import React from 'react';
import "../styles/Dashboard.css";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CalendarPage from './Calendar';
import ToDoList from '../components/ToDoListComponents/newToDoList';
import StudyRoomComponent from '../components/StudyRoomComponent';
import Analytics from './Analytics';
import FriendsTab  from '../components/friends/FriendsTab';
import ProfileBox from './ProfileBox';

/*
This handles the layout of the dashboard page and loads in all the components as panels
*/


function Dashboard() {

    // useNavigate to handle navigation to other pages from the dashboard
    const navigate = useNavigate();


    return (
        <div className='dashboard-container'>
            <h1 className="dashboard-heading">Dashboard</h1> {/* A simple heading */}

            {/* This is where all the main components will go*/}
            {/* Left panel - main panel - right panel*/}

            <div className = "dashboard-content" data-testid="dashboard-content-test">

                {/* Left Panel - Profile & Analytics */}
                <div className = "dashboard-left-panel" data-testid="left-panel">
                    <div className="dashboard-panel"><ProfileBox /></div>
                    <Analytics />
                </div>

                {/* Middle Panel - Join Study Room & Friends Tab */}
                <div className = "dashboard-main-panel" data-testid="main-panel">
                    <StudyRoomComponent />
                    <FriendsTab />
                </div>

                {/* Right Panel - To Do List */}
                <div className = "dashboard-right-panel" data-testid="right-panel">
                    <div className = "to-do-list" ><ToDoList
                        isShared={false}
                        listData={[]}
                    />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
