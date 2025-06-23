import React from 'react';
import "../styles/Welcome.css";
import { useNavigate } from "react-router-dom";
import mangoCat from "../assets/mango_cat.png";


/*
Home or welcome page for the mango cat Study Spot website.
Features the mangocat logo, redirects for signup and login.
*/


function Welcome() {
    // userNavigate to handle page redirects
    const navigate = useNavigate();

    return (
        <div className="welcome-container">

            {/* A simple header */}
            <div className="welcome-header">
                <div></div>
                <div></div>
            </div>

            {/* A simple footer */}
            <div className="welcome-footer">
                <div></div>
                <div></div>
            </div>

            {/* mangoes...  */}
            <div className="floating-mango"></div>
            <div className="floating-mango"></div>
            <div className="floating-mango"></div>
            <div className="floating-mango"></div>

            <div className="welcome-content">
                <span className="mango-emoji top-left-mango">🥭</span>
                <span className="mango-emoji top-right-mango">🥭</span>
                <span className="mango-emoji bottom-left-mango">🥭</span>
                <span className="mango-emoji bottom-right-mango">🥭</span>

                {/* Welcome title and logo */}
                <h1 className="welcome-heading">The Study Spot</h1>
                <img src={mangoCat} alt="logo" className="welcome-image" />

                {/* Buttons which redirect to login and signup */}
                <div className="button-container">
                    <button className="login-button" onClick={() => navigate("/login")}>
                        LOGIN
                    </button>
                    <button className="create-account-button" onClick={() => navigate("/signup")}>
                        CREATE ACCOUNT 
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Welcome;