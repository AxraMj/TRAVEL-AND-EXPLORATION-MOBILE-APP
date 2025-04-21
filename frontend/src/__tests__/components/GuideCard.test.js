import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GuideCard from '../../components/guides/GuideCard';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('GuideCard Component', () => {
  const mockGuide = {
    _id: '1',
    title: 'Test Guide',
    description: 'Test Description',
    location: 'Test Location',
    author: {
      name: 'Test Author',
      avatar: 'https://example.com/avatar.jpg'
    },
    images: ['https://example.com/image.jpg'],
    likes: 10,
    comments: 5
  };

  it('renders guide information correctly', () => {
    const { getByText } = render(<GuideCard guide={mockGuide} />);
    
    expect(getByText('Test Guide')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('Test Location')).toBeTruthy();
    expect(getByText('Test Author')).toBeTruthy();
  });

  it('displays likes and comments count', () => {
    const { getByText } = render(<GuideCard guide={mockGuide} />);
    
    expect(getByText('10')).toBeTruthy(); // Likes count
    expect(getByText('5')).toBeTruthy(); // Comments count
  });
}); 