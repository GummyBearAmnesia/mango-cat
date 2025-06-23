import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://127.0.0.1:8000/api"; //change if needed

/**
 * gets access token from local storage
 * @returns - access token or null
 */
export const getAccessToken = () => localStorage.getItem("access_token");
/**
 * gets refresh token from local storage
 * @returns - refresh token or null
 */
export const getRefreshToken = () => localStorage.getItem("refresh_token");

/**
 * checks if the token has expired
 * @param {*} token - the token to check
 * @returns - true if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
};

/**
 * clears storage and logs out user, redirects to login page
 */
const logoutUser = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login"; // Redirect user to login page
};

/**
 * refreshes the access token using the refresh token
 * @returns the new access token or null if refreshing failed
 */
export const refreshToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh || isTokenExpired(refresh)) {
        logoutUser();
        return null;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refresh,  //sending the refresh token in the body
        });

        //store new tokens
        localStorage.setItem("access_token", response.data.access);
        if (response.data.refresh) {
            localStorage.setItem("refresh_token", response.data.refresh);
        }

        return response.data.access;
    } catch (error) {
        console.error("Error refreshing token:", error.response?.data || error.message);
        logoutUser();
        return null;
    }
};


/**
 * makes an authenticated request
 * @param {*} url - URL to request
 * @param {*} method - HTTP method to use
 * @param {*} data - data to send with request
 * @returns - response data
 */
export const getAuthenticatedRequest = async (url, method = "GET", data = null) => {
    let token = getAccessToken();

    if (!token || isTokenExpired(token)) {
        token = await refreshToken();
        if (!token) throw new Error("Authentication failed, please log in again.");
    }

    try {
        const headers = { Authorization: `Bearer ${token}` };
        const config = { method, url: `${API_BASE_URL}${url}`, headers, data };
        console.log(`${API_BASE_URL}${url}`)

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error making authenticated request to ${url}:`, error);
        if (error.response && error.response.status === 401) {
            logoutUser();
        }
        throw error;
    }
};