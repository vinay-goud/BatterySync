// batterysync-react/src/store/batteryStore.js
import { create } from "zustand";
//import { api } from "../services/api";
import { batteryService } from "../services/battery";

const useBatteryStore = create((set, get) => ({
  batteryData: {
    level: 0,
    charging: false,
    deviceId: localStorage.getItem("deviceId"),
  },
  error: null,
  loading: false,

  setBatteryData: (data) => {
    console.log("Setting battery data in store:", data);
    set((state) => ({
      batteryData: {
        ...state.batteryData,
        ...data,
      },
    }));
  },

  setError: (error) => set({ error }),

  setLoading: (loading) => set({ loading }),

  initializeBattery: async () => {
    set({ loading: true });
    try {
      console.log("Initializing battery service...");
      // Initialize battery service
      const batteryData = await batteryService.initialize();
      console.log("Battery service initialized with data:", batteryData);

      // Update store with initial data
      set({
        batteryData: {
          ...batteryData,
          deviceId: localStorage.getItem("deviceId"),
        },
        loading: false,
      });

      // Schedule regular updates (every 30 seconds)
      setInterval(() => {
        get().updateBatteryStatus();
      }, 30000);
    } catch (error) {
      console.error("Battery initialization error:", error);
      set({ error: error.message, loading: false });
    }
  },

  updateBatteryStatus: async () => {
    try {
      // Get updated battery data
      const batteryData = await batteryService.updateBatteryStatus();

      // Only update the store if we got new data
      if (batteryData) {
        console.log("Updating battery store with new data:", batteryData);
        set((state) => ({
          batteryData: {
            ...state.batteryData,
            level: batteryData.percentage,
            charging: batteryData.charging,
          },
          error: null,
        }));
      }
    } catch (error) {
      console.error("Battery update error:", error);
      set({ error: error.message });
    }
  },
}));

export default useBatteryStore;
