export const API_URL =
  import.meta.env.VITE_API_URL || "https://batterysync-backend.onrender.com";
export const WS_URL =
  import.meta.env.VITE_WS_URL || "wss://batterysync-backend.onrender.com/ws";

export const ALLOWED_ORIGINS = [
  "https://battery-sync.vercel.app",
  "http://localhost:3000",
];
