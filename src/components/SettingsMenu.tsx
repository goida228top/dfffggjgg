import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Palette, Globe, UserCircle, Type, Coins } from 'lucide-react';
import { useSettings, Theme, Language, Font, Currency, CURRENCY_SYMBOLS } from '../SettingsContext';
import { Player, PlayerToken } from '../gameData';
import { TokenIcon } from './TokenIcon';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onUpdatePlayer: (id: number, color: string, token: PlayerToken) => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const TOKENS: PlayerToken[] = ['car', 'dog', 'ship', 'hat', 'shoe', 'iron', 'thimble', 'wheelbarrow'];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, players, onUpdatePlayer }) => {
  const { volume, setVolume, theme, setTheme, language, setLanguage, font, setFont, currency, setCurrency, t } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 glass z-50 p-6 overflow-y-auto border-l border-[var(--glass-border)]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {t('settings')}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-black/20 hover:scale-110 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Volume */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />} {t('volume')}
                </h3>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-current"
                />
              </section>

              {/* Theme */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Palette size={20} /> {t('theme')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['light', 'dark', 'neon', 'pastel'] as Theme[]).map(tName => (
                    <button
                      key={tName}
                      onClick={() => setTheme(tName)}
                      className={`py-2 px-3 rounded-lg border transition-all ${theme === tName ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                    >
                      {t(tName)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Language */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Globe size={20} /> {t('language')}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`flex-1 py-2 rounded-lg border transition-all ${language === 'ru' ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                  >
                    Русский
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-2 rounded-lg border transition-all ${language === 'en' ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                  >
                    English
                  </button>
                </div>
              </section>

              {/* Currency */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Coins size={20} /> {t('currency')}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map(cName => (
                    <button
                      key={cName}
                      onClick={() => setCurrency(cName)}
                      className={`flex-1 min-w-[60px] py-2 rounded-lg border transition-all ${currency === cName ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                    >
                      {CURRENCY_SYMBOLS[cName]} {cName}
                    </button>
                  ))}
                </div>
              </section>

              {/* Font */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Type size={20} /> {t('font')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['sans', 'serif', 'mono', 'comic'] as Font[]).map(fName => (
                    <button
                      key={fName}
                      onClick={() => setFont(fName)}
                      className={`py-2 px-3 rounded-lg border transition-all ${font === fName ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                      style={{
                        fontFamily: fName === 'sans' ? 'Inter, sans-serif' :
                                    fName === 'serif' ? 'Playfair Display, serif' :
                                    fName === 'mono' ? 'JetBrains Mono, monospace' :
                                    'Comic Neue, cursive'
                      }}
                    >
                      {t(`font${fName.charAt(0).toUpperCase() + fName.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Player Customization */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <UserCircle size={20} /> {t('playerCustomization')}
                </h3>
                <div className="space-y-6">
                  {players.map(p => (
                    <div key={p.id} className="p-4 rounded-xl border border-[var(--glass-border)] bg-black/5">
                      <div className="font-bold mb-3">{t(p.name)}</div>
                      
                      <div className="mb-2 text-sm opacity-80">{t('color')}</div>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => onUpdatePlayer(p.id, c, p.token)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 hover:shadow-md ${p.color === c ? 'scale-110 border-current' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div className="mb-2 text-sm opacity-80">{t('shape')}</div>
                      <div className="grid grid-cols-4 gap-2">
                        {TOKENS.map(tkn => (
                          <button
                            key={tkn}
                            onClick={() => onUpdatePlayer(p.id, p.color, tkn)}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${p.token === tkn ? 'bg-black/20 border-black/30 font-bold' : 'border-[var(--glass-border)] hover:bg-black/10 hover:scale-105 hover:shadow-sm'}`}
                          >
                            <TokenIcon token={tkn} color={p.token === tkn ? p.color : '#94a3b8'} className="w-8 h-8" />
                            <span className="text-[10px] leading-tight text-center">{t(tkn)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
