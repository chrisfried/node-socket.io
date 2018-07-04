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
  console.log('user connected');
  socket.join('lobby', () => {
    socket.emit('joinedRoom', 'lobby');
    io.to('lobby').emit('emitRooms', roomList());
  });

  socket.on('register', id => {
    socket.bungieId = id;
    socket.emit('registered', id);
  });

  socket.on('joinRoom', room => {
    socket.leave('lobby', () => {
      socket.join(room, () => {
        socket.emit('joinedRoom', room);
        io.to('lobby').emit('emitRooms', roomList());
        io.to(room).emit('emitUsers', userList(room));
      });
    });
  });

  socket.on('leaveRoom', room => {
    socket.leave(room, () => {
      io.to(room).emit('emitUsers', userList(room));
      socket.join('lobby', () => {
        socket.emit('joinedRoom', 'lobby');
        io.to('lobby').emit('emitRooms', roomList());
      });
    });
  });

  socket.on('disconnect', () => {
    io.to('lobby').emit('emitRooms', roomList());
    console.log('user disconnected');
  });
});

function roomList() {
  const roomList = [];

  Object.keys(io.sockets.adapter.rooms).forEach(roomID => {
    const room = io.sockets.adapter.rooms[roomID];
    if (roomID !== 'lobby') {
      if (room.length > 1) {
        roomList.push(roomID);
      } else if (room.length === 1) {
        let match = false;
        Object.keys(room.sockets).some(socketID => {
          if (socketID === roomID) {
            return (match = true);
          }
        });
        if (!match) {
          roomList.push(roomID);
        }
      }
    }
  });
  return roomList;
}

function userList(roomID) {
  const userList = [];
  const room = io.sockets.adapter.rooms[roomID];
  try {
    Object.keys(room.sockets).forEach(socketID => {
      userList.push(io.nsps['/'].connected[socketID].bungieId);
    });
  } catch (e) {}
  return userList;
}

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
