// batterysync-react/src/pages/Home/Home.jsx
import React, { useEffect } from 'react';
import Battery from '../../components/Battery/Battery';
import useAuth from '../../hooks/useAuth';
import { websocketService } from '../../services/websocket';
import useBatteryStore from '../../store/batteryStore';
import { showNotification } from '../../utils/notifications';
import './Home.css';

const Home = () => {
    const { token, email } = useAuth();
    const { error, initializeBattery } = useBatteryStore();

    useEffect(() => {
        // Debug logging
        console.log("Home component mounted with auth:", { token, email });

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
            console.log("Initializing battery monitoring");
            initializeBattery();
            
            // Debug the battery store to make sure it's properly initialized
            setTimeout(() => {
                const storeState = useBatteryStore.getState();
                console.log("Battery store state after initialization:", storeState);
            }, 2000);
            
            websocketService.connect(token, email);
        } else {
            console.warn("Cannot initialize battery - missing token or email");
        }

        // Show error notifications
        if (error) {
            console.error("Battery error:", error);
            showNotification("Error", error);
        }

        // Cleanup on unmount
        return () => {
            console.log("Home component unmounting, disconnecting WebSocket");
            websocketService.disconnect();
        };
    }, [token, email, error, initializeBattery]);

    return (
        <div className="home-container">
            <Battery />
        </div>
    );
};

export default Home;