import { useEffect, useRef } from "react";
import useAuth from "./useAuth";

const useWebSocket = () => {
  const { token, email } = useAuth();
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const connectWebSocket = () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Max WebSocket reconnection attempts reached");
        return;
      }

      const wsURL = import.meta.env.DEV
        ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
            window.location.hostname
          }:5000/ws`
        : `wss://batterysync-backend.onrender.com/ws`;

      try {
        const ws = new WebSocket(
          `${wsURL}?token=${encodeURIComponent(
            token
          )}&email=${encodeURIComponent(email)}`
        );

        ws.onopen = () => {
          console.log("WebSocket connected");
          reconnectAttemptsRef.current = 0;
        };

        ws.onclose = () => {
          console.log("WebSocket closed. Reconnecting...");
          reconnectAttemptsRef.current++;
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("WebSocket connection error:", error);
        reconnectAttemptsRef.current++;
        setTimeout(connectWebSocket, 5000);
      }
    };

    if (token && email) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, email]);

  return wsRef.current;
};

export default useWebSocket;
