import { create } from "zustand";
import { api } from "../services/api";
import { batteryService } from "../services/battery";

const useBatteryStore = create((set) => ({
  batteryData: {
    level: 0,
    charging: false,
    deviceId: localStorage.getItem("deviceId"),
  },
  error: null,
  loading: false,

  setBatteryData: (data) => {
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
      await batteryService.initialize();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  updateBatteryStatus: async (data) => {
    try {
      await api.updateBatteryStatus(data);
      set({ batteryData: data, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

export default useBatteryStore;
