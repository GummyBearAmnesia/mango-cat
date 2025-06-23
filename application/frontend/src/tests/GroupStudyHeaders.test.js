import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useNavigate, useLocation } from "react-router-dom";
import GroupStudyHeader from "../components/GroupStudyHeader";
import { toast } from "react-toastify";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../firebase-config", () => ({
  storage: {},
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  listAll: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock("../components/SpotifyButton", () => () => <div>SpotifyButton</div>);
jest.mock("../components/FloatingWindow.js", () => () => (
  <div>FloatingMusicPlayer</div>
));

//mock the necessary modules
jest.mock("../pages/Analytics", () => () => <div>Mocked Analytics</div>);
jest.mock("../components/ToDoListComponents/newToDoList", () => () => (
  <div>Mocked ToDoList</div>
));
jest.mock("axios");
jest.mock("@fontsource/vt323", () => {});
jest.mock("@fontsource/press-start-2p", () => {});
jest.mock("../firebase-config.js");
jest.mock("../assets/blueberry.jpeg", () => "blueberry.jpeg");
jest.mock("../assets/generate.PNG", () => "generate.PNG");
jest.mock("@fullcalendar/react", () => (props) => (
  <div>
    <button onClick={props.customButtons?.addEventButton?.click}>
      Add Event
    </button>
    {props.events?.map((event) => (
      <div key={event.id}>{event.title}</div>
    ))}
  </div>
));

jest.mock("@fullcalendar/daygrid", () => () => <div>Mocked DayGridPlugin</div>);
jest.mock("@fullcalendar/timegrid", () => () => (
  <div>Mocked TimeGridPlugin</div>
));

