import React, { useState, useEffect } from "react";
import { useSettings } from "../SettingsContext";
import { Users, Plus, Settings as SettingsIcon, ArrowLeft, Minus, Infinity as InfinityIcon } from "lucide-react";
import { motion } from "motion/react";

const MainMenu = ({ game, openSettings }) => {
  const { t, playerName, setPlayerName, playerColor, setPlayerColor, userId } =
    useSettings();
  const [view, setView] = useState("main");
  const [roomName, setRoomName] = useState(t("roomNameDefault").replace("{name}", playerName));
  const [maxLaps, setMaxLaps] = useState(5);
  const [totalPlayers, setTotalPlayers] = useState(1); // Human slots (online)
  const [botCount, setBotCount] = useState(1);

  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  // Update room name when player name changes
  useEffect(() => {
    setRoomName(t("roomNameDefault").replace("{name}", playerName));
  }, [playerName]);

  const handleCreate = () => {
    game.createRoom(
      { name: roomName, maxLaps, totalPlayers, botCount },
      { id: userId, name: playerName, color: playerColor },
    );
  };

  const adjustLaps = (delta) => {
    if (maxLaps === 0 && delta > 0) {
      setMaxLaps(1);
      return;
    }
    if (maxLaps === 0) return;
    const newVal = Math.max(1, Math.min(99, maxLaps + delta));
    setMaxLaps(newVal);
  };

  const adjustPlayers = (delta) => {
    const newVal = Math.max(1, Math.min(6, totalPlayers + delta));
    // Если сумма превышает 6, уменьшаем количество ботов
    while (newVal + botCount > 6) {
      if (botCount > 0) setBotCount(prev => prev - 1);
      else break;
    }
    setTotalPlayers(newVal);
  };

  const adjustBots = (delta) => {
    const newVal = Math.max(0, Math.min(6 - totalPlayers, botCount + delta));
    setBotCount(newVal);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full min-h-screen">
      {/* Top Right Profile */}
      <div className="absolute top-4 right-4 glass p-2 rounded-2xl flex items-center gap-3">
        <button
          onClick={() => {
            const currentIndex = colors.indexOf(playerColor);
            const nextIndex = (currentIndex + 1) % colors.length;
            setPlayerColor(colors[nextIndex]);
          }}
          className="w-8 h-8 rounded-full border-2 border-white/50 shadow-md transition-transform active:scale-90"
          style={{ backgroundColor: playerColor }}
        />
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="bg-black/5 border border-black/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          maxLength={15}
        />
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
          {t("mainMenuTitle")}
        </h1>

        {view === "main" && (
          <div className="space-y-4">
            <button
              onClick={() => setView("create")}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={24} /> {t("createRoomBtn")}
            </button>
            <button
              onClick={() => setView("join")}
              className="w-full py-4 glass rounded-xl font-bold text-lg hover:bg-black/10 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Users size={24} /> {t("joinRoomBtn")}
            </button>
          </div>
        )}

        {view === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h2 className="text-2xl font-bold mb-6">{t("createRoomBtn")}</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 opacity-80 uppercase">
                {t("roomNameLabel")}
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 opacity-80 uppercase">
                {t("lapsToWinLabel")}
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center bg-black/5 rounded-xl overflow-hidden border border-black/10">
                  <button 
                    onClick={() => adjustLaps(-1)}
                    className="p-3 hover:bg-black/5 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex-1 text-center font-bold text-xl">
                    {maxLaps === 0 ? <InfinityIcon size={24} className="mx-auto" /> : maxLaps}
                  </div>
                  <button 
                    onClick={() => adjustLaps(1)}
                    className="p-3 hover:bg-black/5 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <button
                  onClick={() => setMaxLaps(maxLaps === 0 ? 5 : 0)}
                  className={`p-3 rounded-xl transition-all ${maxLaps === 0 ? "bg-blue-600 text-white shadow-md" : "bg-black/5 hover:bg-black/10"}`}
                  title={t("infinite")}
                >
                  <InfinityIcon size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80 uppercase">
                  {t("humanSlotsLabel")}
                </label>
                <div className="flex items-center bg-black/5 rounded-xl overflow-hidden border border-black/10">
                  <button 
                    onClick={() => adjustPlayers(-1)}
                    disabled={totalPlayers <= 1}
                    className="p-3 hover:bg-black/5 transition-colors disabled:opacity-30"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex-1 text-center font-bold text-xl">
                    {totalPlayers}
                  </div>
                  <button 
                    onClick={() => adjustPlayers(1)}
                    disabled={totalPlayers + botCount >= 6}
                    className="p-3 hover:bg-black/5 transition-colors disabled:opacity-30"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80 uppercase">
                  {t("botsLabel")}
                </label>
                <div className="flex items-center bg-black/5 rounded-xl overflow-hidden border border-black/10">
                  <button 
                    onClick={() => adjustBots(-1)}
                    disabled={botCount <= 0}
                    className="p-3 hover:bg-black/5 transition-colors disabled:opacity-30"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex-1 text-center font-bold text-xl">
                    {botCount}
                  </div>
                  <button 
                    onClick={() => adjustBots(1)}
                    disabled={totalPlayers + botCount >= 6}
                    className="p-3 hover:bg-black/5 transition-colors disabled:opacity-30"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setView("main")}
                className="flex-1 py-3 glass rounded-xl font-bold hover:bg-black/10 transition-all flex items-center justify-center gap-1"
              >
                <ArrowLeft size={18} /> {t("back")}
              </button>
              <button
                onClick={handleCreate}
                className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-md"
              >
                {t("create")}
              </button>
            </div>
          </motion.div>
        )}

        {view === "join" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left flex flex-col h-[400px]"
          >
            <h2 className="text-2xl font-bold mb-4">{t("roomListTitle")}</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {game.roomsList.length === 0 ? (
                <div className="text-center opacity-50 py-10 font-medium">
                  {t("noRooms")}
                </div>
              ) : (
                game.roomsList.map((room) => (
                  <div
                    key={room.id}
                    className="glass p-4 rounded-xl flex items-center justify-between hover:bg-black/5 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-lg">{room.name}</div>
                      <div className="text-xs opacity-70 flex gap-3 mt-1">
                        <span>
                          {t("playersCount")}: {room.playersCount}/{room.totalPlayers}
                        </span>
                        <span>{t("laps")}: {room.maxLaps === 0 ? t("infinite") : room.maxLaps}</span>
                        <span>
                          {room.state === "playing" ? t("playing") : t("waiting")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        game.joinRoom(room.id, { id: userId, name: playerName })
                      }
                      disabled={
                        room.state === "playing" ||
                        room.playersCount >= room.totalPlayers
                      }
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${room.state === "playing" || room.playersCount >= room.totalPlayers ? "bg-gray-400/50 cursor-not-allowed text-white/70" : "bg-blue-600 text-white hover:bg-blue-500 shadow-md"}`}
                    >
                      {t("join")}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setView("main")}
              className="w-full py-3 glass rounded-xl font-bold hover:bg-black/10 transition-all mt-auto flex items-center justify-center gap-1"
            >
              <ArrowLeft size={18} /> {t("back")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
