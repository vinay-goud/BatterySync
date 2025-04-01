// batterysync-react/src/services/websocket.js - URGENT FIX
import { WS_URL } from "../utils/constants";
import useBatteryStore from "../store/batteryStore";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connectAttempts = 0;
    this.maxConnectAttempts = 3; // Reduce max attempts
    this.reconnectTimeout = null;
    this.isConnecting = false; // Add connecting state
    this.connected = false; // Track connection state
  }

  connect(token, email) {
    // Prevent multiple connection attempts
    if (this.isConnecting || this.connected) {
      console.log("WebSocket is already connected or connecting");
      return;
    }

    // Close any existing connection
    this.disconnect();

    this.isConnecting = true;

    try {
      const url = `${WS_URL}?token=${token}&email=${encodeURIComponent(email)}`;
      console.log(`Connecting to WebSocket at: ${url}`);

      this.socket = new WebSocket(url);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.isConnecting = false;
      this.connected = false;
    }
  }

  handleOpen() {
    console.log("WebSocket connected successfully");
    this.connectAttempts = 0;
    this.isConnecting = false;
    this.connected = true;

    // Clear any error state when connected
    useBatteryStore.getState().setError(null);
  }

  handleClose(event) {
    this.isConnecting = false;
    this.connected = false;

    console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);

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
      // Don't set error since it might cause a loop
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
    this.isConnecting = false;

    // Only set error if we haven't reached max attempts
    if (this.connectAttempts < this.maxConnectAttempts) {
      useBatteryStore
        .getState()
        .setError("WebSocket connection error. Please try again later.");
    }
  }

  handleMessage(event) {
    try {
      console.log("WebSocket received message:", event.data);
      const data = JSON.parse(event.data);
      const email = localStorage.getItem("userEmail");

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

        useBatteryStore.getState().setBatteryData({
          level: batteryData.percentage,
          charging: batteryData.charging,
        });
      } else {
        console.warn("No data for current user in WebSocket message");
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  scheduleReconnect() {
    this.connectAttempts++;
    // Use a fixed delay of 5 seconds instead of exponential backoff
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

    if (this.socket) {
      // Only close if the connection is open or connecting
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        try {
          this.socket.close();
        } catch (e) {
          console.error("Error closing WebSocket:", e);
        }
      }
      this.socket = null;
    }

    this.isConnecting = false;
    this.connected = false;
  }
}

export const websocketService = new WebSocketService();
