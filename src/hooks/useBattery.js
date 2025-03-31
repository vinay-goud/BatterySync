import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import useWebSocket from "./useWebSocket";
import { showNotification } from "../utils/notifications";

export const useBattery = () => {
  const { token, email } = useAuth();
  const [batteryData, setBatteryData] = useState({ level: 0, charging: false });
  const [previousCharging, setPreviousCharging] = useState(null);
  const ws = useWebSocket();
  useEffect(() => {
    // Add WebSocket message handler
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data[email]) {
          setBatteryData(data[email]);
        }
      };
    }
  }, [ws, email]);

  // Add initial battery status fetch
  useEffect(() => {
    const fetchBatteryStatus = async () => {
      try {
        const response = await fetch(
          `/api/batterystatus?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setBatteryData(data);
      } catch (error) {
        console.error("Error fetching battery status:", error);
      }
    };

    if (token && email) {
      fetchBatteryStatus();
    }
  }, [token, email]);

  const getBatteryColor = (level) => {
    if (level <= 20) return "gradient-color-red";
    if (level <= 40) return "gradient-color-orange";
    if (level <= 80) return "gradient-color-yellow";
    return "gradient-color-green";
  };

  const getStatusInfo = (level, charging) => {
    if (level >= 100) {
      return {
        text: "Full battery",
        icon: "ri-battery-2-fill green-color",
      };
    }
    if (level <= 20 && !charging) {
      return {
        text: "Low battery",
        icon: "ri-plug-line animated-red",
      };
    }
    if (charging) {
      return {
        text: "Charging...",
        icon: "ri-flashlight-line animated-green",
      };
    }
    return { text: "", icon: "" };
  };

  useEffect(() => {
    if (!batteryData) return;

    const { charging } = batteryData;
    if (previousCharging !== charging) {
      if (charging) {
        showNotification("Charger Connected", "Battery is now charging");
      } else if (previousCharging !== null) {
        showNotification(
          "Charger Disconnected",
          "Battery is on power save mode"
        );
      }
      setPreviousCharging(charging);
    }

    if (batteryData.level >= 90 && charging) {
      showNotification(
        "Battery Full!",
        "Unplug the charger to save battery health."
      );
    }
  }, [batteryData, previousCharging]);

  const { text: statusText, icon: statusIcon } = getStatusInfo(
    batteryData.level,
    batteryData.charging
  );

  return {
    level: batteryData.level,
    charging: batteryData.charging,
    batteryColor: getBatteryColor(batteryData.level),
    statusText,
    statusIcon,
  };
};
