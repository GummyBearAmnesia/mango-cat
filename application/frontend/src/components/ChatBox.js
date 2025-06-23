import React, { useRef, useEffect, useState } from "react";
import { getAuthenticatedRequest } from "../utils/authService";
import "../styles/ChatBox.css";

/*
This handles the chatbox component. The websocket is passed as 'socket' from the initial connection
which is set up in GroupStudyPage.js. It also handles receiving the websocket messages.
*/

function ChatBox({ socket, roomCode }) {

  // Stores data for chatInput, messages and keeps track of when the user is typing
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const chatMessagesRef = useRef(null);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");

  // Default to 'ANON_USER' before fetching. Stores username fetched from the backend
  const [username, setUsername] = useState("ANON_USER");

  // Function to scroll to the bottom of the chat messages container
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Handles changing the colour of the text based on which user is typing  
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).slice(-2);
    }
    return color;
  };

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getAuthenticatedRequest("/profile/", "GET");
        setUsername(data.username || "Anonymous");
      } catch (error) {
        console.error("Error fetching user data", error);
      }
    };
    fetchUserData();
  }, []);

  // Set up WebSocket message handling. Receives messages and handles them correctly.
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket Message:", data);

      // If chat message, updates
      if (data.type === "chat_message") {
        setMessages((prev) => [
          ...prev,
          { sender: data.sender, text: data.message },
        ]);
      // If typing updates user typing. 'typing...' message times out after 3 seconds
      } else if (data.type === "typing") {
        setTypingUser(data.sender);
        setTimeout(() => {
          setTypingUser("");
        }, 3000);
      }
    };

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);


  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  //Sends chat message through websocket connection
  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !chatInput.trim()) {
      return;
    }

    const messageData = {
      type: "chat_message",
      message: chatInput,
      sender: username,
    };

    socket.send(JSON.stringify(messageData));
    setChatInput("");
  };


  // Methods to create a typing... popup when a user is typing.
  let typingTimeout;
  const handleTyping = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // Send "typing" event to WebSocket
    socket.send(JSON.stringify({ type: "typing", sender: username }));

    // Prevent multiple events from being sent too frequently
    if (!isTyping) {
      setIsTyping(true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  return (
    <div className="chatBox-container">
      {/* Chat Messages */}
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((msg, index) => {
          const userColor = stringToColor(msg.sender);
          const isSameUserAsPrevious =
            index > 0 && messages[index - 1].sender === msg.sender;

          return (
            <div
              key={index}
              // Puts the username of the message sender in front of each text
              className={`chat-message ${
                msg.sender === username ? "current-user" : "other-user"
              }`}

              // {/* Chose a different text colour for each user */}
              style={{
                color: userColor,
                borderBottom: isSameUserAsPrevious ? "none" : "1px dotted #eee",
              }}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          );
        })}

        {/* User is typing indicator ... */}
        {typingUser && typingUser !== username &&(
          <p className="typing-indicator">
            {typingUser} is typing...
          </p>
        )}
      </div>
      
      {/* Chat Input - User types their message here */}
      <div className="input-container">
        <input
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value);
            handleTyping();
          }}

          // {/* On pressing enter the message sends, resets the placeholder */}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;