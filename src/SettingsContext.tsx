import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'neon' | 'pastel';
export type Language = 'en' | 'ru';
export type Font = 'sans' | 'serif' | 'mono' | 'comic';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'JPY';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  JPY: '¥'
};

interface SettingsContextType {
  volume: number;
  setVolume: (v: number) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  font: Font;
  setFont: (f: Font) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencySymbol: string;
  playerName: string;
  setPlayerName: (n: string) => void;
  playerColor: string;
  setPlayerColor: (c: string) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    settings: "Settings",
    volume: "Volume",
    theme: "Theme",
    language: "Language",
    playerCustomization: "Player Customization",
    color: "Color",
    shape: "Token",
    rollDice: "Roll Dice",
    rolling: "Rolling...",
    buyProperty: "Buy Property",
    pass: "Pass",
    endTurn: "End Turn",
    players: "Players",
    gameLog: "Game Log",
    currentTurn: "Current Turn",
    propertiesOwned: "properties owned",
    light: "Light",
    dark: "Dark",
    neon: "Neon",
    pastel: "Pastel",
    car: "Car",
    dog: "Dog",
    ship: "Ship",
    hat: "Top Hat",
    shoe: "Shoe",
    iron: "Iron",
    thimble: "Thimble",
    wheelbarrow: "Wheelbarrow",
    close: "Close",
    monopoly: "MONOPOLY",
    moving: "Moving...",
    player1: "Player 1",
    player2: "Player 2",
    player3: "Player 3",
    player4: "Player 4",
    player5: "Player 5",
    player6: "Player 6",
    numberOfPlayers: "Number of Players",
    startGame: "Start Game",
    font: "Font",
    fontSans: "Sans-serif",
    fontSerif: "Serif",
    fontMono: "Monospace",
    fontComic: "Comic",
    currency: "Currency",
    
    // Log messages
    gameStarted: "Game started!",
    rolled: "{player} rolled {d1} + {d2} = {total}",
    rolledDoublesOutJail: "{player} rolled doubles and got out of jail!",
    staysInJail: "{player} stays in jail.",
    paysToLeaveJail: "{player} pays {c}50 to leave jail.",
    passedGo: "{player} passed GO and collected {c}200.",
    landedOn: "{player} landed on {square}.",
    goesToJail: "{player} goes to Jail!",
    paidTax: "{player} paid {c}{tax} in tax.",
    cannotAfford: "{player} cannot afford {square}.",
    paysRent: "{player} pays {c}{rent} rent to {owner}.",
    boughtProperty: "{player} bought {square} for {c}{price}.",

