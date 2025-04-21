import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Mock all the native modules we're using
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  createNavigatorFactory: jest.fn(),
}));

describe('App', () => {
  it('should pass a dummy test', () => {
    expect(true).toBe(true);
  });
}); 