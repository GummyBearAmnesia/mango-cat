import React, { useState, useEffect } from "react";
import axios from "axios";
import { Navigate, useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAuthenticatedRequest, getAccessToken } from "../utils/authService";

/*
This is the login page, handles user authentication and redirects to the user's dashboard
*/

function Login() {

  const navigate = useNavigate();

  // fields that the user will input
  const [formData, setFormData] = useState({ email: "", password: "" });

  // store login errors
  const [error, setError] = useState("");


  // Track the logged-in user
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Check if a user is already logged in
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) {
      setLoggedInUser(user);
      toast.info(
        `You are already logged in as ${user.username}. Please log out first, or refresh the page.`
      );
    }

    // Add event listener for beforeunload
    const handleBeforeUnload = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("loggedInUser");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // when the username/password fields are edited, update form data
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // when the login button is clicked - send form data to backend django form
  const handleLogin = async () => {
    setError("");

    // Check if a user is already logged in
    const existingUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (existingUser) {
      toast.error(
        `You are already logged in as ${existingUser.username}. Please log out first, or refresh the page`
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        formData, // Contains email and password
        { headers: { "Content-Type": "application/json" } } // No Authorization header here
      );

      // Store tokens in localStorage
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("user_id", response.data.userId);

      // Store the logged-in user in localStorage
      const user = { email: formData.email, username: response.data.username };
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      setLoggedInUser(user);

      toast.success("Login Successful!", {
        hideProgressBar: true,
      });

      console.log(" Look here: ", response.data.username);
      setTimeout(() => {
        navigate(`/dashboard/${response.data.username}`, {
          state: { userName: response.data.username },
        });
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-center" />
      <Link to="/">
        <h1 className="login-heading1">The Study Spot</h1>
      </Link>
      <form className="login-form">
        <h1 className="login-heading2">Login</h1>
        {error && <p className="error-message">{error}</p>}{" "}
        {/* Show error if login fails */}
        <label className="username-text" data-testid='email-label'>Email:</label>
        <input
          type="text"
          data-testid="email-input-field"
          name="email"
          className="username-field"
          value={formData.email}
          onChange={handleChange}
        />
        <label className="password-text" data-testid='password-label'>Password:</label>
        <input
          type="password"
          data-testid="password-input-field"
          name="password"
          className="password-field"
          value={formData.password}
          onChange={handleChange}
        />
        <button
          type="button"
          data-testid='login-click-button'
          className="login-submit-button"
          onClick={handleLogin}
        >
          LOGIN
        </button>
      </form>
    </div>
  );
}

export default Login;
