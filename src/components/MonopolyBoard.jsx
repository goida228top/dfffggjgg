import React from "react";
import {
  Settings,
  Users,
  ScrollText,
  Dice5,
  ChevronRight,
  Trophy,
  Home,
  User,
  DollarSign,
  ArrowRight,
  Maximize,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMonopolyGame } from "../useGame";
import { useSettings } from "../SettingsContext";
import Square from "./Square";
import { SettingsMenu } from "./SettingsMenu";
import { SetupScreen } from "./SetupScreen";
import MainMenu from "./MainMenu";
import TokenIcon from "./TokenIcon";
import { DraggableWindow } from "./DraggableWindow";
import { PropertyModal } from "./PropertyModal";
import { TradeModal } from "./TradeModal";
import { TradeOfferModal } from "./TradeOfferModal";

const MonopolyBoard = () => {
  const game = useMonopolyGame();
  const { t, currencySymbol } = useSettings();
  const [showSettings, setShowSettings] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("auto"); // auto, full, tl, tr, bl, br
  const [visibleStatus, setVisibleStatus] = React.useState("");
  const [visibleAction, setVisibleAction] = React.useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState(null);
  const [tradeTargetId, setTradeTargetId] = React.useState(null);

  React.useEffect(() => {
    if (game.statusMessage) {
      setVisibleStatus(game.statusMessage);
    }
  }, [game.statusMessage]);

  React.useEffect(() => {
    if (game.lastActionMessage) {
      setVisibleAction(game.lastActionMessage);
      const timer = setTimeout(() => {
        setVisibleAction(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [game.lastActionMessage]);

  const isMyTurn = !game.currentPlayer?.isBot && (game.currentPlayer?.id === game.myId || (game.currentPlayer?.isLocal && game.isHost));

  const handleCameraClick = (mode) => {
    setViewMode(prev => prev === mode ? "auto" : mode);
  };

  if (!game.roomId) {
    return <MainMenu game={game} openSettings={() => setShowSettings(true)} />;
  }

  if (game.phase === "setup") {
    return <SetupScreen game={game} />;
  }

  const renderBoard = () => {
    const bottomRow = game.board.slice(0, 11).reverse();
    const leftRow = game.board.slice(11, 20).reverse();
    const topRow = game.board.slice(20, 31);
    const rightRow = game.board.slice(31, 40);

    const getPlayerPos = (id) => {
      if (id >= 0 && id <= 10) return { r: 10, c: 10 - id };
      if (id >= 11 && id <= 19) return { r: 10 - (id - 10), c: 0 };
      if (id >= 20 && id <= 30) return { r: 0, c: id - 20 };
      if (id >= 31 && id <= 39) return { r: id - 30, c: 10 };
      return { r: 0, c: 0 };
    };

    const getTransform = () => {
      if (viewMode === "full") {
        return { origin: "center", scale: 1, x: 0, y: 0 };
      }

      let targetPos = 0;
      
      if (viewMode === "auto") {
        // Find the player to follow
        let targetPlayer = game.currentPlayer;
        
        // If it's not our turn, we only follow the active player if they are moving or rolling
        // Otherwise, we look at our own piece
        if (!isMyTurn && !["moving", "rolling", "dice_result"].includes(game.phase)) {
           targetPlayer = game.players.find(p => p.id === game.myId) || game.currentPlayer;
        }
        
        if (targetPlayer) {
          targetPos = targetPlayer.position;
        }
      } else {
        // Manual corner modes
        switch (viewMode) {
          case "tl": targetPos = 20; break;
          case "tr": targetPos = 30; break;
          case "bl": targetPos = 10; break;
          case "br": targetPos = 0; break;
          default: targetPos = 0;
        }
      }

      // Calculate smooth origin based on position (0-39)
      // Board is a square. 0=BR, 10=BL, 20=TL, 30=TR
      let x = 0;
      let y = 0;
      
      if (targetPos >= 0 && targetPos <= 10) {
        // Bottom row (BR to BL)
        x = 100 - (targetPos / 10) * 100;
        y = 100;
      } else if (targetPos > 10 && targetPos <= 20) {
        // Left row (BL to TL)
        x = 0;
        y = 100 - ((targetPos - 10) / 10) * 100;
      } else if (targetPos > 20 && targetPos <= 30) {
        // Top row (TL to TR)
        x = ((targetPos - 20) / 10) * 100;
        y = 0;
      } else {
        // Right row (TR to BR)
        x = 100;
        y = ((targetPos - 30) / 10) * 100;
      }

      return { origin: `${x}% ${y}%`, scale: 1.8 };
    };

    const { origin, scale } = getTransform();

    return (
      <DraggableWindow 
        style={{ top: "50%", left: "2vw" }} 
        initial={{ y: "-50%" }}
        className="w-[min(90vw,800px)] aspect-square !bg-[#E4E9D8] !border-slate-300 !shadow-2xl" 
        handleClassName="!bg-slate-200/80 hover:!bg-slate-300/80 border-b border-slate-300"
      >
        <div className="relative w-full h-full p-0 overflow-hidden">
          {/* Center Logo & Info */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0"
            animate={{
              transformOrigin: origin,
              scale: scale,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-[-45deg] gap-6 md:gap-10">
              {/* Community Chest Deck */}
              <div className="w-20 h-14 md:w-32 md:h-20 bg-blue-50/80 border-2 border-blue-300 rounded-lg shadow-md flex items-center justify-center backdrop-blur-sm">
                <span className="text-[8px] md:text-xs font-black text-blue-500 uppercase tracking-widest text-center leading-tight">{t("communityChest")}</span>
              </div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl md:text-7xl font-black text-emerald-600/15 tracking-tighter"
              >
                {t("monopoly")}
              </motion.h1>

              {/* Chance Deck */}
              <div className="w-20 h-14 md:w-32 md:h-20 bg-orange-50/80 border-2 border-orange-300 rounded-lg shadow-md flex items-center justify-center backdrop-blur-sm">
                <span className="text-[8px] md:text-xs font-black text-orange-500 uppercase tracking-widest text-center leading-tight">{t("chance")}</span>
              </div>
            </div>
          </motion.div>

        {/* Board Grid */}
        <motion.div
          className="grid grid-cols-11 grid-rows-11 h-full w-full relative"
          animate={{
            transformOrigin: origin,
            scale: scale,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            {/* Top Row */}
            {topRow.map((sq, i) => {
              const owner = game.players.find(p => p.id === sq.owner);
              const playersInJail = game.players.filter(p => !p.bankrupt && p.position === sq.id && p.inJail);
              return (
                <div key={sq.id} style={{ gridColumnStart: i + 1, gridRowStart: 1 }}>
                  <Square
                    square={sq}
                    side="top"
                    ownerToken={owner?.token}
                    ownerColor={owner?.color}
                    playersInJail={playersInJail}
                    onClick={() => setSelectedPropertyId(sq.id)}
                  />
                </div>
              );
            })}
            {/* Right Row */}
            {rightRow.map((sq, i) => {
              const owner = game.players.find(p => p.id === sq.owner);
              const playersInJail = game.players.filter(p => !p.bankrupt && p.position === sq.id && p.inJail);
              return (
                <div key={sq.id} style={{ gridColumnStart: 11, gridRowStart: i + 2 }}>
                  <Square
                    square={sq}
                    side="right"
                    ownerToken={owner?.token}
                    ownerColor={owner?.color}
                    playersInJail={playersInJail}
                    onClick={() => setSelectedPropertyId(sq.id)}
                  />
                </div>
              );
            })}
            {/* Bottom Row */}
            {bottomRow.map((sq, i) => {
              const owner = game.players.find(p => p.id === sq.owner);
              const playersInJail = game.players.filter(p => !p.bankrupt && p.position === sq.id && p.inJail);
              return (
                <div key={sq.id} style={{ gridColumnStart: i + 1, gridRowStart: 11 }}>
                  <Square
                    square={sq}
                    side="bottom"
                    ownerToken={owner?.token}
                    ownerColor={owner?.color}
                    playersInJail={playersInJail}
                    onClick={() => setSelectedPropertyId(sq.id)}
                  />
                </div>
              );
            })}
            {/* Left Row */}
            {leftRow.map((sq, i) => {
              const owner = game.players.find(p => p.id === sq.owner);
              const playersInJail = game.players.filter(p => !p.bankrupt && p.position === sq.id && p.inJail);
              return (
                <div key={sq.id} style={{ gridColumnStart: 1, gridRowStart: i + 2 }}>
                  <Square
                    square={sq}
                    side="left"
                    ownerToken={owner?.token}
                    ownerColor={owner?.color}
                    playersInJail={playersInJail}
                    onClick={() => setSelectedPropertyId(sq.id)}
                  />
                </div>
              );
            })}

            {/* Players Layer (Absolute positioning for stable layout) */}
            <div className="absolute inset-0 pointer-events-none z-50">
              {game.players.filter(p => !p.bankrupt).map((player) => {
                const { r, c } = getPlayerPos(player.position);
                const playersOnSameSquare = game.players.filter(p => !p.bankrupt && p.position === player.position);
                const playerCount = playersOnSameSquare.length;
                const playerIndexOnSquare = playersOnSameSquare.findIndex(p => p.id === player.id);
                
                const cellSize = 100 / 11;
                
                // Shrink tokens if there are many on one square
                const isCrowded = playerCount > 2;
                const tokenScale = isCrowded ? 0.75 : 1;
                const iconSize = isCrowded ? 12 : 16;
                
                // Calculate distribution offset
                let offsetX = 0;
                let offsetY = 0;
                
                if (playerCount > 1) {
                  const offsetAmount = isCrowded ? 8 : 6;
                  if (playerCount === 2) {
                    // Side by side
                    offsetX = (playerIndexOnSquare === 0 ? -offsetAmount : offsetAmount);
                  } else {
                    // 2x2 grid or similar
                    const row = Math.floor(playerIndexOnSquare / 2);
                    const col = playerIndexOnSquare % 2;
                    offsetX = (col === 0 ? -offsetAmount : offsetAmount);
                    offsetY = (row === 0 ? -offsetAmount : offsetAmount);
                  }
                }
                
                return (
                  <motion.div
                    key={player.id}
                    initial={false}
                    animate={{ 
                      top: `${r * cellSize}%`,
                      left: `${c * cellSize}%`,
                    }}
                    transition={{ 
                      duration: 0.4, 
                      ease: "easeInOut"
                    }}
                    className="absolute flex items-center justify-center pointer-events-auto"
                    style={{ 
                      width: `${cellSize}%`,
                      height: `${cellSize}%`,
                    }}
                  >
                    <motion.div 
                      animate={{ scale: tokenScale, x: offsetX, y: offsetY }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5 md:w-7 md:h-7 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white/40"
                      style={{
                        backgroundColor: player.color,
                      }}
                    >
                      <TokenIcon type={player.token} size={iconSize} />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </DraggableWindow>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Status Window */}
      <AnimatePresence>
        {visibleStatus && (
          <DraggableWindow 
            style={{ top: "40vh", right: "2vw" }} 
            className="!bg-white !shadow-xl w-[300px]" 
            handleClassName="bg-slate-100 border-b border-slate-200"
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="px-6 py-3 rounded-b-2xl flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-sm md:text-base text-slate-800 drop-shadow-sm">
                {visibleStatus}
              </span>
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      {/* Players Panel */}
      <DraggableWindow style={{ top: "2vh", right: "2vw" }} className="w-64 max-h-[80vh] !bg-white/95 !backdrop-blur-xl shadow-2xl border-slate-200" handleClassName="bg-slate-100 border-b border-slate-200">
        <div className="p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Users size={18} /> {t("players")}
            </h2>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {game.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`p-2 rounded-xl border-2 transition-all relative overflow-hidden shrink-0 w-full ${
                  player.bankrupt
                    ? "opacity-50 grayscale border-slate-300 bg-slate-100"
                    : game.currentPlayerIndex === i
                    ? "border-emerald-500 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Timer Background for Active Player */}
                {game.currentPlayerIndex === i && game.timeLeft > 0 && (
                  <motion.div
                    className="absolute left-0 bottom-0 h-1 bg-emerald-500/50"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(game.timeLeft / 60) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                )}

                <div className="flex items-center gap-2 relative z-10">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    <TokenIcon type={player.token} size={14} className="w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-1.5 text-slate-800">
                      {player.name}
                      {player.id === game.myId && (
                        <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded uppercase">
                          {t("you")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-0.5 font-medium">
                        <DollarSign size={10} />
                        {player.money}
                      </span>
                      {game.currentPlayerIndex === i && (
                        <span className={`font-mono font-bold ${game.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                          {game.timeLeft}s
                        </span>
                      )}
                    </div>
                  </div>
                  {player.bankrupt ? (
                    <div className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                      {t("bankrupt")}
                    </div>
                  ) : player.inJail ? (
                    <div className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                      {t("jail")}
                    </div>
                  ) : (
                    game.currentPlayerIndex === i ? null : (
                      // Only show trade button if it's MY turn (or I'm host and it's a local human's turn)
                      isMyTurn && (
                        <button
                          onClick={() => setTradeTargetId(player.id)}
                          className="text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 transition-colors"
                        >
                          {t("trade")}
                        </button>
                      )
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DraggableWindow>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative w-full h-full">
        {renderBoard()}
      </div>

      {/* Camera Controls */}
      <DraggableWindow style={{ bottom: "2vh", right: "2vw" }} className="w-auto !bg-white !backdrop-blur-none shadow-2xl border-slate-200" handleClassName="bg-slate-100 border-b border-slate-200">
        <div className="flex flex-col gap-2 p-3">
          <div className="text-[10px] text-center font-bold text-slate-800 uppercase tracking-wider mb-1">{t("camera")}</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleCameraClick("tl")}
              className={`w-10 h-10 rounded-md transition-all flex items-center justify-center ${viewMode === "tl" ? "bg-teal-100 shadow-inner scale-105 border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("topLeft")}
            >
              <div className="w-3 h-3 border-t-[3px] border-l-[3px] border-black" />
            </button>
            <button
              onClick={() => handleCameraClick("tr")}
              className={`w-10 h-10 rounded-md transition-all flex items-center justify-center ${viewMode === "tr" ? "bg-teal-100 shadow-inner scale-105 border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("topRight")}
            >
              <div className="w-3 h-3 border-t-[3px] border-r-[3px] border-black" />
            </button>
            <button
              onClick={() => handleCameraClick("bl")}
              className={`w-10 h-10 rounded-md transition-all flex items-center justify-center ${viewMode === "bl" ? "bg-teal-100 shadow-inner scale-105 border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("bottomLeft")}
            >
              <div className="w-3 h-3 border-b-[3px] border-l-[3px] border-black" />
            </button>
            <button
              onClick={() => handleCameraClick("br")}
              className={`w-10 h-10 rounded-md transition-all flex items-center justify-center ${viewMode === "br" ? "bg-teal-100 shadow-inner scale-105 border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("bottomRight")}
            >
              <div className="w-3 h-3 border-b-[3px] border-r-[3px] border-black" />
            </button>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setViewMode("auto")}
              className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${viewMode === "auto" ? "bg-teal-100 shadow-inner border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("auto")}
            >
              <Camera size={16} className="text-black" />
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${viewMode === "full" ? "bg-teal-100 shadow-inner border border-teal-500" : "bg-slate-100 hover:bg-slate-200 border border-slate-200"}`}
              title={t("fullView")}
            >
              <Maximize size={16} className="text-black" />
            </button>
          </div>
        </div>
      </DraggableWindow>

      {/* Controls Panel (Actions Window) */}
      <DraggableWindow style={{ bottom: "2vh", right: "140px" }} className="w-[300px] !bg-white !backdrop-blur-none shadow-2xl border-slate-200" handleClassName="bg-slate-100 border-b border-slate-200">
        <div className="p-4 flex flex-col gap-4">
          <div className="text-sm font-bold text-slate-800 text-center uppercase tracking-wider border-b border-slate-200 pb-2">
            {t("actions")}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isMyTurn ? (
              <div className="px-6 py-4 text-center font-bold text-slate-500 w-full">
                {t("waitingForDecisionLog", { player: game.players[game.currentPlayerIndex]?.name })}
              </div>
            ) : (
              <>
                {game.phase === "roll" && (
                  <div className="flex flex-col gap-2 w-full">
                    {game.currentPlayer?.inJail ? (
                      <>
                        <button
                          onClick={() => game.rollDice()}
                          className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                        >
                          <Dice5 size={20} /> {t("rollForDoubles")}
                        </button>
                        <button
                          onClick={() => game.payToLeaveJail()}
                          disabled={game.currentPlayer.money < 50}
                          className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <DollarSign size={20} /> {t("payJail")}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => game.rollDice()}
                        className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                      >
                        <Dice5 size={20} /> {t("rollDice")}
                      </button>
                    )}
                  </div>
                )}

                {game.phase === "action" && (
                  <>
                    <button
                      onClick={() => game.buyProperty()}
                      className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95"
                    >
                      <DollarSign size={20} /> {t("buyProperty")}
                    </button>
                    <button
                      onClick={() => game.endTurn()}
                      className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all bg-slate-700 hover:bg-slate-600 text-white hover:scale-105 active:scale-95"
                    >
                      <ArrowRight size={20} /> {t("pass")}
                    </button>
                  </>
                )}

                {game.phase === "end" && (
                  <button
                    onClick={() => game.endTurn()}
                    className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                  >
                    <ArrowRight size={20} /> {t("endTurn")}
                  </button>
                )}

                {game.phase === "moving" && (
                  <div className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 flex items-center gap-2 w-full justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Dice5 size={20} className="opacity-50" />
                    </motion.div>
                    {t("moving")}
                  </div>
                )}

                {game.phase === "rolling" && (
                  <div className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 flex items-center gap-2 w-full justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Dice5 size={20} className="opacity-50" />
                    </motion.div>
                    {t("rollingDiceLog")}
                  </div>
                )}

                {game.phase === "dice_result" && (
                  <div className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 flex items-center gap-2 w-full justify-center">
                    <Dice5 size={20} className="opacity-50" />
                    {t("diceResultLog", { total: game.dice[0] + game.dice[1] })}
                  </div>
                )}

                {game.phase === "drawing_card" && game.drawnCard && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="text-center">
                      <h3 className="text-lg font-bold uppercase tracking-widest text-slate-800">
                        {t(game.drawnCard.type)}
                      </h3>
                      <p className="text-sm leading-relaxed italic text-slate-600">
                        "{t(game.drawnCard.key)}"
                      </p>
                    </div>
                    <button
                      onClick={() => game.resolveCard()}
                      className="w-full py-3 rounded-xl font-bold text-lg shadow-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                    >
                      {t("ok")}
                    </button>
                  </div>
                )}
                
                {(game.phase === "roll" || game.phase === "action" || game.phase === "end") && isMyTurn && (
                  <div className="text-xs text-slate-500 text-center mt-2 italic">
                    {t("buildHouseHint")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DraggableWindow>

      {/* Win Screen */}
      <AnimatePresence>
        {game.phase === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-12 rounded-[3rem] text-center flex flex-col items-center gap-8 border-4 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            >
              <div className="relative">
                <Trophy size={120} className="text-yellow-500" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-yellow-500 blur-3xl -z-10"
                />
              </div>
              <div>
                <h2 className="text-5xl font-black mb-2">{t("victory")}</h2>
                <p className="text-2xl opacity-80">
                  {t("conquered").replace("{player}", game.winner?.name)}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-xl shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                {t("playAgain")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsMenu game={game} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Full-screen Dice Animation */}
      <AnimatePresence>
        {(game.phase === "rolling" || game.phase === "dice_result") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex gap-8"
            >
              <motion.div
                animate={game.phase === "rolling" ? { rotate: 360, x: [0, -20, 0], y: [0, -50, 0] } : { rotate: 0, x: 0, y: 0 }}
                transition={game.phase === "rolling" ? { duration: 0.5, repeat: Infinity } : { type: "spring", stiffness: 300, damping: 20 }}
                className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-5xl font-black text-slate-800 border-4 border-slate-200"
              >
                {game.dice[0]}
              </motion.div>
              <motion.div
                animate={game.phase === "rolling" ? { rotate: -360, x: [0, 20, 0], y: [0, -40, 0] } : { rotate: 0, x: 0, y: 0 }}
                transition={game.phase === "rolling" ? { duration: 0.5, repeat: Infinity, delay: 0.1 } : { type: "spring", stiffness: 300, damping: 20 }}
                className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-5xl font-black text-slate-800 border-4 border-slate-200"
              >
                {game.dice[1]}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {visibleAction && (
          <motion.div
            key={JSON.stringify(visibleAction)}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[250] bg-slate-800 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 pointer-events-none"
          >
            <span className="font-medium text-lg text-center">
              {(() => {
                const msg = visibleAction;
                if (msg.key === "landedOn") {
                  const priceStr = msg.params.price ? ` (${currencySymbol}${msg.params.price})` : "";
                  return t("landedOnLog", { player: msg.params.player, square: t(msg.params.square), price: priceStr });
                }
                if (msg.key === "boughtProperty") {
                  return t("boughtPropertyLog", { player: msg.params.player, square: t(msg.params.square), c: currencySymbol, price: msg.params.price });
                }
                if (msg.key === "paysRent") {
                  return t("paidRentLog", { player: msg.params.player, c: currencySymbol, rent: msg.params.rent, owner: msg.params.owner });
                }
                if (msg.key === "paidTax") {
                  return t("paidTaxLog", { player: msg.params.player, c: currencySymbol, tax: msg.params.tax });
                }
                if (msg.key === "drewCard") {
                  return t("drewCardLog", { player: msg.params.player, type: t(msg.params.type) });
                }
                return t(msg.key, msg.params);
              })()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPropertyId !== null && (
          <PropertyModal
            square={game.board.find(s => s.id === selectedPropertyId)}
            game={game}
            onClose={() => setSelectedPropertyId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tradeTargetId !== null && (
          <TradeModal
            game={game}
            targetPlayerId={tradeTargetId}
            onClose={() => setTradeTargetId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {game.tradeOffer && (
          // Show if the trade is to me, OR if I am host and the trade is to a local human player
          (() => {
            const targetPlayer = game.players.find(p => p.id === game.tradeOffer.to);
            if (!targetPlayer) return false;
            const isMe = targetPlayer.id === game.myId;
            const isMyLocalHuman = game.isHost && targetPlayer.isLocal && !targetPlayer.isBot;
            return isMe || isMyLocalHuman;
          })()
        ) && (
          <TradeOfferModal game={game} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonopolyBoard;
