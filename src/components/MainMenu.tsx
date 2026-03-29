import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import { Users, Plus, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const MainMenu = ({ game, openSettings }: { game: any, openSettings: () => void }) => {
  const { t, playerName, setPlayerName, playerColor, setPlayerColor } = useSettings();
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [roomName, setRoomName] = useState(`${playerName}'s Room`);
  const [maxLaps, setMaxLaps] = useState(5);

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const handleCreate = () => {
    game.createRoom({ name: roomName, maxLaps }, { name: playerName, color: playerColor });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full">
      {/* Top Right Profile */}
      <div className="absolute top-4 right-4 glass p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="flex flex-col">
          <label className="text-xs uppercase font-bold opacity-70 mb-1">Ваш никнейм</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)}
            className="bg-black/10 border border-black/20 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={15}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs uppercase font-bold opacity-70 mb-1">Цвет</label>
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setPlayerColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${playerColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <button 
        onClick={openSettings}
        className="absolute top-4 left-4 p-3 rounded-full glass hover:bg-black/10 transition-colors"
      >
        <SettingsIcon size={24} />
      </button>

      <div className="glass p-10 rounded-3xl max-w-md w-full text-center">
        <h1 className="text-5xl font-black mb-8 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">
          МОНОПОЛИЯ
        </h1>

        {view === 'main' && (
          <div className="space-y-4">
            <button 
              onClick={() => setView('create')}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={24} /> Создать комнату
            </button>
            <button 
              onClick={() => setView('join')}
              className="w-full py-4 glass rounded-xl font-bold text-lg hover:bg-black/10 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Users size={24} /> Присоединиться
            </button>
          </div>
        )}

        {view === 'create' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-left">
            <h2 className="text-2xl font-bold mb-6">Создание комнаты</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 opacity-80 uppercase">Название комнаты</label>
              <input 
                type="text" 
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold mb-2 opacity-80 uppercase">Кругов для победы</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(laps => (
                  <button
                    key={laps}
                    onClick={() => setMaxLaps(laps)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${maxLaps === laps ? 'bg-blue-600 text-white shadow-md' : 'bg-black/5 hover:bg-black/10'}`}
                  >
                    {laps}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setView('main')}
                className="flex-1 py-3 glass rounded-xl font-bold hover:bg-black/10 transition-all flex items-center justify-center gap-1"
              >
                <ArrowLeft size={18} /> Назад
              </button>
              <button 
                onClick={handleCreate}
                className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-md"
              >
                Создать
              </button>
            </div>
          </motion.div>
        )}

        {view === 'join' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-left flex flex-col h-[400px]">
            <h2 className="text-2xl font-bold mb-4">Список комнат</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {game.roomsList.length === 0 ? (
                <div className="text-center opacity-50 py-10 font-medium">Нет доступных комнат</div>
              ) : (
                game.roomsList.map((room: any) => (
                  <div key={room.id} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-black/5 transition-colors">
                    <div>
                      <div className="font-bold text-lg">{room.name}</div>
                      <div className="text-xs opacity-70 flex gap-3 mt-1">
                        <span>Игроков: {room.playersCount}/6</span>
                        <span>Кругов: {room.maxLaps}</span>
                        <span>{room.state === 'playing' ? 'В игре' : 'Ожидание'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => game.joinRoom(room.id, { name: playerName, color: playerColor })}
                      disabled={room.state === 'playing' || room.playersCount >= 6}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${room.state === 'playing' || room.playersCount >= 6 ? 'bg-gray-400/50 cursor-not-allowed text-white/70' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'}`}
                    >
                      Войти
                    </button>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setView('main')}
              className="w-full py-3 glass rounded-xl font-bold hover:bg-black/10 transition-all mt-auto flex items-center justify-center gap-1"
            >
              <ArrowLeft size={18} /> Назад
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
