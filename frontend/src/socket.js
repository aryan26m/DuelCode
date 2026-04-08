import {io} from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://duelcode.onrender.com';

export const socket = io(BACKEND_URL, {
    autoConnect: false,
});