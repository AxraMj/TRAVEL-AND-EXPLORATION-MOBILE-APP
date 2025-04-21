import api from './config';

export const notificationsAPI = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 