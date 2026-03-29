import React from 'react';
import { BoardSquare, GROUP_COLORS } from '../gameData';
import { Player } from '../gameData';
import { motion } from 'motion/react';
import { User, Train, Zap, HelpCircle, Briefcase, Store, Home } from 'lucide-react';
import { TokenIcon } from './TokenIcon';
import { useSettings } from '../SettingsContext';

interface SquareProps {
  square: BoardSquare;
  playersOnSquare: Player[];
  allPlayers: Player[];
  isBottomRow?: boolean;
  isTopRow?: boolean;
  isLeftCol?: boolean;
  isRightCol?: boolean;
}

export const Square: React.FC<SquareProps> = ({ square, playersOnSquare, allPlayers, isBottomRow, isTopRow, isLeftCol, isRightCol }) => {
  const { t, currencySymbol } = useSettings();
  const isCorner = square.type === 'corner';
  
  // Determine dimensions based on position
  let className = "relative border border-[var(--glass-border)] flex flex-col items-center justify-between text-[10px] glass-panel";
  
  if (isCorner) {
    className += " w-24 h-24 shrink-0 z-10";
  } else if (isBottomRow || isTopRow) {
    className += " w-16 h-24 shrink-0";
  } else {
    className += " w-24 h-16 shrink-0 flex-row"; // Side rows are horizontal
  }

  const getIcon = () => {
    if (square.type === 'railroad') return <Train size={16} className="opacity-60" />;
    if (square.type === 'utility') return <Zap size={16} className="opacity-60" />;
    if (square.type === 'chance') return <HelpCircle size={16} className="text-blue-500" />;
    if (square.type === 'chest') return <Briefcase size={16} className="text-yellow-600" />;
    if (square.type === 'tax') return <span className="font-bold text-xs opacity-80">{currencySymbol}</span>;
    if (square.type === 'property') return <Store size={14} className="opacity-30" />;
    return null;
  };

  // Render content based on orientation
  const renderContent = () => {
    if (isCorner) {
      return (
        <div className="w-full h-full flex items-center justify-center font-bold text-center p-1 bg-black/5">
          {t(square.name)}
        </div>
      );
    }

    const colorBar = square.group ? (
      <div className={`${GROUP_COLORS[square.group]} w-full h-1/4 border-b border-[var(--glass-border)] opacity-80`} />
    ) : null;

    const price = square.price ? <div className="mb-1 font-mono opacity-80">{currencySymbol}{square.price}</div> : null;
    const name = <div className="text-center px-1 leading-tight font-medium my-auto">{t(square.name)}</div>;

    if (isBottomRow) {
      return (
        <>
          {colorBar}
          {name}
          {getIcon()}
          {price}
        </>
      );
    }
    if (isTopRow) {
      return (
        <>
          {price}
          {getIcon()}
          {name}
          <div className={`${GROUP_COLORS[square.group || '']} w-full h-1/4 border-t border-[var(--glass-border)] opacity-80`} />
        </>
      );
    }
    if (isLeftCol) {
      return (
        <>
           <div className={`${GROUP_COLORS[square.group || '']} h-full w-1/4 border-r border-[var(--glass-border)] opacity-80`} />
           <div className="flex flex-col items-center justify-center flex-1 h-full">
             {name}
             {getIcon()}
             {price}
           </div>
        </>
      );
    }
    if (isRightCol) {
      return (
        <>
           <div className="flex flex-col items-center justify-center flex-1 h-full">
             {name}
             {getIcon()}
             {price}
           </div>
           <div className={`${GROUP_COLORS[square.group || '']} h-full w-1/4 border-l border-[var(--glass-border)] opacity-80`} />
        </>
      );
    }
  };

  const renderPlayerShape = (p: Player) => {
    return (
      <motion.div 
        layoutId={`player-${p.id}`}
        key={p.id} 
        className="z-20 relative flex items-center justify-center"
        style={{ width: '32px', height: '32px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <TokenIcon token={p.token} color={p.color} className="w-full h-full drop-shadow-md" />
      </motion.div>
    );
  };

  return (
    <div className={className}>
      {renderContent()}
      
      {/* Player Tokens */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex -space-x-2">
          {playersOnSquare.map(p => renderPlayerShape(p))}
        </div>
      </div>

      {/* Owner Indicator */}
      {square.owner !== undefined && square.owner !== null && (
         <div className={`absolute top-0 right-0 w-4 h-4 rounded-bl-md z-10 border-l border-b border-white/50 shadow-sm`} style={{ backgroundColor: allPlayers.find(p => p.id === square.owner)?.color || 'gray' }} />
      )}
    </div>
  );
};
