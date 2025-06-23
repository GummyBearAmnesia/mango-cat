import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskItem from '../../ToDoListComponents/TaskItem';

describe('TaskItem Component', () => {
    const task = {
        id: 1,
        title: 'Test Task',
        content: 'This is a test task description',
        is_completed: false,
    };

    const toggleTaskCompletion = jest.fn();
    const handleDeleteTask = jest.fn();
    const toggleTaskDetails = jest.fn();
    const expandedTasks = { 1: false }; 

    const renderTaskItem = (expanded = false, taskProps = task) => {
        render(
            <TaskItem
                task={taskProps} 
                toggleTaskCompletion={toggleTaskCompletion}
                handleDeleteTask={handleDeleteTask}
                toggleTaskDetails={toggleTaskDetails}
                expandedTasks={{ ...expandedTasks, 1: expanded }}
            />
        );
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test case to check that all expected UI elements (task title, checkbox, delete button, etc.) are rendered
    test('renders task title, checkbox, delete button, and expand/collapse button', () => {
        renderTaskItem();

        expect(screen.getByText(task.title)).toBeInTheDocument();
        
        const checkbox = screen.getByRole('checkbox', { name: /complete test task/i });
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
        expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /task details/i })).toBeInTheDocument();
    });

    // Test case to verify that clicking the checkbox toggles task completion status
    test('checkbox toggles task completion status', () => {
        renderTaskItem();

        const checkbox = screen.getByRole('checkbox', { name: /complete test task/i });
        fireEvent.click(checkbox);
        expect(toggleTaskCompletion).toHaveBeenCalledWith(task.id);
    });

    // Test case to ensure the delete button calls the appropriate function with the task ID
    test('delete button calls handleDeleteTask with task ID', () => {
        renderTaskItem();

        const deleteButton = screen.getByRole('button', { name: /delete task/i });
        fireEvent.click(deleteButton);
        expect(handleDeleteTask).toHaveBeenCalledWith(task.id);
    });

    // Test case to ensure the expand/collapse button correctly toggles task details visibility
    test('expand/collapse button toggles task details visibility', () => {
        renderTaskItem();

        const expandButton = screen.getByRole('button', { name: /task details/i });
        fireEvent.click(expandButton);
        expect(toggleTaskDetails).toHaveBeenCalledWith(task.id);
    });

    // Test case to check if task details are correctly displayed when the task is expanded
    test('task details are visible when expanded', () => {
        renderTaskItem(true);

        expect(screen.getByText(/description:/i)).toBeInTheDocument();
        expect(screen.getByText(task.content)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /task details/i })).toBeInTheDocument();
    });

    // Test case to check if task details are correctly hidden when the task is collapsed
    test('task details are hidden when collapsed', () => {
        renderTaskItem();
        
        expect(screen.queryByText(/description:/i)).not.toBeInTheDocument();
        expect(screen.queryByText(task.content)).not.toBeInTheDocument();
    });

    // Test case to ensure task title gets a "completed" class when the task is marked as completed
    test('task title has "completed" class when task is completed', () => {
        const completedTask = {
            id: 1,
            title: 'Test Task',
            content: 'This is a test task description',
            is_completed: true,
        };
        renderTaskItem(false, completedTask);
        const taskTitle = screen.getByText(completedTask.title);
        expect(taskTitle).toHaveClass('completed');
    });

    // Test case to ensure that task details display a default message when content is empty
    test('task details show "No details available" when content is empty', () => {
        const taskWithoutContent = { ...task, content: '' };
        renderTaskItem(true, taskWithoutContent);

        expect(screen.getByText(/description:/i)).toBeInTheDocument();
        expect(screen.getByText('No details available')).toBeInTheDocument();
    });
});