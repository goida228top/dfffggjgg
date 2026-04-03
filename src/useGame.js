import { useState, useEffect, useRef } from "react";
import { BOARD_DATA } from "./gameData";
import { playSound } from "./utils/sound";
import { useSettings } from "./SettingsContext";
import { socket } from "./socket";

export function useMonopolyGame() {
  const { volume, t, userId } = useSettings();
  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [isHost, setIsHost] = useState(false);
  const [myId, setMyId] = useState(userId);
  const [lobbyUsers, setLobbyUsers] = useState([]);

  useEffect(() => {
    console.log(`[GAME] userId changed: ${userId}`);
    if (userId) setMyId(userId);
  }, [userId]);

  const [roomsList, setRoomsList] = useState([]);
  // Local state for Host (or fallback)
  const [gameState, setGameState] = useState({
    players: [],
    currentPlayerIndex: 0,
    board: BOARD_DATA,
    dice: [1, 1],
    phase: "setup",
    logs: [],
    lastActionMessage: null,
    maxLaps: 5,
    winner: null,
    drawnCard: null,
    timeLeft: 60,
    statusMessage: "",
    doublesCount: 0,
  });

  const stateRef = useRef({ gameState, myId, isHost, volume, t, roomId });
  const isProcessingActionRef = useRef(false);

  useEffect(() => {
    stateRef.current = { gameState, myId, isHost, volume, t, roomId };
    isProcessingActionRef.current = false; // Reset on state update
  }, [gameState, myId, isHost, volume, t, roomId]);

  // Sync state to clients if Host
  useEffect(() => {
    if (isHost && gameState.phase !== "setup" && roomId) {
      socket.emit("host_state", roomId, gameState);
    }
  }, [gameState, isHost, roomId]);

  useEffect(() => {
    console.log(`[GAME] Initializing socket listeners. MyId: ${myId}`);
    
    socket.on("connect", () => {
      console.log(`[GAME] Connected to server. SocketId: ${socket.id}`);
      const savedRoomId = sessionStorage.getItem("monopoly_room_id");
      if (savedRoomId && stateRef.current.myId) {
        console.log(`[GAME] Attempting to reconnect to room ${savedRoomId} with myId ${stateRef.current.myId}`);
        socket.emit("reconnect_room", savedRoomId, stateRef.current.myId);
      }
    });

    socket.on("room_list", (rooms) => {
      setRoomsList(rooms);
    });

    socket.on("room_joined", ({ id, name, settings, isHost: serverIsHost, gameState: serverGameState }) => {
      console.log(`[GAME] Joined room ${id}. MyId: ${stateRef.current.myId}, isHost: ${serverIsHost}`);
      setRoomId(id);
      sessionStorage.setItem("monopoly_room_id", id);
      setRoomName(name);
      setTotalPlayers(settings.totalPlayers || 4);
      setIsHost(serverIsHost);
      if (serverGameState) {
        console.log(`[GAME] Received initial game state. Phase: ${serverGameState.phase}`);
        const syncedPlayers = serverGameState.players.map((p) => ({
          ...p,
          isLocal: p.id === stateRef.current.myId || !!p.isBot || !!p.isLocal,
        }));
        setGameState({ ...serverGameState, players: syncedPlayers });
      } else {
        setGameState((prev) => ({
          ...prev,
          maxLaps: settings.maxLaps,
          phase: "setup",
        }));
      }
    });

    socket.on("room_users", (users) => {
      console.log(`[GAME] Room users updated. Count: ${users.length}`);
      const mappedUsers = users.map((u) => ({
        ...u,
        isLocal: u.id === stateRef.current.myId || !!u.isBot || !!u.isLocal,
      }));
      setLobbyUsers(mappedUsers);
      const me = mappedUsers.find((u) => u.id === stateRef.current.myId);
      if (me) {
        setIsHost(me.isHost);
      }
    });

    socket.on("settings_updated", (settings) => {
      setGameState((prev) => ({ ...prev, maxLaps: settings.maxLaps }));
    });

    socket.on("game_state", (state) => {
      if (!stateRef.current.isHost || stateRef.current.gameState.phase === "setup") {
        console.log(`[GAME] Received game state from host. Phase: ${state.phase}, CurrentPlayerIdx: ${state.currentPlayerIndex}`);
        const syncedPlayers = state.players.map((p) => ({
          ...p,
          isLocal: p.id === stateRef.current.myId || !!p.isBot || !!p.isLocal,
        }));
        setGameState({ ...state, players: syncedPlayers });
      }
    });

    socket.on("player_turned_bot", (turnedUserId) => {
      if (stateRef.current.isHost) {
        setGameState((prev) => {
          const newPlayers = prev.players.map(p => {
            if (p.id === turnedUserId) {
              return { ...p, isBot: true, isLocal: true };
            }
            return p;
          });
          return { ...prev, players: newPlayers };
        });
      }
    });

    socket.on("client_action", (action, clientId) => {
      if (stateRef.current.isHost) {
        console.log(`[GAME] Host received action ${action.type} from client ${clientId}`);
        handleClientAction(action, clientId);
      }
    });

    socket.on("error", (msg) => {
      console.error("Socket error:", msg);
    });

    return () => {
      socket.off("connect");
      socket.off("room_list");
      socket.off("room_joined");
      socket.off("room_users");
      socket.off("settings_updated");
      socket.off("game_state");
      socket.off("client_action");
      socket.off("error");
    };
  }, []);

  const createRoom = (settings, user) => {
    socket.emit("create_room", settings, user);
  };

  const joinRoom = (id, user) => {
    socket.emit("join_room", id, user);
  };

  const leaveRoom = () => {
    if (roomId) {
      socket.emit("leave_room", roomId);
      sessionStorage.removeItem("monopoly_room_id");
      setRoomId(null);
      setRoomName("");
      setIsHost(false);
      setLobbyUsers([]);
      setGameState((prev) => ({ ...prev, phase: "setup", players: [] }));
    }
  };

  const updateLobbyUser = (name, color, token) => {
    if (roomId) {
      // Optimistic update
      setLobbyUsers((prev) =>
        prev.map((u) => (u.id === myId ? { ...u, name, color, token } : u)),
      );
      socket.emit("update_user", roomId, { name, color, token });
    }
  };

  const addBot = () => {
    if (isHost && roomId) {
      const botId = `bot_${Math.random().toString(36).substring(2, 8)}`;
      const botColors = [
        "#ef4444",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ec4899",
      ];
      const color = botColors[lobbyUsers.length % botColors.length];
      const newBot = {
        id: botId,
        name: `${t("bot")} ${lobbyUsers.filter((u) => u.isBot).length + 1}`,
        color,
        token: "car", // Server will assign unique
        isBot: true,
        isLocal: true,
      };
      socket.emit("add_bot", roomId, newBot);
    }
  };

  const addLocalPlayer = () => {
    if (isHost && roomId) {
      const localId = `local_${Math.random().toString(36).substring(2, 8)}`;
      const colors = [
        "#ef4444",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ec4899",
      ];
      const color = colors[lobbyUsers.length % colors.length];
      const newLocal = {
        id: localId,
        name: `${t("player")} ${lobbyUsers.filter((u) => u.isLocal && !u.isBot).length + 1}`,
        color,
        token: "car", // Server will assign unique
        isBot: false,
        isLocal: true,
      };
      socket.emit("add_bot", roomId, newLocal);
    }
  };

  const removeBot = (botId) => {
    if (isHost && roomId) {
      socket.emit("remove_bot", roomId, botId);
    }
  };

  const kickPlayer = (playerId) => {
    if (isHost && roomId) {
      socket.emit("kick_player", roomId, playerId);
    }
  };

  const updateMaxLaps = (laps) => {
    if (isHost && roomId) {
      setGameState((prev) => ({ ...prev, maxLaps: laps }));
      socket.emit("update_settings", roomId, { maxLaps: laps });
    }
  };

  const startGame = () => {
    if (!isHost || !roomId) return;
    const newPlayers = lobbyUsers.map((u, i) => ({
      id: u.id,
      name: u.name || `Player ${i + 1}`,
      color: u.color,
      token: u.token,
      money: 1500,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
      laps: 0,
      isBot: !!u.isBot,
      isLocal: u.id === myId || !!u.isBot || !!u.isLocal,
    }));
    setGameState((prev) => ({
      ...prev,
      players: newPlayers,
      currentPlayerIndex: 0,
      board: BOARD_DATA,
      dice: [1, 1],
      phase: "roll",
      logs: [{ key: "gameStarted" }],
      lastActionMessage: null,
      drawnCard: null,
      timeLeft: 60,
      statusMessage: t("waitingForDice", { player: newPlayers[0].name }),
      doublesCount: 0,
    }));
    socket.emit("start_game", roomId);
  };

  const addLog = (key, params) => {
    const entry = { key, params };
    setGameState((prev) => ({
      ...prev,
      logs: [entry, ...prev.logs].slice(0, 50),
      lastActionMessage: entry,
    }));
  };

  const checkWinCondition = (players, maxLaps) => {
    if (maxLaps === 0) return null; // Infinity: no lap-based win condition
    const winner = players.find((p) => p.laps >= maxLaps);
    if (winner) {
      setGameState((prev) => ({ ...prev, phase: "finished", winner }));
      playSound("win", volume);
      return true;
    }
    return false;
  };

  const rollDice = async () => {
    const { isHost, gameState, myId } = stateRef.current;
    console.log(`[GAME] rollDice called. isHost: ${isHost}, phase: ${gameState.phase}`);
    if (!isHost) {
      console.log(`[GAME] Emitting ROLL action to server`);
      socket.emit("client_action", roomId, { type: "ROLL" });
      return;
    }
    const state = gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    if (state.phase !== "roll") {
      console.log(`[GAME] Ignoring rollDice because phase is ${state.phase}`);
      return;
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;

    // Determine final result immediately
    const finalD1 = Math.floor(Math.random() * 6) + 1;
    const finalD2 = Math.floor(Math.random() * 6) + 1;
    const total = finalD1 + finalD2;

    playSound("roll", volume);
    
    // Start rolling animation (fewer steps to reduce traffic)
    setGameState((prev) => ({ 
      ...prev, 
      phase: "rolling", 
      statusMessage: currentPlayer.inJail ? t("rollingForDoublesStatus", { player: currentPlayer.name }) : t("rollingDice", { player: currentPlayer.name }) 
    }));

    for (let i = 0; i < 6; i++) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setGameState((prev) => ({ ...prev, dice: [d1, d2] }));
      await new Promise((res) => setTimeout(res, 150));
    }
    
    // Set final result
    setGameState((prev) => ({ ...prev, dice: [finalD1, finalD2], phase: "dice_result" }));
    await new Promise((res) => setTimeout(res, 800));

    const d1 = finalD1;
    const d2 = finalD2;
    addLog("rolled", { player: currentPlayer.name, d1, d2, total });

    if (currentPlayer.inJail) {
      if (d1 === d2) {
        addLog("rolledDoublesOutJail", { player: currentPlayer.name });
        setGameState((prev) => ({
          ...prev,
          doublesCount: 0,
          players: prev.players.map((p) =>
            p.id === currentPlayer.id
              ? { ...p, inJail: false, jailTurns: 0 }
              : p,
          ),
        }));
        movePlayer(total);
      } else {
        addLog("staysInJail", { player: currentPlayer.name });
        const newJailTurns = currentPlayer.jailTurns + 1;
        if (newJailTurns >= 3) {
          addLog("paysToLeaveJail", { player: currentPlayer.name });
          const updatedMoney = currentPlayer.money - 50;
          setGameState((prev) => ({
            ...prev,
            doublesCount: 0,
            players: prev.players.map((p) =>
              p.id === currentPlayer.id
                ? { ...p, inJail: false, jailTurns: 0, money: updatedMoney }
                : p,
            ),
          }));
          movePlayer(total, updatedMoney);
        } else {
          setGameState((prev) => ({
            ...prev,
            doublesCount: 0,
            players: prev.players.map((p) =>
              p.id === currentPlayer.id ? { ...p, jailTurns: newJailTurns } : p,
            ),
            phase: "end",
            timeLeft: 60,
            statusMessage: t("staysInJailStatus", { player: currentPlayer.name }),
          }));
        }
      }
    } else {
      if (d1 === d2) {
        const newCount = state.doublesCount + 1;
        if (newCount === 3) {
          addLog("speedingJail", { player: currentPlayer.name });
          setGameState((prev) => ({
            ...prev,
            doublesCount: 0,
            players: prev.players.map((p) =>
              p.id === currentPlayer.id ? { ...p, position: 10, inJail: true, jailTurns: 0 } : p,
            ),
            phase: "end",
            timeLeft: 60,
            statusMessage: t("goesToJailStatus", { player: currentPlayer.name }),
          }));
          return;
        } else {
          setGameState((prev) => ({ ...prev, doublesCount: newCount }));
          movePlayer(total);
        }
      } else {
        setGameState((prev) => ({ ...prev, doublesCount: 0 }));
        movePlayer(total);
      }
    }
  };

  const movePlayer = async (steps, startingMoney) => {
    const initialState = stateRef.current.gameState;
    if (!initialState || !initialState.players || initialState.currentPlayerIndex === undefined) return;
    const initialPlayer = initialState.players[initialState.currentPlayerIndex];
    if (!initialPlayer) return;

    setGameState((prev) => ({ ...prev, phase: "moving", statusMessage: t("movingStatus", { player: initialPlayer.name }) }));
    
    let currentPos = initialPlayer.position;
    let currentMoney = startingMoney !== undefined ? startingMoney : initialPlayer.money;
    let currentLaps = initialPlayer.laps;

    for (let i = 1; i <= steps; i++) {
      currentPos = (currentPos + 1) % 40;
      if (currentPos === 0) {
        currentMoney += 200;
        currentLaps += 1;
        addLog("passedGo", { player: initialPlayer.name });
      }
      
      // Only broadcast every 2 steps or the last step to reduce traffic
      const shouldBroadcast = i % 2 === 0 || i === steps;
      
      if (shouldBroadcast) {
        setGameState((prev) => ({
          ...prev,
          players: prev.players.map((p) =>
            p.id === initialPlayer.id
              ? { ...p, position: currentPos, money: currentMoney, laps: currentLaps }
              : p
          ),
        }));
      }
      
      playSound("move", volume);
      await new Promise((res) => setTimeout(res, 300));
    }

    const state = stateRef.current.gameState;
    if (checkWinCondition(state.players, state.maxLaps)) return;

    handleLanding(currentPos, currentMoney);
  };

  const handleLanding = (pos, currentMoney) => {
    const state = stateRef.current.gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;
    const square = state.board[pos];
    if (!square) return;
    addLog("landedOn", { player: currentPlayer.name, square: square.name, price: square.price });

    if (square.name === "goToJailSquare") {
      addLog("goesToJail", { player: currentPlayer.name });
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === currentPlayer.id ? { ...p, position: 10, inJail: true, jailTurns: 0 } : p,
        ),
        phase: "end",
        timeLeft: 60,
        statusMessage: t("goesToJailStatus", { player: currentPlayer.name }),
      }));
      return;
    }

    if (square.type === "tax") {
      const tax = square.price || 0;
      addLog("paidTax", { player: currentPlayer.name, tax });
      playSound("pay", volume);
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === currentPlayer.id ? { ...p, money: currentMoney - tax } : p,
        ),
        phase: "end",
        timeLeft: 60,
        statusMessage: t("paidTaxStatus", { player: currentPlayer.name }),
      }));
      return;
    }

    if (square.type === "chance" || square.type === "chest") {
      const isChance = square.type === "chance";
      const cards = isChance
        ? [
            { key: "chance1", effect: { money: 50 } },
            { key: "chance2", effect: { money: -15 } },
            { key: "chance3", effect: { money: 100 } },
            { key: "chance4", effect: { money: -15 } },
          ]
        : [
            { key: "chest1", effect: { money: 200 } },
            { key: "chest2", effect: { money: -50 } },
            { key: "chest3", effect: { money: 50 } },
            { key: "chest4", effect: { money: -100 } },
          ];
      const card = cards[Math.floor(Math.random() * cards.length)];
      setGameState((prev) => ({
        ...prev,
        phase: "drawing_card",
        drawnCard: { type: square.type, key: card.key, effect: card.effect },
        timeLeft: 60,
        statusMessage: t("drawingCardStatus", { player: currentPlayer.name }),
      }));
      addLog("drewCard", { player: currentPlayer.name, type: square.type });
      return;
    }

    if (
      square.type === "property" ||
      square.type === "railroad" ||
      square.type === "utility"
    ) {
      if (square.owner === undefined || square.owner === null) {
        if (currentMoney >= (square.price || 0)) {
          setGameState((prev) => ({ ...prev, phase: "action", timeLeft: 60, statusMessage: t("waitingForDecision", { player: currentPlayer.name }) }));
        } else {
          addLog("cannotAfford", {
            player: currentPlayer.name,
            square: square.name,
          });
          setGameState((prev) => ({ ...prev, phase: "end", timeLeft: 60, statusMessage: t("endingTurnStatus", { player: currentPlayer.name }) }));
        }
      } else if (square.owner !== currentPlayer.id) {
        const rent = calculateRent(square, state.board, state.dice);
        const ownerPlayer = state.players.find(p => p.id === square.owner);
        addLog("paysRent", {
          player: currentPlayer.name,
          rent,
          owner: ownerPlayer?.name || "Unknown",
        });
        playSound("pay", volume);
        setGameState((prev) => ({
          ...prev,
          players: prev.players.map((p) => {
            if (p.id === currentPlayer.id)
              return { ...p, money: currentMoney - rent };
            if (p.id === square.owner) return { ...p, money: p.money + rent };
            return p;
          }),
          phase: "end",
          timeLeft: 60,
          statusMessage: t("paidRentStatus", { player: currentPlayer.name }),
        }));
      } else {
        setGameState((prev) => ({ ...prev, phase: "end", timeLeft: 60, statusMessage: t("restingStatus", { player: currentPlayer.name }) }));
      }
    } else {
      setGameState((prev) => ({ ...prev, phase: "end", timeLeft: 60, statusMessage: t("endingTurnStatus", { player: currentPlayer.name }) }));
    }
  };

  const calculateRent = (square, board, dice) => {
    if (!square.rent || square.isMortgaged) return 0;
    if (square.type === "railroad") {
      const ownerId = square.owner;
      const railroadCount = board.filter(
        (s) => s.type === "railroad" && s.owner === ownerId,
      ).length;
      return 25 * Math.pow(2, railroadCount - 1);
    }
    if (square.type === "utility") {
      const ownerId = square.owner;
      const utilityCount = board.filter(
        (s) => s.type === "utility" && s.owner === ownerId,
      ).length;
      const multiplier = utilityCount === 2 ? 10 : 4;
      return multiplier * (dice[0] + dice[1]);
    }
    
    // Regular property
    if (square.hotel) return square.rent[5];
    if (square.houses > 0) return square.rent[square.houses];
    
    // Check for monopoly
    const groupProperties = board.filter(s => s.group === square.group);
    const hasMonopoly = groupProperties.length > 0 && groupProperties.every(s => s.owner === square.owner);
    
    return hasMonopoly ? square.rent[0] * 2 : square.rent[0];
  };

  const buildHouse = (propertyId) => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) {
      socket.emit("client_action", roomId, { type: "BUILD_HOUSE", propertyId });
      return;
    }
    const state = gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;
    const squareIndex = state.board.findIndex(s => s.id === propertyId);
    const square = state.board[squareIndex];
    
    if (!square || square.owner !== currentPlayer.id || !square.housePrice) return;
    
    // Check if player has monopoly
    const groupProperties = state.board.filter(s => s.group === square.group);
    const hasMonopoly = groupProperties.length > 0 && groupProperties.every(s => s.owner === currentPlayer.id);
    
    if (!hasMonopoly) return;
    
    // Check if any property in group is mortgaged
    const anyMortgaged = groupProperties.some(s => s.isMortgaged);
    if (anyMortgaged) return;
    
    // Check if player can afford it
    if (currentPlayer.money < square.housePrice) return;
    
    // Check if it can be built (max 4 houses, then 1 hotel)
    const currentHouses = square.houses || 0;
    const hasHotel = square.hotel || false;
    
    if (hasHotel) return; // Already maxed out
    
    // Check even build rule (all properties in group must have at least currentHouses)
    const canBuildEvenly = groupProperties.every(s => (s.houses || 0) >= currentHouses || s.hotel);
    if (!canBuildEvenly) return;
    
    playSound("buy", volume);
    
    const newBoard = [...state.board];
    let newHouses = currentHouses;
    let newHotel = false;
    
    if (currentHouses === 4) {
      newHouses = 0;
      newHotel = true;
    } else {
      newHouses += 1;
    }
    
    newBoard[squareIndex] = { ...square, houses: newHouses, hotel: newHotel };
    
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      players: prev.players.map((p) =>
        p.id === currentPlayer.id
          ? { ...p, money: p.money - square.housePrice }
          : p
      ),
      statusMessage: t("builtHouseStatus", { player: currentPlayer.name, square: t(square.name) }),
    }));
  };

  const mortgageProperty = (propertyId) => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "MORTGAGE", propertyId }); return; }
    const state = gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const squareIndex = state.board.findIndex(s => s.id === propertyId);
    const square = state.board[squareIndex];
    
    if (!square || square.owner !== currentPlayer.id || square.isMortgaged) return;
    
    // Cannot mortgage if any property in group has houses
    const groupProperties = state.board.filter(s => s.group === square.group);
    const anyHouses = groupProperties.some(s => (s.houses || 0) > 0 || s.hotel);
    if (anyHouses) return;
    
    const mortgageValue = square.price / 2;
    playSound("buy", volume);
    
    const newBoard = [...state.board];
    newBoard[squareIndex] = { ...square, isMortgaged: true };
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, money: p.money + mortgageValue } : p),
      statusMessage: t("mortgagedStatus", { player: currentPlayer.name, square: t(square.name) })
    }));
  };

  const unmortgageProperty = (propertyId) => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "UNMORTGAGE", propertyId }); return; }
    const state = gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const squareIndex = state.board.findIndex(s => s.id === propertyId);
    const square = state.board[squareIndex];
    
    if (!square || square.owner !== currentPlayer.id || !square.isMortgaged) return;
    
    const unmortgageCost = Math.ceil((square.price / 2) * 1.1);
    if (currentPlayer.money < unmortgageCost) return;
    
    playSound("pay", volume);
    
    const newBoard = [...state.board];
    newBoard[squareIndex] = { ...square, isMortgaged: false };
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, money: p.money - unmortgageCost } : p),
      statusMessage: t("unmortgagedStatus", { player: currentPlayer.name, square: t(square.name) })
    }));
  };

  const sellHouse = (propertyId) => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "SELL_HOUSE", propertyId }); return; }
    const state = gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const squareIndex = state.board.findIndex(s => s.id === propertyId);
    const square = state.board[squareIndex];
    
    if (!square || square.owner !== currentPlayer.id || (!square.houses && !square.hotel)) return;
    
    const groupProperties = state.board.filter(s => s.group === square.group);
    const currentTotal = square.hotel ? 5 : square.houses || 0;
    const canSellEvenly = groupProperties.every(s => (s.hotel ? 5 : s.houses || 0) <= currentTotal);
    
    if (!canSellEvenly) return;
    
    playSound("buy", volume);
    
    const newBoard = [...state.board];
    let newHouses = square.houses;
    let newHotel = square.hotel;
    
    if (newHotel) {
      newHotel = false;
      newHouses = 4;
    } else {
      newHouses -= 1;
    }
    
    newBoard[squareIndex] = { ...square, houses: newHouses, hotel: newHotel };
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, money: p.money + (square.housePrice / 2) } : p),
      statusMessage: t("soldHouseStatus", { player: currentPlayer.name, square: t(square.name) })
    }));
  };

  const proposeTrade = (trade) => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "PROPOSE_TRADE", trade }); return; }
    setGameState(prev => ({ ...prev, tradeOffer: trade }));
    
    const state = gameState;
    if (!state || !state.players) return;
    const targetPlayer = state.players.find(p => p.id === trade.to);
    if (targetPlayer && targetPlayer.isBot) {
      setTimeout(() => {
        const currentState = stateRef.current.gameState;
        if (!currentState || !currentState.board) return;
        const offerValue = trade.offerMoney + trade.offerProperties.reduce((sum, id) => sum + (currentState.board.find(s => s.id === id)?.price || 0), 0);
        const requestValue = trade.requestMoney + trade.requestProperties.reduce((sum, id) => sum + (currentState.board.find(s => s.id === id)?.price || 0), 0);
        
        if (offerValue >= requestValue) {
          acceptTrade();
        } else {
          rejectTrade();
        }
      }, 2000);
    }
  };

  const acceptTrade = () => {
    const { isHost, gameState, myId } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "ACCEPT_TRADE" }); return; }
    const state = gameState;
    const trade = state.tradeOffer;
    if (!trade) return;
    
    const p1 = state.players.find(p => p.id === trade.from);
    const p2 = state.players.find(p => p.id === trade.to);
    
    if (!p1 || !p2 || p1.money < trade.offerMoney || p2.money < trade.requestMoney) {
      rejectTrade();
      return;
    }
    
    const newBoard = state.board.map(sq => {
      if (trade.offerProperties.includes(sq.id)) return { ...sq, owner: p2.id };
      if (trade.requestProperties.includes(sq.id)) return { ...sq, owner: p1.id };
      return sq;
    });
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      players: prev.players.map(p => {
        if (p.id === p1.id) {
          return {
            ...p,
            money: p.money - trade.offerMoney + trade.requestMoney,
            properties: [...p.properties.filter(id => !trade.offerProperties.includes(id)), ...trade.requestProperties]
          };
        }
        if (p.id === p2.id) {
          return {
            ...p,
            money: p.money - trade.requestMoney + trade.offerMoney,
            properties: [...p.properties.filter(id => !trade.requestProperties.includes(id)), ...trade.offerProperties]
          };
        }
        return p;
      }),
      tradeOffer: null,
      statusMessage: t("tradeAccepted", { player: p2.name })
    }));
    playSound("buy", volume);
  };

  const rejectTrade = () => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) { socket.emit("client_action", roomId, { type: "REJECT_TRADE" }); return; }
    const state = gameState;
    const trade = state.tradeOffer;
    if (!trade) return;
    const p2 = state.players.find(p => p.id === trade.to);
    
    setGameState(prev => ({
      ...prev,
      tradeOffer: null,
      statusMessage: t("tradeRejected", { player: p2?.name || "Player" })
    }));
  };

  const buyProperty = () => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) {
      socket.emit("client_action", roomId, { type: "BUY" });
      return;
    }
    const state = gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;
    const square = state.board[currentPlayer.position];
    if (!square || !square.price) return;
    if (currentPlayer.money >= square.price) {
      playSound("buy", volume);
      const newBoard = [...state.board];
      newBoard[currentPlayer.position] = { ...square, owner: currentPlayer.id };
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        players: prev.players.map((p) =>
          p.id === currentPlayer.id
            ? {
                ...p,
                money: p.money - square.price,
                properties: [...p.properties, square.id],
              }
            : p,
        ),
        phase: "end",
        timeLeft: 60,
        statusMessage: t("boughtPropertyStatus", { player: currentPlayer.name, square: t(square.name) }),
      }));
      addLog("boughtProperty", {
        player: currentPlayer.name,
        square: square.name,
        price: square.price,
      });
    }
  };

  const resolveCard = () => {
    const { isHost, gameState } = stateRef.current;
    if (!isHost) {
      socket.emit("client_action", roomId, { type: "RESOLVE_CARD" });
      return;
    }
    const state = gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const card = state.drawnCard;

    if (card && card.effect) {
      if (card.effect.money) {
        if (card.effect.money > 0) {
          playSound("buy", volume); // Reusing buy sound for getting money
        } else {
          playSound("pay", volume);
        }
        setGameState((prev) => ({
          ...prev,
          players: prev.players.map((p) =>
            p.id === currentPlayer.id
              ? { ...p, money: p.money + card.effect.money }
              : p,
          ),
          phase: "end",
          drawnCard: null,
          timeLeft: 60,
          statusMessage: t("endingTurnStatus", { player: currentPlayer.name }),
        }));
      }
    } else {
      setGameState((prev) => ({ ...prev, phase: "end", drawnCard: null, timeLeft: 60, statusMessage: t("endingTurnStatus", { player: currentPlayer.name }) }));
    }
  };

  const endTurn = () => {
    const { isHost, gameState, myId } = stateRef.current;
    console.log(`[GAME] endTurn called. isHost: ${isHost}`);
    if (!isHost) {
      console.log(`[GAME] Emitting END_TURN action to server`);
      socket.emit("client_action", roomId, { type: "END_TURN" });
      return;
    }
    const state = gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;

    let nextState = { ...state };
    if (currentPlayer.money < 0) {
      // Bankrupt!
      nextState.players = nextState.players.map(p => p.id === currentPlayer.id ? { ...p, bankrupt: true } : p);
      // Free properties and reset houses
      nextState.board = nextState.board.map(sq => sq.owner === currentPlayer.id ? { ...sq, owner: null, houses: 0, hotel: false, isMortgaged: false } : sq);
      // Log
      nextState.logs = [...nextState.logs, { key: "bankruptLog", params: { player: currentPlayer.name } }];
    }

    // Check for doubles extra turn
    if (state.doublesCount > 0 && !currentPlayer.inJail && !nextState.players[state.currentPlayerIndex].bankrupt && currentPlayer.money >= 0) {
      setGameState((prev) => ({
        ...nextState,
        phase: "roll",
        timeLeft: 60,
        statusMessage: t("waitingForDice", { player: currentPlayer.name }),
      }));
      return;
    }

    // Find next non-bankrupt player
    let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    while (nextState.players[nextIndex].bankrupt) {
      nextIndex = (nextIndex + 1) % state.players.length;
      if (nextIndex === state.currentPlayerIndex) {
        // Everyone else is bankrupt, game over!
        nextState.phase = "finished";
        nextState.winner = nextState.players[nextIndex];
        setGameState(nextState);
        playSound("win", volume);
        return;
      }
    }

    const nextPlayer = nextState.players[nextIndex];
    setGameState((prev) => ({
      ...nextState,
      currentPlayerIndex: nextIndex,
      phase: "roll",
      timeLeft: 60,
      statusMessage: t("waitingForDice", { player: nextPlayer.name }),
    }));
  };

  const payToLeaveJail = () => {
    const { isHost, gameState, myId } = stateRef.current;
    console.log(`[GAME] payToLeaveJail called. isHost: ${isHost}`);
    if (!isHost) {
      console.log(`[GAME] Emitting PAY_JAIL action to server`);
      socket.emit("client_action", roomId, { type: "PAY_JAIL" });
      return;
    }
    const state = gameState;
    if (!state || !state.players || state.currentPlayerIndex === undefined) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) return;

    if (currentPlayer.money >= 50) {
      playSound("pay", volume);
      addLog("paysToLeaveJail", { player: currentPlayer.name });
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === currentPlayer.id
            ? { ...p, inJail: false, jailTurns: 0, money: p.money - 50 }
            : p,
        ),
        phase: "roll", // Allow them to roll after paying
        timeLeft: 60,
        statusMessage: t("paidToLeaveStatus", { player: currentPlayer.name }),
      }));
    }
  };

  const handleClientAction = (action, clientId) => {
    const { gameState, myId } = stateRef.current;
    const state = gameState;
    console.log(`[GAME] handleClientAction: ${action.type} from client ${clientId}. CurrentPlayer: ${state?.players?.[state?.currentPlayerIndex]?.id}, Phase: ${state?.phase}`);
    if (!state || !state.players || state.currentPlayerIndex === undefined) {
      console.error("handleClientAction: Invalid game state", state);
      return;
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) {
      console.error("handleClientAction: Current player not found", state.currentPlayerIndex);
      return;
    }

    // Validation logic
    let isAuthorized = false;

    if (action.type === "ACCEPT_TRADE" || action.type === "REJECT_TRADE") {
      const trade = state.tradeOffer;
      if (!trade) return;
      // The person accepting/rejecting must be the target of the trade
      isAuthorized = (trade.to === clientId) || (trade.to === myId && clientId === myId);
    } else if (action.type === "PROPOSE_TRADE") {
      // Anyone can propose a trade if it's their turn
      isAuthorized = (currentPlayer.id === clientId);
    } else {
      // For most actions, it must be the current player's turn
      isAuthorized = (currentPlayer.id === clientId);
    }

    // If the host is performing an action for a local player (bot or host's own player), it's authorized
    if (clientId === myId && currentPlayer.isLocal) {
      console.log(`[GAME] Host authorized action for local player ${currentPlayer.name} (ID: ${currentPlayer.id})`);
      isAuthorized = true;
    }

    if (!isAuthorized) {
      console.warn(`[GAME] handleClientAction: Unauthorized action ${action.type} from client ${clientId}. Current player is ${currentPlayer.name} (ID: ${currentPlayer.id}, isLocal: ${currentPlayer.isLocal}). My ID is ${myId}.`);
      return;
    }

    if (isProcessingActionRef.current) {
      console.log(`[GAME] Ignoring action ${action.type} because another action is processing.`);
      return;
    }
    isProcessingActionRef.current = true;

    console.log(`[GAME] Action ${action.type} authorized and processing...`);

    switch (action.type) {
      case "ROLL":
        if (state.phase === "roll") rollDice();
        break;
      case "BUY":
        if (state.phase === "action") buyProperty();
        break;
      case "RESOLVE_CARD":
        if (state.phase === "drawing_card") resolveCard();
        break;
      case "END_TURN":
        if (state.phase === "action" || state.phase === "end") endTurn();
        break;
      case "PAY_JAIL":
        if (state.phase === "roll") payToLeaveJail();
        break;
      case "BUILD_HOUSE":
        buildHouse(action.propertyId);
        break;
      case "MORTGAGE":
        mortgageProperty(action.propertyId);
        break;
      case "UNMORTGAGE":
        unmortgageProperty(action.propertyId);
        break;
      case "SELL_HOUSE":
        sellHouse(action.propertyId);
        break;
      case "PROPOSE_TRADE":
        proposeTrade(action.trade);
        break;
      case "ACCEPT_TRADE":
        acceptTrade();
        break;
      case "REJECT_TRADE":
        rejectTrade();
        break;
    }
  };

  // Timer Logic
  useEffect(() => {
    if (!isHost) return;
    const state = gameState;
    if (
      state.phase === "setup" ||
      state.phase === "finished" ||
      state.phase === "moving" ||
      state.phase === "rolling" ||
      state.phase === "dice_result" ||
      state.players.length === 0
    )
      return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 1) {
          // Auto-play when time runs out
          setTimeout(() => {
            const currentState = stateRef.current.gameState;
            if (currentState.phase === "roll") rollDice();
            else if (currentState.phase === "action") endTurn();
            else if (currentState.phase === "drawing_card") resolveCard();
            else if (currentState.phase === "end") endTurn();
          }, 0);
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.phase, isHost]);

  // Bot Logic
  useEffect(() => {
    if (!isHost) return;
    const state = gameState;
    if (
      state.phase === "setup" ||
      state.phase === "finished" ||
      !state.players ||
      state.players.length === 0 ||
      state.currentPlayerIndex === undefined
    )
      return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isBot || currentPlayer.bankrupt) return;

    const timer = setTimeout(() => {
      if (state.phase === "roll") {
        if (currentPlayer.inJail && currentPlayer.money >= 50) {
          payToLeaveJail();
        } else {
          rollDice();
        }
      } else if (state.phase === "action") {
        const square = state.board[currentPlayer.position];
        if (
          square.price &&
          !square.owner &&
          currentPlayer.money >= square.price
        ) {
          buyProperty();
        } else {
          endTurn();
        }
      } else if (state.phase === "drawing_card") {
        resolveCard();
      } else if (state.phase === "end") {
        // Try to build a house before ending turn
        const buildableProperties = state.board.filter(s => {
          if (s.owner !== currentPlayer.id || !s.housePrice || s.hotel || s.isMortgaged) return false;
          const groupProperties = state.board.filter(g => g.group === s.group);
          const hasMonopoly = groupProperties.length > 0 && groupProperties.every(g => g.owner === currentPlayer.id);
          if (!hasMonopoly) return false;
          
          // Cannot build if any property in group is mortgaged
          const anyMortgaged = groupProperties.some(g => g.isMortgaged);
          if (anyMortgaged) return false;

          const currentHouses = s.houses || 0;
          const canBuildEvenly = groupProperties.every(g => (g.houses || 0) >= currentHouses || g.hotel);
          return canBuildEvenly && currentPlayer.money >= s.housePrice + 200; // Keep some buffer money
        });
        
        if (buildableProperties.length > 0) {
          buildHouse(buildableProperties[0].id);
        } else {
          endTurn();
        }
      }
    }, 2000); // Bots take 2 seconds to decide

    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.currentPlayerIndex, isHost, gameState.board, gameState.players[gameState.currentPlayerIndex]?.inJail]);

  const syncState = () => {
    if (isHost && roomId) {
      socket.emit("host_state", roomId, gameState);
    }
  };

  return {
    ...gameState,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    roomId,
    roomName,
    totalPlayers,
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
    kickPlayer,
    updateMaxLaps,
    addBot,
    removeBot,
    addLocalPlayer,
    payToLeaveJail,
    buildHouse,
    mortgageProperty,
    unmortgageProperty,
    sellHouse,
    proposeTrade,
    acceptTrade,
    rejectTrade,
    syncState,
  };
}
