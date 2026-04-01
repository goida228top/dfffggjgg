import { io } from "socket.io-client";

// В AI Studio используем текущий origin для WebSocket соединения
const SERVER_URL = window.location.origin;

export const socket = io(SERVER_URL);
