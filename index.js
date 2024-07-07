const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const express = require('express');

const app = express();

// Load SSL certificate and key
const server = https.createServer({
  key: fs.readFileSync('/path/to/your/privkey.pem'),
  cert: fs.readFileSync('/path/to/your/fullchain.pem')
}, app);

const io = socketIo(8800, {
  cors: {
    origin: "https://stelink.vercel.app",
  },
});

let activeUsers = [];

io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    console.log("Sending from socket to :", receiverId)
    console.log("Data: ", data)
    if (user) {
      io.to(user.socketId).emit("recieve-message", data);
    }
  });
});

server.listen(8800, () => {
  console.log('Listening on port 8800');
});
