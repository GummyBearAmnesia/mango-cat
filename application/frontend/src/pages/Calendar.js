import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { getAuthenticatedRequest } from "../utils/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import "../styles/calendar.css";
import { useNavigate } from "react-router-dom";
import returnHomeLogo from "../assets/return_home.png";

console.log(require.resolve("@fullcalendar/react"));

/*
This page is using the react standard calendar library to store user events and details:
such as deadlines, planned study sessions, and class schedules
*/

const backendURL = "/events/";

const CalendarPage = () => {

    // Store data related to calendar
    const [myEvents, setMyEvents] = useState([]);
    const [eventTitle, setEventTitle] = useState("");
    const [eventDescription, setEventDescription] = useState("");
    const [eventStart, setEventStart] = useState("");
    const [eventEnd, setEventEnd] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();
    const userId = location.state?.userId;

    // Function to return to the dashboard when clicking the return button
    const goToDashboard = async () => {
        try {
            // API request to get the user's profile data to pass on returning to dashboard
            const response = await getAuthenticatedRequest("/profile/", "GET");
            navigate(`/dashboard/${response.username}`, {
                state: { userName: response.username }
            });
        } catch (error) {
            navigate("/dashboard"); // Fallback without username
        }
    };

    if (!userId) {
        console.error("User ID is undefined. Redirecting or handling error...");
        // Optionally, redirect the user or show an error message
    }

    // Function to fetch events on the calendar
    const fetchEvents = async () => {
        try {
            // API request to get events on calendar
            const response = await getAuthenticatedRequest(backendURL, "GET");
            console.log("Fetched events:", response); // Debugging: Log fetched events
            setMyEvents(response); // Set the events directly (backend already filters by user)
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Error fetching events");
        }
    };

    // When the page is loaded, fetch all events stored on the user's calendar
    useEffect(() => {
        fetchEvents();
    }, []);


    // Function to add a new event to the calendar
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Set description to "No description available" if empty
        const description = eventDescription.trim() || "No description available";

        const newEvent = {
            title: eventTitle,
            description: description,
            start: eventStart,
            end: eventEnd,
            // Do NOT include the user field here; the backend will handle it
        };

        console.log("Sending event:", newEvent); // 🔍 Debugging: Log before sending

        try {
              // API post to save new event in the backend
              const response = await getAuthenticatedRequest(
                backendURL,
                "POST",
                newEvent
              );

            if (response) {
                toast.success("Event added successfully");
                closeAddEventPopup();
                fetchEvents(); // Fetch events again to reload the calendar
            } else {
                toast.error("Error saving event.");
            }
            } catch (error) {
                console.error("Error saving event:", error);
                toast.error("Error connecting to backend.");
            }
    };

    // Opens Add Event Popup
    const openAddEventPopup = () => {
        console.log("Add Event button func called");
        setShowPopup(true);
        console.log("showPopup:", showPopup);
    };

    // Closes Add Event Popup
    const closeAddEventPopup = () => {
        setShowPopup(false);
    };

    // See event details
    const handleEventClick = (info) => {
        setSelectedEvent(info.event);
    };

    // Close event details popup
    const closePopup = () => {
        setSelectedEvent(null);
    };

    // Stores current date and time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Changes the colour of the event on calendar based on whether passed, present or in the future
    const processedEvents = myEvents.map((event) => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);

        // Default colour for all future events
        let backgroundColor = "#BAD7F2";

        // Set colour for passed / completed events
        if (eventDate < today) {
            backgroundColor = "#F2BAC9";

        // Set colour for currently occuring events
        } else if (eventDate.getTime() === today.getTime()) {
            backgroundColor = "#B0F2B4";
        }

        return {
            ...event,
            backgroundColor,
            borderColor: backgroundColor,
            textColor: "black",
            classNames: ["rounded-event"],
        };
    });


    // Returns the calendar page view

    return (
        <div className="Page">

            {/* Calendar Header and Title & Return to Dashboard Button */}
            <h1 className="Header">
                My Calendar
                <div className="top-bar">
                    <button onClick={goToDashboard} className="dashboard-button">
                    <img src={returnHomeLogo} alt="return" />
                    </button>
                </div>
            </h1>


            {/* Calendar Header Buttons - Add Event, Week View, Month View, Year View */}
            <ToastContainer position="top-center" />
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView="timeGridWeek"
                events={processedEvents}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'addEventButton,dayGridMonth,timeGridWeek,dayGridYear'
                }}

                customButtons={{
                    addEventButton: {
                        text: "Add Event",
                        click: () => {
                        console.log("Add Event button clicked");
                        openAddEventPopup();
                        },
                    },
                }}
                eventClick={handleEventClick}
            />


            {/* Popups for adding an event, with entry fields to receive event data */}
            {showPopup && (
            <div className="event-popup">
                <div className="popup-content">
                <h2>Add Event</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        {/* Input field : Event Title */}
                        <label htmlFor="eventTitle">Title:</label>
                        <input
                            id="eventTitle"
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        {/* Input field : Event Description */}
                        <label htmlFor="eventDescription">Description:</label>
                        <textarea
                            id="eventDescription"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        {/* Input field : Event Start */}
                        <label htmlFor="eventStart">Start:</label>
                        <input
                        id="eventStart"
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        required
                    />
                    </div>

                    <div>
                        {/* Input field : Event End */}
                        <label htmlFor="eventEnd">End:</label>
                        <input
                          id="eventEnd"
                          type="datetime-local"
                          value={eventEnd}
                          onChange={(e) => setEventEnd(e.target.value)}
                        />
                    </div>

                    {/* Buttons to submit event or to cancel */}
                    <button type="submit">Save Event</button>
                    <button type="button" onClick={closeAddEventPopup}>
                        Cancel
                    </button>
                </form>
                </div>
            </div>
            )}


            {/* Popup to show event details when selected */}
            {selectedEvent && (
            <div className="event-popup">
                <div className="popup-content">

                    <h2>Event Details</h2>

                    {/* Display event title */}
                    <p>
                        <strong>Title:</strong> {selectedEvent.title}
                    </p>

                    {/* Display event start */}
                    <p>
                        <strong>Start:</strong> {selectedEvent.start.toLocaleString()}
                    </p>

                    {/* Display event end */}
                    <p>
                        <strong>End:</strong>{" "}
                        {selectedEvent.end ? selectedEvent.end.toLocaleString() : "N/A"}
                    </p>

                    {/* Display event description */}
                    <p>
                        <strong>Description:</strong>{" "}
                        {selectedEvent.extendedProps.description ||
                        "No description available"}
                    </p>

                    {/* Button to close popup */}
                    <button onClick={closePopup}>Close</button>
                </div>
            </div>
            )}
        </div>
        );
};

export default CalendarPage;
