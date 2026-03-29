import { useState, useEffect, useRef } from 'react';
import { BOARD_DATA, Player, BoardSquare, PlayerToken } from './gameData';
import { playSound } from './utils/sound';
import { useSettings } from './SettingsContext';
import { socket } from './socket';

export type GamePhase = 'setup' | 'roll' | 'rolling' | 'moving' | 'action' | 'drawing_card' | 'end' | 'finished';

export type LogEntry = {
  key: string;
  params?: Record<string, string | number>;
};

export interface DrawnCard {
  type: 'chance' | 'chest';
  text: string;
  effect: { money?: number };
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: BoardSquare[];
  dice: [number, number];
  phase: GamePhase;
  logs: LogEntry[];
  lastActionMessage: LogEntry | null;
  maxLaps: number;
  winner: Player | null;
  drawnCard: DrawnCard | null;
}

export function useMonopolyGame() {
  const { volume } = useSettings();
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [myId, setMyId] = useState<string>('');
  const [lobbyUsers, setLobbyUsers] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  
  // Local state for Host (or fallback)
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    board: BOARD_DATA,
    dice: [1, 1],
    phase: 'setup',
    logs: [],
    lastActionMessage: null,
    maxLaps: 5,
    winner: null,
    drawnCard: null
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Sync state to clients if Host
  useEffect(() => {
    if (isHost && gameState.phase !== 'setup' && roomId) {
      socket.emit('host_state', roomId, gameState);
    }
  }, [gameState, isHost, roomId]);

  useEffect(() => {
    socket.on('connect', () => {
      setMyId(socket.id || '');
    });

    socket.on('room_list', (rooms) => {
      setRoomsList(rooms);
    });

    socket.on('room_joined', (id, name, settings) => {
      setRoomId(id);
      setRoomName(name);
      setGameState(prev => ({ ...prev, maxLaps: settings.maxLaps, phase: 'setup' }));
    });

    socket.on('room_users', (users) => {
      setLobbyUsers(users);
      const me = users.find((u: any) => u.id === socket.id);
      if (me) {
        setIsHost(me.isHost);
      }
    });

    socket.on('settings_updated', (settings) => {
      setGameState(prev => ({ ...prev, maxLaps: settings.maxLaps }));
    });

    socket.on('game_state', (state: GameState) => {
      if (!stateRef.current.isHost) {
        setGameState(state);
      }
    });

    socket.on('client_action', (action, clientId) => {
      if (stateRef.current.isHost) {
        handleClientAction(action, clientId);
      }
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('room_list');
      socket.off('room_joined');
      socket.off('room_users');
      socket.off('settings_updated');
      socket.off('game_state');
      socket.off('client_action');
      socket.off('error');
    };
  }, []);

  const createRoom = (settings: { name: string, maxLaps: number }, user: { name: string, color: string }) => {
    socket.emit('create_room', settings, user);
  };

  const joinRoom = (id: string, user: { name: string, color: string }) => {
    socket.emit('join_room', id, user);
  };

  const leaveRoom = () => {
    if (roomId) {
      socket.emit('leave_room', roomId);
      setRoomId(null);
      setRoomName('');
      setIsHost(false);
      setLobbyUsers([]);
      setGameState(prev => ({ ...prev, phase: 'setup', players: [] }));
    }
  };

  const updateLobbyUser = (name: string, color: string, token: PlayerToken) => {
    if (roomId) {
      socket.emit('update_user', roomId, { name, color, token });
    }
  };

  const addBot = () => {
    if (isHost && roomId) {
      const botId = `bot_${Math.random().toString(36).substring(2, 8)}`;
      const botColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = botColors[lobbyUsers.length % botColors.length];
      
      const newBot = {
        id: botId,
        name: `Bot ${lobbyUsers.filter(u => u.isBot).length + 1}`,
        color,
        token: 'car', // Server will assign unique
        isBot: true,
        isLocal: true
      };
      
      socket.emit('add_bot', roomId, newBot);
    }
  };

  const addLocalPlayer = () => {
    if (isHost && roomId) {
      const localId = `local_${Math.random().toString(36).substring(2, 8)}`;
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[lobbyUsers.length % colors.length];
      
      const newLocal = {
        id: localId,
        name: `Local ${lobbyUsers.filter(u => u.isLocal && !u.isBot).length + 1}`,
        color,
        token: 'car', // Server will assign unique
        isBot: false,
        isLocal: true
      };
      
      socket.emit('add_bot', roomId, newLocal); 
    }
  };

  const removeBot = (botId: string) => {
    if (isHost && roomId) {
      socket.emit('remove_bot', roomId, botId);
    }
  };

  const updateMaxLaps = (laps: number) => {
    if (isHost && roomId) {
      setGameState(prev => ({ ...prev, maxLaps: laps }));
      socket.emit('update_settings', roomId, { maxLaps: laps });
    }
  };

  const startGame = () => {
    if (!isHost || !roomId) return;
    const newPlayers: Player[] = lobbyUsers.map((u, i) => ({
      id: i,
      socketId: u.id,
      name: u.name || `Player ${i + 1}`,
      color: u.color,
      token: u.token,
      money: 1500,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
      laps: 0,
      isBot: u.isBot,
      isLocal: u.isLocal
    }));
    
    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      currentPlayerIndex: 0,
      board: BOARD_DATA,
      dice: [1, 1],
      phase: 'roll',
      logs: [{ key: 'gameStarted' }],
      lastActionMessage: null,
      drawnCard: null
    }));
    socket.emit('start_game', roomId);
  };

  const addLog = (key: string, params?: Record<string, string | number>) => {
    const entry = { key, params };
    setGameState(prev => ({
      ...prev,
      logs: [entry, ...prev.logs].slice(0, 50),
      lastActionMessage: entry
    }));
  };

  const checkWinCondition = (players: Player[], maxLaps: number) => {
    const winner = players.find(p => p.laps >= maxLaps);
    if (winner) {
      setGameState(prev => ({ ...prev, phase: 'finished', winner }));
      playSound('win', volume);
      return true;
    }
    return false;
  };

  const rollDice = async () => {
    if (!isHost) {
      socket.emit('client_action', roomId, { type: 'ROLL' });
      return;
    }
    
    const state = stateRef.current;
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    playSound('roll', volume);
    setGameState(prev => ({ ...prev, phase: 'rolling' }));
    
    let d1 = 1, d2 = 1;
    for (let i = 0; i < 10; i++) {
      d1 = Math.floor(Math.random() * 6) + 1;
      d2 = Math.floor(Math.random() * 6) + 1;
      setGameState(prev => ({ ...prev, dice: [d1, d2] }));
      await new Promise(res => setTimeout(res, 50));
    }

    const total = d1 + d2;
    addLog('rolled', { player: currentPlayer.name, d1, d2, total });

    if (currentPlayer.inJail) {
      if (d1 === d2) {
        addLog('rolledDoublesOutJail', { player: currentPlayer.name });
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, inJail: false, jailTurns: 0 } : p)
        }));
        movePlayer(total);
      } else {
        addLog('staysInJail', { player: currentPlayer.name });
        const newJailTurns = currentPlayer.jailTurns + 1;
        if (newJailTurns >= 3) {
           addLog('paysToLeaveJail', { player: currentPlayer.name });
           setGameState(prev => ({
             ...prev,
             players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, inJail: false, jailTurns: 0, money: p.money - 50 } : p)
           }));
           movePlayer(total, currentPlayer.money - 50);
        } else {
           setGameState(prev => ({
             ...prev,
             players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, jailTurns: newJailTurns } : p),
             phase: 'end'
           }));
        }
      }
    } else {
      movePlayer(total);
    }
  };

  const movePlayer = async (steps: number, startingMoney?: number) => {
    setGameState(prev => ({ ...prev, phase: 'moving' }));
    let state = stateRef.current;
    let currentPlayer = state.players[state.currentPlayerIndex];
    
    let currentPos = currentPlayer.position;
    let currentMoney = startingMoney !== undefined ? startingMoney : currentPlayer.money;
    let currentLaps = currentPlayer.laps;

    for (let i = 1; i <= steps; i++) {
      currentPos++;
      if (currentPos >= 40) {
        currentPos = 0;
        currentMoney += 200;
        currentLaps += 1;
        addLog('passedGo', { player: currentPlayer.name });
      }
      
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, position: currentPos, money: currentMoney, laps: currentLaps } : p)
      }));
      playSound('move', volume);
      
      await new Promise(res => setTimeout(res, 250));
    }

    state = stateRef.current;
    currentPlayer = state.players[state.currentPlayerIndex];
    
    if (checkWinCondition(state.players, state.maxLaps)) {
      return;
    }

    handleLanding(currentPos, currentMoney);
  };

  const handleLanding = (pos: number, currentMoney: number) => {
    const state = stateRef.current;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const square = state.board[pos];
    
    addLog('landedOn', { player: currentPlayer.name, square: square.name });

    if (square.name === "goToJailSquare") {
      addLog('goesToJail', { player: currentPlayer.name });
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, position: 10, inJail: true } : p),
        phase: 'end'
      }));
      return;
    }

    if (square.type === 'tax') {
      const tax = square.price || 0;
      addLog('paidTax', { player: currentPlayer.name, tax });
      playSound('pay', volume);
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, money: currentMoney - tax } : p),
        phase: 'end'
      }));
      return;
    }

    if (square.type === 'chance' || square.type === 'chest') {
      const isChance = square.type === 'chance';
      const cards = isChance ? [
        { text: "Bank pays you dividend of $50", effect: { money: 50 } },
        { text: "Speeding fine $15", effect: { money: -15 } },
        { text: "You have won a crossword competition. Collect $100", effect: { money: 100 } },
        { text: "Pay poor tax of $15", effect: { money: -15 } }
      ] : [
        { text: "Bank error in your favor. Collect $200", effect: { money: 200 } },
        { text: "Doctor's fee. Pay $50", effect: { money: -50 } },
        { text: "From sale of stock you get $50", effect: { money: 50 } },
        { text: "Pay hospital fees of $100", effect: { money: -100 } }
      ];
      const card = cards[Math.floor(Math.random() * cards.length)];
      
      setGameState(prev => ({
        ...prev,
        phase: 'drawing_card',
        drawnCard: { type: square.type as 'chance' | 'chest', text: card.text, effect: card.effect }
      }));
      addLog('drewCard', { player: currentPlayer.name, type: square.type });
      return;
    }

    if (square.type === 'property' || square.type === 'railroad' || square.type === 'utility') {
      if (square.owner === undefined || square.owner === null) {
        if (currentMoney >= (square.price || 0)) {
          setGameState(prev => ({ ...prev, phase: 'action' }));
        } else {
          addLog('cannotAfford', { player: currentPlayer.name, square: square.name });
          setGameState(prev => ({ ...prev, phase: 'end' }));
        }
      } else if (square.owner !== currentPlayer.id) {
        const rent = calculateRent(square, state.board, state.dice);
        addLog('paysRent', { player: currentPlayer.name, rent, owner: state.players[square.owner].name });
        playSound('pay', volume);
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => {
            if (p.id === currentPlayer.id) return { ...p, money: currentMoney - rent };
            if (p.id === square.owner) return { ...p, money: p.money + rent };
            return p;
          }),
          phase: 'end'
        }));
      } else {
        setGameState(prev => ({ ...prev, phase: 'end' }));
      }
    } else {
      setGameState(prev => ({ ...prev, phase: 'end' }));
    }
  };

  const calculateRent = (square: BoardSquare, board: BoardSquare[], dice: [number, number]) => {
    if (!square.rent) return 0;
    if (square.type === 'railroad') {
        const ownerId = square.owner!;
        const railroadCount = board.filter(s => s.type === 'railroad' && s.owner === ownerId).length;
        return 25 * Math.pow(2, railroadCount - 1);
    }
    if (square.type === 'utility') {
        return 4 * (dice[0] + dice[1]); 
    }
    return square.rent[0];
  };

  const buyProperty = () => {
    if (!isHost) {
      socket.emit('client_action', roomId, { type: 'BUY' });
      return;
    }
    
    const state = stateRef.current;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const square = state.board[currentPlayer.position];
    
    if (!square.price) return;
    
    if (currentPlayer.money >= square.price) {
      playSound('buy', volume);
      
      const newBoard = [...state.board];
      newBoard[currentPlayer.position] = { ...square, owner: currentPlayer.id };
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        players: prev.players.map(p => p.id === currentPlayer.id ? {
          ...p,
          money: p.money - square.price!,
          properties: [...p.properties, square.id]
        } : p),
        phase: 'end'
      }));
      
      addLog('boughtProperty', { player: currentPlayer.name, square: square.name, price: square.price });
    }
  };

  const resolveCard = () => {
    if (!isHost) {
      socket.emit('client_action', roomId, { type: 'RESOLVE_CARD' });
      return;
    }
    
    const state = stateRef.current;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const card = state.drawnCard;

    if (card && card.effect) {
      if (card.effect.money) {
        if (card.effect.money > 0) {
           playSound('buy', volume); // Reusing buy sound for getting money
        } else {
           playSound('pay', volume);
        }
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, money: p.money + card.effect.money! } : p),
          phase: 'end',
          drawnCard: null
        }));
      }
    } else {
      setGameState(prev => ({ ...prev, phase: 'end', drawnCard: null }));
    }
  };

  const endTurn = () => {
    if (!isHost) {
      socket.emit('client_action', roomId, { type: 'END_TURN' });
      return;
    }
    
    const state = stateRef.current;
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    setGameState(prev => ({
      ...prev,
      currentPlayerIndex: nextIndex,
      phase: 'roll'
    }));
  };

  const handleClientAction = (action: any, clientId: string) => {
    const state = stateRef.current;
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Only allow action if it's the current player's turn
    if (currentPlayer.socketId !== clientId && !currentPlayer.isLocal) return;

    switch (action.type) {
      case 'ROLL':
        if (state.phase === 'roll') rollDice();
        break;
      case 'BUY':
        if (state.phase === 'action') buyProperty();
        break;
      case 'RESOLVE_CARD':
        if (state.phase === 'drawing_card') resolveCard();
        break;
      case 'END_TURN':
        if (state.phase === 'action' || state.phase === 'end') endTurn();
        break;
    }
  };

  // Bot Logic
  useEffect(() => {
    if (!isHost) return;
    
    const state = gameState;
    if (state.phase === 'setup' || state.phase === 'finished' || state.players.length === 0) return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isBot) return;

    const timer = setTimeout(() => {
      if (state.phase === 'roll') {
        rollDice();
      } else if (state.phase === 'action') {
        const square = state.board[currentPlayer.position];
        if (square.price && !square.owner && currentPlayer.money >= square.price) {
          buyProperty();
        } else {
          endTurn();
        }
      } else if (state.phase === 'drawing_card') {
        resolveCard();
      } else if (state.phase === 'end') {
        endTurn();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.currentPlayerIndex, isHost]);

  return {
    ...gameState,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    roomId,
    roomName,
    roomsList,
    isHost,
    myId,
    lobbyUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    rollDice,
    buyProperty,
    resolveCard,
    endTurn,
    updateLobbyUser,
    addBot,
    addLocalPlayer,
    removeBot,
    updateMaxLaps
  };
}
