// batterysync-react/src/pages/Home/Home.jsx - UPDATED
import React, { useEffect, useState } from 'react';
import Battery from '../../components/Battery/Battery';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
// Remove these unused imports:
// import { batteryService } from '../../services/battery';
// import { getBatteryColor, getStatusInfo } from '../../utils/batteryHelpers';
import { showNotification } from '../../utils/notifications';
import 'remixicon/fonts/remixicon.css';
import './Home.css';

const Home = () => {
    const { token, email } = useAuth();
    const { batteryData, error, initializeBattery } = useBatteryStore();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Only initialize once
        if (initialized) return;
        
        console.log("Home component first mount with auth:", { token, email });

        // Request notification permission
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/service-worker.js")
                .then(registration => console.log("ServiceWorker registered:", registration))
                .catch(error => console.error("ServiceWorker registration failed:", error));
        }

        // Initialize battery monitoring
        if (token && email) {
            console.log("Initializing battery monitoring (first time)");
            initializeBattery();
            
            // Connect WebSocket only once
            websocketService.connect(token, email);
            
            // Debug the battery store to make sure it's properly initialized
            setTimeout(() => {
                const storeState = useBatteryStore.getState();
                console.log("Battery store state after initialization:", storeState);
            }, 2000);
            
            setInitialized(true);
        } else {
            console.warn("Cannot initialize battery - missing token or email");
        }

        // Cleanup on unmount
        return () => {
            console.log("Home component unmounting, disconnecting WebSocket");
            websocketService.disconnect();
        };
    }, [token, email, initializeBattery, initialized]);

    // Show error notifications only when error changes
    useEffect(() => {
        if (error) {
            console.error("Battery error:", error);
            // Don't show notifications for WebSocket errors to avoid spam
            if (!error.includes("WebSocket")) {
                showNotification("Error", error);
            }
        }
    }, [error]);

    // Show low battery notification if battery level is low
    useEffect(() => {
        if (batteryData && batteryData.level <= 20 && !batteryData.charging) {
            showNotification('Low Battery', 'Your battery is running low');
        }
    }, [batteryData]);

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
        <div className="home-container">
            <Battery />
        </div>
    );
};

export default Home;