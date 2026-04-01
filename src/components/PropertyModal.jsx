import React from "react";
import { motion } from "motion/react";
import { useSettings } from "../SettingsContext";
import { GROUP_COLORS } from "../gameData";

export const PropertyModal = ({ square, game, onClose }) => {
  const { t, currencySymbol } = useSettings();
  
  if (!square) return null;

  const owner = game.players.find(p => p.id === square.owner);
  const isMyTurn = !game.currentPlayer?.isBot && (game.currentPlayer?.id === game.myId || (game.currentPlayer?.isLocal && game.isHost));
  const isOwner = owner?.id === game.myId || (owner?.isLocal && game.isHost);
  const isCurrentPlayerProperty = owner?.id === game.currentPlayer?.id;
  const groupProperties = game.board.filter(s => s.group === square.group);
  const hasMonopoly = groupProperties.length > 0 && groupProperties.every(s => s.owner === square.owner);
  const anyMortgagedInGroup = groupProperties.some(s => s.isMortgaged);
  const anyHousesInGroup = groupProperties.some(s => (s.houses || 0) > 0 || s.hotel);
  
  const canBuild = isCurrentPlayerProperty && hasMonopoly && !anyMortgagedInGroup && !square.hotel && game.currentPlayer?.money >= square.housePrice && (game.phase === "roll" || game.phase === "action" || game.phase === "end") && isMyTurn;
  const canSell = isCurrentPlayerProperty && (square.houses > 0 || square.hotel) && (game.phase === "roll" || game.phase === "action" || game.phase === "end") && isMyTurn;
  const canMortgage = isCurrentPlayerProperty && !square.isMortgaged && !anyHousesInGroup && (game.phase === "roll" || game.phase === "action" || game.phase === "end") && isMyTurn;
  const canUnmortgage = isCurrentPlayerProperty && square.isMortgaged && game.currentPlayer?.money >= Math.ceil((square.price / 2) * 1.1) && (game.phase === "roll" || game.phase === "action" || game.phase === "end") && isMyTurn;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {square.type === "property" && (
          <div className={`h-16 ${GROUP_COLORS[square.group]} flex items-center justify-center border-b-2 border-black`}>
            <h2 className="text-xl font-black uppercase text-center px-2 text-black tracking-widest">{t(square.name)}</h2>
          </div>
        )}
        {square.type !== "property" && (
          <div className="h-16 bg-slate-200 flex items-center justify-center border-b-2 border-black">
            <h2 className="text-xl font-black uppercase text-center px-2 text-black tracking-widest">{t(square.name)}</h2>
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          {square.price && (
            <div className="text-center font-bold text-lg">
              {t("price")}: {currencySymbol}{square.price}
            </div>
          )}

          {square.rent && (
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>{t("baseRent")}</span>
                <span className="font-bold">{currencySymbol}{square.rent[0]}</span>
              </div>
              {square.type === "property" && (
                <>
                  <div className="flex justify-between">
                    <span>{t("rentWithHouses", { count: 1 })}</span>
                    <span className="font-bold">{currencySymbol}{square.rent[1]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentWithHouses", { count: 2 })}</span>
                    <span className="font-bold">{currencySymbol}{square.rent[2]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentWithHouses", { count: 3 })}</span>
                    <span className="font-bold">{currencySymbol}{square.rent[3]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentWithHouses", { count: 4 })}</span>
                    <span className="font-bold">{currencySymbol}{square.rent[4]}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold mt-1">
                    <span>{t("rentWithHotel")}</span>
                    <span>{currencySymbol}{square.rent[5]}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {square.housePrice && (
            <div className="flex flex-col gap-1 text-sm border-t pt-2 border-slate-200">
              <div className="flex justify-between">
                <span>{t("houseCost")}</span>
                <span className="font-bold">{currencySymbol}{square.housePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("hotelCost")}</span>
                <span className="font-bold">{currencySymbol}{square.housePrice} + 4 {t("houses")}</span>
              </div>
            </div>
          )}

          {square.price && (
            <div className="flex flex-col gap-1 text-sm border-t pt-2 border-slate-200">
              <div className="flex justify-between">
                <span>{t("mortgageValue")}</span>
                <span className="font-bold">{currencySymbol}{square.price / 2}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("unmortgageCost")}</span>
                <span className="font-bold">{currencySymbol}{Math.ceil((square.price / 2) * 1.1)}</span>
              </div>
            </div>
          )}

          <div className="border-t pt-2 border-slate-200 text-center font-bold text-slate-700">
            {owner ? `${t("owner")}: ${owner.name}` : t("unowned")}
          </div>

          {square.isMortgaged && (
            <div className="bg-red-100 text-red-600 font-bold text-center py-2 rounded-md uppercase tracking-widest">
              {t("mortgaged")}
            </div>
          )}

          {isOwner && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => { game.buildHouse(square.id); onClose(); }}
                disabled={!canBuild}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded-md text-xs transition-colors"
              >
                {t("buildHouse")}
              </button>
              <button
                onClick={() => { game.sellHouse(square.id); onClose(); }}
                disabled={!canSell}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded-md text-xs transition-colors"
              >
                {t("sellHouse")}
              </button>
              <button
                onClick={() => { game.mortgageProperty(square.id); onClose(); }}
                disabled={!canMortgage}
                className="bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded-md text-xs transition-colors"
              >
                {t("mortgage")}
              </button>
              <button
                onClick={() => { game.unmortgageProperty(square.id); onClose(); }}
                disabled={!canUnmortgage}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded-md text-xs transition-colors"
              >
                {t("unmortgage")}
              </button>
            </div>
          )}

          <button onClick={onClose} className="mt-2 w-full py-2 bg-slate-200 hover:bg-slate-300 rounded-md font-bold text-slate-700 transition-colors">
            {t("close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
