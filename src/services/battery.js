// batterysync-react/src/services/battery.js
class BatteryService {
  constructor() {
    this.battery = null;
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
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
      console.warn("Battery API not supported in this browser");

      // Use fallback values
      const fallbackData = {
        level: 75, // Default to 75%
        charging: true, // Default to charging
      };

      // Set up a simulated battery level change
      setInterval(async () => {
        const randomChange = Math.random() < 0.5 ? -1 : 1;
        const newLevel = Math.min(
          100,
          Math.max(0, fallbackData.level + randomChange)
        );
        fallbackData.level = newLevel;

        const { api } = await import("./api");
        const email = localStorage.getItem("userEmail");

        if (email) {
          api.updateBatteryStatus({
            email,
            percentage: newLevel,
            charging: fallbackData.charging,
          });
        }
      }, 30000);

      return fallbackData;
    }

    // Get battery instance
    try {
      this.battery = await navigator.getBattery();
      this.setupBatteryListeners();
      // Initial update
      await this.updateBatteryStatus();
      return {
        level: this.battery.level * 100,
        charging: this.battery.charging,
      };
    } catch (error) {
      console.error("Failed to get battery status:", error);
      throw error;
    }
  }

  async updateBatteryStatus() {
    if (!this.battery && !("getBattery" in navigator)) {
      // Handle case where we're using fallback values
      const email = localStorage.getItem("userEmail");
      if (!email) return null;

      // Get fallback battery level
      const fallbackLevel = Math.floor(Math.random() * 100);
      const fallbackCharging = Math.random() > 0.5;

      // Prepare fallback data
      const batteryData = {
        email: email,
        percentage: fallbackLevel,
        charging: fallbackCharging,
      };

      // Send fallback data
      try {
        const { api } = await import("./api");
        await api.updateBatteryStatus(batteryData);
        return batteryData;
      } catch (error) {
        console.error("Error updating fallback battery status:", error);
        throw error;
      }
    }

    if (!this.battery) return null;

    const email = localStorage.getItem("userEmail");
    if (!email) return null;

    // Prepare data for API
    const batteryData = {
      email: email,
      percentage: Math.round(this.battery.level * 100),
      charging: this.battery.charging,
    };

    // Send data via API
    try {
      const { api } = await import("./api");
      await api.updateBatteryStatus(batteryData);
      return batteryData;
    } catch (error) {
      console.error("Error updating battery status:", error);
      throw error;
    }
  }

  setupBatteryListeners() {
    if (!this.battery) return;

    // Update when charging status changes
    this.battery.addEventListener("chargingchange", () => {
      this.updateBatteryStatus();
    });

    // Update when battery level changes
    this.battery.addEventListener("levelchange", () => {
      this.updateBatteryStatus();
    });
  }
}

export const batteryService = new BatteryService();
