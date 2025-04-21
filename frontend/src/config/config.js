// API Configuration
const IP_ADDRESS = '192.168.31.117'; // Your machine's IP address
const LOCALHOST = 'localhost'; // Use this for web browser testing
const PORT = '5000';

// Set this to false to use IP address instead of localhost
const USE_LOCALHOST = false;

// API Configuration
export const API_URL = USE_LOCALHOST 
  ? `http://${LOCALHOST}:${PORT}`
  : `http://${IP_ADDRESS}:${PORT}`;

// WebSocket Configuration
export const WS_URL = USE_LOCALHOST
  ? `ws://${LOCALHOST}:${PORT}`
  : `ws://${IP_ADDRESS}:${PORT}`;

// Debug logging
console.log('API URL:', API_URL);
console.log('WS URL:', WS_URL);

// Timeouts
export const API_TIMEOUT = 15000; // 15 seconds
export const WS_RECONNECT_DELAY = 5000; // 5 seconds

// Network Config
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 2000; 