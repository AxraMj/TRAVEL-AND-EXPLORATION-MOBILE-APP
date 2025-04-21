import api, { withApiTimeout } from './config';
import { checkNetworkStatus } from '../../utils/errorHandler';
import { API_TIMEOUT } from '../../config/config';
import { retryWithBackoff } from '../../utils/retryWithBackoff';

export const authAPI = {
  register: async (userData) => {
    try {
      // Check network status first
      const { isConnected, error } = await checkNetworkStatus();
      if (!isConnected) {
        throw new Error(error || 'No internet connection. Please check your network and try again.');
      }

      const response = await withApiTimeout(
        () => api.post('/auth/register', userData),
        API_TIMEOUT
      );
      
      return response.data;
    } catch (error) {
      if (!error.response) {
        if (error.message.includes('timeout')) {
          throw new Error('Registration request timed out. Please try again.');
        }
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (error.response?.status === 409) {
        // Check specific error message to differentiate between email and username conflicts
        const errorMessage = error.response.data?.message || '';
        if (errorMessage.includes('Username')) {
          throw new Error('This username is already taken. Please choose another username.');
        } else {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
      }

      throw error;
    }
  },

  login: async (credentials) => {
    try {
      // Check network status first
      const { isConnected, error } = await checkNetworkStatus();
      if (!isConnected) {
        throw new Error('Network error');
      }

      // Make the API call with timeout and retry
      const response = await retryWithBackoff(
        async () => {
          const result = await withApiTimeout(
            () => api.post('/auth/login', credentials),
            API_TIMEOUT
          );
          
          if (!result.data || !result.data.token || !result.data.user) {
            throw new Error('Authentication failed');
          }
          
          return result;
        },
        2 // Max 2 retries
      );
      
      return response.data;
    } catch (error) {
      // For login failures, transform the error into a user-friendly format
      if (error.response && error.response.status === 401) {
        throw new Error('Invalid credentials');
      }
      
      // Handle network errors
      if (!error.response) {
        throw new Error('Network error');
      }

      // Handle other server errors
      throw error;
    }
  },

  // Verify token validity
  verifyToken: async (token) => {
    try {
      const response = await withApiTimeout(
        () => api.post('/auth/verify', { token }),
        5000
      );
      return response.data;
    } catch (error) {
      throw new Error('Session expired. Please log in again.');
    }
  },

  verifyEmail: async (email) => {
    try {
      const response = await api.post('/auth/verify-email', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { email, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};