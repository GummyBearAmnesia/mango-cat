import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import StudyParticipants from '../StudyParticipants';
import { getAuthenticatedRequest } from '../../utils/authService';
import { ref, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';

//mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../utils/authService');
jest.mock('firebase/storage');
jest.mock('../../firebase-config.js');

jest.mock('../../assets/avatars/avatar_2.png', () => 'mock-default-avatar.png');

jest.mock('react-toastify', () => {
  const actual = jest.requireActual('react-toastify');
  return {
    ...actual,
    toast: {
      error: jest.fn(),
      success: jest.fn(),
      dismiss: jest.fn(),
      clearWaitingQueue: jest.fn(),
    },
  };
});

describe('StudyParticipants', () => {
  let consoleSpy;
  let mockSocket;
  const mockParticipants = [
    { username: 'user1', imageUrl: 'http://example.com/avatar1.jpg' },
    { username: 'user2', imageUrl: 'http://example.com/avatar2.jpg' }
  ];

  beforeEach(() => {
    mockSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getAuthenticatedRequest
      .mockResolvedValueOnce({ username: 'testuser' })
      .mockResolvedValueOnce({ participantsList: mockParticipants.map(p => ({ username: p.username })) });

    getDownloadURL
      .mockResolvedValueOnce('http://example.com/avatar1.jpg')
      .mockResolvedValueOnce('http://example.com/avatar2.jpg');
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  test('renders participants with avatars', async () => {
    render(
      <StudyParticipants 
        socket={mockSocket}
        roomCode="TEST123" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      
      const avatars = screen.getAllByAltText(/profile$/);
      expect(avatars).toHaveLength(2);
      expect(avatars[0]).toHaveAttribute('src', 'http://example.com/avatar1.jpg');
      expect(avatars[1]).toHaveAttribute('src', 'http://example.com/avatar2.jpg');
    });
  });

  test('handles WebSocket participant updates', async () => {
    getAuthenticatedRequest
      .mockResolvedValueOnce({ username: 'testuser' })
      .mockResolvedValueOnce({ participantsList: [] });
  
    getDownloadURL
      .mockResolvedValueOnce('https://example.com/avatar3.png')
      .mockResolvedValueOnce('https://example.com/avatar4.png');
  
    render(<StudyParticipants socket={mockSocket} roomCode="TEST123" />);
  
    await waitFor(() => {
      expect(screen.getByText('No participants in this room')).toBeInTheDocument();
    });

    const messageHandler = mockSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1];
  
    act(() => {
      messageHandler({
        data: JSON.stringify({
          type: 'participants_update',
          participants: ['user3', 'user4'] 
        })
      });
    });
  
    await waitFor(() => {
      expect(screen.getByText('user3')).toBeInTheDocument();
      expect(screen.getByText('user4')).toBeInTheDocument();
      
      const avatars = screen.getAllByAltText(/profile$/);
      expect(avatars).toHaveLength(2);
      expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar3.png');
      expect(avatars[1]).toHaveAttribute('src', 'https://example.com/avatar4.png');
    });
  });

  test('handles participant data fetch failure', async () => {
    jest.clearAllMocks();

    getAuthenticatedRequest
      .mockResolvedValueOnce({ username: 'testuser' })
      .mockRejectedValueOnce(new Error('Failed to fetch participants'));
  
    render(<StudyParticipants socket={mockSocket} roomCode="TEST123" />);
  
    await waitFor(() => {
      expect(screen.getByText('No participants in this room')).toBeInTheDocument();
    });
  });

  test('logs WebSocket errors to console', async () => {
    jest.clearAllMocks();
    const mockError = new Error('WebSocket connection failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockSocketWithError = {
      addEventListener: jest.fn((event, handler) => {
        if (event === 'message') {
          setTimeout(() => {
            try {
              handler({ data: 'invalid json' });
            } catch (error) {
              
            }
          }, 10);
        }
      }),
      removeEventListener: jest.fn()
    };
  
    render(
      <StudyParticipants 
        socket={mockSocketWithError} 
        roomCode="TEST123" 
      />
    );
  
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket message handling error:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test('handles malformed participant data', async () => {
    getAuthenticatedRequest.mockResolvedValueOnce({
      invalidField: 'bad data'
    });
  
    render(<StudyParticipants />);
  
    await waitFor(() => {
      expect(screen.queryByTestId('participant-item')).not.toBeInTheDocument();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
  
});


describe('StudyParticipants - Avatar Error Handling', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  });

  test('renders default avatar when image fetch fails', async () => {
    const testUsername = 'avatar_test_user';

    getAuthenticatedRequest
      .mockResolvedValueOnce({ username: 'current_user' })
      .mockResolvedValueOnce({ 
        participantsList: [{ username: testUsername }] 
      });

    getDownloadURL.mockRejectedValue(new Error('Image not found'));

    render(
      <StudyParticipants 
        socket={mockSocket} 
        roomCode="TEST123" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(testUsername)).toBeInTheDocument();

      const avatar = screen.getByAltText(`${testUsername}'s profile`);
      expect(avatar).toHaveAttribute('src', 'mock-default-avatar.png');
    }, { timeout: 3000 });
  });
});

describe('fetchParticipants Error Handling', () => {
    let consoleErrorSpy;
    let mockSocket;
    const mockParticipants = [
        { username: 'user3', imageUrl: 'https://example.com/avatar3.png' },
        { username: 'user4', imageUrl: 'https://example.com/avatar4.png' }
      ];
  
    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      useParams.mockReturnValue({ roomCode: 'TEST123' });
      mockSocket = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    test('logs error when participant fetch fails', async () => {
      const mockError = new Error('Network error');

      getAuthenticatedRequest
        .mockResolvedValueOnce({ username: 'testuser' })
        .mockRejectedValueOnce(mockError);
  
      render(
        <StudyParticipants 
          socket={mockSocket} 
          roomCode="TEST123" 
        />
      );
  
      await waitFor(() => {
        const participantErrorCall = consoleErrorSpy.mock.calls.find(
          call => call[0] === 'Error fetching participants:'
        );
        
        expect(participantErrorCall).toBeDefined();
        expect(participantErrorCall[1]).toEqual(mockError);
      });
  
      expect(screen.getByText('No participants in this room')).toBeInTheDocument();
    });
  
    test('handles empty participants list', async () => {
      getAuthenticatedRequest.mockResolvedValueOnce({ participantsList: [] });
  
      render(<StudyParticipants />);
  
      await waitFor(() => {
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

});

describe('StudyParticipants - User Data Fetch Error Handling', () => {
  let consoleErrorSpy;
  let mockSocket;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('logs error and returns "Anonymous" when user data fetch fails', async () => {
    const mockError = new Error('Network error');
    
    getAuthenticatedRequest
      .mockRejectedValueOnce(mockError);

    render(
      <StudyParticipants 
        socket={mockSocket} 
        roomCode="TEST123" 
      />
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user data',
        mockError
      );
    });

  });
});

describe('StudyParticipants - fetchParticipantData Error Handling', () => {
  let consoleErrorSpy;
  let mockSocket;
  const testUsername = 'error_test_user';

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    jest.clearAllMocks();

    getAuthenticatedRequest
      .mockResolvedValueOnce({ username: 'testuser' })
      .mockResolvedValueOnce({ participantsList: [{ username: testUsername }] });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('logs error when avatar fetch throws an error', async () => {
    const mockError = new Error('Image not found');
    getDownloadURL.mockImplementation(() => {
      throw mockError;
    });

    render(<StudyParticipants socket={mockSocket} roomCode="TEST123" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching participant image:',
        mockError
      );
    });
  });
});
