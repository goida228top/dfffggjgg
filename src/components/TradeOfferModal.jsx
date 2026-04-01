import React from "react";
import { motion } from "motion/react";
import { useSettings } from "../SettingsContext";
import { GROUP_COLORS } from "../gameData";

export const TradeOfferModal = ({ game }) => {
  const { t, currencySymbol } = useSettings();
  const trade = game.tradeOffer;
  
  if (!trade) return null;

  const targetPlayer = game.players.find(p => p.id === trade.to);
  if (!targetPlayer) return null;

  const isMe = targetPlayer.id === game.myId;
  const isMyLocalHuman = game.isHost && targetPlayer.isLocal && !targetPlayer.isBot;
  
  if (!isMe && !isMyLocalHuman) return null;

  const fromPlayer = game.players.find(p => p.id === trade.from);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col"
      >
        <div className="bg-amber-500 text-white p-4 text-center font-bold text-xl uppercase tracking-widest">
          {t("tradeOffer")}
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="text-center text-slate-600 font-medium">
            <span className="font-bold text-black">{fromPlayer.name}</span> {t("proposesTrade")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <h4 className="font-bold text-emerald-700 mb-2 text-sm uppercase">{t("youGet")}</h4>
              {trade.offerMoney > 0 && <div className="font-mono font-bold text-lg text-emerald-600">+{currencySymbol}{trade.offerMoney}</div>}
              {trade.offerProperties.map(id => {
                const sq = game.board.find(s => s.id === id);
                return (
                  <div key={id} className="flex items-center gap-1 text-xs font-bold mt-1">
                    <div className={`w-2 h-2 rounded-sm ${GROUP_COLORS[sq.group] || 'bg-slate-300'}`} />
                    <span className="truncate">{t(sq.name)}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <h4 className="font-bold text-red-700 mb-2 text-sm uppercase">{t("youGive")}</h4>
              {trade.requestMoney > 0 && <div className="font-mono font-bold text-lg text-red-600">-{currencySymbol}{trade.requestMoney}</div>}
              {trade.requestProperties.map(id => {
                const sq = game.board.find(s => s.id === id);
                return (
                  <div key={id} className="flex items-center gap-1 text-xs font-bold mt-1">
                    <div className={`w-2 h-2 rounded-sm ${GROUP_COLORS[sq.group] || 'bg-slate-300'}`} />
                    <span className="truncate">{t(sq.name)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <button onClick={() => game.rejectTrade()} className="flex-1 py-3 rounded-lg font-bold text-red-600 bg-red-100 hover:bg-red-200 transition-colors">
              {t("reject")}
            </button>
            <button onClick={() => game.acceptTrade()} className="flex-1 py-3 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all">
              {t("accept")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
