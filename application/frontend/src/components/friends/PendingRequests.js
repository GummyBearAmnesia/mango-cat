import React, { useContext } from "react";
import { FriendsContext } from "./FriendsContext";
import "../../styles/friends/PendingFriends.css";

//The PendingFriends component is designed to handle and display a list of friend requests that are pending. 
//It allows users to accept or reject friend requests.
//This component provides an interactive way for users to manage their incoming friend requests.
const PendingFriends = () => {
    
    // Accessing the state and methods from the FriendsContext
    const { friendRequests, onAccept, onReject, loading } = useContext(FriendsContext);

    // If the data is still loading, show a loading message
    if (loading) return <div className="loading">Loading Friend Requests...</div>;

    return (
        <div className="pending-friends">
            <div className="invitations-container">
                {friendRequests.length === 0 ? (
                    <p className="no-invitations">No pending invitations.</p>
                ) : (
                    <ul className="invitations-list">
                        {friendRequests.map((inv) => (
                            <li key={inv.id} className="invitation-card">
                                <img src={inv.image} alt="logo" className="small-pic" />
                                <span className="invitation-name">
                                    {inv.name} {inv.surname} ({inv.username})
                                </span>
                                <div className="invitation-actions">
                                    <button className="accept-btn" onClick={() => onAccept(inv.id, 'accept_friend', "PATCH")} aria-label="Add Friend">
                                        <i class="bi bi-check2-circle"></i>
                                    </button>
                                    <button className="reject-btn" onClick={() => onReject(inv.id)} aria-label="Remove Friend">
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PendingFriends;
