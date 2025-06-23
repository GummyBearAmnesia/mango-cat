import musicLogo from "../assets/music_logo.png";
import customLogo from "../assets/customisation_logo.png";
import copyLogo from "../assets/copy_logo.png";
import exitLogo from "../assets/exit_logo.png";
import React, { useEffect, useState, useCallback } from "react";
import "../styles/GroupStudyPage.css";
import { getAuthenticatedRequest } from "../utils/authService";
import { toast } from "react-toastify";
import "../styles/ChatBox.css";
import "react-toastify/dist/ReactToastify.css";
import { storage } from "../firebase-config";
import { ref, listAll, deleteObject } from "firebase/storage";
import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import SpotifyButton from "../components/SpotifyButton";
import FloatingMusicPlayer from "../components/FloatingWindow.js";
import { useNavigate, useLocation } from "react-router-dom";

/*
This is the header in the group study room.
Displays the room code.
Buttons : Leave Room, Copy Code, Play Music, **Customise (functionality not in scope of project)
*/

function GroupStudyHeader() {
  const navigate = useNavigate();
  // Location object used for state
  const location = useLocation();

  // Retrieve roomCode and roomName from state
  const { roomCode, roomName, roomList } = location.state || {
    roomCode: "",
    roomName: "",
    roomList: "",
  };

  // Retrieve roomCode from state if not in URL
  const stateRoomCode = location.state?.roomCode;
  const finalRoomCode = roomCode || stateRoomCode;
  // finalRoomCode is what we should refer to!

  // For Websockets
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]); // State to store participants
  const [open, setOpen] = useState(false); //open and close states for pop-up window for spotify button

  // Method to handle copying the room code
  const handleCopy = () => {
    if (finalRoomCode) {
      navigator.clipboard
        .writeText(finalRoomCode)
        .then(() => {
          toast.success("Code copied to clipboard!", {
            position: "top-center",
            autoClose: 1000,
            closeOnClick: true,
            pauseOnHover: true,
          });
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error("Failed to copy code!");
        });
    }
  };

  // Handle open for music player popup
  const handleClickOpen = () => {
    setOpen((prevState) => !prevState);
  };

  // Handle close for music player popup
  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenMusicButton = () => {
    // Assuming this should toggle the floating music player visibility
    setOpenMusicPlayer((prevState) => !prevState);
  };

  const [openMusicPlayer, setOpenMusicPlayer] = useState(false); //handle open and close for free tracks

  const [isActiveMusic, setIsActiveMusic] = useState(false);
  const [isActiveCustom, setIsActiveCustom] = useState(false);
  const [isActiveCopy, setIsActiveCopy] = useState(false);
  const [isActiveExit, setIsActiveExit] = useState(false);

  // Method to leave room
  const leaveRoom = useCallback(async () => {
    try {
      // Close the WebSocket connection if it exists
      if (socket) {
        console.log("Closing WebSocket connection...");
        socket.close(); // Close the WebSocket connection
        setSocket(null);
      } else {
        console.log("Connection to websocket already terminated.");
      }

      const roomCode = finalRoomCode;
      const response1 = await getAuthenticatedRequest(
        `/get-participants/?roomCode=${roomCode}`,
        "GET"
      );
      console.log("Participants", response1.participantsList.length);
      console.log("num participants: ", participants.length);
      if (response1.participantsList.length == 1) {
        await deleteFirebaseFiles(finalRoomCode);
        console.log("all firebase files deleted successfully");
      }
      // delete all files associated with this room from firebase

      // This stuff gets sent to the backend!
      const response = await getAuthenticatedRequest("/leave-room/", "POST", {
        roomCode: finalRoomCode, // Sends the room name to the backend
      });

      console.log("leaving .. . .");

      console.log("ROOM CODE", finalRoomCode);

      if (response.status === 200) setIsActiveExit(true);
      // Redirect to the Dashboard
      navigate(`/dashboard/${response.username}`, {
        state: { userName: response.username },
      });
      console.log("User has left the room", response.username);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }, [finalRoomCode, navigate]);

  // Leave room when you close the tab
  useEffect(() => {
    const handlePageHide = () => {
      leaveRoom();
    };

    // Add event listeners
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [leaveRoom]);

  // Method to delete Firebase Files on room being destroyed
  // Room is destroyed when all users leave the room
  const deleteFirebaseFiles = async (roomCode) => {
    try {
      const listRef = ref(storage, `shared-materials/${roomCode}/`);
      const res = await listAll(listRef);

      if (res.items.length != 0) {
        // Delete each file in the storage location
        const deletePromises = res.items.map((itemRef) =>
          deleteObject(itemRef)
        );
        await Promise.all(deletePromises);
        console.log("files deleted successfully!");
      } else {
        console.log("no firebase files to delete");
      }
    } catch (error) {
      console.log("error deleting files");
    }
  };

  // Tracks state of buttons for button animations

  const handleMouseDown = (btnType) => {
    //when the button is pressed then the variable setIsActive is set to True
    if (btnType === "music") {
      setIsActiveMusic(true);
    } else if (btnType === "custom") {
      setIsActiveCustom(true);
    } else if (btnType === "copy") {
      setIsActiveCopy(true);
    } else if (btnType === "exit") {
      setIsActiveExit(true);
    }
  };

  const handleMouseUp = (btnType) => {
    //when the button is released then setIsActive is set to False
    if (btnType === "music") {
      setIsActiveMusic(false);
    } else if (btnType === "custom") {
      setIsActiveCustom(false);
    } else if (btnType === "copy") {
      setIsActiveCopy(false);
    } else if (btnType === "exit") {
      setIsActiveExit(false);
    }
  };

  return (
    <div className="study-room-header">
      {" "}
      {/* Header Component */}
      <h2 className="heading">Study Room: {roomName}</h2>
      <div className="header-right-section">
        {/* Utility Bar containing all buttons */}
        <div className="utility-bar">
          {/* Music Button - Opens Music Pop Up */}
          <button
            type="button"
            className={`music-button ${isActiveMusic ? "active" : ""}`}
            onMouseDown={() => handleMouseDown("music")}
            onMouseUp={() => handleMouseUp("music")}
            onMouseLeave={() => handleMouseUp("music")}
            onClick={handleClickOpen}
          >
            <img src={musicLogo} alt="Music" />
          </button>

          {/* Music Player Pop Up */}
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
              <div style={{ textAlign: "center" }}>Spotify Player</div>
              <h2 style={{ textAlign: "center", fontSize: "14px" }}>
                (playback for premium users only)
              </h2>
            </DialogTitle>
            <DialogContent>
              <SpotifyButton />
              <Button onClick={handleOpenMusicButton}>
                Switch to Free Tracks
              </Button>
            </DialogContent>
          </Dialog>

          {/* Floating Pop Up Component which plays music */}
          <FloatingMusicPlayer
            isOpen={openMusicPlayer}
            onClose={() => setOpenMusicPlayer(false)}
          />

          {/* Customisation Button - for now this button has no functionality when clicked */}
          <button
            type="button"
            className={`customisation-button ${isActiveCustom ? "active" : ""}`}
            onMouseDown={() => handleMouseDown("custom")}
            onMouseUp={() => handleMouseUp("custom")}
            onMouseLeave={() => handleMouseUp("custom")}
          >
            <img src={customLogo} alt="Customisation" />
          </button>

          {/* Copy Room Code Button */}
          <button
            type="button"
            className={`copy-button ${isActiveCopy ? "active" : ""}`}
            onClick={handleCopy}
            onMouseDown={() => handleMouseDown("copy")}
            onMouseUp={() => handleMouseUp("copy")}
            onMouseLeave={() => handleMouseUp("copy")}
          >
            <img src={copyLogo} alt="Copy" />
          </button>

          {/* Exit Room Button */}
          <button
            type="button"
            className={`exit-button ${isActiveExit ? "active" : ""}`}
            onMouseDown={() => handleMouseDown("exit")}
            onMouseUp={() => handleMouseUp("exit")}
            onMouseLeave={() => handleMouseUp("exit")}
            onClick={() => leaveRoom()}
          >
            <img src={exitLogo} alt="Exit" />
          </button>
        </div>

        {/* Displays the Room Code */}
        <h3 className="gs-heading2">Code: {finalRoomCode}</h3>
      </div>
      {/*End of header */}
    </div>
  );
}

export default GroupStudyHeader;
