export const showNotification = (title, body) => {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }

    const showNotif = () => {
        const notification = new Notification(title, {
            body,
            icon: "/img/icon-192.png",
            badge: "/img/icon-192.png",
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Play notification sound
        const audio = new Audio("/audio/notification.mp3");
        audio.play().catch(error => {
            console.warn("Could not play notification sound:", error);
        });
    };

    if (Notification.permission === "granted") {
        showNotif();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showNotif();
            }
        });
    }
};

export const showToast = (type, message) => {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast ${type.toLowerCase()}`;
    toast.textContent = message;

    // Add to DOM
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove after animation
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};