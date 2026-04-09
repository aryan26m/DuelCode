import {io} from "socket.io-client";

const runningOnLocalHost =
    typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const useRemoteBackendInDev = String(import.meta.env.VITE_USE_REMOTE_BACKEND || '').toLowerCase() === 'true';
const shouldUseLocalBackend = (import.meta.env.DEV || runningOnLocalHost) && !useRemoteBackendInDev;

const BACKEND_URL =
    shouldUseLocalBackend
        ? 'http://localhost:3000'
        : import.meta.env.VITE_BACKEND_URL || 'https://duelcode.onrender.com';

export const socket = io(BACKEND_URL, {
    autoConnect: false,
});