    // Board Squares
    go: "GO",
    mediterraneanAve: "Mediterranean Avenue",
    communityChest: "Community Chest",
    balticAve: "Baltic Avenue",
    incomeTax: "Income Tax",
    readingRailroad: "Reading Railroad",
    orientalAve: "Oriental Avenue",
    chance: "Chance",
    vermontAve: "Vermont Avenue",
    connecticutAve: "Connecticut Avenue",
    justVisiting: "Just Visiting",
    stCharlesPlace: "St. Charles Place",
    electricCompany: "Electric Company",
    statesAve: "States Avenue",
    virginiaAve: "Virginia Avenue",
    pennsylvaniaRailroad: "Pennsylvania Railroad",
    stJamesPlace: "St. James Place",
    tennesseeAve: "Tennessee Avenue",
    newYorkAve: "New York Avenue",
    freeParking: "Free Parking",
    kentuckyAve: "Kentucky Avenue",
    indianaAve: "Indiana Avenue",
    illinoisAve: "Illinois Avenue",
    boRailroad: "B. & O. Railroad",
    atlanticAve: "Atlantic Avenue",
    ventnorAve: "Ventnor Avenue",
    waterWorks: "Water Works",
    marvinGardens: "Marvin Gardens",
    goToJailSquare: "Go To Jail",
    pacificAve: "Pacific Avenue",
    northCarolinaAve: "North Carolina Avenue",
    pennsylvaniaAve: "Pennsylvania Avenue",
    shortLine: "Short Line",
    parkPlace: "Park Place",
    luxuryTax: "Luxury Tax",
    boardwalk: "Boardwalk"
  },
  ru: {
    settings: "Настройки",
    volume: "Громкость",
    theme: "Тема",
    language: "Язык",
    playerCustomization: "Настройка игроков",
    color: "Цвет",
    shape: "Фигурка",
    rollDice: "Бросить кубики",
    rolling: "Бросаем...",
    buyProperty: "Купить",
    pass: "Пропустить",
    endTurn: "Завершить ход",
    players: "Игроки",
    gameLog: "Журнал игры",
    currentTurn: "Текущий ход",
    propertiesOwned: "недвижимости",
    light: "Светлая",
    dark: "Темная",
    neon: "Неон",
    pastel: "Пастель",
    car: "Машина",
    dog: "Собака",
    ship: "Корабль",
    hat: "Шляпа",
    shoe: "Башмак",
    iron: "Утюг",
    thimble: "Наперсток",
    wheelbarrow: "Тачка",
    close: "Закрыть",
    monopoly: "МОНОПОЛИЯ",
    moving: "Перемещение...",
    player1: "Игрок 1",
    player2: "Игрок 2",
    player3: "Игрок 3",
    player4: "Игрок 4",
    player5: "Игрок 5",
    player6: "Игрок 6",
    numberOfPlayers: "Количество игроков",
    startGame: "Начать игру",
    font: "Шрифт",
    fontSans: "Без засечек",
    fontSerif: "С засечками",
    fontMono: "Моноширинный",
    fontComic: "Комикс",
    currency: "Валюта",

    // Log messages
    gameStarted: "Игра началась!",
    rolled: "{player} выбросил {d1} + {d2} = {total}",
    rolledDoublesOutJail: "{player} выбросил дубль и вышел из тюрьмы!",
    staysInJail: "{player} остается в тюрьме.",
    paysToLeaveJail: "{player} платит {c}50 за выход из тюрьмы.",
    passedGo: "{player} прошел ВПЕРЕД и получил {c}200.",
    landedOn: "{player} попал на {square}.",
    goesToJail: "{player} отправляется в тюрьму!",
    paidTax: "{player} заплатил {c}{tax} налога.",
    cannotAfford: "{player} не может позволить себе {square}.",
    paysRent: "{player} платит {c}{rent} аренды игроку {owner}.",
    boughtProperty: "{player} купил {square} за {c}{price}.",

    // Board Squares
    go: "ВПЕРЕД",
    mediterraneanAve: "Житная улица",
    communityChest: "Общественная казна",
    balticAve: "Нагатинская улица",
    incomeTax: "Подоходный налог",
    readingRailroad: "Рижская железная дорога",
    orientalAve: "Варшавское шоссе",
    chance: "Шанс",
    vermontAve: "Улица Огарева",
    connecticutAve: "Первая парковая улица",
    justVisiting: "Посетитель",
    stCharlesPlace: "Улица Полянка",
    electricCompany: "Электростанция",
    statesAve: "Улица Сретенка",
    virginiaAve: "Ростовская набережная",
    pennsylvaniaRailroad: "Курская железная дорога",
    stJamesPlace: "Рязанский проспект",
    tennesseeAve: "Улица Вавилова",
    newYorkAve: "Рублевское шоссе",
    freeParking: "Бесплатная парковка",
    kentuckyAve: "Улица Тверская",
    indianaAve: "Пушкинская улица",
    illinoisAve: "Площадь Маяковского",
    boRailroad: "Казанская железная дорога",
    atlanticAve: "Улица Грузинский вал",
    ventnorAve: "Новинский бульвар",
    waterWorks: "Водопровод",
    marvinGardens: "Смоленская площадь",
    goToJailSquare: "Отправляйтесь в тюрьму",
    pacificAve: "Улица Щусева",
    northCarolinaAve: "Гоголевский бульвар",
    pennsylvaniaAve: "Кутузовский проспект",
    shortLine: "Ленинградская железная дорога",
    parkPlace: "Улица Малая Бронная",
    luxuryTax: "Налог на роскошь",
    boardwalk: "Улица Арбат"
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [volume, setVolume] = useState(0.5);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('ru');
  const [font, setFont] = useState<Font>('sans');
  const [currency, setCurrency] = useState<Currency>('USD');
  
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Игрок');
  const [playerColor, setPlayerColor] = useState(() => localStorage.getItem('playerColor') || '#ef4444');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('playerColor', playerColor);
  }, [playerColor]);

  const t = (key: string) => {
    let str = (translations[language] as any)[key] || key;
    if (typeof str === 'string') {
      str = str.replace(/\{c\}/g, CURRENCY_SYMBOLS[currency]);
    }
    return str;
  };

  return (
    <SettingsContext.Provider value={{ 
      volume, setVolume, 
      theme, setTheme, 
      language, setLanguage, 
      font, setFont, 
      currency, setCurrency,
      currencySymbol: CURRENCY_SYMBOLS[currency],
      playerName, setPlayerName,
      playerColor, setPlayerColor,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
