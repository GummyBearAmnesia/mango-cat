import React from "react";

const TaskItem = ({
  task,
  toggleTaskCompletion,
  handleDeleteTask,
  toggleTaskDetails,
  expandedTasks,
}) => {
  return (
    <li key={task.id} className="task">
      <div className="task-item">
        <input
          type="checkbox"
          className="custom-checkbox"
          checked={task.is_completed}
          aria-label={`Complete ${task.title}`}
          onChange={() => toggleTaskCompletion(task.id)}
        />
        <span className={task.is_completed ? "completed" : ""}>
          {task.title}
        </span>

        <div className="task-item-buttons">
          {/* Delete Task Button */}
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="btn btn-danger btn-sm"
            aria-label="Delete Task"
          >
            <i className="bi bi-trash"></i>
          </button>
          {/* Expand/Collapse Button for Task Details */}
          <button
            onClick={() => toggleTaskDetails(task.id)}
            className="btn btn-info btn-sm"
            aria-label="Task Details"
          >
            {expandedTasks[task.id] ? (
              <>
                <i className="bi bi-chevron-up"></i>
              </>
            ) : (
              <>
                <i className="bi bi-chevron-down"></i>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Task Details (Only visible when expanded) */}
      {expandedTasks[task.id] && (
        <div className="task-details">
          <p>
            <strong>Description:</strong>{" "}
            {task.content || "No details available"}
          </p>
        </div>
      )}
    </li>
  );
};

export default TaskItem;
