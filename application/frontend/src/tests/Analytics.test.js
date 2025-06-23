import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Analytics from "../pages/Analytics";
import axios from "axios";
import { getAuthenticatedRequest } from "../utils/authService";

// Mock the axios module to prevent actual HTTP requests
jest.mock("axios");
// Mock getAuthenticatedRequest function from authService
jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

describe("Analytics Component", () => {
  // Before each test, set a mock token in localStorage to simulate authentication
  beforeEach(() => {
    localStorage.setItem("access_token", "mockToken");
  });

  // After each test clear all mocks and remove the mock token
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem("access_token");
  });

  // Test case 1 - makes sure stats are displayed correctly
  test("renders statistics correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });

    // Render Analytics Component
    render(<Analytics />);

    expect(screen.getByText("Statistics")).toBeInTheDocument(); // Check if Statistics header is present

    // Wait for API data to load and check that values are displayed correctly
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // Streaks
      expect(screen.getByText("4")).toBeInTheDocument(); // Avg. Study Hours
      expect(screen.getByText("Day Streak")).toBeInTheDocument();
      expect(screen.getByText("Average Hours")).toBeInTheDocument();
      expect(screen.getByText("Share Statistics")).toBeInTheDocument();
    });
  });

  // Test case 2 - makes sure that share statistics checkbox toggles
  test("toggles share statistics checkbox", async () => {
    // Mock API response data for analytics
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false, // Inititally not shareable
      },
    });

    // Mock API call for toggling share
    getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

    render(<Analytics />);

    const checkbox = await screen.findByRole("checkbox"); // Find checkbox element
    expect(checkbox).not.toBeChecked(); // Initially should be unchecked

    fireEvent.click(checkbox); // Simulate clicking the checkbox

    await waitFor(() => {
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/share_analytics/",
        "PATCH"
      );
      expect(checkbox).toBeChecked(); // Now checkbox should be checked
    });
  });

  // Test case 3 - checks that the component can handle api failures
  test("handles API failure gracefully", async () => {
    // Mock API call to fail with a network error
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Analytics />);

    // Wait and check if Statistics is still displayed
    await waitFor(() => {
      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching analytics:",
        "Network Error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test case 4 - handles case when no access token is present
  test("handles missing access token", async () => {
    localStorage.removeItem("access_token");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Analytics />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "No access token found. Please log in."
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test case 5 - handles failed share toggle request
  test("handles failed share toggle request", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });

    getAuthenticatedRequest.mockResolvedValueOnce({ status: 0 });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Analytics />);

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(getAuthenticatedRequest).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating task status"
      );
      expect(checkbox).not.toBeChecked(); // Should remain unchecked on failure
    });

    consoleErrorSpy.mockRestore();
  });

  // Test case 6 - verifies tooltips are present
  test("displays correct tooltips", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });

    render(<Analytics />);

    await waitFor(() => {
      const infoIcons = screen.getAllByText("i");
      expect(infoIcons.length).toBe(2);

      fireEvent.mouseOver(infoIcons[0]);
      expect(
        screen.getByText("Number of consecutive days you've studied")
      ).toBeInTheDocument();

      fireEvent.mouseOver(infoIcons[1]);
      expect(
        screen.getByText("Your average time spent in a study room in hours")
      ).toBeInTheDocument();
    });
  });

  // Test case 7 - handles error response from analytics API
  test("handles error response from analytics API", async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { message: "Unauthorized" },
      },
    };
    axios.get.mockRejectedValueOnce(errorResponse);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Analytics />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching analytics:",
        401
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test case 8 - verifies initial state is set correctly
  test("initializes with default state", () => {
    render(<Analytics />);

    // Check for initial values before API response
    expect(screen.getByTestId("streaks-test")).toBeInTheDocument(); // Streaks default
    expect(screen.getByTestId("avg-time-test")).toBeInTheDocument(); // Avg hours default
  });
});
