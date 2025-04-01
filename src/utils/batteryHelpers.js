// batterysync-react/src/utils/batteryHelpers.js
export const getBatteryColor = (level) => {
  if (level === null || level === undefined) return "gradient-color-red";
  if (level <= 20) return "gradient-color-red";
  if (level <= 40) return "gradient-color-orange";
  if (level <= 80) return "gradient-color-yellow";
  return "gradient-color-green";
};

export const getStatusInfo = (level, charging) => {
  // Handle null/undefined battery level
  if (level === null || level === undefined) {
    return {
      text: "Connecting...",
      icon: "ri-loader-4-line animated-spin",
    };
  }

  // Handle critical battery level
  if (level <= 10) {
    return {
      text: "Critical battery",
      icon: charging
        ? "ri-flashlight-line animated-green"
        : "ri-battery-low-line animated-red",
    };
  }

  // Handle low battery level
  if (level <= 20) {
    return {
      text: "Low battery",
      icon: charging
        ? "ri-flashlight-line animated-green"
        : "ri-battery-low-line animated-red",
    };
  }

  // Handle full battery
  if (level >= 100) {
    return {
      text: "Full battery",
      icon: "ri-battery-2-fill green-color",
    };
  }

  // Handle charging states
  if (charging) {
    return {
      text: "Charging...",
      icon: "ri-flashlight-line animated-green",
    };
  }

  // Default state based on battery level
  if (level > 80) {
    return {
      text: "Good battery",
      icon: "ri-battery-2-line green-color",
    };
  } else if (level > 40) {
    return {
      text: "Medium battery",
      icon: "ri-battery-line",
    };
  } else {
    return {
      text: "Low battery",
      icon: "ri-battery-low-line",
    };
  }
};
