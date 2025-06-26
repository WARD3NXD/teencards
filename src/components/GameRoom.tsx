import React from 'react';
import { Users, Copy, CheckCircle, ArrowLeft, Crown } from 'lucide-react';

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

interface GameRoomProps {
  room: Room;
  playerName: string;
  onToggleReady: () => void;
  onBackToLobby: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ 
  room, 
  playerName, 
  onToggleReady, 
  onBackToLobby 
}) => {
  const currentPlayer = room.players.find(p => p.name === playerName);
  const allReady = room.players.length >= 3 && room.players.every(p => p.ready);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lobby
          </button>
          
          <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
            <span className="text-green-700 font-medium">Room:</span>
            <span className="text-green-800 font-bold text-lg">{room.id}</span>
            <button
              onClick={copyRoomCode}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Players</h2>
          <p className="text-gray-600">
            {room.players.length} of {room.maxPlayers} players joined
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {room.players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                player.ready
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {index === 0 && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-800">
                  {player.name}
                  {player.name === playerName && (
                    <span className="text-green-600 text-sm ml-2">(You)</span>
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {player.ready ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ready</span>
                  </div>
                ) : (
                  <span className="text-gray-500 font-medium">Waiting...</span>
                )}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">?</span>
              </div>
              <span className="ml-3 text-gray-500 italic">Waiting for player...</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={onToggleReady}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              currentPlayer?.ready
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {currentPlayer?.ready ? 'Not Ready' : 'Ready to Play'}
          </button>

          {allReady && (
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium">
                🎉 All players are ready! Game starting soon...
              </p>
            </div>
          )}

          {room.players.length < 3 && (
            <div className="text-center p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Need at least 3 players to start the game
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Share this room code with friends:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-green-600">{room.id}</span>
              <button
                onClick={copyRoomCode}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};