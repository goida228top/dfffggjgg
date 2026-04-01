import React, { useState } from "react";
import { motion } from "motion/react";
import { useSettings } from "../SettingsContext";
import { GROUP_COLORS } from "../gameData";

export const TradeModal = ({ game, targetPlayerId, onClose }) => {
  const { t, currencySymbol } = useSettings();
  const me = game.players.find(p => p.id === game.myId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  const [offerMoney, setOfferMoney] = useState(0);
  const [requestMoney, setRequestMoney] = useState(0);
  const [offerProperties, setOfferProperties] = useState([]);
  const [requestProperties, setRequestProperties] = useState([]);

  if (!me || !targetPlayer) return null;

  const toggleOfferProperty = (id) => {
    setOfferProperties(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleRequestProperty = (id) => {
    setRequestProperties(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handlePropose = () => {
    game.proposeTrade({
      from: me.id,
      to: targetPlayer.id,
      offerMoney,
      requestMoney,
      offerProperties,
      requestProperties
    });
    onClose();
  };

  const renderPropertyList = (player, selected, toggleFn) => {
    const props = game.board.filter(sq => player.properties.includes(sq.id));
    if (props.length === 0) return <div className="text-sm text-slate-500 italic">{t("noProperties")}</div>;

    return (
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
        {props.map(sq => (
          <div
            key={sq.id}
            onClick={() => toggleFn(sq.id)}
            className={`cursor-pointer border-2 rounded-md p-1 flex items-center gap-1 text-xs font-bold transition-all ${selected.includes(sq.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className={`w-3 h-3 rounded-sm ${GROUP_COLORS[sq.group] || 'bg-slate-300'}`} />
            <span className="truncate">{t(sq.name)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-800 text-white p-4 text-center font-bold text-xl uppercase tracking-widest">
          {t("trade")}
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Offer Section */}
          <div className="flex-1 p-4 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-emerald-600 border-b pb-2">{t("offer")} ({me.name})</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t("money")} ({currencySymbol}{me.money})</label>
              <input
                type="range"
                min="0"
                max={me.money}
                step="10"
                value={offerMoney}
                onChange={(e) => setOfferMoney(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="text-center font-mono font-bold text-lg">{currencySymbol}{offerMoney}</div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t("selectProperties")}</label>
              {renderPropertyList(me, offerProperties, toggleOfferProperty)}
            </div>
          </div>

          {/* Request Section */}
          <div className="flex-1 p-4 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-amber-600 border-b pb-2">{t("request")} ({targetPlayer.name})</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t("money")} ({currencySymbol}{targetPlayer.money})</label>
              <input
                type="range"
                min="0"
                max={targetPlayer.money}
                step="10"
                value={requestMoney}
                onChange={(e) => setRequestMoney(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-center font-mono font-bold text-lg">{currencySymbol}{requestMoney}</div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t("selectProperties")}</label>
              {renderPropertyList(targetPlayer, requestProperties, toggleRequestProperty)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            {t("cancel")}
          </button>
          <button onClick={handlePropose} className="px-6 py-2 rounded-md font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all">
            {t("proposeTrade")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
