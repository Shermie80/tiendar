"use client";

import { useNotification } from "@/lib/NotificationContext";

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg transition-all duration-300 transform animate-slide-in ${
            notification.type === "error"
              ? "bg-red-500 text-white"
              : notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
