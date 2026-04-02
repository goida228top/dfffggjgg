import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  app.use(cors());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  const rooms = new Map();
  const socketMap = new Map(); // socket.id -> { userId, roomId }

  function broadcastRooms() {
    const roomList = Array.from(rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      playersCount: r.users.size,
      realPlayersCount: Array.from(r.users.values()).filter((u) => !u.isBot)
        .length,
      totalPlayers: r.totalPlayers,
      maxLaps: r.settings.maxLaps,
      state: r.state,
    }));
    io.emit("room_list", roomList);
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send current rooms to the newly connected user
    socket.emit(
      "room_list",
      Array.from(rooms.values()).map((r) => ({
        id: r.id,
        name: r.name,
        playersCount: r.users.size,
        realPlayersCount: Array.from(r.users.values()).filter((u) => !u.isBot)
          .length,
        totalPlayers: r.totalPlayers,
        maxLaps: r.settings.maxLaps,
        state: r.state,
      })),
    );

    socket.on("create_room", (roomData, user) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      const totalPlayers = roomData.totalPlayers || 1;
      const botCount = roomData.botCount || 0;

      rooms.set(roomId, {
        id: roomId,
        name: roomData.name,
        hostId: user.id,
        settings: { maxLaps: roomData.maxLaps },
        totalPlayers: totalPlayers + botCount,
        users: new Map(),
        state: "lobby",
      });
      socket.join(roomId);
      socketMap.set(socket.id, { userId: user.id, roomId });
      const room = rooms.get(roomId);
      // Add host
      const colors = [
        "#ef4444",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
        "#f97316",
      ];
      const tokens = ["car", "dog", "ship", "hat", "shoe", "iron"];
      room.users.set(user.id, {
        ...user,
        id: user.id,
        socketId: socket.id,
        isHost: true,
        color: user.color || colors[0],
        token: user.token || tokens[0],
      });
      // Add bots
      for (let i = 0; i < botCount; i++) {
        const botId = `bot_${Math.random().toString(36).substring(2, 8)}`;
        const takenTokens = Array.from(room.users.values()).map((u) => u.token);
        const availableTokens = tokens.filter((t) => !takenTokens.includes(t));
        const botToken = availableTokens.length > 0 
          ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
          : tokens[i % tokens.length];

        room.users.set(botId, {
          id: botId,
          name: `Бот ${i + 1}`,
          color: colors[(i + 1) % colors.length],
          token: botToken,
          isBot: true,
          isLocal: true,
        });
      }
      socket.emit("room_joined", {
        id: roomId,
        name: room.name,
        settings: { ...room.settings, totalPlayers: room.totalPlayers },
        isHost: true,
        gameState: room.gameState || null
      });
      io.to(roomId).emit("room_users", Array.from(room.users.values()));
      broadcastRooms();
    });

    socket.on("reconnect_room", (roomId, userId) => {
      const room = rooms.get(roomId);
      if (room && room.users.has(userId)) {
        const user = room.users.get(userId);
        if (user.disconnected) {
          user.disconnected = false;
          user.socketId = socket.id;
          socketMap.set(socket.id, { userId, roomId });
          socket.join(roomId);
          socket.emit("room_joined", {
            id: roomId,
            name: room.name,
            settings: { ...room.settings, totalPlayers: room.totalPlayers },
            isHost: room.hostId === userId,
            gameState: room.gameState || null
          });
          io.to(roomId).emit("room_users", Array.from(room.users.values()));
          
          // Send current state to reconnected user
          if (room.state === "playing" && room.gameState) {
            socket.emit("game_state", room.gameState);
          }
        }
      }
    });

    socket.on("join_room", (roomId, user) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("error", "Комната не найдена");
        return;
      }

      if (room.users.has(user.id)) {
        // Reconnect
        const existingUser = room.users.get(user.id);
        existingUser.disconnected = false;
        existingUser.socketId = socket.id;
        socketMap.set(socket.id, { userId: user.id, roomId });
        socket.join(roomId);
        socket.emit("room_joined", {
          id: roomId,
          name: room.name,
          settings: { ...room.settings, totalPlayers: room.totalPlayers },
          isHost: room.hostId === user.id,
          gameState: room.gameState || null
        });
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
        
        // Send current state to reconnected user
        if (room.state === "playing" && room.gameState) {
          socket.emit("game_state", room.gameState);
        }
        return;
      }

      if (room.state === "lobby" && room.users.size < room.totalPlayers) {
        socket.join(roomId);
        socketMap.set(socket.id, { userId: user.id, roomId });
        // Assign a unique token and color
        const takenTokens = Array.from(room.users.values()).map((u) => u.token);
        const takenColors = Array.from(room.users.values()).map((u) => u.color);
        const allTokens = ["car", "dog", "ship", "hat", "shoe", "iron"];
        const allColors = [
          "#ef4444",
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#06b6d4",
          "#f97316",
        ];
        const availableTokens = allTokens.filter(
          (t) => !takenTokens.includes(t),
        );
        const availableColors = allColors.filter(
          (c) => !takenColors.includes(c),
        );
        const assignedToken =
          availableTokens.length > 0 ? availableTokens[0] : allTokens[0];
        const assignedColor =
          availableColors.length > 0 ? availableColors[0] : allColors[0];

        room.users.set(user.id, {
          ...user,
          id: user.id,
          socketId: socket.id,
          isHost: false,
          token: assignedToken,
          color: assignedColor,
        });
        socket.emit("room_joined", {
          id: roomId,
          name: room.name,
          settings: { ...room.settings, totalPlayers: room.totalPlayers },
          isHost: room.hostId === user.id,
          gameState: room.gameState || null
        });
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
        broadcastRooms();
      } else {
        socket.emit(
          "error",
          "Комната не найдена, переполнена или игра уже началась",
        );
      }
    });

    socket.on("leave_room", (roomId) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room) {
        room.users.delete(userId);
        socket.leave(roomId);
        socketMap.delete(socket.id);

        const realPlayers = Array.from(room.users.values()).filter(
          (u) => !u.isBot,
        );

        if (realPlayers.length === 0) {
          rooms.delete(roomId);
        } else if (room.hostId === userId) {
          const nextHost = realPlayers[0];
          room.hostId = nextHost.id;
          nextHost.isHost = true;
          io.to(roomId).emit("room_users", Array.from(room.users.values()));
        } else {
          io.to(roomId).emit("room_users", Array.from(room.users.values()));
        }
        broadcastRooms();
      }
    });

    socket.on("update_user", (roomId, userUpdate) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.users.has(userId)) {
        const currentUser = room.users.get(userId);
        // Check token uniqueness
        const isTokenTaken = Array.from(room.users.values()).some(
          (u) => u.token === userUpdate.token && u.id !== userId,
        );
        room.users.set(userId, {
          ...currentUser,
          ...userUpdate,
          token: isTokenTaken ? currentUser.token : userUpdate.token,
        });
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
      }
    });

    socket.on("add_bot", (roomId, bot) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId === userId && room.users.size < 6) {
        const takenTokens = Array.from(room.users.values()).map((u) => u.token);
        const allTokens = ["car", "dog", "ship", "hat", "shoe", "iron"];
        const availableTokens = allTokens.filter(
          (t) => !takenTokens.includes(t),
        );
        if (availableTokens.length > 0) {
          bot.token = availableTokens[Math.floor(Math.random() * availableTokens.length)];
        }
        room.users.set(bot.id, bot);
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
        broadcastRooms();
      }
    });

    socket.on("remove_bot", (roomId, botId) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId === userId && room.users.has(botId)) {
        room.users.delete(botId);
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
        broadcastRooms();
      }
    });

    socket.on("kick_player", (roomId, playerId) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId === userId && playerId !== userId) {
        const targetUser = room.users.get(playerId);
        if (targetUser && targetUser.socketId) {
          const targetSocket = io.sockets.sockets.get(targetUser.socketId);
          if (targetSocket) {
            targetSocket.leave(roomId);
            targetSocket.emit("error", "Вы были исключены из комнаты");
            socketMap.delete(targetUser.socketId);
          }
        }
        room.users.delete(playerId);
        io.to(roomId).emit("room_users", Array.from(room.users.values()));
        broadcastRooms();
      }
    });

    socket.on("update_settings", (roomId, settings) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId === userId) {
        room.settings = settings;
        socket.to(roomId).emit("settings_updated", settings);
        broadcastRooms();
      }
    });

    socket.on("start_game", (roomId) => {
      const connection = socketMap.get(socket.id);
      if (!connection) return;
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId === userId) {
        room.state = "playing";
        io.to(roomId).emit("game_started");
        broadcastRooms();
      }
    });

    socket.on("host_state", (roomId, state) => {
      const room = rooms.get(roomId);
      if (room) {
        console.log(`[SERVER] Received host_state for room ${roomId}. Phase: ${state.phase}, CurrentPlayerIdx: ${state.currentPlayerIndex}`);
        room.gameState = state;
      }
      socket.to(roomId).emit("game_state", state);
    });

    socket.on("client_action", (roomId, action) => {
      const connection = socketMap.get(socket.id);
      if (!connection) {
        console.warn(`[SERVER] client_action from unknown socket ${socket.id}`);
        return;
      }
      const { userId } = connection;
      const room = rooms.get(roomId);
      if (room && room.hostId) {
        console.log(`[SERVER] Forwarding action ${action.type} from user ${userId} to host ${room.hostId} in room ${roomId}`);
        const hostUser = room.users.get(room.hostId);
        if (hostUser && hostUser.socketId) {
          io.to(hostUser.socketId).emit("client_action", action, userId);
        } else {
          console.error(`[SERVER] Host user ${room.hostId} not found or has no socketId in room ${roomId}`);
        }
      } else {
        console.warn(`[SERVER] Room ${roomId} not found or has no host for client_action ${action.type}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const connection = socketMap.get(socket.id);
      if (connection) {
        const { userId, roomId } = connection;
        const room = rooms.get(roomId);
        if (room && room.users.has(userId)) {
          const user = room.users.get(userId);
          user.disconnected = true;
          
          // Start a timeout to remove the user or turn them into a bot
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom && currentRoom.users.has(userId)) {
              const currentUser = currentRoom.users.get(userId);
              if (currentUser.disconnected) {
                if (currentRoom.state === "playing") {
                  // Turn into bot
                  currentUser.isBot = true;
                  currentUser.disconnected = false;
                  
                  // Handle host migration if the host disconnected
                  const realPlayers = Array.from(currentRoom.users.values()).filter(u => !u.isBot && !u.disconnected);
                  if (realPlayers.length === 0) {
                    rooms.delete(roomId);
                  } else {
                    if (currentRoom.hostId === userId) {
                      const nextHost = realPlayers[0];
                      currentRoom.hostId = nextHost.id;
                      nextHost.isHost = true;
                      currentUser.isHost = false;
                    }
                    io.to(roomId).emit("room_users", Array.from(currentRoom.users.values()));
                    // Notify new host to take over the bot
                    const hostUser = currentRoom.users.get(currentRoom.hostId);
                    if (hostUser && hostUser.socketId) {
                      io.to(hostUser.socketId).emit("player_turned_bot", userId);
                    }
                  }
                } else {
                  // Remove from lobby
                  currentRoom.users.delete(userId);
                  // Handle host migration
                  const realPlayers = Array.from(currentRoom.users.values()).filter(u => !u.isBot && !u.disconnected);
                  if (realPlayers.length === 0) {
                    rooms.delete(roomId);
                  } else if (currentRoom.hostId === userId) {
                    const nextHost = realPlayers[0];
                    currentRoom.hostId = nextHost.id;
                    nextHost.isHost = true;
                  }
                  io.to(roomId).emit("room_users", Array.from(currentRoom.users.values()));
                  broadcastRooms();
                }
              }
            }
          }, 10000); // 10 seconds reconnect window
          
          io.to(roomId).emit("room_users", Array.from(room.users.values()));
        }
        socketMap.delete(socket.id);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the React app in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
