// batterysync-react/src/services/websocket.js
import { WS_URL } from "../utils/constants";
import useBatteryStore from "../store/batteryStore";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connectAttempts = 0;
    this.maxConnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  connect(token, email) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected");
      return;
    }

    // Close any existing connection
    this.disconnect();

    const url = `${WS_URL}?token=${token}&email=${encodeURIComponent(email)}`;
    console.log(`Connecting to WebSocket at: ${url}`);
    this.socket = new WebSocket(url);

    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);

    console.log("WebSocket connecting...");
  }

  handleOpen() {
    console.log("WebSocket connected");
    this.connectAttempts = 0;
  }

  handleClose(event) {
    console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Try to reconnect if not intentionally closed and within max attempts
    if (!event.wasClean && this.connectAttempts < this.maxConnectAttempts) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
    useBatteryStore
      .getState()
      .setError("WebSocket connection error. Please try again later.");
  }

  handleMessage(event) {
    try {
      console.log("Raw WebSocket message:", event.data);
      const data = JSON.parse(event.data);
      const email = localStorage.getItem("userEmail");

      // Handle detailed debugging
      console.log("Parsed WebSocket data:", data);
      console.log("Current user email:", email);

      // Handle error messages
      if (data.error) {
        console.error("WebSocket message error:", data.error);
        if (data.error === "unauthorized") {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        return;
      }

      // Try to find the user's battery data
      let batteryData = null;

      // Option 1: Check if the data has the email as a key
      if (data[email]) {
        batteryData = data[email];
        console.log("Found battery data by email key:", batteryData);
      }
      // Option 2: Data might be directly the battery data
      else if (data.percentage !== undefined && data.charging !== undefined) {
        batteryData = data;
        console.log("Found direct battery data:", batteryData);
      }
      // Option 3: Scan all keys for any battery data
      else {
        console.log("Scanning WebSocket data for battery info...");
        Object.entries(data).forEach(([key, value]) => {
          console.log(`Checking key "${key}":`, value);
          if (
            value &&
            typeof value === "object" &&
            "percentage" in value &&
            "charging" in value
          ) {
            console.log(`Found battery data in key "${key}":`, value);
            batteryData = value;
          }
        });
      }

      // Update battery data if found
      if (batteryData) {
        useBatteryStore.getState().setBatteryData({
          level: batteryData.percentage,
          charging: batteryData.charging,
        });
      } else {
        console.warn("No battery data found in WebSocket message");
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error, event.data);
    }
  }

  scheduleReconnect() {
    this.connectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.connectAttempts), 30000);

    console.log(
      `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.connectAttempts})`
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
        this.socket.close();
      }
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();
