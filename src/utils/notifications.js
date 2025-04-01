// batterysync-react/src/utils/notifications.js - URGENT FIX
let lastNotificationTime = 0;
const MIN_NOTIFICATION_INTERVAL = 60000; // 1 minute minimum interval

export const showNotification = (title, body) => {
  // Prevent notification spam - only show notifications once per minute
  const now = Date.now();
  if (now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
    console.log("Skipping notification due to rate limiting:", { title, body });
    return;
  }

  lastNotificationTime = now;

  // Check if notifications are supported and permission is granted
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return;
  }

  if (Notification.permission === "granted") {
    try {
      // Create and show notification
      const notification = new Notification(title, {
        body: body,
        icon: "/img/icon-192.png",
        silent: false, // Set to true to disable sound
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
    return;
  }

  // Request permission if not yet granted
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showNotification(title, body);
      }
    });
  }
};
