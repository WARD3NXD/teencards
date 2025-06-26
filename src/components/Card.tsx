import React from 'react';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface CardProps {
  card: {
    suit: string;
    rank: string;
    value: number;
  };
  large?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, large = false }) => {
  const getSuitIcon = (suit: string) => {
    const iconProps = { 
      className: `${large ? 'w-6 h-6' : 'w-4 h-4'} ${
        suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
      }` 
    };
    
    switch (suit) {
      case 'hearts':
        return <Heart {...iconProps} fill="currentColor" />;
      case 'diamonds':
        return <Diamond {...iconProps} fill="currentColor" />;
      case 'clubs':
        return <Club {...iconProps} fill="currentColor" />;
      case 'spades':
        return <Spade {...iconProps} fill="currentColor" />;
      default:
        return null;
    }
  };

  const getRankDisplay = (rank: string) => {
    return rank === '10' ? '10' : rank;
  };

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const cardSize = large ? 'w-20 h-28' : 'w-8 h-12';
  const textSize = large ? 'text-lg' : 'text-xs';

  return (
    <div className={`${cardSize} bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col justify-between p-2 ${large ? 'hover:scale-105 transition-transform' : ''}`}>
      <div className="flex justify-between items-start">
        <div className={`flex flex-col items-center ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
          <span className={`font-bold ${textSize} leading-none`}>
            {getRankDisplay(card.rank)}
          </span>
          {getSuitIcon(card.suit)}
        </div>
        {large && (
          <div className={`flex flex-col items-center ${isRed ? 'text-red-500' : 'text-gray-800'} transform rotate-180`}>
            <span className={`font-bold ${textSize} leading-none`}>
              {getRankDisplay(card.rank)}
            </span>
            {getSuitIcon(card.suit)}
          </div>
        )}
      </div>
      
      {large && (
        <div className="flex justify-center items-center flex-1">
          <div className={`${isRed ? 'text-red-500' : 'text-gray-800'}`}>
            {getSuitIcon(card.suit)}
          </div>
        </div>
      )}
    </div>
  );
};