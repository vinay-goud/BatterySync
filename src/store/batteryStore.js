// batterysync-react/src/store/batteryStore.js - URGENT FIX
import { create } from "zustand";
import { batteryService } from "../services/battery";

const useBatteryStore = create((set, get) => ({
  batteryData: {
    level: 0,
    charging: false,
    deviceId: localStorage.getItem("deviceId"),
  },
  error: null,
  loading: false,
  initialized: false,

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
    const state = get();

    // Prevent multiple initializations
    if (state.initialized || state.loading) {
      console.log("Battery already initialized or initializing");
      return;
    }

    set({ loading: true, initialized: true });

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

      // Schedule a single update every 60 seconds
      const intervalId = setInterval(() => {
        batteryService
          .updateBatteryStatus()
          .then((data) => {
            if (data) {
              console.log("Scheduled battery update:", data);
            }
          })
          .catch((err) =>
            console.error("Scheduled battery update error:", err)
          );
      }, 60000); // Update every minute

      // Return cleanup function
      return () => {
        console.log("Cleaning up battery service");
        clearInterval(intervalId);
      };
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
