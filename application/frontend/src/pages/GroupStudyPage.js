import React, { useRef, useEffect, useState, useCallback } from "react";
import "../styles/GroupStudyPage.css";
import MotivationalMessage from "./Motivation";
import ToDoList from "../components/ToDoListComponents/newToDoList";
import StudyTimer from "../components/StudyTimer.js";
import StudyParticipants from "../components/StudyParticipants.js";
import { getAuthenticatedRequest } from "../utils/authService";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "../styles/ChatBox.css";
import "react-toastify/dist/ReactToastify.css";
import defaultAvatar from "../assets/avatars/avatar_2.png";
import { storage } from "../firebase-config";
import {
  ref,
  getDownloadURL,
  uploadBytes,
  listAll,
  deleteObject,
} from "firebase/storage";
import SharedMaterials from "./SharedMaterials.js";
import ChatBox from "../components/ChatBox.js";
import GroupStudyHeader from "../components/GroupStudyHeader.js";
import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import SpotifyButton from "../components/SpotifyButton";
import FloatingMusicPlayer from "../components/FloatingWindow.js";

/*
Group Study Page for the website. Imports all components, handles users joining and leaving the room.
Also handles websockets communications
*/

function GroupStudyPage() {
  const [open, setOpen] = useState(false); //open and close states for pop-up window for spotify button

  // Location object used for state
  const location = useLocation();
  const navigate = useNavigate(); // initialise

  // Track the logged-in user
  const [loggedInUser, setLoggedInUser] = useState(null);
  const chatMessagesRef = useRef(null); // Ref for the chat messages container

  // Function to scroll to the bottom of the chat messages container
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const { roomCode, roomName, roomList } = location.state || {
    roomCode: "",
    roomName: "",
    roomList: "",
  };
  // Retrieve roomCode and roomName from state
  const { roomCode: urlRoomCode } = useParams(); // Get roomCode from URL params

  console.log("The room code is: ", roomCode);

  // Retrieve roomCode from state if not in URL
  const stateRoomCode = location.state?.roomCode;
  const finalRoomCode = roomCode || stateRoomCode;
  // finalRoomCode is what we should refer to!

  // for websockets
  const [socket, setSocket] = useState(null);

  // Determines whether or not to auto-reconnect user to websocket server
  const [shouldReconnect, setShouldReconnect] = useState(true);

  // Created initial websocket connection and saves it as socket
  useEffect(() => {
    // Ensure room code is given
    if (!finalRoomCode) {
      console.error("Room code is missing.");
      return;
    }

    console.log("GroupStudyPage UseEffect is being called now!");

    // If the user disconnects by accident due to a timeout, will auto-reconnect
    setShouldReconnect(true);

    // Initial connection to the websocket
    connectWebSocket();

    // Cleanup function to prevent reconnect attempts after the component unmounts
    return () => {
      setShouldReconnect(false); // Signal not to reconnect anymore
      if (socket) {
        console.log("Closing WebSocket connection on unmount...");
        socket.close();
      }
    };
  }, [finalRoomCode, shouldReconnect]);

  // Method for connecting to the websocket
  const connectWebSocket = () => {
    // Check if a WebSocket connection already exists, not sure if this actually does anything?
    if (socket === WebSocket.OPEN) {
      console.log("Using existing WebSocket connection");
      return; // Reuse the existing connection
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/room/${finalRoomCode}/`);

    //Logs when connection is established
    ws.onopen = () => {
      console.log("Connected to Websocket");
      setSocket(ws);
      console.log("socket", ws);
    };

    //Logs when the connection is closed
    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
      if (shouldReconnect) {
        console.log("Reconnecting");
        setTimeout(connectWebSocket, 1000); // Attempt to reconnect after 1 seconds
      }
    };
    setSocket(ws);
  };

  const [username, setUsername] = useState("ANON_USER"); // Default to 'ANON_USER' before fetching. Stores username fetched from the backend

  //Fetches logged in user's username when component mounts
  //Updates username state with fetched data or defaults to 'anonymous'
  const fetchUserData = async () => {
    try {
      const data = await getAuthenticatedRequest("/profile/", "GET");
      setUsername(data.username || "Anonymous"); // Fallback in case username is missing
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  // This page is designed in columns
  // First Column: todoList, shared materials
  // Second Column: users listes, motivational message
  // Third Column: Timer, customisation, chatbox

  return (
    <>
      {/* Again need to sort this out */}
      <GroupStudyHeader />

      <div
        className="groupStudyRoom-container"
        data-testid="groupStudyRoom-container"
      >
        {/*1st Column */}
        <div className="column" role="column" data-testid="column-1">
          {/* To Do List Component */}
          <ToDoList
            isShared={true}
            listId={roomList}
            socket={socket}
            roomCode={roomCode}
          />

          <div
            className="sharedMaterials-container"
            data-testid="sharedMaterials-container"
          >
            {/* Shared Materials */}
            <SharedMaterials socket={socket} />
          </div>
        </div>

        {/*2nd Column */}
        <div className="column" role="column" data-testid="column-2">
          <div
            className="user-list-container"
            data-testid="user-list-container"
          >
            {/* Loads in the users in the room, profile pictures and usernames */}
            <StudyParticipants socket={socket} roomCode={finalRoomCode} />
          </div>
          {/* Motivational Message Component */}
          <MotivationalMessage data-testid="motivationalMessage-container" />
        </div>

        {/*3rd Column */}
        <div className="column" role="column" data-testid="column-3">
          {/* StudyTimer replaces the timer-container div */}
          <StudyTimer
            roomId={finalRoomCode}
            isHost={true}
            onClose={() => console.log("Timer closed")}
            data-testid="studyTimer-container"
          />
          {/* Chat Box Component */}
          <ChatBox socket={socket} roomCode={finalRoomCode} />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default GroupStudyPage;
