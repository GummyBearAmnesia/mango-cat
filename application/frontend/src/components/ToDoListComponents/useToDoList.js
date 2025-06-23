import { useState, useEffect } from 'react';
import { getAuthenticatedRequest } from "../../utils/authService";

// Custom hook for fetching to-do lists and managing their state
const useToDoList = (isShared, listId) => {
    // State to store the to-do lists and loading status
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect hook to fetch the to-do list data when component mounts or when isShared/listId changes
    useEffect(() => {
        // Function to fetch data from API based on the shared status or list ID
        const fetchData = async () => {
            try {
                let data;
                if (!isShared) {
                    data = await getAuthenticatedRequest(`/todolists/`);
                } else {
                    data = await getAuthenticatedRequest(`/todolists/${listId}/`);
                }
                setLists(data);
            } catch (error) {
                if (error.response) {
                    alert(error.response.data.error);
                }
                console.error("Error fetching to-do lists:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isShared, listId]);

    // Return the state values and setter function for the lists
    return { lists, loading, setLists };
};

export default useToDoList;
