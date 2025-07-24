import React, { useState, useEffect } from "react";
import {
  FiCheck,
  FiX,
  FiInfo,
  FiAlertTriangle,
  FiAlertCircle,
} from "react-icons/fi";
import "./NotificationSystem.css";

const NOTIFICATION_TYPES = {
  success: { icon: FiCheck, color: "var(--green)" },
  error: { icon: FiAlertCircle, color: "var(--red)" },
  warning: { icon: FiAlertTriangle, color: "var(--yellow)" },
  info: { icon: FiInfo, color: "var(--blue)" },
};

let notificationId = 0;

class NotificationManager {
  constructor() {
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(notification) {
    this.listeners.forEach((listener) => listener(notification));
  }

  success(message, options = {}) {
    this.emit({
      id: ++notificationId,
      type: "success",
      message,
      duration: options.duration || 5000,
      ...options,
    });
  }

  error(message, options = {}) {
    this.emit({
      id: ++notificationId,
      type: "error",
      message,
      duration: options.duration || 7000,
      ...options,
    });
  }

  warning(message, options = {}) {
    this.emit({
      id: ++notificationId,
      type: "warning",
      message,
      duration: options.duration || 6000,
      ...options,
    });
  }

  info(message, options = {}) {
    this.emit({
      id: ++notificationId,
      type: "info",
      message,
      duration: options.duration || 5000,
      ...options,
    });
  }
}

export const notificationManager = new NotificationManager();

const Notification = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const { icon: Icon, color } = NOTIFICATION_TYPES[notification.type];

  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  return (
    <div
      className={`notification notification-${notification.type} ${
        isExiting ? "exiting" : ""
      }`}
      style={{ "--notification-color": color }}
    >
      <div className="notification-icon">
        <Icon size={20} />
      </div>

      <div className="notification-content">
        {notification.title && (
          <div className="notification-title">{notification.title}</div>
        )}
        <div className="notification-message">{notification.message}</div>
      </div>

      <button
        className="notification-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

// Hook for easy use in components
export const useNotifications = () => {
  return {
    success: notificationManager.success.bind(notificationManager),
    error: notificationManager.error.bind(notificationManager),
    warning: notificationManager.warning.bind(notificationManager),
    info: notificationManager.info.bind(notificationManager),
  };
};
