export type PropertyType = 'property' | 'railroad' | 'utility' | 'tax' | 'corner' | 'chance' | 'chest';
export type PlayerToken = 'car' | 'dog' | 'ship' | 'hat' | 'shoe' | 'iron' | 'thimble' | 'wheelbarrow';

export interface BoardSquare {
  id: number;
  name: string;
  type: PropertyType;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, ..., hotel] - simplified to base for now
  group?: string; // Color group
  owner?: number | null; // Player ID
}

export interface Player {
  id: number;
  socketId?: string;
  name: string;
  color: string;
  token: PlayerToken;
  money: number;
  position: number;
  properties: number[]; // Array of square IDs
  inJail: boolean;
  jailTurns: number;
  laps: number;
  isBot?: boolean;
  isLocal?: boolean;
}

export const BOARD_DATA: BoardSquare[] = [
  { id: 0, name: "go", type: "corner" },
  { id: 1, name: "mediterraneanAve", type: "property", price: 60, rent: [2], group: "brown" },
  { id: 2, name: "communityChest", type: "chest" },
  { id: 3, name: "balticAve", type: "property", price: 60, rent: [4], group: "brown" },
  { id: 4, name: "incomeTax", type: "tax", price: 200 },
  { id: 5, name: "readingRailroad", type: "railroad", price: 200, rent: [25] },
  { id: 6, name: "orientalAve", type: "property", price: 100, rent: [6], group: "light-blue" },
  { id: 7, name: "chance", type: "chance" },
  { id: 8, name: "vermontAve", type: "property", price: 100, rent: [6], group: "light-blue" },
  { id: 9, name: "connecticutAve", type: "property", price: 120, rent: [8], group: "light-blue" },
  { id: 10, name: "justVisiting", type: "corner" },
  { id: 11, name: "stCharlesPlace", type: "property", price: 140, rent: [10], group: "pink" },
  { id: 12, name: "electricCompany", type: "utility", price: 150, rent: [0] }, // Special logic needed
  { id: 13, name: "statesAve", type: "property", price: 140, rent: [10], group: "pink" },
  { id: 14, name: "virginiaAve", type: "property", price: 160, rent: [12], group: "pink" },
  { id: 15, name: "pennsylvaniaRailroad", type: "railroad", price: 200, rent: [25] },
  { id: 16, name: "stJamesPlace", type: "property", price: 180, rent: [14], group: "orange" },
  { id: 17, name: "communityChest", type: "chest" },
  { id: 18, name: "tennesseeAve", type: "property", price: 180, rent: [14], group: "orange" },
  { id: 19, name: "newYorkAve", type: "property", price: 200, rent: [16], group: "orange" },
  { id: 20, name: "freeParking", type: "corner" },
  { id: 21, name: "kentuckyAve", type: "property", price: 220, rent: [18], group: "red" },
  { id: 22, name: "chance", type: "chance" },
  { id: 23, name: "indianaAve", type: "property", price: 220, rent: [18], group: "red" },
  { id: 24, name: "illinoisAve", type: "property", price: 240, rent: [20], group: "red" },
  { id: 25, name: "boRailroad", type: "railroad", price: 200, rent: [25] },
  { id: 26, name: "atlanticAve", type: "property", price: 260, rent: [22], group: "yellow" },
  { id: 27, name: "ventnorAve", type: "property", price: 260, rent: [22], group: "yellow" },
  { id: 28, name: "waterWorks", type: "utility", price: 150, rent: [0] },
  { id: 29, name: "marvinGardens", type: "property", price: 280, rent: [24], group: "yellow" },
  { id: 30, name: "goToJailSquare", type: "corner" },
  { id: 31, name: "pacificAve", type: "property", price: 300, rent: [26], group: "green" },
  { id: 32, name: "northCarolinaAve", type: "property", price: 300, rent: [26], group: "green" },
  { id: 33, name: "communityChest", type: "chest" },
  { id: 34, name: "pennsylvaniaAve", type: "property", price: 320, rent: [28], group: "green" },
  { id: 35, name: "shortLine", type: "railroad", price: 200, rent: [25] },
  { id: 36, name: "chance", type: "chance" },
  { id: 37, name: "parkPlace", type: "property", price: 350, rent: [35], group: "dark-blue" },
  { id: 38, name: "luxuryTax", type: "tax", price: 100 },
  { id: 39, name: "boardwalk", type: "property", price: 400, rent: [50], group: "dark-blue" },
];

// Correcting the end of the array based on standard board
BOARD_DATA[36] = { id: 36, name: "chance", type: "chance" };
BOARD_DATA[37] = { id: 37, name: "parkPlace", type: "property", price: 350, rent: [35], group: "dark-blue" };
BOARD_DATA[38] = { id: 38, name: "luxuryTax", type: "tax", price: 100 };
BOARD_DATA[39] = { id: 39, name: "boardwalk", type: "property", price: 400, rent: [50], group: "dark-blue" };

export const GROUP_COLORS: Record<string, string> = {
  brown: "bg-[#8B4513]",
  "light-blue": "bg-[#87CEEB]",
  pink: "bg-[#FF69B4]",
  orange: "bg-[#FFA500]",
  red: "bg-[#FF0000]",
  yellow: "bg-[#FFD700]",
  green: "bg-[#008000]",
  "dark-blue": "bg-[#0000FF]",
};
