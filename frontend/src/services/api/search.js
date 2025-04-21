import api from './config';

export const searchAPI = {
  searchAll: async (query) => {
    try {
      const response = await api.get(`/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  searchUsers: async (query) => {
    try {
      const response = await api.get(`/search/users?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  searchLocations: async (query) => {
    try {
      const response = await api.get(`/search/locations?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 