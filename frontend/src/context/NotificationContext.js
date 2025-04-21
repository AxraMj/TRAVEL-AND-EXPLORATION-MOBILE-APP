import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api/notifications';
import { API_URL } from '../config/config';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      // Silent error handling
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
    } catch (error) {
      // Silent error handling
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Silent error handling
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();

      // Set up WebSocket connection
      const wsUrl = `ws://${API_URL.replace(/^https?:\/\//, '')}/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);
          
          if (eventType === 'notification') {
            setUnreadCount(prev => prev + 1);
          }
        } catch (error) {
          // Silent error handling
        }
      };

      ws.onerror = (error) => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (user && token) {
            ws.close();
            // The next useEffect run will establish a new connection
          }
        }, 5000);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [user, token]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      wsConnected,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 