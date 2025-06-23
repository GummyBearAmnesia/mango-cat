import { render, screen, waitFor } from "@testing-library/react";
import useToDoList from "../../ToDoListComponents/useToDoList";
import React from "react";
import * as authService from "../../../utils/authService";

jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));

const TestComponent = ({ isShared, listId }) => {
    const { lists, loading } = useToDoList(isShared, listId);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {lists.map((list) => (
                <div key={list.id}>{list.name}</div>
            ))}
        </div>
    );
};

describe("useToDoList Hook", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test case to verify successful fetching of non-shared lists
    test("fetches non-shared lists successfully", async () => {

        const mockLists = [
            { id: 1, name: "Personal List 1" },
            { id: 2, name: "Personal List 2" },
        ];
        authService.getAuthenticatedRequest.mockResolvedValue(mockLists);

        render(<TestComponent isShared={false} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Personal List 1")).toBeInTheDocument();
            expect(screen.getByText("Personal List 2")).toBeInTheDocument();
        });

        expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith("/todolists/");
    });

    // Test case to verify proper error handling when fetching lists fails
    test("handles error when fetching lists", async () => {
        const errorMessage = "Failed to fetch lists";
        authService.getAuthenticatedRequest.mockRejectedValue({
            response: { data: { error: errorMessage } },
        });

        console.error = jest.fn();
        render(<TestComponent isShared={false} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                "Error fetching to-do lists:",
                expect.anything()
            );
        });

        expect(screen.queryByText("Personal List 1")).not.toBeInTheDocument();
    });

    // Test case to verify successful fetching of shared lists
    test("fetches shared list successfully", async () => {
        
        const mockList = { id: 1, name: "Shared List 1" };
        authService.getAuthenticatedRequest.mockResolvedValue([mockList]);  
        render(<TestComponent isShared={true} listId={1} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Shared List 1")).toBeInTheDocument();
        });

        expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith("/todolists/1/");
    });

    // Test case to handle generic errors when fetching lists fails
    test("handles generic errors when fetching lists", async () => {
        const mockError = new Error("Network error");
        authService.getAuthenticatedRequest.mockRejectedValue(mockError);
        console.error = jest.fn();
        global.alert = jest.fn();
        render(<TestComponent isShared={false} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                "Error fetching to-do lists:",
                mockError
            );
        });
        expect(global.alert).not.toHaveBeenCalled();
        expect(screen.queryByText("Personal List 1")).not.toBeInTheDocument();
    });


});