jest.mock("@mui/material", () => ({
  Dialog: ({ children, open, onClose }) =>
    open ? (
      <div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogContent: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
  // ... other MUI components
}));
/*
jest.mock("@mui/material", () => ({
  Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogContent: ({ children }) => <div>{children}</div>,
  Button: ({ children }) => <button>{children}</button>,
}));
*/

jest.mock("@mui/icons-material/PlayArrow", () => "PlayArrowIcon");
jest.mock("@mui/icons-material/Pause", () => "PauseIcon");
jest.mock("@mui/icons-material/SkipNext", () => "SkipNextIcon");

jest.mock(
  "../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3",
  () => "mock-audio-file-1"
);
jest.mock(
  "../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3",
  () => "mock-audio-file-2"
);
jest.mock(
  "../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3",
  () => "mock-audio-file-3"
);
jest.mock(
  "../assets/music/Defqwop - Heart Afire (feat. Strix).mp3",
  () => "mock-audio-file-4"
);
jest.mock(
  "../assets/music/[Rhythm Root] Wii Shop Channel Main Theme (HQ).mp3",
  () => "mock-audio-file-5"
);
jest.mock(
  "../assets/music/[K.K. Slider] Bubblegum K.K. - K.K. Slider.mp3",
  () => "mock-audio-file-6"
);
jest.mock(
  "../assets/music/[Gyro Zeppeli] Pokemon X & Y-Bicycle theme [OST].mp3",
  () => "mock-audio-file-7"
);

// Mock assets
jest.mock("../assets/music_logo.png", () => "music_logo.png");
jest.mock("../assets/customisation_logo.png", () => "customisation_logo.png");
jest.mock("../assets/copy_logo.png", () => "copy_logo.png");
jest.mock("../assets/exit_logo.png", () => "exit_logo.png");

describe("GroupStudyHeader", () => {
  const mockNavigate = jest.fn();
  const mockLocation = {
    state: {
      roomCode: "TEST123",
      roomName: "Test Room",
      roomList: [],
    },
  };

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with room information", () => {
    render(<GroupStudyHeader />);

    expect(screen.getByText("Study Room: Test Room")).toBeInTheDocument();
    expect(screen.getByText("Code: TEST123")).toBeInTheDocument();
    expect(screen.getByAltText("Music")).toBeInTheDocument();
    expect(screen.getByAltText("Customisation")).toBeInTheDocument();
    expect(screen.getByAltText("Copy")).toBeInTheDocument();
    expect(screen.getByAltText("Exit")).toBeInTheDocument();
  });

  it("handles copy room code successfully", async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValueOnce(undefined),
      },
    });

    render(<GroupStudyHeader />);
    await fireEvent.click(screen.getByAltText("Copy"));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("TEST123");
    expect(toast.success).toHaveBeenCalledWith("Code copied to clipboard!", {
      position: "top-center",
      autoClose: 1000,
      closeOnClick: true,
      pauseOnHover: true,
    });
  });

  it("shows error when copy fails", async () => {
    // Mock clipboard API failure
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockRejectedValueOnce(new Error("Failed to copy")),
      },
    });

    render(<GroupStudyHeader />);
    await act(async () => {
      await fireEvent.click(screen.getByAltText("Copy"));
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to copy code!");
  });

  it("toggles music dialog when music button is clicked", () => {
    render(<GroupStudyHeader />);

    // Initial state - dialog should be closed
    expect(screen.queryByText("Spotify Player")).not.toBeInTheDocument();

    // Click music button to open dialog
    fireEvent.click(screen.getByAltText("Music"));
    expect(screen.getByText("Spotify Player")).toBeInTheDocument();
    expect(
      screen.getByText("(playback for premium users only)")
    ).toBeInTheDocument();
    expect(screen.getByText("SpotifyButton")).toBeInTheDocument();
    expect(screen.getByText("Switch to Free Tracks")).toBeInTheDocument();

    // Click again to close (since it's a toggle)
    fireEvent.click(screen.getByAltText("Music"));
    expect(screen.queryByText("Spotify Player")).not.toBeInTheDocument();
  });

  it("handles button active states on mouse events", () => {
    render(<GroupStudyHeader />);

    const musicButton = screen.getByAltText("Music").closest("button");
    const customButton = screen.getByAltText("Customisation").closest("button");
    const copyButton = screen.getByAltText("Copy").closest("button");
    const exitButton = screen.getByAltText("Exit").closest("button");

    // Test music button
    fireEvent.mouseDown(musicButton);
    expect(musicButton).toHaveClass("active");
    fireEvent.mouseUp(musicButton);
    expect(musicButton).not.toHaveClass("active");

    // Test custom button
    fireEvent.mouseDown(customButton);
    expect(customButton).toHaveClass("active");
    fireEvent.mouseUp(customButton);
    expect(customButton).not.toHaveClass("active");

    // Test copy button
    fireEvent.mouseDown(copyButton);
    expect(copyButton).toHaveClass("active");
    fireEvent.mouseUp(copyButton);
    expect(copyButton).not.toHaveClass("active");

    // Test exit button
    fireEvent.mouseDown(exitButton);
    expect(exitButton).toHaveClass("active");
    fireEvent.mouseUp(exitButton);
    expect(exitButton).not.toHaveClass("active");
  });

  it("resets button active state when mouse leaves", () => {
    render(<GroupStudyHeader />);

    const musicButton = screen.getByAltText("Music").closest("button");

    fireEvent.mouseDown(musicButton);
    expect(musicButton).toHaveClass("active");

    fireEvent.mouseLeave(musicButton);
    expect(musicButton).not.toHaveClass("active");
  });

  it("handles exit room functionality", async () => {
    const mockGetAuthenticatedRequest = jest
      .fn()
      .mockResolvedValueOnce({ participantsList: [{}, {}] }) // First call for get-participants
      .mockResolvedValueOnce({ status: 200, username: "testuser" }); // Second call for leave-room

    require("../utils/authService").getAuthenticatedRequest =
      mockGetAuthenticatedRequest;

    render(<GroupStudyHeader />);
    await fireEvent.click(screen.getByAltText("Exit"));

    // Wait for async operations
    await Promise.resolve();

    expect(mockGetAuthenticatedRequest).toHaveBeenCalledWith(
      `/get-participants/?roomCode=TEST123`,
      "GET"
    );
    expect(mockGetAuthenticatedRequest).toHaveBeenCalledWith(
      "/leave-room/",
      "POST",
      { roomCode: "TEST123" }
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/testuser", {
      state: { userName: "testuser" },
    });
  });

  it("deletes firebase files when last participant leaves", async () => {
    const mockGetAuthenticatedRequest = jest
      .fn()
      .mockResolvedValueOnce({ participantsList: [{}] }) // Only one participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    const mockListAll = jest
      .fn()
      .mockResolvedValue({ items: ["file1", "file2"] });
    const mockDeleteObject = jest.fn().mockResolvedValue(true);

    require("../utils/authService").getAuthenticatedRequest =
      mockGetAuthenticatedRequest;
    require("firebase/storage").listAll = mockListAll;
    require("firebase/storage").deleteObject = mockDeleteObject;

    render(<GroupStudyHeader />);
    await fireEvent.click(screen.getByAltText("Exit"));

    // Wait for async operations
    await Promise.resolve();

    expect(mockListAll).toHaveBeenCalled();
    expect(mockDeleteObject).toHaveBeenCalledTimes(2);
  });

  it("does not delete firebase files when there are no files", async () => {
    const mockGetAuthenticatedRequest = jest
      .fn()
      .mockResolvedValueOnce({ participantsList: [{}] }) // Only one participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    const mockListAll = jest.fn().mockResolvedValue({ items: [] });

    require("../utils/authService").getAuthenticatedRequest =
      mockGetAuthenticatedRequest;
    require("firebase/storage").listAll = mockListAll;

    render(<GroupStudyHeader />);
    fireEvent.click(screen.getByAltText("Exit"));

    // Wait for async operations
    await Promise.resolve();

    expect(mockListAll).toHaveBeenCalled();
    expect(require("firebase/storage").deleteObject).not.toHaveBeenCalled();
  });

  it("handles exit room functionality", async () => {
    // Properly mock the response structure with participantsList
    const mockGetAuthenticatedRequest = jest
      .fn()
      .mockResolvedValueOnce({
        participantsList: [{ id: 1 }, { id: 2 }], // Must include participantsList
      })
      .mockResolvedValueOnce({
        status: 200,
        username: "testuser",
      });

    require("../utils/authService").getAuthenticatedRequest =
      mockGetAuthenticatedRequest;

    render(<GroupStudyHeader />);

    // Use act for async operations
    await act(async () => {
      fireEvent.click(screen.getByAltText("Exit"));
    });

    // Verify the first call checks participants
    expect(mockGetAuthenticatedRequest).toHaveBeenCalledWith(
      `/get-participants/?roomCode=TEST123`,
      "GET"
    );

    // Verify the second call leaves the room
    expect(mockGetAuthenticatedRequest).toHaveBeenCalledWith(
      "/leave-room/",
      "POST",
      { roomCode: "TEST123" }
    );

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/testuser", {
      state: { userName: "testuser" },
    });
  });
});
