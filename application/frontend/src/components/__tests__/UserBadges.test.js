import { render, screen, waitFor } from "@testing-library/react";
import UserBadges from "../UserBadges";
import axios from "axios";
import React from "react";
import { act } from "react-dom/test-utils";

jest.mock("axios");

describe("UserBadges Component", () => {
  const mockEarnedBadges = [
    { reward_number: 1, date_earned: "2024-03-15T00:00:00Z" },
    { reward_number: 3, date_earned: "2024-03-18T00:00:00Z" },
    { reward_number: 5, date_earned: "2024-03-20T00:00:00Z" }
  ];

  beforeEach(() => {
    localStorage.setItem("access_token", "test-token");
    axios.get.mockResolvedValue({ data: { earned_badges: mockEarnedBadges } });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Basic rendering tests
  test("renders the component container", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    expect(screen.getByTestId("user-badges-container")).toBeInTheDocument();
  });

  test("displays all 8 badge images", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    expect(screen.getAllByRole('img')).toHaveLength(8);
  });

  // Badge state tests
  test("shows correct number of earned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    
    await waitFor(() => {
      const earnedBadges = screen.getAllByText(/Earned:/);
      expect(earnedBadges).toHaveLength(mockEarnedBadges.length);
    });
  });

  test("formats earned badge dates correctly", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      const earnedBadges = screen.getAllByText(/Earned:/);
      earnedBadges.forEach(badge => {
        const textContent = badge.textContent.replace(/\s+/g, ' ').trim();
        expect(textContent).toMatch(/Earned: \d{1,2}\/\d{1,2}\/\d{4}/);
      });
    });
  });

  test("shows correct number of unearned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      const unearnedBadges = screen.getAllByText("Not yet earned");
      expect(unearnedBadges).toHaveLength(8 - mockEarnedBadges.length);
    });
  });

  // Styling tests
  test("applies correct styling to earned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const earnedBadge = await screen.findByAltText("Badge 1 Hour");
    expect(earnedBadge).toHaveStyle("opacity: 1");
    expect(earnedBadge).toHaveStyle("filter: drop-shadow(0 0 4px #f2e2ba)");
  });

  test("applies correct styling to unearned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const unearnedBadge = await screen.findByAltText("Badge 30 Hours");
    expect(unearnedBadge).toHaveStyle("opacity: 0.4");
    expect(unearnedBadge).toHaveStyle("filter: grayscale(100%)");
  });

  // Authentication tests
  test("handles missing access token", async () => {
    localStorage.removeItem("access_token");

    await act(async () => {
      render(<UserBadges />);
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  // API response tests
  test("handles empty API response data", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Not yet earned")).toHaveLength(8);
    });
  });

  test("handles null API response", async () => {
    axios.get.mockResolvedValueOnce({ data: null });

    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Not yet earned")).toHaveLength(8);
    });
  });

  // Error handling tests
  describe("Error handling", () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test("logs API error with status code", async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: "Server Error" }
        }
      };
      axios.get.mockRejectedValueOnce(mockError);

      await act(async () => {
        render(<UserBadges />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching badges:",
          500
        );
      });
    });

    test("logs network error with message", async () => {
      const mockError = new Error("Network Error");
      axios.get.mockRejectedValueOnce(mockError);

      await act(async () => {
        render(<UserBadges />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching badges:",
          "Network Error"
        );
      });
    });

    test("logs error with response but no status", async () => {
      const mockError = {
        response: {
          data: { message: "Unexpected Error" }
        }
      };
      axios.get.mockRejectedValueOnce(mockError);

      await act(async () => {
        render(<UserBadges />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching badges:",
          undefined
        );
      });
    });
  });

  // Badge content tests
  test("displays correct hour labels for all badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const hourLabels = [
      "1 Hour", "5 Hours", "15 Hours", "30 Hours",
      "50 Hours", "75 Hours", "100 Hours", "150 Hours"
    ];

    hourLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});