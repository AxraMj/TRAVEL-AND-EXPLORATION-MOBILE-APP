import api from './config';

export const postsAPI = {
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllPosts: async () => {
    try {
      const response = await api.get('/posts');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserPosts: async (userId) => {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  savePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/save`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, commentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getFollowedPosts: async () => {
    try {
      const response = await api.get('/posts/following');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSavedPosts: async () => {
    try {
      const response = await api.get('/posts/saved');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 