import React, { useState } from "react";
import "../../styles/toDoList/CreateNewList.css";
import { getAuthenticatedRequest } from "../../utils/authService";

// AddListModal is a modal component for adding a new to-do list
const AddListModal = ({ addListWindow, setAddListWindow, setLists }) => {
  // Local state to store form data for the new list (name and shared status)
  const [formData, setFormData] = useState({ name: "", isShared: false });

  // Handle form submission, saves the list and resets the form
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveList(formData);
    setFormData({ name: "", isShared: false });
  };

  // Handle input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to handle saving the new to-do list via an API request and locally
  const handleSaveList = async (newList) => {
    console.log("Saving list with data:", newList);
    try {
      const response = await getAuthenticatedRequest("/new_list/", "POST", {
        name: newList.name,
        is_shared: newList.isShared,
      });
      
      const newListWithTasks = {
        id: response.listId,
        name: response.name, 
        is_shared: response.isShared, 
        tasks: [],
      };

      setLists((prevLists) => [...prevLists, newListWithTasks]);
      setAddListWindow(false);
      console.log("List Created:", response);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.error);
      } else {
        alert("An error occurred. Please try again.");
      }
    }
  };

  // Handle cancel action by resetting form data and closing the modal
  const handleCancel = () => {
    setFormData({ name: "", isShared: false });
    setAddListWindow(false);
  };

        if (!addListWindow) return null;
        return (
            <div role="dialog" className="modal-overlay add-list-modal">
                <div className="modal-content">
                    <h4>Add List</h4>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter list title"
                            required
                        />

                        <div>
                            <button type="submit" className="btn btn-primary">Save</button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

export default AddListModal;
