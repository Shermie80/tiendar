"use client";

import { useNotification } from "@/lib/NotificationContext";

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg transition-all duration-300 transform animate-slide-in border border-gray-200 border-x-2 text-gray-700 bg-white ${
            notification.type === "error"
              ? "border-l-red-400"
              : notification.type === "success"
              ? "border-l-green-400"
              : "border-l-blue-400"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-gray-500 hover:text-gray-400"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
