import axios from 'axios'

/*
Creates an instance of Axios for making REST API calls to backend
*/


// Base URL for api calls
const myBaseUrl = 'http://127.0.0.1:8000/';

const AxiosInstance = axios.create({
    baseURL: myBaseUrl,

    // Request will timeout and fail if it takes longer than 10 seconds
    timeout: 10000,

    // Sets JSON content type for API requests
    headers: {
        "Content-Type":"application/json",
        accept: "application/json"
    }
}); 

export default AxiosInstance
