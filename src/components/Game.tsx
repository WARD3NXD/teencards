import React from 'react';
import { ArrowLeft, Coins, Clock } from 'lucide-react';
import { Card } from './Card';

interface GameProps {
  gameState: any;
  playerCards: any[];
  playerName: string;
  onGameAction: (action: string, amount?: number) => void;
  onBackToLobby: () => void;
}

export const Game: React.FC<GameProps> = ({
  gameState,
  playerCards,
  playerName,
  onGameAction,
  onBackToLobby
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.name === playerName;
  const myPlayer = gameState.players.find((p: any) => p.name === playerName);

  const handleRaise = () => {
    const amount = Math.max(gameState.currentBet * 2, gameState.currentBet + 2);
    onGameAction('raise', amount);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Leave Game
          </button>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-lg">Pot: ₹{gameState.pot}</span>
            </div>
            <div className="text-sm text-gray-600">
              Round {gameState.round}
            </div>
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-3xl p-8 shadow-2xl">
        {/* Center Pot */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-yellow-500 text-yellow-900 px-6 py-3 rounded-full font-bold text-xl shadow-lg">
            <Coins className="w-6 h-6" />
            ₹{gameState.pot}
          </div>
          {isMyTurn && (
            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-300">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Your Turn</span>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gameState.players.map((player: any, index: number) => (
            <div
              key={player.id}
              className={`bg-white rounded-2xl p-6 shadow-lg transition-all ${
                index === gameState.currentPlayerIndex && !player.folded
                  ? 'ring-4 ring-yellow-400 transform scale-105'
                  : ''
              } ${player.folded ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {player.name}
                  {player.name === playerName && (
                    <span className="text-green-600 text-sm ml-1">(You)</span>
                  )}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Bet:</span>
                    <span className="font-medium">₹{player.bet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bet:</span>
                    <span className="font-medium">₹{player.totalBet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      player.folded ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {player.folded ? 'Folded' : 'Playing'}
                    </span>
                  </div>
                </div>

                {/* Player Cards */}
                <div className="mt-4 flex justify-center gap-1">
                  {player.name === playerName ? (
                    playerCards.map((card, cardIndex) => (
                      <Card key={cardIndex} card={card} />
                    ))
                  ) : (
                    Array.from({ length: player.cardCount }).map((_, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="w-8 h-12 bg-blue-600 rounded border-2 border-blue-800 shadow-sm"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {isMyTurn && !myPlayer?.folded && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onGameAction('pack')}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-lg"
            >
              Pack (Fold)
            </button>
            <button
              onClick={() => onGameAction('call')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-lg"
            >
              Call (₹{gameState.currentBet})
            </button>
            <button
              onClick={handleRaise}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg"
            >
              Raise (₹{Math.max(gameState.currentBet * 2, gameState.currentBet + 2)})
            </button>

            <button
              onClick={() => socket.emit("show-cards", { roomId })}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md"
            >
              Show
            </button>
          </div>
        )}

        {!isMyTurn && (
          <div className="text-center">
            <p className="text-green-100 text-lg">
              Waiting for {currentPlayer?.name} to play...
            </p>
          </div>
        )}
      </div>

      {/* My Cards (Large Display) */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Your Cards</h3>
        <div className="flex justify-center gap-4">
          {playerCards.map((card, index) => (
            <Card key={index} card={card} large />
          ))}
        </div>
      </div>
    </div>
  );
};
