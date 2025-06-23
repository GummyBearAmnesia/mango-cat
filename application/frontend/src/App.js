import React, { Component } from "react";
// import { w3websocket as W3CWebSocket } from "websocket";

import "./styles/App.css";
import Login from "./pages/Login";
import CalendarPage from "./pages/Calendar";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import GroupStudyPage from "./pages/GroupStudyPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/**
 * sets up navigation between pages
 * @returns - router component with defined routes
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard/:username" element={<Dashboard />} />
        <Route path="/group-study/:roomCode" element={<GroupStudyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
