import React, { useContext, useEffect, useState } from "react";
import { FriendsContext } from "./FriendsContext";
import "../../styles/friends/SearchFriends.css";
import "../../styles/friends/PendingFriends.css";
import { getAuthenticatedRequest } from "../../utils/authService";

import defaultAvatar from '../../assets/avatars/avatar_2.png';
import { storage } from "../../firebase-config";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

// This component allows users to search for friends by name or username and displays relevant actions
// depending on the current status of the relationship with each user (friend request sent, invitation pending, already friends).
const SearchFriends = () => {
    // Extract necessary state and functions from FriendsContext
    const { loading, onAccept, onReject, friendRequests, invitationsRequests, friends  } = useContext(FriendsContext);

    const [search, setSearch] = useState("");
    const [result, setResult] = useState([]);

    // Accessing context data related to friend requests and user lists
    const handleChange = (event) => {
        setSearch(event.target.value);
    };

    // Effect hook to trigger search when the search input is updated
    useEffect(() => {
        if (search.length > 2) {
            const fetchData = async () => {
                try {
                    const friendsData = await getAuthenticatedRequest(`/find_friend/?q=${search}`);

                    // Process friendsData with images
                    const friendsWithImages = await Promise.all(
                        friendsData.map(async (friend) => {
                            const imageRef = ref(storage, `avatars/${friend.username}`);
                            const imageUrl = await getDownloadURL(imageRef).catch(() => defaultAvatar);
                            return { ...friend, image: imageUrl }; 
                        })
                    );

                    setResult(friendsWithImages);
                } catch (error) {
                    console.error("Error fetching friends:", error);
                }
            };

            fetchData();
        } else {
            setResult([]); 
        }
    }, [search]);

    if (loading) return <div className="loading">Loading Friends...</div>;

    return (
        <div className="search-friends">
            <input className="search-input" type="text" value={search} onChange={handleChange} placeholder="Add new friends..." />
            <ul className="invitations-container invitations-list">
                {result.map((friend) => (
                    <li key={friend.id} className="invitation-card">
                        {/* Display friend's image and name */}
                        <img src={friend.image || defaultAvatar} alt="logo" className="small-pic" />
                        <div className="invitation-name">
                        <span>{friend.name} {friend.surname} ({friend.username})</span>
                        
                        {/* Conditional rendering of actions based on the friend status */}
                        <div className="invitation-actions">
                            {
                            friendRequests.some(request => request.username === friend.username) ? (
                                friendRequests.filter(r => r.username === friend.username).map((r) => (
                                <div >
                                    <span> (user sent you request)   </span>
                                    <button onClick={() => onAccept(r.id, 'accept_friend', "PATCH")} className="btn btn-success btn-sm" aria-label="Add Friend">
                                        <i class="bi bi-check2-circle"></i>
                                    </button>
                                        <button className="btn btn-danger" onClick={() => onReject(r.id)} aria-label="Remove Friend">
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                </div>
                                ))
                            ) : invitationsRequests.some(request => request.username === friend.username) ? (
                                    invitationsRequests.filter(request => request.username === friend.username).map((request) => (
                                        <div>
                                            <span> (you sent request to that user)   </span>
                                            <button onClick={() => onReject(request.id)} className="btn btn-danger" aria-label="Add Friend">
                                                <i className="bi bi-x-circle"></i>
                                            </button>
                                        </div>
                                    ))
                            ) : friends.some(request => request.username === friend.username) ? (
                                friends.filter(request => request.username === friend.username).map((request) => (
                                    <div>
                                        <span> (you are already a friends)   </span>
                                        <button onClick={() => onReject(request.id)} className="btn btn-danger" aria-label="Add Friend">    
                                            <i className="bi bi-x-circle"></i>
                                        </button>   
                                    </div>
                                        
                                ))
                            ) : (
                                <button onClick={() => onAccept(friend.id, 'create_friend_request', "POST")} className="btn btn-danger" aria-label="Add Friend">
                                    <i className="bi bi-person-plus"></i>
                                </button>       
                                            
                            )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SearchFriends;
