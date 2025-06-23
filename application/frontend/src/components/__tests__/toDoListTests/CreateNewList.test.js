import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddListModal from "../../ToDoListComponents/CreateNewList";
import * as authService from "../../../utils/authService";

jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));
describe("CreateNewList", () => {

    let setAddListWindowMock, setListsMock;
 
    beforeAll(() => {
        global.alert = jest.fn(); 
        global.console.log = jest.fn();
    });

    afterAll(() => {
        global.alert.mockRestore();
        global.console.log.mockRestore();
    });
 
    beforeEach(() => {
        setAddListWindowMock = jest.fn();
        setListsMock = jest.fn();
        jest.clearAllMocks();
    });
 

    const submitForm = () => {
        const titleInput = screen.getByPlaceholderText("Enter list title");
        
        fireEvent.change(titleInput, { target: { value: "New List" } });
        
        expect(titleInput.value).toBe("New List");
        
        fireEvent.click(screen.getByText("Save"));
    }

    const setup = () => {
        render(
            <AddListModal
                addListWindow={true}
                setAddListWindow={setAddListWindowMock}
                setLists={setListsMock}
            />
        );
    };

    // Tests the modal renders correctly when `addListWindow` is true
    test("renders modal correctly when addListWindow is true", () => {
        setup();

        expect(screen.getByText("Add List")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter list title")).toBeInTheDocument();
    });

    // Tests the modal does not render when `addListWindow` is false
    test("does not render modal when addListWindow is false", () => {
        const { container } = render(
            <AddListModal
                addListWindow={false}
                setAddListWindow={setAddListWindowMock}
                setLists={setListsMock}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    // Tests if the form is filled and submitted successfully
    test("allows input and submits the form successfully", async () => {
        authService.getAuthenticatedRequest.mockResolvedValue({
            listId: 2,
            name: "New List",
            isShared: true
        });
        let updatedMockLists = [
            { id: 1, name: "List 1", tasks: [] },
        ];

        setListsMock.mockImplementation((updateFunc) => {
            updatedMockLists = updateFunc(updatedMockLists);
        });
        
        setup();
        submitForm();

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith(
                "/new_list/",
                "POST",
                {
                    name: "New List",
                    is_shared: false,
                }
            );
        });
        await waitFor(() => expect(setListsMock).toHaveBeenCalled());
        await waitFor(() => {
            expect(updatedMockLists).toHaveLength(2);
            expect(updatedMockLists[1]).toMatchObject({
                id: 2,
                name: "New List",
                tasks: [],
            });
        });
        await waitFor(() => expect(setAddListWindowMock).toHaveBeenCalledWith(false));
    });

    // Tests handling a generic error when there's no response from the API
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
        expect(setAddListWindowMock).not.toHaveBeenCalled();
    });

    // Tests handling a specific error with a response from the API
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
        expect(setAddListWindowMock).not.toHaveBeenCalled();
    });

    // Tests that the modal closes when the cancel button is clicked
    test("closes modal on cancel button click", async () => {
        setup();
        const cancelButton = screen.getByText("Cancel");

        fireEvent.click(cancelButton);
        await waitFor(() => expect(setAddListWindowMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(setAddListWindowMock).toHaveBeenCalledWith(false));

    });
})