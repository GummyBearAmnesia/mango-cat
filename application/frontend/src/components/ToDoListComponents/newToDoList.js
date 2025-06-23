    import React, { useState } from 'react';
import { getAuthenticatedRequest } from "../../utils/authService";
import "../../styles/toDoList/ToDoList.css";
import AddTaskModal from "./CreateNewTask";
import AddListModal from "./CreateNewList";
import useWebSocket from './useWebSocket';
import useToDoList from './useToDoList';
import TaskItem from './TaskItem';

// The ToDoList component is responsible for rendering and managing to-do lists and tasks.
// It handles both shared and individual lists, allowing users to add, delete, and toggle task completion.
const ToDoList = ({ isShared, listId = undefined, socket, roomCode = undefined }) => {
    
    // The ToDoList component is responsible for rendering and managing to-do lists and tasks.
    // It handles both shared and individual lists, allowing users to add, delete, and toggle task completion.
    const { lists, loading, setLists } = useToDoList(isShared, listId);
    const [addTaskWindow, setAddTaskWindow] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const [addListWindow, setAddListWindow] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState({});

    // WebSocket integration to allow real-time updates of the to-do list tasks when shared
    useWebSocket(isShared, socket, listId, setLists, roomCode);

    // Functionality to handle toggling task completion, sending updates via WebSocket if shared
    const toggleTaskCompletion = async (taskId) => {
        try {
            const task = await getAuthenticatedRequest(`/update_task/${taskId}/`, "PATCH");

            if (isShared && socket.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: "toggle_task",
                    task_id: taskId,
                    is_completed: !task.is_completed,
                });
                socket.send(message);
            }
            if (!isShared) {
                setLists(prevLists =>
                    prevLists.map(list => ({
                        ...list,
                        tasks: list.tasks.map(task =>
                            task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
                        )
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching to-do lists:", error);
        }
    };

    // Handle task deletion, update the list locally and through WebSocket if shared
    const handleDeleteTask = async (taskId) => {
        try {
            const data = await getAuthenticatedRequest(`/delete_task/${taskId}/`, "DELETE");
            console.log(data.data)

            if (isShared && socket.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: "remove_task",
                    task_id: taskId,
                });
                socket.send(message);
            } else {
                setLists(prevLists =>
                    prevLists.map(list => ({
                        ...list,
                        tasks: list.tasks.filter(task => task.id !== taskId) // Remove the deleted task from tasks array
                    })))
            }

        } catch (error) {
            console.error("Error fetching to-do lists:", error);
        }
    };

    // Handle list deletion for non-shared lists
    const handleDeleteList = async (listId) => {
        try {
            const data = await getAuthenticatedRequest(`/delete_list/${listId}/`, "DELETE");
            setLists(data);
        } catch (error) {
            console.error("Error fetching to-do lists:", error);
        } 
    };

    // Handle adding a task to a specific list
    const handleAddTask = (listId) => {
        setSelectedListId(listId);
        setAddTaskWindow(true);

        if (isShared && socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type: "add_task", list_id: listId });
            socket.send(message);
        }
    };

    // Handle adding a new list
    const handleAddList = () => {
        setAddListWindow(true);
    };

    // Toggle full-screen view for displaying the to-do list
    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // Manage task expansion for viewing additional task details
    const toggleTaskDetails = (taskId) => {
        setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    // Loading state for displaying a loading message while fetching the to-do lists
    if (loading) return <div>Loading To-Do Lists...</div>;

    return (
        <div className={isFullScreen ? "todo-container full-screen" : "todo-container"}>
            <div className="todo-header">
                <h3>To-Do Lists</h3>
                {!isShared ? (
                    <div className="header-buttons">
                        <button onClick={handleAddList} className="btn btn-success btn-sm" aria-label="Add List">
                            <i className="bi bi-plus-circle"></i>
                        </button>
                        <button onClick={toggleFullScreen} className="full-screen-btn">
                            {isFullScreen ? (
                                <>
                                    <i className="bi bi-box-arrow-in-down"></i> Exit View
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrows-fullscreen">View All</i>
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </div>
            <div className="todo-list">
            {lists.map((list) => (
                <div className="todo-card" key={list.id}>
                    <div className="todo-card-header">
                        <button onClick={() => handleAddTask(list.id)} className="btn btn-success btn-sm" aria-label='add task'>
                            <i className="bi bi-plus-circle"></i>
                        </button>
                        {!isShared ? (
                            <button onClick={() => handleDeleteList(list.id)} className="btn btn-danger btn-sm" aria-label='delete list'>
                                <i className="bi bi-trash"></i>
                            </button>
                        ) : (<></>)
                        }
                    </div>

                    <h4>{list.name}</h4>
                    <ul>
                        {list.tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                toggleTaskCompletion={toggleTaskCompletion}
                                handleDeleteTask={handleDeleteTask}
                                toggleTaskDetails={toggleTaskDetails}
                                expandedTasks={expandedTasks}
                            />
                        ))}
                    </ul>
                </div>
            ))}
            </div>

            <AddTaskModal
                addTaskWindow={addTaskWindow}
                setAddTaskWindow={setAddTaskWindow}
                listId={selectedListId}
                setLists={setLists}
                isShared={isShared}
            />

            {!isShared && (
                <AddListModal addListWindow={addListWindow} setAddListWindow={setAddListWindow} setLists={setLists} />
            )}
        </div>
    );
};

export default ToDoList;
