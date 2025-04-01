// batterysync-react/src/components/Battery/Battery.jsx
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
import { batteryService } from '../../services/battery';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import 'remixicon/fonts/remixicon.css';
import './Battery.css';

// Direct import of helper functions to avoid any import issues
const getBatteryColor = (level) => {
  if (level === null || level === undefined) return "gradient-color-red";
  if (level <= 20) return "gradient-color-red";
  if (level <= 40) return "gradient-color-orange";
  if (level <= 80) return "gradient-color-yellow";
  return "gradient-color-green";
};

const getStatusInfo = (level, charging) => {
  try {
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
        icon: "ri-battery-low-line" 
      };
    }
  } catch (err) {
    console.error("Error in getStatusInfo:", err);
    return {
      text: "Battery status",
      icon: "ri-battery-line"
    };
  }
};

const Battery = () => {
    const { token, email } = useAuth();
    const { batteryData, loading } = useBatteryStore();
    const [displayLevel, setDisplayLevel] = useState(0);
    const [displayCharging, setDisplayCharging] = useState(false);
    const [animating, setAnimating] = useState(false);

    // Safely extract data with fallbacks
    let level = 0;
    let charging = false;
    
    try {
        level = batteryData?.level ?? 0;
        charging = batteryData?.charging ?? false;
    } catch (err) {
        console.error("Error extracting battery data:", err);
    }

    // Log battery data for debugging
    useEffect(() => {
        console.log("Battery component received data:", batteryData);
        
        try {
            // Safely update display values
            if (batteryData) {
                // Derive values inside the effect from batteryData
                const currentLevel = batteryData?.level ?? 0;
                const currentCharging = batteryData?.charging ?? false;
                
                setAnimating(true);
                const timer = setTimeout(() => {
                    setDisplayLevel(currentLevel);
                    setDisplayCharging(currentCharging);
                    setAnimating(false);
                }, 300);
                return () => clearTimeout(timer);
            }
        } catch (err) {
            console.error("Error in battery display update:", err);
        }
    }, [batteryData]);  // Only batteryData is needed
    
    // Get battery UI states safely
    let batteryColor = "gradient-color-red";
    let statusText = "Battery status";
    let statusIcon = "ri-battery-line";
    
    try {
        batteryColor = getBatteryColor(displayLevel);
        const statusInfo = getStatusInfo(displayLevel, displayCharging);
        statusText = statusInfo.text || "Battery status";
        statusIcon = statusInfo.icon || "ri-battery-line";
    } catch (err) {
        console.error("Error getting battery UI states:", err);
    }

    // Render loading state if no battery data or while loading
    if (loading || !batteryData) {
        return (
            <section className="battery">
                <div className="battery__card">
                    <div className="battery__data">
                        <p className="battery__text">Connecting...</p>
                        <h1 className="battery__percentage">--</h1>
                        <LoadingSpinner size="small" />
                    </div>
                </div>
            </section>
        );
    }

    // Safe handler functions
    const handleReconnect = () => {
        try {
            if (token && email) {
                websocketService.disconnect();
                setTimeout(() => {
                    websocketService.connect(token, email);
                }, 1000);
            }
        } catch (err) {
            console.error("Error reconnecting WebSocket:", err);
        }
    };

    const handleRefresh = async () => {
        try {
            await batteryService.updateBatteryStatus();
        } catch (err) {
            console.error("Error refreshing battery:", err);
        }
    };

    // Safe render method
    try {
        return (
            <section className="battery">
                <div className="battery__card">
                    <div className="battery__data">
                        <p className="battery__text">Battery</p>
                        <h1 className="battery__percentage">
                            {displayLevel}%
                        </h1>
                        <p className="battery__status">
                            {statusText} {statusIcon && (
                                <i className={statusIcon}></i>
                            )}
                        </p>
                        <div className="battery__actions">
                            <button 
                                className="battery__action-btn" 
                                onClick={handleReconnect}
                                title="Reconnect WebSocket"
                            >
                                <i className="ri-refresh-line"></i>
                            </button>
                            <button 
                                className="battery__action-btn" 
                                onClick={handleRefresh}
                                title="Refresh Battery Data"
                            >
                                <i className="ri-battery-charge-line"></i>
                            </button>
                        </div>
                    </div>
                    <div className="battery__pill">
                        <div className="battery__level">
                            <div 
                                className={`battery__liquid ${batteryColor} ${animating ? 'animating' : ''}`} 
                                style={{ height: `${displayLevel}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    } catch (err) {
        console.error("Error rendering Battery component:", err);
        
        // Fallback render in case of any error
        return (
            <section className="battery">
                <div className="battery__card">
                    <div className="battery__data">
                        <p className="battery__text">Battery Status</p>
                        <h1 className="battery__percentage">
                            {level}%
                        </h1>
                        <p className="battery__status">
                            {charging ? "Charging" : "Not charging"}
                        </p>
                        <button 
                            className="battery__action-btn"
                            onClick={() => window.location.reload()}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </section>
        );
    }
};

export default Battery;