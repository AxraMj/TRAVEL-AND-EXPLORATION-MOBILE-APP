// Import test environment setup
require('@testing-library/jest-dom');

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:5000';
process.env.NODE_ENV = 'test';

// Mock react-native modules that might be required
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn(obj => obj.default)
  },
  StyleSheet: {
    create: jest.fn()
  }
}));

// Setup global test timeouts
jest.setTimeout(10000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 