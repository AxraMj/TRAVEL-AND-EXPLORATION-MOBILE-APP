import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

jest.mock('expo-font');
jest.mock('expo-asset');

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
}); 