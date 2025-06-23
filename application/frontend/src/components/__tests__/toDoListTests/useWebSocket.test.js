import { renderHook, act } from "@testing-library/react";
import useWebSocket from "../../ToDoListComponents/useWebSocket";


global.WebSocket = jest.fn().mockImplementation(() => {
    const instance = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onclose: jest.fn(() => {
            console.log("WebSocket onclose called");
        }),
        close: jest.fn().mockImplementation(function () {
            console.log("WebSocket close called");
            if (typeof this.onclose === 'function') {
                this.onclose(); 
            }
        }),
    };
    return instance;
});

describe("useWebSocket Hook", () => {
    let mockSetLists;
    let mockSocket;

    beforeEach(() => {
        
        jest.clearAllMocks(); 
        jest.spyOn(console, 'log').mockImplementation(() => { }); 
        mockSetLists = jest.fn();
        mockSocket = {}; 
    });
      
    // Test case to verify that WebSocket is not connected when 'isShared' is false
    test("does not connect WebSocket if isShared is false", () => {
        act(() => {
            renderHook(() => useWebSocket(false, mockSocket, 1, mockSetLists, "room123"));
        });
         expect(global.WebSocket).not.toHaveBeenCalled();
    });
     
    // Test case to verify WebSocket connection when 'isShared' is true
    test("connects WebSocket when isShared is true", () => {
        act(() => {
            renderHook(() => useWebSocket(true, mockSocket, 1, mockSetLists, "room123"));
        });
         expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8000/ws/todolist/room123/");
    });

    // Test case to verify logging when WebSocket connection is successfully opened
    test("logs WebSocket connection when opened", () => {
         const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
         act(() => {
            renderHook(() => useWebSocket(true, {}, 1, jest.fn(), "room123"));
        });
         const wsInstance = global.WebSocket.mock.instances[0];
         act(() => {
            wsInstance.onopen();
        });
         expect(consoleLogSpy).toHaveBeenCalledWith("WebSocket connected");
         consoleLogSpy.mockRestore();
    });

    // Test case to verify that WebSocket messages are properly handled
    test("handles WebSocket messages", () => {
        const mockMessage = { data: JSON.stringify({ type: "add_task", task: { id: 1, name: "New Task", is_completed: false } }) };

        act(() => {
            renderHook(() => useWebSocket(true, mockSocket, 1, mockSetLists, "room123"));
        });
         const wsInstance = global.WebSocket.mock.instances[0];
         act(() => {
            wsInstance.onmessage(mockMessage);
        });

        expect(mockSetLists).toHaveBeenCalled();
    });

    // Test case to verify that "remove_task" WebSocket messages are handled correctly
    test("handles remove_task WebSocket messages", () => {

        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];

        const mockSetLists = jest.fn();

        const mockMessage = {
            data: JSON.stringify({
                type: "remove_task",
                task_id: 2,
            }),
        };

        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });

        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });

        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];

        expect(updatedLists).toEqual(expectedLists);
    });

    // Test case to verify that "toggle_task" WebSocket messages are handled correctly
    test("handles toggle_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "toggle_task",
                task_id: 1,  
                is_completed: true, 
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: true },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        expect(updatedLists).toEqual(expectedLists);
    });

    // Test case to verify that "add_task" WebSocket messages are handled correctly
    test("handles add_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "add_task",
                task: { id: 4, name: "Task 4", is_completed: false },  
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                    { id: 4, name: "Task 4", is_completed: false }, 
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        expect(updatedLists).toEqual(expectedLists);
    });

    // Test case to verify handling of unknown WebSocket message types
    test("handles unknown WebSocket message types", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "unknown_type",
                task_id: 1,
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = initialLists;
        expect(updatedLists).toEqual(expectedLists);
    });

    // Test case to ensure no duplicate tasks are added for "add_task" WebSocket messages
    test("does not add duplicate tasks for add_task WebSocket messages", () => {
        const initialLists = [
            {
                id: 1,
                tasks: [
                    { id: 1, name: "Task 1", is_completed: false },
                    { id: 2, name: "Task 2", is_completed: true },
                ],
            },
            {
                id: 2,
                tasks: [
                    { id: 3, name: "Task 3", is_completed: false },
                ],
            },
        ];
        const mockSetLists = jest.fn();
        const mockMessage = {
            data: JSON.stringify({
                type: "add_task",
                task: { id: 1, name: "Task 1", is_completed: false }, 
            }),
        };
        act(() => {
            renderHook(() => useWebSocket(true, {}, 1, mockSetLists, "room123"));
        });
        const wsInstance = global.WebSocket.mock.instances[0];
        act(() => {
            wsInstance.onmessage(mockMessage);
        });
        expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
        const updaterFunction = mockSetLists.mock.calls[0][0];
        const updatedLists = updaterFunction(initialLists);
        const expectedLists = initialLists;
        expect(updatedLists).toEqual(expectedLists);
    });
});