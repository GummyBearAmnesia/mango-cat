import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ProfileBox from "../pages/ProfileBox";
import { BrowserRouter as Router } from "react-router-dom";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getAuthenticatedRequest } from "../utils/authService";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import defaultAvatar from "../assets/avatars/avatar_2.png";

//mock the necessary modules
jest.mock("../utils/authService");
jest.mock("firebase/storage");
jest.mock("../firebase-config.js");
jest.mock("react-toastify", () => {
  const actual = jest.requireActual("react-toastify"); // Preserve the actual module
  return {
    ...actual, // Spread actual exports
    toast: {
      error: jest.fn(),
      success: jest.fn(),
    },
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("ProfileBox", () => {
  let navigateMock;
  beforeEach(() => {
    getAuthenticatedRequest.mockResolvedValue({
      username: "testuser",
      description: "Test Description",
    });

    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) => (key === "user_id" ? "123" : null)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    getDownloadURL.mockResolvedValue("https://example.com/avatar.png");
    uploadBytes.mockResolvedValue();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["avatar"])), // Mock the blob response
      })
    );
  });

  test("renders ProfileBox component", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("testuser")).toBeInTheDocument()
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    expect(
      screen.getByPlaceholderText("Please Enter Description")
    ).toBeInTheDocument();
  });

  test("updates description", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const descriptionTextarea = screen.getByPlaceholderText(
      "Please Enter Description"
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: "New Description" },
    });

    expect(descriptionTextarea.value).toBe("New Description");

    const saveButton = screen.getByText("SAVE DESCRIPTION");
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/description/",
        "PUT",
        { description: "New Description" }
      )
    );
  });

  test("handles avatar upload", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    const uploadLabel = screen.getByText("UPLOAD AVATAR");
    await act(async () => {
      fireEvent.click(uploadLabel);
    });
    //find the hidden file input and simulate file selection
    const input = screen.getByTestId("file-input");
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } }); // Simulate file selection
    });

    await waitFor(() => expect(uploadBytes).toHaveBeenCalled());
    await waitFor(() => expect(getDownloadURL).toHaveBeenCalled());
  });

  test("handles default avatar selection", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const defaultAvatarButton = screen.getByText("DEFAULT AVATARS");
    fireEvent.click(defaultAvatarButton);

    const avatarImage = screen.getByAltText("Avatar 1");
    fireEvent.click(avatarImage);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => expect(uploadBytes).toHaveBeenCalled());
    await waitFor(() => expect(getDownloadURL).toHaveBeenCalled());
  });

  test("fetches user badges", async () => {
    getAuthenticatedRequest.mockResolvedValueOnce([
      { reward_number: 1, date_earned: "2023-01-01" },
      { reward_number: 2, date_earned: "2023-02-01" },
    ]);

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const inventoryButton = screen.getByLabelText("View Badge Collection");
    fireEvent.click(inventoryButton);

    await waitFor(() =>
      expect(screen.getByText("Your Badge Collection")).toBeInTheDocument()
    );
    expect(screen.getByText("1 Hour")).toBeInTheDocument();
    expect(screen.getByText("5 Hours")).toBeInTheDocument();
  });

  test("logs off user", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const logoffButton = screen.getByText("Logout");
    fireEvent.click(logoffButton);

    await waitFor(() =>
      expect(localStorage.removeItem).toHaveBeenCalledWith("access_token")
    );
    await waitFor(() =>
      expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token")
    );
  });

  test("handles error fetching user data", async () => {
    getAuthenticatedRequest.mockRejectedValueOnce(
      new Error("error fetching user data")
    );

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("error fetching user data")
    );
  });

  test("handles error when no valid user id or file selected", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const uploadLabel = screen.getByText("UPLOAD AVATAR");
    await act(async () => {
      fireEvent.click(uploadLabel);
    });

    const input = screen.getByTestId("file-input");
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } }); //empty file
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "no valid user id or file selected"
      )
    );
  });

  test("handles error uploading avatar", async () => {
    uploadBytes.mockRejectedValueOnce(new Error("error uploading avatar"));

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const uploadLabel = screen.getByText("UPLOAD AVATAR");
    await act(async () => {
      fireEvent.click(uploadLabel);
    });

    const input = screen.getByTestId("file-input");
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("error uploading avatar")
    );
  });

  test("handles error updating description", async () => {
    getAuthenticatedRequest.mockResolvedValueOnce({
      username: "testuser",
      description: "Test Description",
    });
    getAuthenticatedRequest.mockRejectedValueOnce(
      new Error("error updating description")
    );

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const descriptionTextarea = screen.getByPlaceholderText(
      "Please Enter Description"
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: "New Description" },
    });

    const saveButton = screen.getByText("SAVE DESCRIPTION");
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("error updating description")
    );
  });

  test("handles error selecting avatar from defaults", async () => {
    uploadBytes.mockRejectedValueOnce(
      new Error("error selecting avatar from defaults")
    );

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const defaultAvatarButton = screen.getByText("DEFAULT AVATARS");
    fireEvent.click(defaultAvatarButton);

    const avatarImage = screen.getByAltText("Avatar 1");
    fireEvent.click(avatarImage);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "error selecting avatar from defaults"
      )
    );
  });

  test("handles error fetching user badges", async () => {
    getAuthenticatedRequest.mockResolvedValueOnce({
      username: "testuser",
      description: "Test Description",
    });
    getAuthenticatedRequest.mockRejectedValueOnce(
      new Error("error fetching user badges")
    );

    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    const inventoryButton = screen.getByLabelText("View Badge Collection");
    fireEvent.click(inventoryButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("error fetching user badges")
    );
  });

  test("clicking modal close hides modal", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const showMoreButton = screen.getByTestId("show-more-button");
    fireEvent.click(showMoreButton);

    expect(screen.getByText("UPLOAD AVATAR")).toBeInTheDocument();
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("UPLOAD AVATAR")).not.toBeInTheDocument();
  });

  test("clicking close inventory hides inventory", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    const inventoryButton = screen.getByLabelText("View Badge Collection");
    fireEvent.click(inventoryButton);

    expect(screen.getByText("Your Badge Collection")).toBeInTheDocument();
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("Your Badge Collection")).not.toBeInTheDocument();
  });

  test("navigates to calendar with user_id from localStorage", () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    // Simulate clicking a button that triggers gotoCalendar
    const calendarButton = screen.getByTestId("calendar-button-profile"); // Adjust this to match your button's test ID
    fireEvent.click(calendarButton);

    // Verify localStorage.getItem was called
    expect(localStorage.getItem).toHaveBeenCalledWith("user_id");

    // Verify navigate was called with the correct arguments
    expect(navigateMock).toHaveBeenCalledWith("/calendar/", {
      state: { userId: "123" },
    });
  });

  test("fetches profile picture and uses default avatar if not found", async () => {
    render(
      <Router>
        <ProfileBox />
      </Router>
    );

    // Mock getDownloadURL to reject with an error (simulate image not found)
    getDownloadURL.mockRejectedValueOnce(new Error("Image not found"));

    // Wait for the component to fall back to the default avatar
    await waitFor(() => {
      const profileImage = screen.getByTestId("image-profile-src");
      expect(profileImage).toHaveAttribute("src", defaultAvatar);
    });
  });
});
