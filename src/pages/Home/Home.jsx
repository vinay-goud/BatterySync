// batterysync-react/src/pages/Home/Home.jsx
import React, { useEffect, useRef } from 'react';
import Battery from '../../components/Battery/Battery';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
import { showNotification } from '../../utils/notifications';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import 'remixicon/fonts/remixicon.css';
import './Home.css';

const Home = () => {
    const { token, email } = useAuth();
    const { batteryData, error, loading, initializeBattery } = useBatteryStore();
    const initRef = useRef(false);

    // Initialize only once
    useEffect(() => {
        // Use a ref to prevent double initialization in strict mode
        if (initRef.current) return;
        
        if (!token || !email) {
            console.warn("Cannot initialize - missing token or email");
            return;
        }
        
        console.log("Home component first mount with auth:", { token, email });

        // Request notification permission
        if (Notification && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register("/service-worker.js")
                    .then(registration => {
                        console.log("ServiceWorker registered:", registration);
                    })
                    .catch(error => {
                        console.error("ServiceWorker registration failed:", error);
                    });
            });
        }

        const initialize = async () => {
            try {
                console.log("Initializing battery monitoring (first time)");
                await initializeBattery();
                
                // Connect WebSocket only once
                websocketService.connect(token, email);
                
                initRef.current = true;
                
                // Debug the battery store to make sure it's properly initialized
                setTimeout(() => {
                    const storeState = useBatteryStore.getState();
                    console.log("Battery store state after initialization:", storeState);
                }, 2000);
            } catch (err) {
                console.error("Error during initialization:", err);
            }
        };
        
        initialize();

        // Cleanup on unmount - using a closure to maintain reference
        const ws = websocketService;
        return () => {
            console.log("Home component unmounting, disconnecting WebSocket");
            ws.disconnect();
        };
    }, [token, email, initializeBattery]);

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

    // Show low battery notification
    useEffect(() => {
        if (batteryData && batteryData.level <= 20 && !batteryData.charging) {
            showNotification('Low Battery', 'Your battery is running low');
        }
    }, [batteryData]); // Include batteryData as a dependency

    // Show loading spinner while initializing
    if (loading) {
        return (
            <div className="home-container">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="home-container">
            <Battery />
        </div>
    );
};

export default React.memo(Home);