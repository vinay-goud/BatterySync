import React, { useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
import { batteryService } from '../../services/battery';
import { getBatteryColor, getStatusInfo } from '../../utils/batteryHelpers';
import { showNotification } from '../../utils/notifications';
import 'remixicon/fonts/remixicon.css';
import './Battery.css';

const Battery = () => {
    const { token, email } = useAuth();
    const { batteryData } = useBatteryStore();
    const { level = 0, charging = false } = batteryData;

    // Get battery UI states
    const batteryColor = getBatteryColor(level);
    const { text: statusText, icon: statusIcon } = getStatusInfo(level, charging);

    useEffect(() => {
        let cleanupBattery;

        const initBattery = async () => {
            try {
                if (!token || !email) return;

                // Initialize battery monitoring
                cleanupBattery = await batteryService.initialize();
                
                // Connect WebSocket
                websocketService.connect(token, email);

                // Show initial battery status
                if (level <= 20) {
                    showNotification('Low Battery', 'Your battery is running low');
                }
            } catch (error) {
                console.error('Battery initialization failed:', error);
                showNotification('Error', 'Failed to initialize battery monitoring');
            }
        };

        initBattery();

        // Cleanup function
        return () => {
            if (cleanupBattery) cleanupBattery();
            websocketService.disconnect();
        };
    }, [token, email, level]);

    // Render loading state if no battery data
    if (!batteryData) {
        return (
            <section className="battery">
                <div className="battery__card">
                    <div className="battery__data">
                        <p className="battery__text">Connecting...</p>
                        <h1 className="battery__percentage">--</h1>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="battery">
            <div className="battery__card">
                <div className="battery__data">
                    <p className="battery__text">Battery</p>
                    <h1 className="battery__percentage">{level}%</h1>
                    <p className="battery__status">
                        {statusText} {statusIcon && <i className={statusIcon}></i>}
                    </p>
                </div>
                <div className="battery__pill">
                    <div className="battery__level">
                        <div 
                            className={`battery__liquid ${batteryColor}`} 
                            style={{ height: `${level}%` }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Battery;