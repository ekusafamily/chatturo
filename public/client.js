const socket = io();

let username = '';
let typingTimer;
const userColors = {};

const loginScreen = document.getElementById('login-screen');
const chatInterface = document.getElementById('chat-interface');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const usernameInput = document.getElementById('username');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');
const typingIndicator = document.getElementById('typing-indicator');
const typingUsername = document.getElementById('typing-username');

function getColorForUser(user) {
  if (!userColors[user]) {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    userColors[user] = colors[Math.floor(Math.random() * colors.length)];
  }
  return userColors[user];
}

function createAvatar(name) {
  const initial = name.charAt(0).toUpperCase();
  const color = getColorForUser(name);
  return `<div class="w-8 h-8 rounded-full ${color} flex items-center justify-center text-sm font-medium text-white">${initial}</div>`;
}

loginBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (username === '') {
    alert('Please enter your name');
    return;
  }
  loginScreen.classList.add('hidden');
  chatInterface.classList.remove('hidden');
  socket.emit('new user', username);
});

logoutBtn.addEventListener('click', () => {
  location.reload();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message === '') return;
  const messageData = {
    user: username,
    text: message,
    time: new Date().toISOString()
  };
  socket.emit('chat message', messageData);
  messageInput.value = '';
  socket.emit('typing', '');
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  } else {
    socket.emit('typing', username);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', '');
    }, 2000);
  }
});

messageInput.addEventListener('input', () => {
  socket.emit('typing', username);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('typing', '');
  }, 2000);
});

function displayMessage(msg) {
  if (msg.text === '__ping__') return;
  const date = new Date(msg.time);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isOwn = msg.user === username;
  const html = isOwn
    ? `<div class="flex items-end justify-end">
         <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-1 items-end">
           <div class="px-4 py-2 rounded-lg shadow-sm bg-indigo-100">${msg.text}<div class="text-xs opacity-70 text-right mt-1">${timeString}</div></div>
         </div>
         ${createAvatar(msg.user)}
       </div>`
    : `<div class="flex items-end">
         ${createAvatar(msg.user)}
         <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-2 items-start">
           <div class="px-4 py-2 rounded-lg bg-white shadow-sm">
             <div class="font-medium text-xs text-indigo-600 mb-1">${msg.user}</div>
             ${msg.text}
             <div class="text-xs text-gray-500 mt-1">${timeString}</div>
           </div>
         </div>
       </div>`;
  chatMessages.insertAdjacentHTML('beforeend', html);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateUserList(users) {
  userList.innerHTML = '';
  users.forEach(user => {
    userList.innerHTML += `
      <div class="flex items-center mb-3">
        ${createAvatar(user)}
        <span class="ml-2 text-gray-700">${user}</span>
        ${user === username ? '<span class="ml-2 text-xs text-gray-500">(you)</span>' : ''}
      </div>`;
  });
  userCount.textContent = `${users.length} participant${users.length !== 1 ? 's' : ''}`;
}

socket.on('chat history', (history) => {
  chatMessages.innerHTML = '';
  history.forEach(displayMessage);
});

socket.on('chat message', displayMessage);
socket.on('user list', updateUserList);

socket.on('typing', (name) => {
  if (name && name !== username) {
    typingUsername.textContent = name;
    typingIndicator.classList.remove('hidden');
  } else {
    typingIndicator.classList.add('hidden');
  }
});

socket.on('auto login', (name) => {
  username = name;
  loginScreen.classList.add('hidden');
  chatInterface.classList.remove('hidden');
  socket.emit('new user', username);
});

setInterval(() => {
  socket.emit('chat message', {
    user: 'bot',
    text: '__ping__',
    time: new Date().toISOString()
  });
}, 6000);
