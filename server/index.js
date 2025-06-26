import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { TeenPattiGame } from './game/TeenPattiGame.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://teencards.vercel.app/",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active games and rooms
const rooms = new Map();
const games = new Map();

// Generate a unique room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', (playerName) => {
    const roomCode = generateRoomCode();
    const room = {
      id: roomCode,
      players: [{ id: socket.id, name: playerName, ready: false }],
      maxPlayers: 6,
      gameStarted: false
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, room });
    console.log(`Room ${roomCode} created by ${playerName}`);
  });

  // Join an existing room
  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('room-error', 'Room not found');
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('room-error', 'Room is full');
      return;
    }
    
    if (room.gameStarted) {
      socket.emit('room-error', 'Game already in progress');
      return;
    }
    
    // Check if player name already exists
    if (room.players.some(p => p.name === playerName)) {
      socket.emit('room-error', 'Player name already taken');
      return;
    }
    
    room.players.push({ id: socket.id, name: playerName, ready: false });
    socket.join(roomCode);
    
    io.to(roomCode).emit('room-updated', room);
    console.log(`${playerName} joined room ${roomCode}`);
  });

  // Player ready toggle
  socket.on('toggle-ready', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(roomCode).emit('room-updated', room);
      
      // Check if all players are ready and we have at least 3 players
      if (room.players.length >= 3 && room.players.every(p => p.ready)) {
        startGame(roomCode);
      }
    }
  });

  // Start the game
  function startGame(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    room.gameStarted = true;
    const game = new TeenPattiGame(room.players);
    games.set(roomCode, game);
    
    // Deal cards to all players
    game.dealCards();
    
    io.to(roomCode).emit('game-started', {
      gameState: game.getGameState(),
      playerCards: game.getPlayerCards()
    });
    
    console.log(`Game started in room ${roomCode}`);
  }

  // Handle game actions
  socket.on('game-action', ({ roomCode, action, amount }) => {
    const game = games.get(roomCode);
    if (!game) return;
    
    const result = game.handlePlayerAction(socket.id, action, amount);
    
    if (result.success) {
      io.to(roomCode).emit('game-updated', {
        gameState: game.getGameState(),
        playerCards: game.getPlayerCards(),
        lastAction: result.lastAction
      });
      
      // Check if game is over
      if (game.isGameOver()) {
        const winners = game.getWinners();
        io.to(roomCode).emit('game-over', {
          winners,
          finalCards: game.getAllCards()
        });
        
        // Reset game after 10 seconds
        setTimeout(() => {
          games.delete(roomCode);
          const room = rooms.get(roomCode);
          if (room) {
            room.gameStarted = false;
            room.players.forEach(p => p.ready = false);
            io.to(roomCode).emit('room-updated', room);
          }
        }, 10000);
      }
    } else {
      socket.emit('game-error', result.error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all rooms
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
          games.delete(roomCode);
        } else {
          io.to(roomCode).emit('room-updated', room);
          
          // If game was in progress, handle player leaving
          const game = games.get(roomCode);
          if (game && room.gameStarted) {
            game.removePlayer(socket.id);
            if (game.getActivePlayers().length < 2) {
              io.to(roomCode).emit('game-over', {
                winners: game.getActivePlayers(),
                reason: 'Not enough players'
              });
            }
          }
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
