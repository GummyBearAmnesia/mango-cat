import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ChatBox from "../components/ChatBox";


// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.onmessage = null;
    this.readyState = WebSocket.OPEN;
  }
  send(data) {
    this.lastSentMessage = JSON.parse(data);
  }
}

describe("ChatBox Component", () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = new MockWebSocket();
  });

  test("renders ChatBox component", () => {
    render(<ChatBox socket={mockSocket} roomCode="1234" />);
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  test("displays received WebSocket messages", async () => {
    render(<ChatBox socket={mockSocket} roomCode="1234" />);

    act(() => {
      mockSocket.onmessage({
        data: JSON.stringify({ type: "chat_message", sender: "User1", message: "Hello!" }),
      });
    });

    expect(await screen.findByText("User1:")).toBeInTheDocument();
    expect(await screen.findByText("Hello!" )).toBeInTheDocument();
  });

  test("shows typing indicator when a user is typing", async () => {
    render(<ChatBox socket={mockSocket} roomCode="1234" />);

    act(() => {
      mockSocket.onmessage({
        data: JSON.stringify({ type: "typing", sender: "User2" }),
      });
    });

    expect(await screen.findByText("User2 is typing...")).toBeInTheDocument();
  });

  test("sends a message when enter is pressed", () => {
    render(<ChatBox socket={mockSocket} roomCode="1234" />);

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockSocket.lastSentMessage).toEqual({
      type: "chat_message",
      message: "Test message",
      sender: "ANON_USER",
    });
  });
});
