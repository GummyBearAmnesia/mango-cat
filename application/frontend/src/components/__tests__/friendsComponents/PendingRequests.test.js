import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendsContext } from "../../friends/FriendsContext";
import { getDownloadURL, uploadBytes } from 'firebase/storage';
import PendingFriends from '../../friends/PendingRequests';

jest.mock('../../../utils/authService', () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('firebase/storage');
jest.mock('../../../firebase-config.js');
jest.mock('react-toastify', () => {
    const actual = jest.requireActual('react-toastify');
    return { 
        ...actual,
        toast: {
            error: jest.fn(),
            success: jest.fn(),
        },
    };
});
 
const mockRequestData = [
    { id: 1, name: "Name1", surname: "Surname1", username: "@username1" },
    { id: 2, name: "Name2", surname: "Surname2", username: "@username2" },
];

describe("PendingRequests", () => {

    const mockOnReject = jest.fn();
    const mockOnAccept = jest.fn();
    const mockLoading = false;

    const renderWithContext = (contextValue) => {
        return render(
            <FriendsContext.Provider value={contextValue}>
                <PendingFriends />
            </FriendsContext.Provider>
        );
    };

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(window, 'alert').mockImplementation(() => { });
        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
        uploadBytes.mockResolvedValue();
        global.fetch = jest.fn(() =>
            Promise.resolve({
                blob: () => Promise.resolve(new Blob(['avatar'])),
            })
        );
        jest.spyOn(Storage.prototype, 'removeItem');
    });

    afterEach(() => {
        console.error.mockRestore();
        window.alert.mockRestore();
    });

    //Verifies that the loading state is displayed when the component is in the loading state
    test("shows loading state", () => {
        renderWithContext({
            onReject: mockOnReject,
            onAccept: mockOnAccept,
            friendRequests: [],
            loading: true,
        });
        expect(screen.getByText(/Loading Friend Requests.../i)).toBeInTheDocument();
    });

    // Ensures that the list of friend requests is rendered correctly when there is data
    test('renders the list of friends correctly', async () => {
        renderWithContext({
            onAccept: mockOnAccept,
            onReject: mockOnReject,
            friendRequests: mockRequestData,
            loading: mockLoading,
        });

        const friendNames = screen.getAllByText(/Name/i); 
        expect(friendNames[0]).toHaveTextContent('Name1');
        expect(friendNames[1]).toHaveTextContent('Name2');
    });


    // Verifies that the empty state is shown when there are no pending friend requests
    test('renders the empty list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            onAccept: mockOnAccept,
            friendRequests: [],
            loading: mockLoading,
        });

        expect(screen.getByText(/No pending invitations./i)).toBeInTheDocument();
    });

    // Verifies the functionality of accept/reject buttons and ensures that actions are triggered correctly
    test('renders the invitation actions and handles accept/reject button clicks', async () => {
        renderWithContext({
            onAccept: mockOnAccept,
            onReject: mockOnReject,
            friendRequests: mockRequestData,
            loading: mockLoading,
        });

        const acceptButtons = screen.getAllByRole('button', { name: /add friend/i });
        const rejectButtons = screen.getAllByRole('button', { name: /remove friend/i });

        expect(acceptButtons).toHaveLength(mockRequestData.length);
        expect(rejectButtons).toHaveLength(mockRequestData.length);

        fireEvent.click(acceptButtons[0]);

        expect(mockOnAccept).toHaveBeenCalledWith(mockRequestData[0].id, 'accept_friend', 'PATCH');
        expect(mockOnAccept).toHaveBeenCalledTimes(1);
        fireEvent.click(rejectButtons[0]);

        expect(mockOnReject).toHaveBeenCalledWith(mockRequestData[0].id);
        expect(mockOnReject).toHaveBeenCalledTimes(1); 
        
    });



});