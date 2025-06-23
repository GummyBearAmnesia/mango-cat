import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FloatingMusicPlayer from '../components/FloatingWindow';
import MusicButton from '../components/MusicButton';

// Mock the MusicButton component since we want to test FloatingMusicPlayer in isolation
jest.mock('../components/MusicButton', () => {
  return function MockMusicButton() {
    return <div data-testid="mock-music-button">Mock Music Button</div>;
  };
});

describe('FloatingMusicPlayer', () => {
  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <FloatingMusicPlayer isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders correctly when isOpen is true', () => {
    render(<FloatingMusicPlayer isOpen={true} onClose={mockOnClose} />);
    
    // Check for main elements
    expect(screen.getByText('Free Tracks:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument();
    expect(screen.getByTestId('mock-music-button')).toBeInTheDocument();
    
    // Check styles
    const window = screen.getByText('Free Tracks:').closest('.floating-window');
    expect(window).toHaveStyle({
      position: 'fixed',
      top: '10%',
      left: '10%',
      backgroundColor: '#fff',
    });
  });

  test('calls onClose when close button is clicked', () => {
    render(<FloatingMusicPlayer isOpen={true} onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button', { name: 'X' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('has draggable functionality', () => {
    render(<FloatingMusicPlayer isOpen={true} onClose={mockOnClose} />);
    
    // The handle should be present
    const handle = screen.getByText('Free Tracks:').closest('.handle');
    expect(handle).toBeInTheDocument();
    
    // The window should have cursor: move style
    const window = handle.closest('.floating-window');
    expect(window).toHaveStyle('cursor: move');
  });

  test('renders MusicButton component', () => {
    render(<FloatingMusicPlayer isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('mock-music-button')).toBeInTheDocument();
  });
});