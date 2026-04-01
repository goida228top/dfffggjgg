import React, { memo } from "react";
import { motion } from "motion/react";
import { useSettings } from "../SettingsContext";
import { GROUP_COLORS } from "../gameData";
import TokenIcon from "./TokenIcon";

const Square = memo(({ square, side, ownerToken, ownerColor, playersInJail, onClick }) => {
  const { t, currencySymbol } = useSettings();

  const isCorner = square.type === "corner";
  const isProperty = square.type === "property";

  const getRotation = () => {
    if (isCorner) return "";
    if (side === "left") return "rotate-90";
    if (side === "right") return "-rotate-90";
    if (side === "top") return "rotate-180";
    return "";
  };

  const getTitle = () => {
    let title = t(square.name);
    if (square.price) {
      title += `\n${t("price")}: ${currencySymbol}${square.price}`;
    }
    if (square.rent) {
      title += `\n${t("rent")}: ${currencySymbol}${square.rent[0]}`;
    }
    if (square.housePrice) {
      title += `\n${t("housePrice")}: ${currencySymbol}${square.housePrice}`;
    }
    if (square.hotel) {
      title += `\n${t("hotel")}: 1`;
    } else if (square.houses > 0) {
      title += `\n${t("houses")}: ${square.houses}`;
    }
    return title;
  };

  return (
    <div
      onClick={onClick}
      title={getTitle()}
      className={`relative h-full w-full flex flex-col items-center justify-between p-1 transition-all duration-300 hover:z-10 hover:scale-[1.02] group cursor-pointer
        ${isCorner ? "bg-white shadow-md rounded-sm" : "bg-white shadow-sm rounded-none"}
        border border-teal-400 dark:border-teal-500
      `}
    >
      <div className={`absolute inset-0 flex flex-col items-center justify-between p-1 ${getRotation()}`}>
        {isProperty && (
          <div
            className={`absolute top-0 left-0 right-0 h-[22%] ${GROUP_COLORS[square.group]} border-b border-teal-400/50 shadow-inner flex items-center justify-center gap-0.5 px-0.5`}
          >
            {square.hotel ? (
              <div className="w-2 h-2 bg-red-500 border border-black rounded-sm shadow-sm" />
            ) : (
              Array.from({ length: square.houses || 0 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-green-500 border border-black rounded-sm shadow-sm" />
              ))
            )}
          </div>
        )}

        <div
          className={`flex flex-col items-center justify-center h-full w-full gap-0.5 pt-[25%]`}
        >
          <span className="font-bold text-center leading-none uppercase px-0.5 break-words whitespace-pre-wrap max-w-full text-black text-[4.5px] md:text-[6px]">
            {square.id === 10 && (square.playersInJail && square.playersInJail.length > 0) ? t("jail") : t(square.name)}
          </span>

          {square.price && (square.owner === null || square.owner === undefined) && (
            <span className="text-[4.5px] md:text-[5.5px] font-semibold text-emerald-600 mt-0.5">
              {currencySymbol}{square.price}
            </span>
          )}

          {(square.owner !== null && square.owner !== undefined) && ownerToken && (
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="mt-0.5 flex items-center justify-center" 
              style={{ color: ownerColor }}
            >
              <TokenIcon type={ownerToken} size={10} />
            </motion.div>
          )}

          {square.owner !== undefined && square.owner !== null && (
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <div className="w-10 h-10 rounded-full border-[2px] border-black/10" />
            </div>
          )}

          {square.isMortgaged && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
              <span className="text-red-500 font-bold text-[6px] md:text-[8px] rotate-45 border-2 border-red-500 px-1 uppercase whitespace-nowrap">
                {t("mortgaged")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.square.id === nextProps.square.id && 
         prevProps.side === nextProps.side &&
         prevProps.square.owner === nextProps.square.owner &&
         prevProps.square.houses === nextProps.square.houses &&
         prevProps.square.hotel === nextProps.square.hotel &&
         prevProps.square.isMortgaged === nextProps.square.isMortgaged &&
         prevProps.ownerToken === nextProps.ownerToken &&
         prevProps.ownerColor === nextProps.ownerColor;
});

export default Square;
