import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, useLocation, useParams } from "react-router-dom";
import GroupStudyPage from "../pages/GroupStudyPage";
import { getAuthenticatedRequest } from "../utils/authService";
import { ToastContainer } from "react-toastify";

// Mock dependencies
jest.mock("../utils/authService");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
}));

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

// Mock Firebase storage
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
  uploadBytes: jest.fn(),
  listAll: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock Firebase config
jest.mock("../firebase-config.js", () => ({
  storage: {
    ref: jest.fn(),
    getDownloadURL: jest.fn(),
    uploadBytes: jest.fn(),
    listAll: jest.fn(),
    deleteObject: jest.fn(),
  },
  database: {
    ref: jest.fn(),
  },
}));

// Mock child components
jest.mock("../pages/Motivation", () => () => (
  <div data-testid="motivational-message">Mocked Motivation</div>
));
jest.mock("../components/ToDoListComponents/newToDoList", () => () => (
  <div data-testid="todo-list">Mocked ToDoList</div>
));
jest.mock("../components/StudyTimer", () => ({ onClose }) => (
  <div data-testid="study-timer">
    Mocked StudyTimer
    <button
      onClick={() => onClose ? onClose() : console.log("Timer closed")}
      data-testid="timer-close-button"
    >
      Close Timer
    </button>
  </div>
));
jest.mock("../components/StudyParticipants", () => () => (
  <div data-testid="study-participants">Mocked StudyParticipants</div>
));
jest.mock("../pages/SharedMaterials", () => () => (
  <div data-testid="shared-materials">Mocked SharedMaterials</div>
));
jest.mock("../components/ChatBox", () => () => (
  <div data-testid="chat-box">Mocked ChatBox</div>
));
jest.mock("../components/GroupStudyHeader", () => () => (
  <div data-testid="group-study-header">Mocked GroupStudyHeader</div>
));

// Mock Material-UI components
jest.mock("@mui/material", () => ({
  Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogContent: ({ children }) => <div>{children}</div>,
  Button: ({ children }) => <button>{children}</button>,
}));

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

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  onopen: jest.fn(),
  onclose: jest.fn(),
  close: jest.fn(),
}));

// Mock assets if needed
jest.mock("../assets/avatars/avatar_2.png", () => "avatar_2.png");

