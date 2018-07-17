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

  socket.on('register', ({
    membershipType,
    destinyMembershipId
  }) => {
    socket.membershipType = membershipType;
    socket.destinyMembershipId = destinyMembershipId;
    socket.emit('registered', {
      registeredType: socket.membershipType,
      registeredId: socket.destinyMembershipId
    });
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
  const roomList = [
    '4611686018430450544'
  ];

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
  const userList = [{
      membershipType: '1',
      destinyMembershipId: '4611686018430450544'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018434619267'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018438442802'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018429542374'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018433857896'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018430209229'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018438413570'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018431417070'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018433707437'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018459691107'
    },
    {
      membershipType: '1',
      destinyMembershipId: '4611686018443852891'
    },
  ];
  const room = io.sockets.adapter.rooms[roomID];
  try {
    Object.keys(room.sockets).forEach(socketID => {
      userList.push({
        membershipType: io.nsps['/'].connected[socketID].membershipType,
        destinyMembershipId: io.nsps['/'].connected[socketID].destinyMembershipId
      });
    });
  } catch (e) {}
  console.log(userList)
  return userList;
}

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);