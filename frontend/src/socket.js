import {io} from "socket.io-client";

const runningOnLocalHost =
    typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.DEV || runningOnLocalHost
        ? 'http://localhost:3000'
        : 'https://duelcode.onrender.com');

export const socket = io(BACKEND_URL, {
    autoConnect: false,
});