// batterysync-react/src/components/Battery/Battery.jsx
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
import { batteryService } from '../../services/battery';
import { getBatteryColor, getStatusInfo } from '../../utils/batteryHelpers';
import { showNotification } from '../../utils/notifications';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import 'remixicon/fonts/remixicon.css';
import './Battery.css';

const Battery = () => {
    const { token, email } = useAuth();
    const { batteryData, loading } = useBatteryStore();
    const [displayLevel, setDisplayLevel] = useState(0);
    const [displayCharging, setDisplayCharging] = useState(false);
    const [animating, setAnimating] = useState(false);

    // Extract data from batteryData with safety checks
    const level = batteryData?.level ?? 0;
    const charging = batteryData?.charging ?? false;

    // Log battery data for debugging
    useEffect(() => {
        console.log("Battery component received data:", batteryData);
        
        // Animate the transition when level changes
        if (batteryData) {
            setAnimating(true);
            const timer = setTimeout(() => {
                setDisplayLevel(level);
                setDisplayCharging(charging);
                setAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [batteryData, level, charging]);

    // Get battery UI states
    const batteryColor = getBatteryColor(displayLevel);
    const { text: statusText, icon: statusIcon } = getStatusInfo(displayLevel, displayCharging);

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

    // Reconnect websocket if token and email exist
    const handleReconnect = () => {
        if (token && email) {
            websocketService.disconnect();
            setTimeout(() => {
                websocketService.connect(token, email);
            }, 1000);
        }
    };

    // Refresh battery data
    const handleRefresh = async () => {
        try {
            await batteryService.updateBatteryStatus();
        } catch (error) {
            console.error("Error refreshing battery:", error);
            showNotification("Error", "Failed to refresh battery status");
        }
    };

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
};

export default Battery;