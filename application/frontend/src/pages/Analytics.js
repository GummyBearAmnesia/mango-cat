import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Analytics.css";
import { getAuthenticatedRequest } from "../utils/authService";

/*
This handles the analytics panel on the dashboard page.
Keeps track of user average time spend in a study room.
Also keeps track of the consecutive number of days you have studied on the website.
*/

const Analytics = () => {
  // Store analytics data
  const [analytics, setAnalytics] = useState({
    streaks: 0,
    total_hours_studied: 0,
    average_study_hours: 0,
    is_sharable: false,
  });

  useEffect(() => {
    // Fetches the analytics data for the logged in user from the backend
    const fetchAnalytics = async () => {
      // Get the access token from localStorage
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.error("No access token found. Please log in.");
        return;
      }

      try {
        const response = await axios.get(
          // Endpoint for fetching analytics

          //"https://studyspot.pythonanywhere.com/api/analytics/", <- URL to be used in deployment
          "http://127.0.0.1:8000/api/analytics/",

          {
            headers: {
              // Include the access token in the request
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        // Set the analytics data
        setAnalytics(response.data);
      } catch (error) {
        // Catch errors in fetching analytics data from backend
        console.error(
          "Error fetching analytics:",
          error.response ? error.response.status : error.message
        );
      }
    };

    // Fetch data and log for debugging purposes
    fetchAnalytics();
    console.log(analytics);
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Toggle analytics sharing with friends
  const toggleShareAnalytics = async () => {
    try {
      // Update 'share_analytics' in analytics data in backend
      const response = await getAuthenticatedRequest(
        `/share_analytics/`,
        "PATCH"
      );

      // Catches error in update request
      if (response.status === 0) {
        console.error("Error updating task status");
      } else {
        // Toggles share analytics between ON and OFF
        setAnalytics((prevList) => ({
          ...prevList,
          is_sharable: !prevList.is_sharable,
        }));
      }
    } catch (error) {
      // Catches error in fetching data from backend
      console.error("Error fetching share-analytics data:", error);
    }
  };

  return (
    <div className="dashboard-panel analytics">
      <h2>Statistics</h2>
      <div className="stats">
        {/* Displays user data : consecutive days studied */}
        <div className="stat">
          <div className="circle">
            <span className="number" data-testid="streaks-test">
              {analytics.streaks}
            </span>
          </div>
          <div className="stat-label">
            <p>Day Streak</p>
            <div className="tooltip-container">
              <span className="info-icon">i</span>
              <span className="tooltip">
                Number of consecutive days you've studied
              </span>
            </div>
          </div>
        </div>

        {/* Displays user data : Average time in study room */}
        <div className="stat">
          <div className="circle">
            <span className="number" data-testid="avg-time-test">
              {analytics.average_study_hours}
            </span>
          </div>
          <div className="stat-label">
            <p>Average Hours</p>
            <div className="tooltip-container">
              <span className="info-icon">i</span>
              <span className="tooltip">
                Your average time spent in a study room in hours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle for Share Analytics */}
      <div className="share">
        <div className="share-label">
          <div className="checkbox-wrapper-5">
            <p>Share Statistics</p>
            <div className="check">
              <input
                id="check-5"
                type="checkbox"
                checked={analytics.is_sharable}
                onChange={() => toggleShareAnalytics()}
              ></input>
              <label htmlFor="check-5"></label>
            </div>
          </div>
        </div>
        <div className="button-container"></div>
      </div>
    </div>
  );
};

export default Analytics;
