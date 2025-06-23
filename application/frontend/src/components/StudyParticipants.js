import React, { useState, useEffect } from "react";
import { getAuthenticatedRequest } from "../utils/authService";
import { storage } from "../firebase-config";
import { ref, getDownloadURL } from "firebase/storage";
import defaultAvatar from "../assets/avatars/avatar_2.png";
import { ToastContainer, toast } from "react-toastify";
import "../styles/StudyParticipants.css";


/*
Study Participants handles displaying the users in the room and dynamically changes the layout
as users join. Fetches user profile pictures and usernames to display on the page.
Uses websockets to keep track of which users are currently in the room ( joining and leaving )
*/

function StudyParticipants({ socket, roomCode }) {
  const [participants, setParticipants] = useState([]);

  // Fetch initial participants and setup WebSocket listeners
  useEffect(() => {
    if (!roomCode) return;

    const fetchInitialData = async () => {
      try {
        await fetchUserData();
        await fetchParticipants(roomCode);
      } catch (error) {
        console.error("Initial data fetch error:", error);
        toast.error("Failed to load participants");
      }
    };

    fetchInitialData();

    // WebSocket message handler
    const handleWebSocketMessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "participants_update") {
          const updatedParticipants = await Promise.all(
            data.participants.map(async (username) => {
              const imageUrl = await fetchParticipantData(username);
              return { username, imageUrl };
            })
          );
          setParticipants(updatedParticipants);
        }
      } catch (error) {
        console.error("WebSocket message handling error:", error);
      }
    };

    if (socket) {
      socket.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (socket) {
        socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [roomCode, socket]);


  // Method to fetch Username
  // Defaults to Anonymous user if user is not found
  const fetchUserData = async () => {
    try {
      const data = await getAuthenticatedRequest("/profile/", "GET");
      return data.username || "Anonymous";
    } catch (error) {
      console.error("Error fetching user data", error);
      return "Anonymous";
    }
  };

  // Method to fetch all users in the study room
  const fetchParticipants = async (roomCode) => {
    try {
      const response = await getAuthenticatedRequest(
        `/get-participants/?roomCode=${roomCode}`,
        "GET"
      );

      // Fetched the profile pictures of all the users from firebase
      const participantsWithImages = await Promise.all(
        response.participantsList.map(async (participant) => {
          const imageUrl = await fetchParticipantData(participant.username);
          return { username: participant.username, imageUrl };
        })
      );

      // Sets the participants usernames and profile pictures on the page
      setParticipants(participantsWithImages);
    } catch (error) {
      console.error("Error fetching participants:", error);
      throw error;
    }
  };


  // Method to fetch image from firebase. Used in fetchParticipants
  const fetchParticipantData = async (username) => {
    if (!username) return defaultAvatar;

    try {
      const imageRef = ref(storage, `avatars/${username}`);
      return await getDownloadURL(imageRef).catch(() => defaultAvatar);
    } catch (error) {
      console.error("Error fetching participant image:", error);
      return defaultAvatar;
    }
  };

  return (
    <div className="user-list-container">

     {/* Dynamically displays users as they enter the room */}
      <div className="users">
        {participants.length > 0 ? (
          participants.map((participant, index) => (

            // {/* Displays the users */}
            <div key={`${participant.username}-${index}`} className="user-circle">

              {/* Displays the user profile picture */}
              <div className="user-image">
                <img
                  src={participant.imageUrl || defaultAvatar}
                  alt={`${participant.username}'s profile`}
                  onError={(e) => {
                    e.target.src = defaultAvatar;
                  }}
                  className="user-image"
                />
              </div>

              {/* Displays the user's username */}
              <div className="user-name">
                {participant.username}
              </div>
            </div>
          ))
        ) : (

          // {/* If no participants in the room, message says no participants */}
          <div className="no-participants">No participants in this room</div>
        )}
      </div>

      {/* Sets toast placement */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default StudyParticipants;