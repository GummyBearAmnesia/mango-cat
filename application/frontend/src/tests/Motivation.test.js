import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MotivationalMessage from "../pages/Motivation";
import axios from "axios";

jest.mock("axios");

describe("MotivationalMessage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Provide a default resolved mock for all tests
    axios.get.mockResolvedValue({ data: { message: "Mocked Message" } });
  }); 

  test("displays loading message initially", () => {
    render(<MotivationalMessage />);
 
    // Check if the "Loading..." message appears initially
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("displays motivational message when API call is successful", async () => {
    const mockMessage = "Keep pushing forward!";

    // Mock successful API response
    axios.get.mockResolvedValueOnce({ data: { message: mockMessage } });

    render(<MotivationalMessage />);

    // Wait for the API call to resolve and message to update
    await waitFor(() => {
      expect(screen.getByText(mockMessage)).toBeInTheDocument();
    });
  });

  test("displays error message when API call fails", async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<MotivationalMessage />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("Failed to load message")).toBeInTheDocument();
    });
  });
});
