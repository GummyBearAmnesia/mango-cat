import React, { useContext } from "react";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { FriendsProvider, FriendsContext } from '../../friends/FriendsContext';
import * as authService from "../../../utils/authService";
import { getDownloadURL } from 'firebase/storage';
import { async } from "@firebase/util";
import defaultAvatar from '../../../assets/avatars/avatar_2.png';


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

const TestComponent = () => {
    const { friends, invitationsRequests, loading, onAccept, onReject } = useContext(FriendsContext);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <ul className="friends-list">
                {friends.length === 0 ?
                    (
                        <p className="no-friends">No friends found.</p>
                    )
                    :
                    (
                        friends.map((friend) => (
                            <li key={friend.id} className="friend-card">
                                <img src={friend.image} alt="logo" className="pic" />
                                <h4>{friend.name} {friend.surname}</h4>
                                <p className="username">{friend.username}</p>
                                <button className="reject-btn" onClick={() => onReject(friend.id)} aria-label="delete friend"><i class="bi bi-trash"></i></button>
                                <button className="details-btn" onClick={() => handleOpenProfile(friend.id)} aria-label="details" > <i class="bi bi-eye"></i> </button>
                            </li>
                        ))
                    )
                }
            </ul>
            <div>
                {invitationsRequests.map(invitation => (
                    <div key={invitation.id}>
                        <img src={invitation.image} alt="logo" className="pic" />
                        <span>{invitation.name}</span>
                        <button onClick={() => onAccept(invitation.id, 'accept_friend', 'POST')}>Accept</button>
                        <button onClick={() => onReject(invitation.id)}>Reject</button>
                    </div>
                ))}
            </div>
            <button onClick={() => onAccept(3, 'create_friend_request', 'POST')}>Create Friend Request</button>
        </div>
    );
};

