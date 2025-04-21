import api from './config';

export const guidesAPI = {
  createGuide: async (guideData) => {
    try {
      const response = await api.post('/guides', guideData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllGuides: async () => {
    try {
      const response = await api.get('/guides');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserGuides: async (userId) => {
    try {
      const response = await api.get(`/guides/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  likeGuide: async (guideId) => {
    try {
      const response = await api.post(`/guides/${guideId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  dislikeGuide: async (guideId) => {
    try {
      const response = await api.post(`/guides/${guideId}/dislike`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteGuide: async (guideId) => {
    try {
      const response = await api.delete(`/guides/${guideId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 