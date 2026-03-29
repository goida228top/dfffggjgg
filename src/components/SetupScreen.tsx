import React, { useState, useEffect } from 'react';
import { Users, Play, Copy, Check, Crown, Palette, ArrowLeft } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { PlayerToken } from '../gameData';
import { TokenIcon } from './TokenIcon';

const AVAILABLE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const AVAILABLE_TOKENS: PlayerToken[] = ['car', 'dog', 'ship', 'hat', 'shoe', 'iron', 'thimble', 'wheelbarrow'];

interface SetupScreenProps {
  onStart: () => void;
  lobbyUsers: any[];
  isHost: boolean;
  roomId: string;
  myId: string;
  updateLobbyUser: (name: string, color: string, token: PlayerToken) => void;
  updateMaxLaps: (laps: number) => void;
  maxLaps: number;
  addBot: () => void;
  addLocalPlayer: () => void;
  removeBot: (id: string) => void;
  leaveRoom: () => void;
  roomName: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ 
  onStart, lobbyUsers, isHost, roomId, myId, updateLobbyUser, updateMaxLaps, maxLaps, addBot, addLocalPlayer, removeBot, leaveRoom, roomName
}) => {
  const { t } = useSettings();
  
  const myUser = lobbyUsers.find(u => u.id === myId);
  const [myName, setMyName] = useState(myUser?.name || 'Player');

  useEffect(() => {
    if (myUser && myUser.name !== myName) {
      setMyName(myUser.name);
    }
  }, [myUser?.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMyName(e.target.value);
  };

  const handleNameBlur = () => {
    if (myUser) {
      updateLobbyUser(myName || 'Player', myUser.color, myUser.token);
    }
  };

  const takenTokens = lobbyUsers.filter(u => u.id !== myId).map(u => u.token);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass p-8 rounded-2xl max-w-md w-full text-center relative">
        <button 
          onClick={leaveRoom}
          className="absolute top-4 right-4 p-2 rounded-lg glass hover:bg-red-500/20 hover:text-red-600 transition-colors flex items-center gap-1 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Выйти
        </button>

        <h1 className="text-3xl font-black mb-6 uppercase tracking-widest mt-4">{roomName}</h1>
        
        {isHost && (
          <div className="mb-6 text-left">
            <label className="block text-sm font-bold mb-2 opacity-80 uppercase">Кругов для победы</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map(laps => (
                <button
                  key={laps}
                  onClick={() => updateMaxLaps(laps)}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${maxLaps === laps ? 'bg-blue-600 text-white shadow-md' : 'glass hover:bg-black/10'}`}
                >
                  {laps}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 text-left glass p-4 rounded-xl">
          <h3 className="font-bold mb-4 opacity-80 flex items-center gap-2">
            <Users size={18} /> {t('players')} ({lobbyUsers.length}/6)
          </h3>
          <div className="space-y-3">
            {lobbyUsers.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3 bg-black/5 p-2 rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm shrink-0" 
                  style={{ backgroundColor: user.color || AVAILABLE_COLORS[i % AVAILABLE_COLORS.length] }} 
                />
                
                {user.id === myId ? (
                  <input 
                    type="text"
                    value={myName}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    className="bg-white/50 border border-black/10 rounded px-2 py-1 text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ваш никнейм"
                    maxLength={15}
                  />
                ) : (
                  <span className="font-medium truncate">{user.name || `Игрок ${i + 1}`}</span>
                )}
                
                <TokenIcon token={user.token || 'car'} color={user.color || '#ef4444'} className="w-6 h-6 shrink-0" />
                
                {user.isHost && <Crown size={16} className="text-yellow-500 shrink-0 ml-auto" />}
                {isHost && (user.isBot || (user.isLocal && user.id !== myId)) && (
                  <button 
                    onClick={() => removeBot(user.id)}
                    className="text-red-500 hover:text-red-600 ml-auto text-xs font-bold uppercase px-2 py-1 bg-red-100 rounded"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
          {isHost && lobbyUsers.length < 6 && (
            <div className="flex gap-2 mt-4">
              <button 
                onClick={addLocalPlayer}
                className="flex-1 py-2 border-2 border-dashed border-black/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 hover:border-black/40 transition-all"
              >
                + Локальный
              </button>
              <button 
                onClick={addBot}
                className="flex-1 py-2 border-2 border-dashed border-black/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 hover:border-black/40 transition-all"
              >
                + Бот
              </button>
            </div>
          )}
        </div>

        {myUser && (
          <div className="mb-8 text-left glass p-4 rounded-xl">
            <h3 className="font-bold mb-4 opacity-80 flex items-center gap-2">
              <Palette size={18} /> Внешний вид
            </h3>
            
            <div className="mb-4">
              <div className="text-sm opacity-80 mb-2 uppercase font-bold">Цвет</div>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateLobbyUser(myName || 'Player', c, myUser.token)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 hover:shadow-md ${myUser.color === c ? 'scale-110 border-current' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm opacity-80 mb-2 uppercase font-bold">Фигурка</div>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_TOKENS.map(tkn => {
                  const isTaken = takenTokens.includes(tkn);
                  return (
                    <button
                      key={tkn}
                      onClick={() => !isTaken && updateLobbyUser(myName || 'Player', myUser.color, tkn)}
                      disabled={isTaken}
                      className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${myUser.token === tkn ? 'bg-black/20 border-black/30 font-bold' : isTaken ? 'opacity-30 cursor-not-allowed grayscale' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                    >
                      <TokenIcon token={tkn} color={myUser.token === tkn ? myUser.color : isTaken ? '#000' : '#94a3b8'} className="w-6 h-6" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={onStart}
            disabled={lobbyUsers.length < 2}
            className={`w-full py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 shadow-lg ${lobbyUsers.length < 2 ? 'bg-gray-500/50 text-white/50 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 hover:shadow-xl hover:brightness-110'}`}
          >
            <Play size={24} /> {lobbyUsers.length < 2 ? 'Ожидание игроков...' : t('startGame')}
          </button>
        ) : (
          <div className="w-full py-4 glass rounded-xl font-bold text-lg flex items-center justify-center gap-2 animate-pulse">
            Ожидание хоста...
          </div>
        )}
      </div>
    </div>
  );
};
