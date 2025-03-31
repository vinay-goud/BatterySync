export const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://batterysync-backend.onrender.com";

export const WS_URL =
  window.location.hostname === "localhost"
    ? "ws://localhost:5000/ws"
    : "wss://batterysync-backend.onrender.com/ws";
