 const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', true); // Trust proxies like Render

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Store users, messages, and IP-user mapping
let users = [];
let messages = [];
let ipUserMap = {};

// UptimeRobot ping route
app.get('/ping', (req, res) => {
  res.send('pong');
});

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0] || socket.handshake.address;
  let currentUser = ipUserMap[ip] || '';

  // If username exists for this IP, send it
  if (currentUser) {
    socket.emit('restore username', currentUser);
  }

  // New user joins
  socket.on('new user', (username) => {
    currentUser = username;
    ipUserMap[ip] = username;

    if (!users.includes(username)) {
      users.push(username);
    }

    io.emit('user list', users);
    socket.emit('chat history', messages);
  });

  // Handle messages (skip pings)
  socket.on('chat message', (msg) => {
    if (msg.text === '__ping__') return;

    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit('chat message', msg);
  });

  // Typing indicator
  socket.on('typing', (name) => {
    socket.broadcast.emit('typing', name);
  });

  // Disconnect
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
