import React, { useState } from "react";
import AllFriends from "./AllFriends";
import PendingRequests from "./PendingRequests";
import FriendsRequested from "./FriendsRequested";
import SearchFriends from "./SearchFriends";
import "../../styles/friends/FriendsTab.css";
import "../../styles/Dashboard.css";

 // Importing the FriendsProvider to wrap the component with the context provider
import { FriendsProvider } from './FriendsContext';

const FriendsTab = () => {
    // State to manage which tab is currently active, default is "all" friends
    const [activeTab, setActiveTab] = useState("all");

    return (
        <FriendsProvider>
            <div className="dashboard-panel friends-tab">
            {/* Tab Navigation */}
            <div className="tabs">
                <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
                    All Friends
                </button>
                <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
                    Pending Requests
                </button>
                <button className={activeTab === "sent" ? "active" : ""} onClick={() => setActiveTab("sent")}>
                    Sent Requests
                    </button>
                    <button className={activeTab === "search" ? "active" : ""} onClick={() => setActiveTab("search")}>
                    Search Friends
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === "all" && <AllFriends />}
                {activeTab === "pending" && <PendingRequests />}
                {activeTab === "sent" && <FriendsRequested />}
                {activeTab === "search" && <SearchFriends />}
            </div>
            </div>
        </FriendsProvider>
    );
};

export default FriendsTab;
