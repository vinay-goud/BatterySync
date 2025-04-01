// batterysync-react/src/services/battery.js - URGENT FIX
class BatteryService {
  constructor() {
    this.battery = null;
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
    this.isUpdating = false; // Add lock to prevent concurrent updates
    this.lastUpdateTime = 0; // Track last update time
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
    // Make sure we have a device ID
    await this.initializeDeviceId();

    // Check if Battery API is supported
    if (!("getBattery" in navigator)) {
      console.log("Battery API not supported, using fallback values");

      // Use fallback values - no need to set up listeners that might cause loops
      return {
        level: 75,
        charging: true,
      };
    }

    // Get battery instance
    try {
      this.battery = await navigator.getBattery();
      this.setupBatteryListeners();

      // Initial update with throttling
      await this.updateBatteryStatus();

      return {
        level: Math.round(this.battery.level * 100),
        charging: this.battery.charging,
      };
    } catch (error) {
      console.error("Failed to get battery status:", error);
      return {
        level: 50, // Fallback value
        charging: false,
      };
    }
  }

  async updateBatteryStatus() {
    // Prevent concurrent updates and throttle to max once per 10 seconds
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

      const charging = this.battery ? this.battery.charging : false;

      // Prepare data for API
      const batteryData = {
        email,
        percentage,
        charging,
      };

      // Send data via API
      const { api } = await import("./api");
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

    // Using throttled event handlers to prevent excessive updates
    const throttledUpdate = this.throttle(() => {
      this.updateBatteryStatus();
    }, 10000); // Only update every 10 seconds at most

    // Update when charging status changes
    this.battery.addEventListener("chargingchange", throttledUpdate);

    // Update when battery level changes
    this.battery.addEventListener("levelchange", throttledUpdate);
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
