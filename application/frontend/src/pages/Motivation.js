import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MotivationalMessage.css";

/*
This handles the motivational message which appears on the group study room page,
it is randomised out of a selection of motivational quotes stored in the backend
*/


const MotivationalMessage = ({ "data-testid": dataTestId }) => {
    const [message, setMessage] = useState("Loading...");

    // Fetches message from the backend
    useEffect(() => {
    axios
        // URL for deployment -> .get("https://studyspot.pythonanywhere.com/api/motivational-message/")
        .get("http://127.0.0.1:8000/api/motivational-message/")
        .then((response) => {
        console.log("API Response:", response.data);
        setMessage(response.data.message);
    })
    .catch((error) => {
        console.error("Error fetching message:", error);
        setMessage("Failed to load message");
    });
    }, []);

    // Displays the message on the page
    return (
    <div className="message-card" data-testid={dataTestId}>
        <h4>{message}</h4>
    </div>
    );
};

export default MotivationalMessage;
