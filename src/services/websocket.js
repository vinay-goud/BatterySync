import { WS_URL } from "../utils/constants";
import useBatteryStore from "../store/batteryStore";
import { showNotification } from "../utils/notifications";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.lastBatteryData = null;
  }

  connect(token, email) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max WebSocket reconnection attempts reached");
      return;
    }

    try {
      const url = `${WS_URL}?token=${encodeURIComponent(
        token
      )}&email=${encodeURIComponent(email)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.scheduleReconnect();
    }
  }

  handleOpen() {
    console.log("WebSocket connected");
    this.reconnectAttempts = 0;
  }

  handleClose() {
    console.log("WebSocket closed");
    this.scheduleReconnect();
  }

  handleError(error) {
    console.error("WebSocket error:", error);
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      if (data.error === "unauthorized") {
        window.location.href = "/login";
        return;
      }

      // Update battery store
      useBatteryStore.getState().setBatteryData(data);

      // Handle notifications for state changes
      if (this.lastBatteryData) {
        const wasCharging = this.lastBatteryData.charging;
        const isCharging = data.charging;

        if (wasCharging !== isCharging) {
          if (isCharging) {
            showNotification("Charger Connected", "Battery is now charging");
          } else {
            showNotification(
              "Charger Disconnected",
              "Battery is on power save mode"
            );
          }
        }

        if (data.level >= 90 && isCharging) {
          showNotification(
            "Battery Full!",
            "Consider unplugging to save battery health"
          );
        }
      }

      this.lastBatteryData = data;
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.reconnectAttempts++;
        this.connect();
      }, 5000);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.lastBatteryData = null;
  }
}

export const websocketService = new WebSocketService();
