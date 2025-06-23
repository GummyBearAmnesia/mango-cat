import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import SpotifyButton from '../components/SpotifyButton';

// Mock the MusicPlayer component
jest.mock('../components/MusicPlayer', () => {
  return function MockMusicPlayer(props) {
    return (
      <div data-testid="music-player">
        {props.title && <div>{props.title}</div>}
        {props.artist && <div>{props.artist}</div>}
        {props.image_url && <img alt="album cover" src={props.image_url} />}
      </div>
    );
  };
});

describe('SpotifyButton Component', () => {
  let originalFetch;
  let mockFetch;

  beforeEach(() => {
    
    originalFetch = global.fetch;
    
    
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders without crashing', async () => {
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: true }),
    });

    await act(async () => {
      render(<SpotifyButton />);
    });
    
    expect(screen.getByTestId('music-player')).toBeInTheDocument();
  });

  describe('Authentication', () => {
    it('checks authentication status on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: false }),
      });

      await act(async () => {
        render(<SpotifyButton />);
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/is-authenticated',
          { credentials: 'include' }
        );
      });
    });

    it('redirects to Spotify auth when not authenticated', async () => {
      const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => {});
      
      // First call: is-authenticated
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: false }),
      });
      
      // Second call: get-auth-url
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://spotify-auth.example.com' }),
      });

      await act(async () => {
        render(<SpotifyButton />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/get-auth-url',
          { credentials: 'include' }
        );
        expect(mockWindowOpen).toHaveBeenCalledWith('https://spotify-auth.example.com');
      });

      mockWindowOpen.mockRestore();
    });

    it('does not redirect when already authenticated', async () => {
      const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: true }),
      });

      await act(async () => {
        render(<SpotifyButton />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockWindowOpen).not.toHaveBeenCalled();
      });

      mockWindowOpen.mockRestore();
    });

    it('does not redirect when authorization code is present in URL', async () => {
      window.history.pushState({}, '', '/?code=test-code');
      const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: false }),
      });

      await act(async () => {
        render(<SpotifyButton />);
      });

      expect(mockWindowOpen).not.toHaveBeenCalled();
      mockWindowOpen.mockRestore();
    });

    it('does not make API call when already authenticated in state', async () => {
        // Mock the initial fetch call that happens in componentDidMount
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: true }),
        });
    
        const ref = React.createRef();
        
        await act(async () => {
          render(<SpotifyButton ref={ref} />);
        });
    
        // Verify initial authentication check happened
        expect(mockFetch).toHaveBeenCalledTimes(1);
    
        mockFetch.mockClear();
    
        await act(async () => {
          ref.current.setState({ spotifyAuthenticated: true });
        });
    
        // Manually trigger authentication
        await act(async () => {
          ref.current.authenticateSpotify();
        });
    
        // Verify no additional API calls were made
        expect(mockFetch).not.toHaveBeenCalled();
      });
  });

  describe('Current Song Updates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: true }),
      });
    });

    it('polls for current song every second', async () => {
      // Mock current-playing response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          title: 'Test Song',
          artist: 'Test Artist',
          image_url: 'test-image.jpg',
          is_playing: true,
          time: 1000,
          duration: 3000
        }),
      });

      await act(async () => {
        render(<SpotifyButton />);
      });

      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/is-authenticated',
        { credentials: 'include' }
      );

      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/current-playing',
          { credentials: 'include' }
        );
      });

      // Should show the song info in the MusicPlayer
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByAltText('album cover')).toHaveAttribute('src', 'test-image.jpg');
    });

    it('handles empty response when no song is playing', async () => {
      // Mock current-playing response
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await act(async () => {
        render(<SpotifyButton />);
      });

    
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // MusicPlayer should render without song data
      expect(screen.getByTestId('music-player')).toBeInTheDocument();
    });
  });

  it('clears interval on unmount', async () => {

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: true }),
    });

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<SpotifyButton />);
    
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});