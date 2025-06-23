import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudyRoomComponent from '../StudyRoomComponent';
import { useNavigate } from 'react-router-dom';
import { getAuthenticatedRequest } from '../../utils/authService';


jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../utils/authService', () => ({
  getAuthenticatedRequest: jest.fn(),
}));

jest.mock('../../pages/GroupStudyPage', () => () => <div>GroupStudyRoom Mock</div>);
jest.mock('../../assets/generate.PNG', () => 'generate.PNG');

describe('StudyRoomComponent', () => {
    const mockNavigate = jest.fn();
    const mockGetAuthenticatedRequest = getAuthenticatedRequest;

    beforeEach(() => {
        useNavigate.mockReturnValue(mockNavigate);
        mockNavigate.mockClear();
        mockGetAuthenticatedRequest.mockClear();
    });

    test('renders initial state correctly', () => {
        render(<StudyRoomComponent />);
        
        expect(screen.getByText('Study Room')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('I want to study...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Room Code...')).toBeInTheDocument();
        expect(screen.getByText('Create Room')).toBeInTheDocument();
        expect(screen.getByText('Join Room')).toBeInTheDocument();
        expect(screen.getByAltText('Generate Room')).toHaveAttribute('src', 'generate.PNG');
    });

    test('handles room name input change', () => {
        render(<StudyRoomComponent />);
        const roomNameInput = screen.getByPlaceholderText('I want to study...');
        
        fireEvent.change(roomNameInput, { target: { value: 'Math Study Session' } });
        expect(roomNameInput.value).toBe('Math Study Session');
    });

    test('successfully creates a room', async () => {
        const mockResponse = {
            roomCode: 'ABC123',
            roomList: ['user1', 'user2']
        };
        mockGetAuthenticatedRequest.mockResolvedValue(mockResponse);
        
        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('I want to study...'), {
            target: { value: 'Math Study Session' }
        });
        fireEvent.click(screen.getByText('Create Room'));
        
        await waitFor(() => {
            expect(mockGetAuthenticatedRequest).toHaveBeenCalledWith(
            '/create-room/',
            'POST',
            { sessionName: 'Math Study Session' }
            );
            expect(mockNavigate).toHaveBeenCalledWith(
            '/group-study/ABC123',
            {
                state: {
                roomCode: 'ABC123',
                roomName: 'Math Study Session',
                roomList: ['user1', 'user2']
                }
            }
            );
        });
    });

    test('handles create room error', async () => {
        mockGetAuthenticatedRequest.mockRejectedValue(new Error('Network error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('I want to study...'), {
            target: { value: 'Math Study Session' }
        });
        fireEvent.click(screen.getByText('Create Room'));
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error creating room: ', expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });

    test('handles room code input change', () => {
        render(<StudyRoomComponent />);
        const roomCodeInput = screen.getByPlaceholderText('Room Code...');
        
        fireEvent.change(roomCodeInput, { target: { value: 'XYZ789' } });
        expect(roomCodeInput.value).toBe('XYZ789');
    });

    test('successfully joins a room', async () => {
        const mockJoinResponse = { status: 200 };
        const mockDetailsResponse = {
            sessionName: 'Physics Study Group',
            roomList: ['user3', 'user4']
        };
        
        mockGetAuthenticatedRequest
            .mockResolvedValueOnce(mockJoinResponse)
            .mockResolvedValueOnce(mockDetailsResponse);
        
        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('Room Code...'), {
            target: { value: 'XYZ789' }
        });
        fireEvent.click(screen.getByText('Join Room'));
        
        await waitFor(() => {
            expect(mockGetAuthenticatedRequest).toHaveBeenNthCalledWith(
            1,
            '/join-room/',
            'POST',
            { roomCode: 'XYZ789' }
            );
            expect(mockGetAuthenticatedRequest).toHaveBeenNthCalledWith(
            2,
            '/get-room-details/?roomCode=XYZ789',
            'GET'
            );
            expect(mockNavigate).toHaveBeenCalledWith(
            '/group-study/XYZ789',
            {
                state: {
                roomCode: 'XYZ789',
                roomName: 'Physics Study Group',
                roomList: ['user3', 'user4']
                }
            });
        });
    });

    test('handles join room error', async () => {
        mockGetAuthenticatedRequest.mockRejectedValue(new Error('Invalid room code'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('Room Code...'), {
            target: { value: 'INVALID' }
        });
        fireEvent.click(screen.getByText('Join Room'));
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error joining room:', expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });

    test('successfully fetches room details and updates state', async () => {
        const mockJoinResponse = { status: 200 };
        const mockDetailsResponse = {
          sessionName: 'Math Study Group',
          roomList: ['user1', 'user2']
        };
        
        //mock API calls
        mockGetAuthenticatedRequest
          .mockResolvedValueOnce(mockJoinResponse)
          .mockResolvedValueOnce(mockDetailsResponse);
    
        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('Room Code...'), {
          target: { value: 'ABC123' }
        });
        fireEvent.click(screen.getByText('Join Room'));
    
        await waitFor(() => {
          //verify both API calls made
          expect(mockGetAuthenticatedRequest).toHaveBeenNthCalledWith(
            1,
            '/join-room/',
            'POST',
            { roomCode: 'ABC123' }
          );
          expect(mockGetAuthenticatedRequest).toHaveBeenNthCalledWith(
            2,
            '/get-room-details/?roomCode=ABC123',
            'GET'
          );
          
          expect(mockNavigate).toHaveBeenCalledWith(
            '/group-study/ABC123',
            {
              state: {
                roomCode: 'ABC123',
                roomName: 'Math Study Group',
                roomList: ['user1', 'user2']
              }
            }
          );
          
          expect(mockNavigate).toHaveBeenCalled();
        });
    });
    
    test('handles room details fetch error', async () => {
        const mockJoinResponse = { status: 200 };
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockGetAuthenticatedRequest
            .mockResolvedValueOnce(mockJoinResponse)
            .mockRejectedValueOnce(new Error('Failed to fetch room details'));

        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('Room Code...'), {
            target: { value: 'ABC123' }
        });
        fireEvent.click(screen.getByText('Join Room'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
            'Error joining room:', 
            expect.any(Error)
            );

            expect(mockNavigate).not.toHaveBeenCalled();
        });
        
        consoleSpy.mockRestore();
    });
    
    test('does not proceed if join response is not 200', async () => {
        const mockJoinResponse = { status: 400 };
        
        mockGetAuthenticatedRequest.mockResolvedValueOnce(mockJoinResponse);
        //second call should not have happened

        render(<StudyRoomComponent />);
        
        fireEvent.change(screen.getByPlaceholderText('Room Code...'), {
            target: { value: 'ABC123' }
        });
        fireEvent.click(screen.getByText('Join Room'));

        await waitFor(() => {
            expect(mockGetAuthenticatedRequest).toHaveBeenCalledTimes(1);
            expect(mockGetAuthenticatedRequest).not.toHaveBeenCalledWith(
            '/get-room-details/?roomCode=ABC123',
            'GET'
            );
            
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

});