import React, { useState, useEffect } from "react";
import "../../styles/friends/FriendsProfile.css";
import { getAuthenticatedRequest } from "../../utils/authService";
import defaultAvatar from "../../assets/avatars/avatar_2.png";
import { storage } from "../../firebase-config";
import { ref, getDownloadURL } from "firebase/storage";

const FriendsProfile = ({ FriendsId, addUserWindow, setAddUserWindow }) => {

  // States for managing the profile data, loading state, and any potential errors
  const [friendsProfile, setFriendsProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect hook to fetch the friend's profile data whenever the FriendsId changes
  useEffect(() => {
    if (!FriendsId) return; 

    // Fetch the friend's profile data from the API
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAuthenticatedRequest(
          `/get_friend_profile/${FriendsId}/`,
          "GET"
        );
        const imageRef = ref(storage, `avatars/${data.username}`);
        const imageUrl = await getDownloadURL(imageRef).catch(
          () => defaultAvatar
        );
        setFriendsProfile({ ...data, image: imageUrl });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [FriendsId]); 

  // If the modal is not open (addUserWindow is false), don't render the component
  if (!addUserWindow) return null; 

  return (
    <div
      className="modal-overlay-friends"
      data-testid="modal-overlay"
      onClick={() => setAddUserWindow(false)}
    >
      <div
        className="modal-content-friends"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="profile-section-friends">
            <button
              className="close-btn-friends"
              onClick={() => setAddUserWindow(false)}
            >
              ×
            </button>
            <img
              src={friendsProfile.image}
              alt="Profile"
              className="profile-pic-friends"
            />

            <div className="profile-details-friends">
              <h4>
                {friendsProfile.name} {friendsProfile.surname}
              </h4>
              <p>
                <strong>Username:</strong> {friendsProfile.username}
              </p>
              <p>
                <strong>Email:</strong> {friendsProfile.email}
              </p>

              {friendsProfile.share_analytics && (
                <div className="analytics-section-friends">
                  <p>
                    📚 <strong>Hours Studied:</strong>{" "}
                    {friendsProfile.hours_studied}
                  </p>
                  <p>
                    🔥 <strong>Streaks:</strong> {friendsProfile.streaks}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsProfile;
