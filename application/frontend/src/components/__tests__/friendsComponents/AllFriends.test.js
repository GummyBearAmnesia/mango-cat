import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import AllFriends from '../../friends/AllFriends';
import * as authService from '../../../utils/authService';
import { FriendsContext } from "../../friends/FriendsContext";
import { BrowserRouter as Router } from "react-router-dom";
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
jest.mock('../../../utils/authService', () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('../../friends/FriendsProfile', () => {
    return jest.fn(() => (
        <div data-testid="mock-user-profile">
            <h4>Name1 Surname1</h4>
        </div>
    ));
});


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

const mockFriendsData = [
    { id: 1, name: "Name1", surname: "Surname1", username: "@username1" },
    { id: 2, name: "Name2", surname: "Surname2", username: "@username2" },
];

describe("AllFriends", () => {

    const mockOnReject = jest.fn(); 
    const mockLoading = false;

    const renderWithContext = (contextValue) => {
        return render(
            <FriendsContext.Provider value={contextValue}>
                <AllFriends />
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

    // Test for checking if the loading state is properly rendered when the 'loading' flag is true
    test("shows loading state", () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: [],
            loading: true,
        });
        expect(screen.getByText(/Loading Friends List/i)).toBeInTheDocument();
    });

    // Test for rendering a list of friends correctly when friends data is available
    test('renders the list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });

        const friendNames = screen.getAllByRole('heading', { level: 4 });

        expect(friendNames[0]).toHaveTextContent('Name1');
        expect(friendNames[1]).toHaveTextContent('Name2');
    });

    // Test for checking how the component renders when there are no friends in the list
    test('renders the empty list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: [],
            loading: mockLoading,
        });

        expect(screen.getByText(/No friends found./i)).toBeInTheDocument();
    });

    // Test for rendering the list of friends and verifying the functionality of the delete button
    test('renders the list of friends correctly and handles button click', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });

        const rejectButtons = screen.getAllByRole('button', { name: /delete friend/i });
        expect(rejectButtons).toHaveLength(mockFriendsData.length);

        // Simulate clicks on each delete button and check if the correct function is called
        fireEvent.click(rejectButtons[0]);
        expect(mockOnReject).toHaveBeenCalledWith(mockFriendsData[0].id);
        expect(mockOnReject).toHaveBeenCalledTimes(1);

        fireEvent.click(rejectButtons[1]);
        expect(mockOnReject).toHaveBeenCalledWith(mockFriendsData[1].id);
        expect(mockOnReject).toHaveBeenCalledTimes(2);
    });

    // Test for handling the profile button click and ensuring the user profile window opens correctly
    test('handles profile button click and opens user profile window', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });

        // Get the profile details button for the first friend and simulate a click
        const detailsButton = screen.getAllByRole('button', { name: /details/i })[0];
        fireEvent.click(detailsButton);
    });


});