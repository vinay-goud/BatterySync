// batterysync-react/src/services/websocket.js
import { WS_URL } from "../utils/constants";
import useBatteryStore from "../store/batteryStore";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connectAttempts = 0;
    this.maxConnectAttempts = 3;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.connected = false;
    this.abortController = null;
    this.pingInterval = null;
  }

  connect(token, email) {
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log("WebSocket is already connecting");
      return;
    }

    if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected");
      return;
    }

    // Close any existing connection
    this.disconnect();

    if (!token || !email) {
      console.error("Cannot connect WebSocket: Missing token or email");
      return;
    }

    this.isConnecting = true;
    this.abortController = new AbortController();

    try {
      const url = `${WS_URL}?token=${token}&email=${encodeURIComponent(email)}`;
      console.log(`Connecting to WebSocket at: ${url}`);

      this.socket = new WebSocket(url);

      // Set timeouts to prevent hanging connections
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log("WebSocket connection timeout after 10 seconds");
          this.socket.close();
        }
      }, 10000);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.resetState();
    }
  }

  resetState() {
    this.isConnecting = false;
    this.connected = false;
    this.socket = null;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  handleOpen() {
    console.log("WebSocket connected successfully");
    this.connectAttempts = 0;
    this.isConnecting = false;
    this.connected = true;

    // Setup ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    // Clear any error state when connected
    const batteryStore = useBatteryStore.getState();
    if (batteryStore && typeof batteryStore.setError === "function") {
      batteryStore.setError(null);
    }
  }

  handleClose(event) {
    this.isConnecting = false;
    this.connected = false;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    console.log(`WebSocket disconnected: ${event.code} ${event.reason || ""}`);

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Only try to reconnect if not at max attempts and wasn't a clean close
    if (!event.wasClean && this.connectAttempts < this.maxConnectAttempts) {
      this.scheduleReconnect();
    } else if (this.connectAttempts >= this.maxConnectAttempts) {
      console.log("Maximum WebSocket reconnect attempts reached. Giving up.");
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
    this.isConnecting = false;

    // Only set error if we haven't reached max attempts
    if (this.connectAttempts < this.maxConnectAttempts) {
      const batteryStore = useBatteryStore.getState();
      if (batteryStore && typeof batteryStore.setError === "function") {
        batteryStore.setError(
          "WebSocket connection error. Please try again later."
        );
      }
    }
  }

  handleMessage(event) {
    try {
      console.log("WebSocket received message:", event.data);
      if (!event.data) return;

      const data = JSON.parse(event.data);

      // Handle ping-pong for keeping connection alive
      if (data.type === "pong") {
        console.log("Received pong from server");
        return;
      }

      const email = localStorage.getItem("userEmail");

      if (!email) {
        console.warn("No email found in localStorage");
        return;
      }

      if (data.error) {
        console.error("WebSocket message error:", data.error);
        if (data.error === "unauthorized") {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        return;
      }

      // Handle the data
      if (data[email] && typeof data[email] === "object") {
        const batteryData = data[email];
        console.log("Processing battery data from WebSocket:", batteryData);

        const batteryStore = useBatteryStore.getState();
        if (batteryStore && typeof batteryStore.setBatteryData === "function") {
          batteryStore.setBatteryData({
            level: batteryData.percentage,
            charging: batteryData.charging,
          });
        }
      } else {
        console.warn("No data for current user in WebSocket message");
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  scheduleReconnect() {
    this.connectAttempts++;
    // Use a fixed delay of 5 seconds
    const delay = 5000;

    console.log(
      `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.connectAttempts}/${this.maxConnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      const token = localStorage.getItem("authToken");
      const email = localStorage.getItem("userEmail");

      if (token && email) {
        console.log(`Attempting WebSocket reconnect #${this.connectAttempts}`);
        this.connect(token, email);
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.socket) {
      try {
        // Only close if the connection is open or connecting
        if (
          this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING
        ) {
          this.socket.close();
        }
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      } finally {
        this.socket = null;
      }
    }

    this.resetState();
  }
}

// Use a singleton instance
export const websocketService = new WebSocketService();
