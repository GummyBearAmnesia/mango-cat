import React, { useState } from "react";
import GroupStudyRoom from '../pages/GroupStudyPage';
import { getAuthenticatedRequest } from "../utils/authService";
import { useNavigate } from 'react-router-dom';
import "../styles/StudyRoomComponent.css";
import "../styles/Dashboard.css";
import generate from "../assets/generate.PNG";

// Component used on the main dashboard used for a user creating / joining a room
const StudyRoomComponent = () => {
  // Web socket handling
  const [roomCode, setRoomCode] = useState(""); // Ensure that the room code is defined
  const [roomName, setRoomName] = useState("");
  const [joined, setJoined] = useState(false);

  // Use to navigate to the created room / joined room
  const navigate = useNavigate(); // initialise

  // Method to create Room
  const createRoom = async () => {
    console.log("Creating room...");

    try {
      // This stuff gets sent to the backend!
      const response = await getAuthenticatedRequest("/create-room/", "POST", {
        sessionName: roomName, // Sends the room name to the backend
      });

      console.log("Room created successfully:", response);
      setRoomCode(response.roomCode);
      setJoined(true);

      // Redirect to the Group Study Room page with the Room Code
      navigate(`/group-study/${response.roomCode}`, {
        state: { roomCode: response.roomCode, roomName: roomName, roomList: response.roomList },
      });
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  // Methods to join room
  const joinRoom = async () => {
    try {
      console.log("Attempting to join room...");

      // This stuff gets sent to the backend!
      const response = await getAuthenticatedRequest("/join-room/", "POST", {
        roomCode: roomCode, // Sends the room name to the backend
      });

      // To get the room name
      const roomDetails = await getAuthenticatedRequest(
        `/get-room-details/?roomCode=${roomCode}`,
        "GET"
      );

      if (response.status === 200) setJoined(true);
      // Redirect to the Group Study Room page with the roomCode
      navigate(`/group-study/${roomCode}`, {
        state: { roomCode: roomCode, roomName: roomDetails.sessionName, roomList: roomDetails.roomList },
      });
      console.log("User has joined the room");
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  return (
    <div className="dashboard-panel">
      <h2>  Study Room </h2>
      <div>
        {!joined ? (
          <div className="generate-panel">
            <img src={generate} alt="Generate Room" className="generate-image" />

            <div className="input-panel">
              {/* To create a study room, text field to enter a room name ( NOT CODE, code is auto generated ) */}
              <div className="input-group">
                <input
                  type="text"
                  placeholder="I want to study..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
                <button className="gsr" onClick={createRoom}>
                  Create Room
                </button>
              </div>

              {/* For joining the room, there is also a text input for the room code"*/}
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Room Code... "
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <button className="gsr" onClick={joinRoom}>
                  Join Room
                </button>
              </div>
            </div>
          </div>
        ) : (
          <GroupStudyRoom roomCode={roomCode} />
        )}
      </div>
    </div>
  );
};

export default StudyRoomComponent;
