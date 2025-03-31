export const getBatteryColor = (level) => {
  if (!level && level !== 0) return "gradient-color-red";
  if (level <= 20) return "gradient-color-red";
  if (level <= 40) return "gradient-color-orange";
  if (level <= 80) return "gradient-color-yellow";
  return "gradient-color-green";
};

export const getStatusInfo = (level, charging) => {
  if (!level && level !== 0) {
    return {
      text: "Connecting...",
      icon: "ri-loader-4-line animated-spin",
    };
  }

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
