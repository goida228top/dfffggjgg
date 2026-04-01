import React from "react";
import { X, Volume2, Moon, Sun, Languages, Type, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { useSettings, CURRENCY_SYMBOLS } from "../SettingsContext";

export const SettingsMenu = ({ onClose }) => {
  const {
    volume,
    setVolume,
    theme,
    setTheme,
    language,
    setLanguage,
    font,
    setFont,
    currency,
    setCurrency,
    t,
  } = useSettings();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl border border-white/20 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
          <Type size={32} className="text-emerald-500" />
          {t("settings")}
        </h2>

        <div className="space-y-8">
          {/* Volume */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center gap-2">
                <Volume2 size={20} /> {t("volume")}
              </label>
              <span className="text-sm opacity-60">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <label className="font-bold flex items-center gap-2">
              <Sun size={20} /> {t("theme")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["light", "dark"].map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    theme === th
                      ? "bg-emerald-600 shadow-lg"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {t(th)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-4">
            <label className="font-bold flex items-center gap-2">
              <Languages size={20} /> {t("language")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["en", "ru"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    language === lang
                      ? "bg-emerald-600 shadow-lg"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {lang === "en" ? "English" : "Русский"}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="space-y-4">
            <label className="font-bold flex items-center gap-2">
              <Type size={20} /> {t("font")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["sans", "serif", "mono", "comic"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    font === f
                      ? "bg-emerald-600 shadow-lg"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                  style={{
                    fontFamily:
                      f === "sans"
                        ? "sans-serif"
                        : f === "serif"
                          ? "serif"
                          : f === "mono"
                            ? "monospace"
                            : "cursive",
                  }}
                >
                  {t(`font${f.charAt(0).toUpperCase() + f.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-4">
            <label className="font-bold flex items-center gap-2">
              <DollarSign size={20} /> {t("currency")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`py-2 rounded-xl font-medium transition-all ${
                    currency === curr
                      ? "bg-emerald-600 shadow-lg"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {CURRENCY_SYMBOLS[curr]} {curr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-xl shadow-xl transition-all"
        >
          {t("close")}
        </button>
      </motion.div>
    </motion.div>
  );
};
