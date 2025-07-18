const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let users = [];
let messages = [];
let ipToUsername = {};

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  let currentUser = ipToUsername[ip] || '';

  if (currentUser) {
    socket.emit('auto login', currentUser);
  }

  socket.on('new user', (username) => {
    currentUser = username;
    ipToUsername[ip] = username;
    users.push(username);
    io.emit('user list', users);
    socket.emit('chat history', messages);
  });

  socket.on('chat message', (msg) => {
    if (msg.text === '__ping__') return;
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit('chat message', msg);
  });

  socket.on('typing', (name) => {
    socket.broadcast.emit('typing', name);
  });

  socket.on('disconnect', () => {
    if (currentUser) {
      users = users.filter(u => u !== currentUser);
      io.emit('user list', users);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
  app.get('/ping', (req, res) => {
    res.send('pong');
  });
