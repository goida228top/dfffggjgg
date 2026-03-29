import React, { useState } from 'react';
import { useMonopolyGame, LogEntry } from '../useGame';
import { Square } from './Square';
import { Dice5, Home, User, Settings, GripVertical, Crown, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { SettingsMenu } from './SettingsMenu';
import { useSettings } from '../SettingsContext';
import { SetupScreen } from './SetupScreen';
import { MainMenu } from './MainMenu';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GROUP_COLORS } from '../gameData';

export default function MonopolyBoard() {
  const game = useMonopolyGame();
  const { 
    players, currentPlayer, currentPlayerIndex, board, dice, phase, logs, 
    rollDice, buyProperty, endTurn, lastActionMessage, startGame,
    lobbyUsers, isHost, roomId, myId, updateLobbyUser, updateMaxLaps, maxLaps, winner,
    addBot, addLocalPlayer, removeBot, drawnCard, resolveCard
  } = game;
  const { t, currencySymbol } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getGridPosition = (index: number) => {
    if (index >= 0 && index <= 10) {
      return { row: 11, col: 11 - index };
    }
    if (index >= 11 && index <= 20) {
      return { row: 11 - (index - 10), col: 1 };
    }
    if (index >= 21 && index <= 30) {
      return { row: 1, col: index - 20 + 1 };
    }
    if (index >= 31 && index <= 39) {
      return { row: index - 30 + 1, col: 11 };
    }
    return { row: 1, col: 1 };
  };

  const translateLog = (entry: LogEntry | null) => {
    if (!entry) return "";
    let msg = t(entry.key);
    if (entry.params) {
      for (const [key, value] of Object.entries(entry.params)) {
        let translatedValue = value.toString();
        if (typeof value === 'string' && (value.startsWith('player') || t(value) !== value)) {
          translatedValue = t(value);
        }
        msg = msg.replace(`{${key}}`, translatedValue);
      }
    }
    return msg;
  };

  if (!roomId) {
    return (
      <div className="flex flex-col min-h-screen p-4 overflow-y-auto">
        <MainMenu game={game} openSettings={() => setIsSettingsOpen(true)} />
        <SettingsMenu 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          players={players}
          onUpdatePlayer={() => {}}
        />
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="flex flex-col min-h-screen p-4 overflow-y-auto">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 left-4 z-30 p-3 rounded-full glass hover:bg-black/10 transition-colors"
        >
          <Settings size={24} />
        </button>
        <SetupScreen 
          onStart={startGame} 
          lobbyUsers={lobbyUsers}
          isHost={isHost}
          roomId={roomId}
          myId={myId}
          updateLobbyUser={updateLobbyUser}
          updateMaxLaps={updateMaxLaps}
          maxLaps={maxLaps}
          addBot={addBot}
          addLocalPlayer={addLocalPlayer}
          removeBot={removeBot}
          leaveRoom={game.leaveRoom}
          roomName={game.roomName}
        />
        <SettingsMenu 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          players={players}
          onUpdatePlayer={() => {}}
        />
      </div>
    );
  }

  if (phase === 'finished' && winner) {
    // Calculate total assets for ranking
    const rankedPlayers = [...players].sort((a, b) => {
      const aAssets = a.money + a.properties.reduce((sum, pId) => {
        const prop = board.find(s => s.id === pId);
        return sum + (prop?.price || 0);
      }, 0);
      const bAssets = b.money + b.properties.reduce((sum, pId) => {
        const prop = board.find(s => s.id === pId);
        return sum + (prop?.price || 0);
      }, 0);
      return bAssets - aAssets;
    });

    return (
      <div className="flex-1 flex items-center justify-center p-4 h-screen overflow-hidden">
        <div className="glass p-12 rounded-3xl max-w-2xl w-full text-center relative overflow-hidden">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="absolute -top-10 -right-10 text-yellow-400 opacity-20"
          >
            <Crown size={200} />
          </motion.div>
          
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Crown size={80} className="text-yellow-500 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-black mb-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              Game Over!
            </h1>
            <h2 className="text-2xl font-bold mb-10 opacity-80">
              {winner.name} wins by completing {maxLaps} laps!
            </h2>
          </motion.div>

          <div className="space-y-4 relative z-10">
            {rankedPlayers.map((p, index) => {
              const totalAssets = p.money + p.properties.reduce((sum, pId) => {
                const prop = board.find(s => s.id === pId);
                return sum + (prop?.price || 0);
              }, 0);

              return (
                <motion.div 
                  key={p.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'glass'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black opacity-50 w-8">#{index + 1}</div>
                    <div className="w-6 h-6 rounded-full shadow-md" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-xl">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl text-emerald-600">
                      {currencySymbol}{totalAssets}
                    </div>
                    <div className="text-xs opacity-60 uppercase font-bold">Total Assets</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 h-screen">
        <div className="glass p-8 rounded-xl font-bold text-xl animate-pulse">
          Loading game state...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen p-4 overflow-hidden flex flex-col transition-all duration-500"
      style={{ 
        boxShadow: `inset 0 0 120px ${currentPlayer.color}40` 
      }}
    >
      <PanelGroup orientation="horizontal" className="w-full h-full">
        {/* Main Board Area */}
        <Panel defaultSize={75} minSize={50} className="flex items-center justify-center relative min-h-0 overflow-auto">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-4 left-4 z-30 p-3 rounded-full glass hover:bg-black/20 hover:scale-110 hover:shadow-lg transition-all"
          >
            <Settings size={24} />
          </button>

          <div className="relative glass-board rounded-xl p-1" style={{ width: '800px', height: '800px', minWidth: '800px', minHeight: '800px' }}>
          
          {/* Center Area */}
          <div className="absolute inset-[12%] glass flex flex-col items-center justify-center p-8 text-center rounded-lg z-0">
             <h1 className="text-6xl font-black tracking-widest uppercase mb-8 rotate-[-45deg] opacity-20 select-none">
               {t('monopoly')}
             </h1>
             
             {/* Visual Decks */}
             <div className="absolute top-16 left-16 w-36 h-24 rotate-[135deg] transform-gpu select-none">
                {/* Stack effect */}
                <div className="absolute inset-0 bg-yellow-400 rounded-lg shadow-md border border-yellow-500 translate-x-2 translate-y-2 opacity-50"></div>
                <div className="absolute inset-0 bg-yellow-400 rounded-lg shadow-md border border-yellow-500 translate-x-1 translate-y-1 opacity-75"></div>
                <div className="absolute inset-0 bg-yellow-400 rounded-lg shadow-xl border-2 border-yellow-500 flex items-center justify-center font-black text-yellow-900 text-sm text-center px-2 leading-tight">
                  COMMUNITY<br/>CHEST
                </div>
             </div>
             
             <div className="absolute bottom-16 right-16 w-36 h-24 rotate-[-45deg] transform-gpu select-none">
                {/* Stack effect */}
                <div className="absolute inset-0 bg-orange-500 rounded-lg shadow-md border border-orange-600 translate-x-2 translate-y-2 opacity-50"></div>
                <div className="absolute inset-0 bg-orange-500 rounded-lg shadow-md border border-orange-600 translate-x-1 translate-y-1 opacity-75"></div>
                <div className="absolute inset-0 bg-orange-500 rounded-lg shadow-xl border-2 border-orange-600 flex items-center justify-center font-black text-orange-100 text-xl tracking-widest">
                  CHANCE
                </div>
             </div>

             {/* Drawn Card Animation */}
             {phase === 'drawing_card' && drawnCard && (
               <motion.div 
                 initial={{ 
                   scale: 0.2, 
                   rotateY: 180, 
                   opacity: 0,
                   x: drawnCard.type === 'chance' ? 250 : -250,
                   y: drawnCard.type === 'chance' ? 250 : -250,
                   rotateZ: drawnCard.type === 'chance' ? -45 : 135
                 }}
                 animate={{ 
                   scale: 1, 
                   rotateY: 0, 
                   opacity: 1,
                   x: 0,
                   y: 0,
                   rotateZ: 0
                 }}
                 transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                 className={`absolute z-50 w-72 h-48 rounded-xl shadow-2xl flex flex-col items-center justify-center p-6 border-4 ${
                   drawnCard.type === 'chance' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-yellow-400 border-yellow-500 text-yellow-900'
                 }`}
               >
                 <div className="font-black uppercase tracking-widest mb-4 text-2xl">
                   {drawnCard.type === 'chance' ? 'CHANCE' : 'COMMUNITY CHEST'}
                 </div>
                 <div className="text-center font-bold text-lg mb-6 leading-tight">
                   {drawnCard.text}
                 </div>
                 {(currentPlayer.socketId === myId || (isHost && currentPlayer.isLocal)) && (
                   <button 
                     onClick={resolveCard}
                     className="px-6 py-2 bg-black/20 hover:bg-black/30 rounded-lg font-bold transition-colors uppercase tracking-widest shadow-sm"
                   >
                     {t('continue')}
                   </button>
                 )}
               </motion.div>
             )}

             {/* Dice & Controls */}
             <div className="glass p-6 rounded-2xl w-full max-w-md z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-bold uppercase tracking-wider opacity-80">{t('currentTurn')}</div>
                  <motion.div 
                    animate={{ 
                      boxShadow: [`0 0 0px ${currentPlayer.color}`, `0 0 20px ${currentPlayer.color}`, `0 0 0px ${currentPlayer.color}`] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`px-4 py-1.5 rounded-full text-white font-bold text-sm`} 
                    style={{ backgroundColor: currentPlayer.color }}
                  >
                    {t(currentPlayer.name)}
                  </motion.div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                   <motion.div 
                     animate={
                       phase === 'rolling' 
                         ? { rotate: [0, 180, 360], scale: [1, 1.2, 1], y: [0, -20, 0] } 
                         : { rotate: 0, scale: 1, y: 0 }
                     }
                     transition={
                       phase === 'rolling' 
                         ? { repeat: Infinity, duration: 0.2, ease: "linear" } 
                         : { type: 'spring', stiffness: 300, damping: 20 }
                     }
                     className="w-16 h-16 glass rounded-xl flex items-center justify-center text-3xl font-bold"
                   >
                     {dice[0]}
                   </motion.div>
                   <motion.div 
                     animate={
                       phase === 'rolling' 
                         ? { rotate: [0, -180, -360], scale: [1, 1.2, 1], y: [0, -20, 0] } 
                         : { rotate: 0, scale: 1, y: 0 }
                     }
                     transition={
                       phase === 'rolling' 
                         ? { repeat: Infinity, duration: 0.2, ease: "linear" } 
                         : { type: 'spring', stiffness: 300, damping: 20 }
                     }
                     className="w-16 h-16 glass rounded-xl flex items-center justify-center text-3xl font-bold"
                   >
                     {dice[1]}
                   </motion.div>
                </div>

                <div className="space-y-3">
                  {/* Only show controls if it's my turn, OR if it's a local player/bot and I am the host */}
                  {(currentPlayer.socketId === myId || (isHost && currentPlayer.isLocal)) ? (
                    <>
                      {phase === 'roll' && (
                        <button 
                          onClick={rollDice}
                          className="w-full py-3 bg-black/80 text-white rounded-xl font-bold hover:bg-black hover:scale-105 hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                        >
                          <Dice5 size={20} /> {t('rollDice')}
                        </button>
                      )}

                      {phase === 'rolling' && (
                        <div className="w-full py-3 bg-black/50 text-white rounded-xl font-bold flex items-center justify-center gap-2 backdrop-blur-md cursor-not-allowed">
                          <Dice5 size={20} className="animate-spin" /> {t('rolling')}
                        </div>
                      )}

                      {phase === 'moving' && (
                        <div className="w-full py-3 bg-black/50 text-white rounded-xl font-bold flex items-center justify-center backdrop-blur-md cursor-not-allowed">
                          {t('moving')}
                        </div>
                      )}
                      
                      {phase === 'action' && (
                        <div className="flex gap-2">
                           <button 
                            onClick={buyProperty}
                            className="flex-1 py-3 bg-emerald-600/90 text-white rounded-xl font-bold hover:bg-emerald-500 hover:scale-105 hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                          >
                            <Home size={20} /> {t('buyProperty')}
                          </button>
                          <button 
                            onClick={endTurn}
                            className="flex-1 py-3 glass rounded-xl font-bold hover:bg-black/20 hover:scale-105 hover:shadow-lg transition-all"
                          >
                            {t('pass')}
                          </button>
                        </div>
                      )}

                      {phase === 'drawing_card' && (
                        <div className="w-full py-3 bg-black/50 text-white rounded-xl font-bold flex items-center justify-center backdrop-blur-md cursor-not-allowed">
                          {t('drawingCard') || 'Drawing Card...'}
                        </div>
                      )}

                      {phase === 'end' && (
                        <button 
                          onClick={endTurn}
                          className="w-full py-3 bg-blue-600/90 text-white rounded-xl font-bold hover:bg-blue-500 hover:scale-105 hover:shadow-lg hover:brightness-110 transition-all backdrop-blur-md"
                        >
                          {t('endTurn')}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full py-4 glass rounded-xl font-bold text-center opacity-70">
                      Waiting for {currentPlayer.name}...
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-sm opacity-80 h-6 font-medium">
                  {translateLog(lastActionMessage)}
                </div>
             </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full absolute inset-0 pointer-events-none">
            {board.map((square, index) => {
              const pos = getGridPosition(index);
              const playersOnSquare = players.filter(p => p.position === index);
              
              const isBottom = pos.row === 11 && pos.col > 1 && pos.col < 11;
              const isTop = pos.row === 1 && pos.col > 1 && pos.col < 11;
              const isLeft = pos.col === 1 && pos.row > 1 && pos.row < 11;
              const isRight = pos.col === 11 && pos.row > 1 && pos.row < 11;

              return (
                <div 
                  key={square.id} 
                  style={{ gridRow: pos.row, gridColumn: pos.col }}
                  className="w-full h-full pointer-events-auto"
                >
                  <Square 
                    square={square} 
                    playersOnSquare={playersOnSquare}
                    allPlayers={players}
                    isBottomRow={isBottom}
                    isTopRow={isTop}
                    isLeftCol={isLeft}
                    isRightCol={isRight}
                  />
                </div>
              );
            })}
          </div>
        </div>
        </Panel>

        <PanelResizeHandle className="w-4 flex items-center justify-center cursor-col-resize group">
          <div className="h-12 w-1 rounded-full bg-black/10 group-hover:bg-black/30 transition-colors" />
        </PanelResizeHandle>

        {/* Sidebar Info */}
        <Panel defaultSize={25} minSize={20} className="flex flex-col gap-4 z-10 min-h-0">
          {/* Players List */}
          <div className="glass rounded-xl p-4 flex-shrink-0">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User size={20} /> {t('players')}
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-2">
              {players.map(p => {
                const isCurrent = currentPlayer.id === p.id;
                return (
                  <div 
                    key={p.id} 
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${isCurrent ? 'bg-black/20 scale-[1.02] z-10 relative' : 'border-[var(--glass-border)] bg-black/5 border-transparent'}`}
                    style={isCurrent ? { 
                      borderColor: p.color, 
                      boxShadow: `0 4px 20px ${p.color}40, inset 0 0 10px ${p.color}20` 
                    } : {}}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                        <span className="font-bold">{t(p.name)}</span>
                      </div>
                      <div className="font-mono font-bold opacity-90 flex items-center">
                        <span className="mr-0.5">{currencySymbol}</span>{p.money}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-70 mb-2">
                      <span>{p.properties.length} {t('propertiesOwned')}</span>
                      <span className="font-bold uppercase bg-black/10 px-2 py-0.5 rounded">Lap {p.laps}/{maxLaps}</span>
                    </div>
                    {p.properties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.properties.map(propId => {
                          const prop = board.find(s => s.id === propId);
                          if (!prop) return null;
                          return (
                            <div 
                              key={propId} 
                              className="text-[10px] border border-[var(--glass-border)] rounded overflow-hidden flex items-center bg-black/5" 
                              title={t(prop.name)}
                            >
                              {prop.group && <div className={`w-2 h-full self-stretch ${GROUP_COLORS[prop.group]}`} />}
                              {!prop.group && prop.type === 'railroad' && <div className="w-2 h-full self-stretch bg-gray-500" />}
                              {!prop.group && prop.type === 'utility' && <div className="w-2 h-full self-stretch bg-yellow-400" />}
                              <span className="px-1.5 py-0.5 truncate max-w-[70px] font-medium">{t(prop.name)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Log */}
          <div className="glass rounded-xl p-4 flex-1 flex flex-col min-h-[200px]">
            <h2 className="text-lg font-bold mb-4">{t('gameLog')}</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {logs.map((log, i) => (
                <div key={i} className="text-xs opacity-80 border-b border-[var(--glass-border)] pb-1 last:border-0">
                  {translateLog(log)}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </PanelGroup>

      <SettingsMenu 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        players={players}
        onUpdatePlayer={() => {}}
      />
    </div>
  );
}
