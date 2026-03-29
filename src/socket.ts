/// <reference types="vite/client" />
import { io } from 'socket.io-client';

// URL сервера. Для локальной разработки 3001, для продакшена можно задать в .env или использовать текущий origin
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

export const socket = io(SERVER_URL);