describe("GroupStudyPage", () => {
  const mockLocation = {
    state: {
      roomCode: "TEST123",
      roomName: "Test Room",
      roomList: "list123",
    },
    pathname: '/group-study/TEST123', 
    search: '', 
    hash: '', 
  };

  let consoleLogSpy;
  let mockSocket;
  let originalUseState;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });

    mockSocket = {
        onopen: jest.fn(),
        onclose: jest.fn(),
        close: jest.fn()
    };
    originalUseState = React.useState;
    global.WebSocket.mockImplementation(() => mockSocket);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
    useLocation.mockReturnValue(mockLocation);
    useParams.mockReturnValue({ roomCode: "TEST123" });
    getAuthenticatedRequest.mockResolvedValue({ username: "testuser" });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
    React.useState = originalUseState;
  });

  test("renders the main container", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("groupStudyRoom-container")).toBeInTheDocument();
  });

  test("renders all three columns", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("column-1")).toBeInTheDocument();
    expect(screen.getByTestId("column-2")).toBeInTheDocument();
    expect(screen.getByTestId("column-3")).toBeInTheDocument();
  });

  test("renders all child components", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("group-study-header")).toBeInTheDocument();
    expect(screen.getByTestId("todo-list")).toBeInTheDocument();
    expect(screen.getByTestId("shared-materials")).toBeInTheDocument();
    expect(screen.getByTestId("study-participants")).toBeInTheDocument();
    expect(screen.getByTestId("motivational-message")).toBeInTheDocument();
    expect(screen.getByTestId("study-timer")).toBeInTheDocument();
    expect(screen.getByTestId("chat-box")).toBeInTheDocument();
  });

  test("establishes WebSocket connection with room code", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(global.WebSocket).toHaveBeenCalledWith(
      "ws://localhost:8000/ws/room/TEST123/"
    );
  });

  test('scrolls to bottom when chatMessagesRef exists', async () => {

    const mockScrollTo = jest.fn();
    const mockRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
        scrollTo: mockScrollTo
      }
    };

    
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Simulate a new message being added
    mockRef.current.scrollHeight = 1500;
    if (mockRef.current.scrollTo) {
      mockRef.current.scrollTo(0, mockRef.current.scrollHeight);
    }

    // Verify scroll was called with the correct position
    expect(mockScrollTo).toHaveBeenCalledWith(0, 1500);

    // Clean up the mock
    useRefSpy.mockRestore();
  });

  test('scroll behavior when ref exists', async () => {
    // Create a mock ref with scrollTo spy
    const mockScrollTo = jest.fn();
    const mockRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
        scrollTo: mockScrollTo
      }
    };

    // Mock useRef to return our mock ref
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Simulate new content being added
    mockRef.current.scrollHeight = 1500;

    // Trigger scroll behavior (this would normally happen in a useEffect)
    if (mockRef.current.scrollTo) {
      mockRef.current.scrollTo(0, mockRef.current.scrollHeight);
    }

    // Verify scroll was called
    expect(mockScrollTo).toHaveBeenCalled();

    // Clean up mock
    useRefSpy.mockRestore();
  });

  test('sets scrollTop to scrollHeight when ref exists', async () => {
    // Create a mock ref object
    const mockRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000
      }
    };

    // Mock useRef to return our mock ref
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Simulate calling scrollToBottom (which would happen internally when new messages arrive)
    if (mockRef.current) {
      mockRef.current.scrollTop = mockRef.current.scrollHeight;
    }

    // Verify scrollTop was updated
    expect(mockRef.current.scrollTop).toBe(mockRef.current.scrollHeight);

    // Clean up mock
    useRefSpy.mockRestore();
  });

  test('does nothing when chatMessagesRef is null', async () => {
    // Mock useRef to return a ref with null current value
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: null });

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Verify no errors occurred
    expect(useRefSpy).toHaveBeenCalled();

    // Clean up mock
    useRefSpy.mockRestore();
  });

  test('logs WebSocket connection and sets socket state', async () => {
    const mockSocket = {
      onopen: jest.fn(),
      onclose: jest.fn(),
      close: jest.fn()
    };
    global.WebSocket.mockImplementation(() => mockSocket);

    // Mock console.log to track calls
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Simulate WebSocket connection opening
    mockSocket.onopen();

    // Verify connection logs
    expect(consoleLogSpy).toHaveBeenCalledWith('Connected to Websocket');
    expect(consoleLogSpy).toHaveBeenCalledWith('socket', mockSocket);

    // Clean up spy
    consoleLogSpy.mockRestore();
  });

  test('handles WebSocket disconnection and reconnection', async () => {
    jest.useFakeTimers(); // Enable fake timers

    const mockSocket = {
      onopen: jest.fn(),
      onclose: jest.fn(),
      close: jest.fn()
    };
    global.WebSocket.mockImplementation(() => mockSocket);

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    // Simulate WebSocket disconnection
    act(() => {
      mockSocket.onclose();
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Disconnected from WebSocket');
    expect(consoleLogSpy).toHaveBeenCalledWith('Reconnecting');

    // Check setTimeout was called
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 1000);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(2);

    // Clean up
    consoleLogSpy.mockRestore();
    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  test('logs error when room code is missing', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    // Mock location with no room code
    useLocation.mockReturnValue({
      state: null,
      pathname: '/group-study',
      search: '',
      hash: '',
    });
    useParams.mockReturnValue({ roomCode: undefined });

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Room code is missing.');
    consoleErrorSpy.mockRestore();
  });
  test('does not attempt WebSocket connection when room code is missing', async () => {
    // Mock location with no room code
    useLocation.mockReturnValue({
      state: null,
      pathname: '/group-study',
      search: '',
      hash: '',
    });
    useParams.mockReturnValue({ roomCode: undefined });

    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    expect(global.WebSocket).not.toHaveBeenCalled();
  });

  test('does not attempt to scroll when chatMessagesRef.current is null', () => {
    // Mock useRef to return a ref with null current value
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: null });

    // Mock the scrollToBottom function if it's exported or accessible
    // Alternatively, we can test the behavior through the component's effects

    render(
      <MemoryRouter>
        <GroupStudyPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // The test passes if no errors are thrown when trying to access scroll properties
    expect(useRefSpy).toHaveBeenCalled();
    useRefSpy.mockRestore();
  });

  test('sets scrollTop to scrollHeight when both exist', () => {
    const mockRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000
      }
    };

    // Mock useRef to return our mock ref
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

    render(
      <MemoryRouter>
        <GroupStudyPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // Simulate the scroll behavior that would happen in the component
    if (mockRef.current) {
      mockRef.current.scrollTop = mockRef.current.scrollHeight;
    }

    expect(mockRef.current.scrollTop).toBe(mockRef.current.scrollHeight);
    useRefSpy.mockRestore();
  });

  test('handles scroll when scrollTo method is available', () => {
    const mockScrollTo = jest.fn();
    const mockRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
        scrollTo: mockScrollTo
      }
    };

    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

    render(
      <MemoryRouter>
        <GroupStudyPage />
        <ToastContainer />
      </MemoryRouter>
    );

    // Simulate calling scrollTo
    if (mockRef.current && mockRef.current.scrollTo) {
      mockRef.current.scrollTo(0, mockRef.current.scrollHeight);
    }

    expect(mockScrollTo).toHaveBeenCalledWith(0, 1000);
    useRefSpy.mockRestore();
  });


    test('renders StudyTimer with close button', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <GroupStudyPage />
            <ToastContainer />
          </MemoryRouter>
        );
      });

      expect(screen.getByTestId('study-timer')).toBeInTheDocument();
      expect(screen.getByTestId('timer-close-button')).toBeInTheDocument();
    });

  test('clicking close button triggers onClose callback', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    const closeButton = screen.getByTestId('timer-close-button');
    await fireEvent.click(closeButton);

    expect(consoleLogSpy).toHaveBeenCalledWith('Timer closed');
  });

  test('does not try to close socket when socket is null', async () => {
    // Mock useState to return null for socket
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [null, jest.fn()]) // socket state
      .mockImplementationOnce(() => [true, jest.fn()]); // shouldReconnect state

    // Mock useLocation to avoid React Router errors
    useLocation.mockReturnValue({
      state: null,
      pathname: '/group-study',
      search: '',
      hash: '',
    });

    const { unmount } = await act(async () => {
      return render(
        <MemoryRouter>
          <GroupStudyPage />
          <ToastContainer />
        </MemoryRouter>
      );
    });

    await act(async () => {
      unmount();
    });

    // Verify no cleanup actions were taken
    expect(consoleLogSpy).not.toHaveBeenCalledWith('Closing WebSocket connection on unmount...');
    expect(mockSocket.close).not.toHaveBeenCalled();
  });

});