import React, { useContext } from "react";
import { FriendsContext } from "./FriendsContext";
import "../../styles/friends/PendingFriends.css";

const FriendsRequested = () => {
    // Accessing the invitationsRequests, onReject function, and loading state from the FriendsContext
    const { invitationsRequests, onReject, loading } = useContext(FriendsContext);

    // Display a loading message while the data is being fetched
    if (loading) return <div className="loading">Loading Friend Requests...</div>;

    return (
        <div className="pending-friends">
            <div className="invitations-container">
                {invitationsRequests.length === 0 ? (
                    <p className="no-invitations">No pending invitations.</p>
                ) : (
                    <ul className="invitations-list">
                        {invitationsRequests.map((inv) => (
                            <li key={inv.id} className="invitation-card">
                                <img src={inv.image} alt="logo" className="small-pic" />
                                <span className="invitation-name">
                                    {inv.name} {inv.surname} {inv.username}
                                </span>
                                <div className="invitation-actions">
                                    <button className="reject-btn" onClick={() => onReject(inv.id)} aria-label = "remove friend">
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

export default FriendsRequested;
