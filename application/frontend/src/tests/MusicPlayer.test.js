import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MusicPlayer from '../components/MusicPlayer';

// Mock the fetch API
global.fetch = jest.fn();

// Mock MUI components
jest.mock('@mui/material', () => ({
  Grid2: ({ children }) => <div>{children}</div>,
  Typography: ({ children }) => <div>{children}</div>,
  Card: ({ children }) => <div>{children}</div>,
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  LinearProgress: () => <div role="progressbar" />
}));

// Mock MUI icons
jest.mock('@mui/icons-material/PlayArrow', () => () => <div>PlayArrowIcon</div>);
jest.mock('@mui/icons-material/Pause', () => () => <div>PauseIcon</div>);
jest.mock('@mui/icons-material/SkipNext', () => () => <div>SkipNextIcon</div>);

describe('MusicPlayer Component', () => {
  const mockProps = {
    title: 'Test Song',
    artist: 'Test Artist',
    image_url: 'test-image.jpg',
    is_playing: true,
    time: 30,
    duration: 180
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders correctly with props', () => {
    render(<MusicPlayer {...mockProps} />);
    
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image.jpg');
  });

  it('calls playSong when play button is clicked', () => {
    render(<MusicPlayer {...mockProps} is_playing={false} />);
    fireEvent.click(screen.getByText('PlayArrowIcon'));
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/play',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }
    );
  });

  it('calls pauseSong when pause button is clicked', () => {
    render(<MusicPlayer {...mockProps} is_playing={true} />);
    fireEvent.click(screen.getByText('PauseIcon'));
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/pause',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }
    );
  });

  it('calls skipSong when skip button is clicked', () => {
    render(<MusicPlayer {...mockProps} />);
    fireEvent.click(screen.getByText('SkipNextIcon'));
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/skip',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }
    );
  });
});