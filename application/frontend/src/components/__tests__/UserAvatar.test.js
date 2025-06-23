import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAvatar from '../UserAvatar';

describe('UserAvatar', () => {
  const mockProps = {
    onSelect: jest.fn(),
    currentAvatar: 'http://example.com/avatars/avatar_1.png'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });
 
  test('renders avatar grid', async () => {
    render(<UserAvatar {...mockProps} />);
    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThan(0);
     
    const container = screen.getByTestId('avatar-grid');
    const rows = container.querySelectorAll('[data-testid="avatar-row"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('handles avatar selection', () => {
    render(<UserAvatar {...mockProps} />);
    const firstAvatar = screen.getAllByRole('img')[0];
    fireEvent.click(firstAvatar);
    expect(mockProps.onSelect).toHaveBeenCalled();
  });

  test('handles null onSelect prop', () => {
    const propsWithoutSelect = { ...mockProps, onSelect: undefined };
    render(<UserAvatar {...propsWithoutSelect} />);
    const firstAvatar = screen.getAllByRole('img')[0];
    fireEvent.click(firstAvatar);
    // Should not throw error
  });

  test('applies correct styling to selected avatar', () => {
    render(<UserAvatar {...mockProps} />);
    const selectedAvatar = screen.getAllByRole('img')[0];
    expect(selectedAvatar).toHaveStyle({
      border: mockProps.currentAvatar === selectedAvatar.src ? '2px solid #f2bac9' : '1px solid #bad7f5'
    });
  });

  test('handles avatar selection on click', () => {
    const mockOnSelect = jest.fn();
    render(<UserAvatar onSelect={mockOnSelect} currentAvatar={null} />);
    const avatars = screen.getAllByTestId('avatar-img');
    fireEvent.click(avatars[0]);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });
}); 