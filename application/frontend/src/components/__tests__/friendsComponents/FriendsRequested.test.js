import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as authService from '../../../utils/authService';
import { FriendsContext } from "../../friends/FriendsContext";
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import FriendsRequested from '../../friends/FriendsRequested';

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
    const mockLoading = false;

    const renderWithContext = (contextValue) => {
        return render(
            <FriendsContext.Provider value={contextValue}>
                <FriendsRequested />
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

    // Verifies that the loading state is displayed when `loading` is true
    // Ensures that the component properly indicates when the friend requests are being loaded
    test("shows loading state", () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: [],
            loading: true,
        });
        expect(screen.getByText(/Loading Friend Requests.../i)).toBeInTheDocument();
    });


    // Ensures that the list of friend requests is rendered correctly
    // Verifies that the correct names are displayed for each friend request
    test('renders the list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: mockRequestData,
            loading: mockLoading,
        });

        const friendNames = screen.getAllByText(/Name/i);
        expect(friendNames[0]).toHaveTextContent('Name1');
        expect(friendNames[1]).toHaveTextContent('Name2');
    });

    // Verifies that a message indicating no pending invitations is displayed when there are no requests
    test('renders the empty list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: [],
            loading: mockLoading,
        });

        expect(screen.getByText(/No pending invitations./i)).toBeInTheDocument();
    });

    // Tests that the accept/reject buttons are rendered and function correctly
    // Simulates the rejection of a friend request and ensures that the appropriate handler is called
    test('renders the invitation actions and handles accept/reject button clicks', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: mockRequestData,
            loading: mockLoading,
        });

        const rejectButtons = screen.getAllByRole('button', { name: /remove friend/i });

        expect(rejectButtons).toHaveLength(mockRequestData.length);

        fireEvent.click(rejectButtons[0]);

        expect(mockOnReject).toHaveBeenCalledWith(mockRequestData[0].id);
        expect(mockOnReject).toHaveBeenCalledTimes(1);

    });



});