import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { retryWithBackoff, withTimeout, checkNetworkStatus } from "../../utils/errorHandler";
import { API_URL, API_TIMEOUT } from "../../config/config";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Check network status first
      const { isConnected, error } = await checkNetworkStatus();
      if (!isConnected) {
        throw new Error(error || 'No internet connection. Please check your network and try again.');
      }

      // Add token to request
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please try again later.');
      }
      throw error;
    }

    // Handle token expiration
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem("token");
      } catch (err) {
        // Suppress console error
      }
    }

    return Promise.reject(error);
  }
);

// Wrapper function for API calls with timeout and retry
const withApiTimeout = async (apiCall, timeout = API_TIMEOUT) => {
  try {
    // Check network status before making the call
    const { isConnected, error } = await checkNetworkStatus();
    if (!isConnected) {
      throw new Error(error || 'No internet connection. Please check your network and try again.');
    }

    return await withTimeout(apiCall(), timeout);
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
};

export { withApiTimeout };
export default api;
