// batterysync-react/src/services/battery.js
import { api } from "./api";

class BatteryService {
  constructor() {
    this.battery = null;
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
    this.isUpdating = false;
    this.lastUpdateTime = 0;
    this.updateInterval = null;
    this.batteryListeners = [];
  }

  generateDeviceId() {
    const id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem("deviceId", id);
    return id;
  }

  async initializeDeviceId() {
    if (!localStorage.getItem("deviceId")) {
      const id = this.generateDeviceId();
      return id;
    }
    return localStorage.getItem("deviceId");
  }

  async initialize() {
    // Clean up any existing resources
    this.cleanup();

    // Make sure we have a device ID
    await this.initializeDeviceId();

    // Check if Battery API is supported
    if (!("getBattery" in navigator)) {
      console.log("Battery API not supported, using fallback values");

      // Set up regular updates using fallback values
      this.setupRegularUpdates();

      return {
        level: 75,
        charging: true,
      };
    }

    // Get battery instance
    try {
      this.battery = await navigator.getBattery();
      this.setupBatteryListeners();

      // Initial update
      const initialData = {
        level: Math.round(this.battery.level * 100),
        charging: this.battery.charging,
      };

      // Do an initial API update
      await this.updateBatteryStatus();

      // Set up regular updates for backup
      this.setupRegularUpdates();

      return initialData;
    } catch (error) {
      console.error("Failed to get battery status:", error);

      // Use fallback values if battery API fails
      this.setupRegularUpdates();

      return {
        level: 50, // Fallback value
        charging: false,
      };
    }
  }

  setupRegularUpdates() {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Set up a new interval (every 1 minute)
    this.updateInterval = setInterval(() => {
      this.updateBatteryStatus().catch((err) => {
        console.error("Error in scheduled battery update:", err);
      });
    }, 60000);
  }

  async updateBatteryStatus() {
    // Prevent concurrent updates and throttle
    const now = Date.now();
    if (this.isUpdating || now - this.lastUpdateTime < 10000) {
      console.log(
        "Skipping battery update: too frequent or already in progress"
      );
      return null;
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;

    try {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        this.isUpdating = false;
        return null;
      }

      // Get battery info
      const percentage = this.battery
        ? Math.round(this.battery.level * 100)
        : Math.floor(Math.random() * (100 - 30) + 30); // Fallback random value

      const charging = this.battery
        ? this.battery.charging
        : Math.random() > 0.7; // Random charging state

      // Prepare data for API
      const batteryData = {
        email,
        percentage,
        charging,
      };

      // Send data via API
      await api.updateBatteryStatus(batteryData);

      this.isUpdating = false;
      return batteryData;
    } catch (error) {
      console.error("Error updating battery status:", error);
      this.isUpdating = false;
      return null;
    }
  }

  setupBatteryListeners() {
    if (!this.battery) return;

    // Clean up any existing listeners
    this.removeAllListeners();

    // Using throttled event handlers to prevent excessive updates
    const throttledUpdate = this.throttle(() => {
      this.updateBatteryStatus();
    }, 10000); // Only update every 10 seconds at most

    // Update when charging status changes
    const chargingHandler = () => throttledUpdate();
    this.battery.addEventListener("chargingchange", chargingHandler);
    this.batteryListeners.push({
      event: "chargingchange",
      handler: chargingHandler,
    });

    // Update when battery level changes
    const levelHandler = () => throttledUpdate();
    this.battery.addEventListener("levelchange", levelHandler);
    this.batteryListeners.push({
      event: "levelchange",
      handler: levelHandler,
    });
  }

  removeAllListeners() {
    if (this.battery && this.batteryListeners.length > 0) {
      this.batteryListeners.forEach(({ event, handler }) => {
        this.battery.removeEventListener(event, handler);
      });
    }
    this.batteryListeners = [];
  }

  cleanup() {
    // Clear interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Remove event listeners
    this.removeAllListeners();

    // Reset state
    this.isUpdating = false;
  }

  // Add throttle function to limit frequency of updates
  throttle(func, limit) {
    let inThrottle;
    return function () {
      if (!inThrottle) {
        func.apply(this, arguments);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

export const batteryService = new BatteryService();