describe('FriendsContext', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(window, 'alert').mockImplementation(() => { });

        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    // Test if friends data is fetched from the API and rendered correctly in the component
    // Verify loading state appears initially, then check if friends' names are displayed
    test('should correctly fetch and render friends data', async () => {
        
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce()
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

        const johnDoe = await screen.findByText('John Doe');
        const janeDoe = await screen.findByText('Jane Doe');

        expect(johnDoe).toBeInTheDocument();
        expect(janeDoe).toBeInTheDocument();
    });

    // Test if a default avatar image is used when fetching an avatar from the URL fails
    // Simulate image fetch failure and verify that default avatar is shown for the friend
    test('should use default avatar if image fetch fails', async () => {
        
        getDownloadURL.mockRejectedValueOnce(new Error('Image not found'));

        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ])
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ])
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        
        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images[0]).toHaveAttribute('src', '');
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar.png');
        });
    });

    // Test if the onAccept function is triggered when accepting a friend request
    // Ensure that the friends list is updated by adding the accepted friend and removing the invitation
    test('should call onAccept and update the friends list', async () => {
        
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const acceptResponse = { status: 1 };

        authService.getAuthenticatedRequest.mockResolvedValueOnce(acceptResponse);
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([ 
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]) 
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations)
        
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        });

        const acceptButtons = screen.getAllByText('Accept');
        fireEvent.click(acceptButtons[0]);

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        });
    });

    // Test if the onReject function is triggered when rejecting a friend invitation
    // Ensure that the friend is removed from the list of friends after rejection
    test('should call onReject and remove friend from the list', async () => {
        
        const rejectResponse = { status: 1 };
        authService.getAuthenticatedRequest.mockResolvedValueOnce(rejectResponse);

        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const acceptResponse = { status: 1 }; 
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(acceptResponse);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(async () => {
            const rejectButton = screen.getByText('Reject');
            expect(rejectButton).toBeInTheDocument();

            fireEvent.click(rejectButton);

            await waitFor(() => {
                expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
            });
        });
    }); 

    // Test if creating a new friend request adds a new invitation to the invitations list
    // Ensure that the request is made and the invitations list is updated accordingly
    test('should create a friend request and update the invitations list', async () => {
            
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const createResponse = { id: 3, username: 'alice_doe', name: 'Alice Doe', image: 'https://example.com/avatar3.png' };
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations) 
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(createResponse); 

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        });

        const createButton = screen.getByText('Create Friend Request');
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith(
                '/create_friend_request/3/',
                'POST'
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Alice Doe')).toBeInTheDocument();
        });
    });

    // Test if accepting a friend request correctly moves the friend from the invitations list to the friends list
    // Verify that the invitation is removed from the requests and the friend is added to the friends list
    test("should accept a friend request and update friends list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
                if (url === "/get_pending_friends/") return Promise.resolve(mockRequests);
                if (url === "/get_friends/") return Promise.resolve(mockFriends);
                if (url === "/get_made_requests/") return Promise.resolve([]);
                return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onAccept(2, "accept_friend", "POST");
        });

        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve([...mockFriends, mockRequests[0]]);
            return Promise.resolve([]);
        });

        await waitFor(() => {
            expect(contextValue.friends).toContainEqual(mockRequests[0]);
            expect(contextValue.friendRequests).not.toContainEqual(mockRequests[0]);
        });
    });

    // Test if removing a friend from the friends list adds them to the friend requests list
    // Ensure that the friend is removed from friends and appears in the invitations list for re-request
    test("should remove a friend and add them to the requests list", async () => {
        const initialFriends = [
            { id: 1, username: "john_doe", name: "John Doe", image: "https://example.com/avatar.png" },
            { id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" },
        ];

        const initialRequests = [];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends);
            if (url === "/get_pending_friends/") return Promise.resolve(initialRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );
        await waitFor(() => expect(contextValue.friends).toEqual(initialFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(initialRequests));
        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });
        act(() => {
            contextValue.onReject(2);
        });
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends.filter(f => f.id !== 2));
            if (url === "/get_pending_friends/") return Promise.resolve([{ id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" }]);
            return Promise.resolve([]);
        });
        await waitFor(() => {
            expect(contextValue.friends).not.toContainEqual(expect.objectContaining({ id: 2 }));
            expect(contextValue.friendRequests).toContainEqual(expect.objectContaining({ id: 2 }));
        });
    });

    // Test if an error is logged when the API call to accept a friend request fails
    // Verify that an appropriate error is logged in the console if something goes wrong
    test("should log error when accepting friend request fails", async () => {
        const initialFriends = [
            { id: 1, username: "john_doe", name: "John Doe", image: "https://example.com/avatar.png" },
        ];

        const initialInvitations = [
            { id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar2.png" },
        ];
        const errorResponse = { status: 0 };
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends) 
            .mockResolvedValueOnce(initialInvitations)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(errorResponse); 
        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument(); 
        });
        const acceptButtons = screen.getAllByText('Accept');
        fireEvent.click(acceptButtons[0]); 
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error accepting friend request");
        });
        consoleErrorSpy.mockRestore();
    });

    // Test if the component displays a default avatar when fetching a friend's avatar fails
    // Simulates a failed image fetch and checks if the fallback image is shown
    test('should use default avatar if image fetch fails for friends', async () => {
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found')) 
            .mockResolvedValueOnce('https://example.com/avatar2.png'); 

        const initialInvitations = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]) 
            .mockResolvedValueOnce(initialInvitations); 

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images[0]).toHaveAttribute('src', defaultAvatar);
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png');
        });
    });

    // Similar to the previous test, but this time checks if the default avatar is used for friend invitations
    test('should use default avatar if image fetch fails for invitations', async () => {
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found')) 
            .mockResolvedValueOnce('https://example.com/avatar2.png');
        const initialInvitations = [
            { id: 1, username: 'john_doe', name: 'John Doe' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe' },
        ];
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(initialInvitations)
            .mockResolvedValueOnce([]);
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });
        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images[0]).toHaveAttribute('src', defaultAvatar);
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png');
        });
    });

    // Test if rejecting a friend correctly removes them from the friends list and adds them to the requests list
    // Verifies that after rejection, the friend is moved from the friends list to the invitations list
    test('should remove a friend and add them to the requests list', async () => {
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar.png' },
        ];

        const initialRequests = [];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends);
            if (url === "/get_pending_friends/") return Promise.resolve(initialRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );
        await waitFor(() => expect(contextValue.friends).toEqual(initialFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(initialRequests));
        act(() => {
            contextValue.onReject(2);
        });
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends.filter(f => f.id !== 2));
            if (url === "/get_pending_friends/") return Promise.resolve([{ id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" }]);
            return Promise.resolve([]);
        });
        await waitFor(() => {
            expect(contextValue.friends).not.toContainEqual(expect.objectContaining({ id: 2 }));
            expect(contextValue.friendRequests).toContainEqual(expect.objectContaining({ id: 2 }));
        });
    });

    // Similar to the previous tests, but this one checks for friend requests and how the default avatar is applied when fetching fails
    test('should use default avatar if image fetch fails for requests', async () => {
        const TestComponent1 = () => {
            const { friendRequests, friends, invitationsRequests, loading, onAccept, onReject } = useContext(FriendsContext);

            if (loading) return <div>Loading...</div>;

            return (
                <div>
                    <ul className="friends-list">
                        {friends.length === 0 ?
                            (
                                <p className="no-friends">No friends found.</p>
                            )
                            :
                            (
                                friends.map((friend) => (
                                    <li key={friend.id} className="friend-card">
                                        <img src={friend.image} alt="logo" className="pic" />
                                        <h4>{friend.name} {friend.surname}</h4>
                                        <p className="username">{friend.username}</p>
                                        <button className="reject-btn" onClick={() => onReject(friend.id)} aria-label="delete friend"><i class="bi bi-trash"></i></button>
                                        <button className="details-btn" onClick={() => handleOpenProfile(friend.id)} aria-label="details" > <i class="bi bi-eye"></i> </button>
                                    </li>
                                ))
                            )
                        }
                    </ul>
                    <div>
                        {invitationsRequests.map(invitation => (
                            <div key={invitation.id}>
                                <img src={invitation.image} alt="logo" className="pic" />
                                <span>{invitation.name}</span>
                                <button onClick={() => onAccept(invitation.id, 'accept_friend', 'POST')}>Accept</button>
                                <button onClick={() => onReject(invitation.id)}>Reject</button>
                            </div>
                        ))}
                    </div>
                    <div>
                        {friendRequests.map(requests => (
                            <div key={requests.id}>
                                <img src={requests.image} alt="logo" className="pic" />
                                <span>{requests.name}</span>
                                <button onClick={() => onAccept(requests.id, 'accept_friend', 'POST')}>Accept</button>
                                <button onClick={() => onReject(requests.id)}>Reject</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => onAccept(3, 'create_friend_request', 'POST')}>Create Friend Request</button>
                </div>
            );
        };
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found'))
            .mockResolvedValueOnce('https://example.com/avatar2.png');
        const initialRequests = [
            { id: 1, username: 'john_doe', name: 'John Doe' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe' },
        ];
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialRequests)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);
        render(
            <FriendsProvider>
                <TestComponent1 />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });
        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images[0]).toHaveAttribute('src', defaultAvatar);
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png');
        });
    });

    // Test if accepting a friend request correctly adds the friend to the friends list
    // Verifies that the request is accepted and the friends list is updated accordingly
    test("accept a friend request and update friends list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_pending_friends/") return Promise.resolve([]);
            if (url === "/get_friends/") return Promise.resolve(mockFriends);
            if (url === "/get_made_requests/") return Promise.resolve(mockRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.invitationsRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onAccept(2, "create_friend_request", "POST");
        });
    });

    // Tests the rejection of an invitation and ensures the invitations list is updated correctly after the rejection
    test("reject an invitations request and update list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_pending_friends/") return Promise.resolve([]);
            if (url === "/get_friends/") return Promise.resolve(mockFriends);
            if (url === "/get_made_requests/") return Promise.resolve(mockRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.invitationsRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onReject(2, "reject_friend", "DELETE");
        });

        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_made_requests/") return Promise.resolve([...mockFriends, mockRequests[0]]);
            return Promise.resolve([]);
        });

        await waitFor(() => {
            expect(contextValue.invitationsRequests).not.toContainEqual(mockRequests[0]);
        });
    });

});
