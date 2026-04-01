import React, { useEffect } from "react";
import { Users, Play, Plus, Minus, Infinity as InfinityIcon, Trash2, Shield, UserPlus, Palette, Ghost, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "../SettingsContext";
import TokenIcon from "./TokenIcon";

export const SetupScreen = ({ game }) => {
  const { t, playerName, playerColor } = useSettings();
  const myUser = game.lobbyUsers.find((u) => u.id === game.myId);
  const currentToken = myUser?.token || "car";

  // Update lobby user when settings change
  useEffect(() => {
    if (game.roomId) {
      game.updateLobbyUser(playerName, playerColor, currentToken);
    }
  }, [playerName, playerColor, game.roomId]);

  const tokens = ["car", "dog", "ship", "hat", "shoe", "iron"];
  const takenTokens = game.lobbyUsers
    .filter((u) => u.id !== game.myId)
    .map((u) => u.token);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gap-6">
      {/* Token Selection Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass p-6 rounded-[2rem] flex flex-col gap-4 border border-white/20 shadow-xl"
      >
        <h3 className="text-xs uppercase font-black opacity-50 text-center mb-2">
          {t("shape")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {tokens.map((tk) => {
            const isTaken = takenTokens.includes(tk);
            const isSelected = currentToken === tk;
            return (
              <button
                key={tk}
                disabled={isTaken}
                onClick={() => game.updateLobbyUser(playerName, playerColor, tk)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-lg scale-110"
                    : isTaken
                      ? "opacity-20 cursor-not-allowed grayscale"
                      : "glass hover:bg-white/10"
                }`}
              >
                <TokenIcon type={tk} size={28} />
                {isSelected && (
                  <motion.div
                    layoutId="activeToken"
                    className="absolute -right-1 -top-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl glass p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">
              {game.roomName}
            </h1>
            <p className="opacity-60 flex items-center gap-2">
              <Users size={16} /> {game.lobbyUsers.length} / 6 {t("players")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
              {t("lapsToWin")}
            </label>
            <div className="flex items-center gap-2 text-emerald-500">
              <span className="text-2xl font-black tabular-nums">
                {game.maxLaps === 0 ? <InfinityIcon size={24} /> : game.maxLaps}
              </span>
              {game.maxLaps === 0 && (
                <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">
                  {t("infinite")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-12">
          <AnimatePresence mode="popLayout">
            {game.lobbyUsers.map((user, i) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-4 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: user.color }}
                >
                  <TokenIcon type={user.token} size={28} />
                </div>

                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {user.name}
                    {user.isHost && (
                      <Shield size={14} className="text-yellow-500" />
                    )}
                  </div>
                </div>

                {game.isHost && user.id !== game.myId && (
                  <button
                    onClick={() => user.isBot ? game.removeBot(user.id) : game.kickPlayer(user.id)}
                    className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => game.leaveRoom()}
            className="flex-1 py-4 glass rounded-2xl font-bold hover:bg-white/10 transition-all"
          >
            {t("leaveRoom")}
          </button>
          {game.isHost && (
            <>
              <button
                onClick={() => game.startGame()}
                disabled={game.lobbyUsers.length < 2}
                className={`flex-[2] py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 shadow-xl transition-all ${
                  game.lobbyUsers.length >= 2
                    ? "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gray-600 opacity-50 cursor-not-allowed"
                }`}
              >
                <Play size={24} fill="currentColor" /> {t("startGame")}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
