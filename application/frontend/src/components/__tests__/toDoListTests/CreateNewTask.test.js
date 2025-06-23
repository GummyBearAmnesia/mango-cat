import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddTaskModal from "../../ToDoListComponents/CreateNewTask";
import * as authService from "../../../utils/authService";

jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));

describe("CreateNewTask", () => {

    let setAddTaskWindowMock, setListsMock;
 
    beforeAll(() => {
        global.alert = jest.fn();
        global.console.log = jest.fn();
    });

    afterAll(() => {
        global.alert.mockRestore();
        global.console.log.mockRestore();
    }); 

    beforeEach(() => {
        setAddTaskWindowMock = jest.fn();
        setListsMock = jest.fn();
        jest.clearAllMocks();
    });

    const setup = () => {
        render(
            <AddTaskModal
                addTaskWindow={true}
                setAddTaskWindow={setAddTaskWindowMock}
                listId={1}
                setLists={setListsMock}
            />
        );
    };

    const submitForm = () => {

        const titleInput = screen.getByPlaceholderText("Enter task title");
        const contentInput = screen.getByPlaceholderText("Enter task content");

        fireEvent.change(titleInput, { target: { value: "New Task" } });
        fireEvent.change(contentInput, { target: { value: "Task details" } });

        expect(titleInput.value).toBe("New Task");
        expect(contentInput.value).toBe("Task details");

        fireEvent.click(screen.getByText("Save"));
    }

     // Tests that the modal renders correctly when `addTaskWindow` is true
    test("renders modal correctly when addTaskWindow is true", () => {
        setup();

        expect(screen.getByText("Add Task")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter task title")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter task content")).toBeInTheDocument();
    });

    // Tests that the modal does not render when `addTaskWindow` is false
    test("does not render modal when addTaskWindow is false", () => {
        const { container } = render(
            <AddTaskModal
                addTaskWindow={false}
                setAddTaskWindow={setAddTaskWindowMock}
                listId={1}
                setLists={setListsMock}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    // Tests that the form is filled and submitted successfully
    test("allows input and submits the form successfully", async () => {
        authService.getAuthenticatedRequest.mockResolvedValue({
            id: 1,
            title: "New Task",
            content: "Task details",
            is_completed: false,
        });

        let updatedMockLists = [
            { id: 1, name: "List 1", tasks: [] },
            { id: 2, name: "List 2", tasks: [] },
        ];

        setListsMock.mockImplementation((updateFunc) => {
            const cloneList = JSON.parse(JSON.stringify(updatedMockLists));
            updatedMockLists = updateFunc(cloneList);
        });

        setup();
        submitForm();

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith(
                "/new_task/",
                "POST",
                {
                    list_id: 1,
                    title: "New Task",
                    content: "Task details",
                }
            );
            
        });
        await waitFor(() => expect(setListsMock).toHaveBeenCalled());
        await waitFor(() => {
            expect(updatedMockLists[0].tasks).toHaveLength(1);
            expect(updatedMockLists[0].tasks[0]).toMatchObject({
                id: 1,
                title: "New Task",
                content: "Task details",
            });
        });
        await waitFor(() => expect(setAddTaskWindowMock).toHaveBeenCalledWith(false));
    });

    // Tests that the error is handled correctly when there is a generic error with no response
    test("handles generic error without response", async () => {
        authService.getAuthenticatedRequest.mockRejectedValueOnce({
            message: "Network Error",
        });

        setup();
        submitForm();

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("An error occurred. Please try again.");
        });
        expect(setListsMock).not.toHaveBeenCalled();
        expect(setAddTaskWindowMock).not.toHaveBeenCalled();
    });

    // Tests that the error is handled correctly when the API responds with an error
    test("handles error with response", async () => {
        authService.getAuthenticatedRequest.mockRejectedValueOnce({
            response: {
                data: {
                    error: "Something went wrong with the request",
                },
            },
        });

        setup();
        submitForm();

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("Something went wrong with the request");
        });
        expect(setListsMock).not.toHaveBeenCalled();
        expect(setAddTaskWindowMock).not.toHaveBeenCalled();
    });

    // Tests that the modal closes when the cancel button is clicked
    test("closes modal on cancel button click", async() => {
        setup();
        const cancelButton = screen.getByText("Cancel");

        fireEvent.click(cancelButton);
        await waitFor(() => expect(setAddTaskWindowMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(setAddTaskWindowMock).toHaveBeenCalledWith(false));

    });

    // Tests that tasks are not added when the list is shared
    test("does not update lists when isShared is true", async () => {
        authService.getAuthenticatedRequest.mockResolvedValue({
            id: 1,
            title: "New Task",
            content: "Task details",
            is_completed: false,
        });
        render(
            <AddTaskModal
                addTaskWindow={true}
                setAddTaskWindow={setAddTaskWindowMock}
                listId={1}
                setLists={setListsMock}
                isShared={true}
            />
        );
        submitForm();
        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith(
                "/new_task/",
                "POST",
                {
                    list_id: 1,
                    title: "New Task",
                    content: "Task details",
                }
            );
        });
        await waitFor(() => expect(setListsMock).not.toHaveBeenCalled());
        await waitFor(() => expect(setAddTaskWindowMock).toHaveBeenCalledWith(false));
    });
})