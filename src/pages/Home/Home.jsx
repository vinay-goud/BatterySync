import React, { useEffect } from 'react';
import Battery from '../../components/Battery/Battery';
import useBatteryStore from '../../store/batteryStore';
import { showNotification } from '../../utils/notifications';
import './Home.css';

const Home = () => {
    const { error } = useBatteryStore();

    useEffect(() => {
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

        // Show error notifications
        if (error) {
            showNotification("Error", error);
        }
    }, [error]);

    return (
        <div className="home-container">
            <Battery />
        </div>
    );
};

export default Home;