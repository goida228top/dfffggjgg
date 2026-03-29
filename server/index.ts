import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(process.cwd(), 'dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

interface Room {
  id: string;
  name: string;
  hostId: string;
  settings: { maxLaps: number };
  users: Map<string, any>;
  state: 'lobby' | 'playing';
}

const rooms = new Map<string, Room>();

function broadcastRooms() {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    playersCount: r.users.size,
    maxLaps: r.settings.maxLaps,
    state: r.state
  }));
  io.emit('room_list', roomList);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current rooms to the newly connected user
  socket.emit('room_list', Array.from(rooms.values()).map(r => ({
    id: r.id, name: r.name, playersCount: r.users.size, maxLaps: r.settings.maxLaps, state: r.state
  })));

  socket.on('create_room', (roomData, user) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms.set(roomId, {
      id: roomId,
      name: roomData.name,
      hostId: socket.id,
      settings: { maxLaps: roomData.maxLaps },
      users: new Map(),
      state: 'lobby'
    });
    
    socket.join(roomId);
    const room = rooms.get(roomId)!;
    room.users.set(socket.id, { ...user, id: socket.id, isHost: true });
    
    socket.emit('room_joined', roomId, room.name, room.settings);
    io.to(roomId).emit('room_users', Array.from(room.users.values()));
    broadcastRooms();
  });

  socket.on('join_room', (roomId, user) => {
    const room = rooms.get(roomId);
    if (room && room.state === 'lobby' && room.users.size < 6) {
      socket.join(roomId);
      
      // Assign a unique token
      const takenTokens = Array.from(room.users.values()).map(u => u.token);
      const allTokens = ['car', 'dog', 'ship', 'hat', 'shoe', 'iron', 'thimble', 'wheelbarrow'];
      const availableTokens = allTokens.filter(t => !takenTokens.includes(t));
      const assignedToken = availableTokens.length > 0 ? availableTokens[0] : 'car';

      room.users.set(socket.id, { ...user, id: socket.id, isHost: false, token: assignedToken });
      
      socket.emit('room_joined', roomId, room.name, room.settings);
      io.to(roomId).emit('room_users', Array.from(room.users.values()));
      broadcastRooms();
    } else {
      socket.emit('error', 'Комната не найдена, переполнена или игра уже началась');
    }
  });

  socket.on('leave_room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.delete(socket.id);
      socket.leave(roomId);
      if (room.users.size === 0) {
        rooms.delete(roomId);
      } else if (room.hostId === socket.id) {
        const nextHost = Array.from(room.users.values())[0];
        room.hostId = nextHost.id;
        nextHost.isHost = true;
        io.to(roomId).emit('room_users', Array.from(room.users.values()));
      } else {
        io.to(roomId).emit('room_users', Array.from(room.users.values()));
      }
      broadcastRooms();
    }
  });

  socket.on('update_user', (roomId, userUpdate) => {
    const room = rooms.get(roomId);
    if (room && room.users.has(socket.id)) {
      const currentUser = room.users.get(socket.id);
      
      // Check token uniqueness
      const isTokenTaken = Array.from(room.users.values()).some(u => u.token === userUpdate.token && u.id !== socket.id);
      
      room.users.set(socket.id, { 
        ...currentUser, 
        ...userUpdate, 
        token: isTokenTaken ? currentUser.token : userUpdate.token 
      });
      
      io.to(roomId).emit('room_users', Array.from(room.users.values()));
    }
  });

  socket.on('add_bot', (roomId, bot) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id && room.users.size < 6) {
      const takenTokens = Array.from(room.users.values()).map(u => u.token);
      const allTokens = ['car', 'dog', 'ship', 'hat', 'shoe', 'iron', 'thimble', 'wheelbarrow'];
      const availableTokens = allTokens.filter(t => !takenTokens.includes(t));
      if (availableTokens.length > 0) {
        bot.token = availableTokens[0];
      }
      room.users.set(bot.id, bot);
      io.to(roomId).emit('room_users', Array.from(room.users.values()));
      broadcastRooms();
    }
  });

  socket.on('remove_bot', (roomId, botId) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id && room.users.has(botId)) {
      room.users.delete(botId);
      io.to(roomId).emit('room_users', Array.from(room.users.values()));
      broadcastRooms();
    }
  });

  socket.on('update_settings', (roomId, settings) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.settings = settings;
      socket.to(roomId).emit('settings_updated', settings);
      broadcastRooms();
    }
  });

  socket.on('start_game', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.state = 'playing';
      io.to(roomId).emit('game_started');
      broadcastRooms();
    }
  });

  socket.on('host_state', (roomId, state) => {
    socket.to(roomId).emit('game_state', state);
  });

  socket.on('client_action', (roomId, action) => {
    const room = rooms.get(roomId);
    if (room && room.hostId) {
      io.to(room.hostId).emit('client_action', action, socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else if (room.hostId === socket.id) {
          const nextHost = Array.from(room.users.values())[0];
          room.hostId = nextHost.id;
          nextHost.isHost = true;
          io.to(roomId).emit('room_users', Array.from(room.users.values()));
        } else {
          io.to(roomId).emit('room_users', Array.from(room.users.values()));
        }
        broadcastRooms();
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
