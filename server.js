'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on('connection', socket => {
  socket.join('lobby', () => {});

  socket.on('register', id => {
    socket.bungieId = id;
  });

  socket.on('joinRoom', room => {
    socket.join(room, () => {
      socket.leave('lobby');
    });
  });

  socket.on('leaveRoom', room => {
    socket.leave(room, () => {
      socket.join('lobby');
    });
  });

  socket.on('disconnect', () => {});
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
