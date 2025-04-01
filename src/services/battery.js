import { api } from "./api";
//import { showNotification } from "../utils/notifications";

class BatteryService {
  constructor() {
    this.battery = null;
    this.updateInterval = null;
    this.deviceId = localStorage.getItem("deviceId");
  }

  async initializeDeviceId() {
    if (!this.deviceId) {
      try {
        const hints = await navigator.userAgentData?.getHighEntropyValues([
          "platform",
          "platformVersion",
          "model",
        ]);

        if (hints) {
          this.deviceId = `${hints.platform}-${
            hints.model || "unknown"
          }-${crypto.randomUUID().slice(0, 8)}`;
        } else {
          const platform =
            /Windows|Mac|Linux|Android|iOS/.exec(navigator.userAgent)?.[0] ||
            "unknown";
          this.deviceId = `${platform}-${crypto.randomUUID().slice(0, 8)}`;
        }
        localStorage.setItem("deviceId", this.deviceId);
      } catch (error) {
        console.warn("Device identification failed:", error);
        this.deviceId = `device-${crypto.randomUUID().slice(0, 8)}`;
        localStorage.setItem("deviceId", this.deviceId);
      }
    }
  }

  async initialize() {
    await this.initializeDeviceId();

    if (!navigator.getBattery) {
      throw new Error("Battery API not supported");
    }

    this.battery = await navigator.getBattery();
    return this.setupBatteryListeners();
  }

  async updateBatteryStatus() {
    if (!this.battery) return;

    const batteryData = {
      email: localStorage.getItem("userEmail"),
      deviceId: this.deviceId,
      percentage: Math.round(this.battery.level * 100),
      charging: this.battery.charging,
    };

    try {
      await api.updateBatteryStatus(batteryData);
    } catch (error) {
      console.error("Failed to update battery status:", error);
    }
  }

  setupBatteryListeners() {
    const updateHandler = () => this.updateBatteryStatus();

    this.battery.addEventListener("levelchange", updateHandler);
    this.battery.addEventListener("chargingchange", updateHandler);

    // Initial update and interval
    this.updateBatteryStatus();
    this.updateInterval = setInterval(updateHandler, 5000);

    // Return cleanup function
    return () => {
      this.battery.removeEventListener("levelchange", updateHandler);
      this.battery.removeEventListener("chargingchange", updateHandler);
      clearInterval(this.updateInterval);
    };
  }
}

export const batteryService = new BatteryService();
