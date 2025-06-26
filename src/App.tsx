import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Game } from './components/Game';

interface Player {
  id: string;
  name: string;
  ready: boolean;
}

interface Room {
  id: string;
  players: Player[];
  maxPlayers: number;
  gameStarted: boolean;
}

type GamePhase = 'lobby' | 'waiting' | 'playing';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io('https://teencards.onrender.com/');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('room-created', ({ roomCode, room }) => {
      setRoom(room);
      setGamePhase('waiting');
    });

    newSocket.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.gameStarted) {
        setGamePhase('playing');
      }
    });

    newSocket.on('room-error', (errorMessage) => {
      setError(errorMessage);
    });

    newSocket.on('game-started', ({ gameState, playerCards }) => {
      setGameState(gameState);
      setPlayerCards(playerCards[newSocket.id] || []);
      setGamePhase('playing');
    });

    newSocket.on('game-updated', ({ gameState, playerCards }) => {
      setGameState(gameState);
      setPlayerCards(playerCards[newSocket.id] || []);
    });

    newSocket.on('game-over', ({ winners, finalCards }) => {
      // Handle game over
      console.log('Game over', winners);
      setTimeout(() => {
        setGamePhase('waiting');
        setGameState(null);
        setPlayerCards([]);
      }, 5000);
    });

    newSocket.on('game-error', (errorMessage) => {
      setError(errorMessage);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateRoom = (name: string) => {
    setPlayerName(name);
    socket?.emit('create-room', name);
  };

  const handleJoinRoom = (roomCode: string, name: string) => {
    setPlayerName(name);
    socket?.emit('join-room', { roomCode, playerName: name });
    setGamePhase('waiting');
  };

  const handleToggleReady = () => {
    if (room) {
      socket?.emit('toggle-ready', room.id);
    }
  };

  const handleGameAction = (action: string, amount?: number) => {
    if (room) {
      socket?.emit('game-action', { roomCode: room.id, action, amount });
    }
  };

  const handleBackToLobby = () => {
    setGamePhase('lobby');
    setRoom(null);
    setGameState(null);
    setPlayerCards([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-green-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Teen Patti</h1>
          <p className="text-green-100">Multiplayer Card Game</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-4 p-4 bg-red-500 text-white rounded-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {gamePhase === 'lobby' && (
          <Lobby 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {gamePhase === 'waiting' && room && (
          <GameRoom 
            room={room}
            playerName={playerName}
            onToggleReady={handleToggleReady}
            onBackToLobby={handleBackToLobby}
          />
        )}

        {gamePhase === 'playing' && gameState && (
          <Game 
            gameState={gameState}
            playerCards={playerCards}
            playerName={playerName}
            onGameAction={handleGameAction}
            onBackToLobby={handleBackToLobby}
          />
        )}
      </div>
    </div>
  );
}

export default App;
