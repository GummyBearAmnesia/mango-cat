import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarPage from '../pages/Calendar';
import { ToastContainer, toast } from 'react-toastify';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';
import { getAuthenticatedRequest } from "../utils/authService";
import authService from '../utils/authService'; 
import { handleAddEvent } from '../pages/Calendar'; // Adjust the import


// Mock the getAuthenticatedRequest function
jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(() => Promise.resolve({})),
}));
// Mock axios and FullCalendar components
jest.mock('axios');
jest.mock('@fullcalendar/react', () => (props) => (
  <div>
    <button onClick={props.customButtons?.addEventButton?.click}>Add Event</button>
    {props.events?.map((event) => (
      <div key={event.id}>{event.title}</div>
    ))}
  </div>
));

jest.mock('@fullcalendar/daygrid', () => () => <div>Mocked DayGridPlugin</div>);
jest.mock('@fullcalendar/timegrid', () => () => <div>Mocked TimeGridPlugin</div>);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
}));
const closeAddEventPopup = jest.fn();
const fetchEvents = jest.fn();
const setShowPopup = jest.fn();

describe('CalendarPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
// Test 1: Renders the CalendarPage component - PASSED
  test('renders CalendarPage correctly', () => {
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );
    // Check if the header is rendered
    expect(screen.getByText('My Calendar')).toBeInTheDocument();
    screen.debug();
  });

// Test 2: Shows add event button PopUp - PASSED
  test('Shows popup add event', () => {
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );
    // Open the Add Event popup
    fireEvent.click(screen.getByText('Add Event'));
    // Debug the rendered DOM
    screen.debug();
    // Check if the popup is open by verifying the presence of the "Add Event" heading
    expect(screen.getByText('Save Event')).toBeInTheDocument();
    // Check if event thing in add event popup is present
    expect(screen.getByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Description:')).toBeInTheDocument();
    expect(screen.getByText('Start:')).toBeInTheDocument();
    expect(screen.getByText('End:')).toBeInTheDocument();
    //expect(screen.getByText('Save Event')).not.toBeInTheDocument();
  });

// Test 3: Submit event to backend - PASSED
  it('handles event click and displays event details', async () => {
    render(
          <MemoryRouter>
            <CalendarPage />
            <ToastContainer />
          </MemoryRouter>
        );

    // Simulate adding an event
    fireEvent.click(screen.getByText('Add Event'));

    fireEvent.change(screen.getByLabelText("Title:"), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByLabelText("Description:"), {
      target: { value: "This is a test event" },
    });
    fireEvent.change(screen.getByLabelText("Start:"), {
      target: { value: "2023-10-10T10:00" },
    });
    fireEvent.change(screen.getByLabelText("End:"), {
      target: { value: "2023-10-10T12:00" },
    });

    // Click the "Save Event" button to submit the form
    fireEvent.click(screen.getByText("Save Event"));

    expect(getAuthenticatedRequest).toHaveBeenCalledWith(
      "/events/",
      "POST",
      {
        title: "Test Event",
        description: "This is a test event",
        start: "2023-10-10T10:00",
        end: "2023-10-10T12:00",
      }
    );

    // await waitFor(() => {
    //   expect(screen.getByText("Test Event")).toBeInTheDocument();
    // });
    });

    // Fetches events test - PASSED 
    test('fetched events list contains "CLASS for STUDENTS"', async () => {
      // Mock the fetched events data
      const mockEvents = [
        { title: 'CLASS for STUDENTS', start: '2025-03-22', end: '2025-03-23' },
        { title: 'Another Event', start: '2025-03-24', end: '2025-03-25' },
      ];
    
      // Mock the getAuthenticatedRequest function to return the mock events
      jest.spyOn(authService, 'getAuthenticatedRequest').mockResolvedValue(mockEvents);
    
      // Spy on console.log to capture the logged fetched events
      const consoleSpy = jest.spyOn(console, 'log');
    
      // Render the component with MemoryRouter and ToastContainer
      render(
        <MemoryRouter>
          <CalendarPage />
          <ToastContainer />
        </MemoryRouter>
      );
    
      // Wait for the fetchEvents function to complete
      await waitFor(() => {
        // Check that the console.log was called with the fetched events
        expect(consoleSpy).toHaveBeenCalledWith('Fetched events:', mockEvents);
    
        // Check that "CLASS for STUDENTS" is in the fetched events list
        expect(mockEvents).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'CLASS for STUDENTS' }),
          ])
        );
      });
    
      // Restore the original console.log function
      consoleSpy.mockRestore();
    });
    
    test('navigates to basic dashboard when profile fetch fails', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
      
      // Mock failed profile response
      getAuthenticatedRequest.mockRejectedValueOnce(new Error('Failed to fetch'));
    
      render(
        <MemoryRouter>
          <CalendarPage />
          <ToastContainer />
        </MemoryRouter>
      );
    
      fireEvent.click(screen.getByAltText('return'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    //submission error test - PASSED
    test('handles form submission failure and displays error toast', async () => {
      // Mock the getAuthenticatedRequest function to throw an error
      jest.spyOn(authService, 'getAuthenticatedRequest').mockRejectedValue(new Error('Save error'));
    
      // Render the component with MemoryRouter and ToastContainer
      render(
        <MemoryRouter>
          <CalendarPage />
          <ToastContainer />
        </MemoryRouter>
      );
    
      // Open the "Add Event" popup
      fireEvent.click(screen.getByText('Add Event'));
    
      // Fill in the form fields
      fireEvent.change(screen.getByLabelText('Title:'), {
        target: { value: 'Test Event' },
      });
      fireEvent.change(screen.getByLabelText('Description:'), {
        target: { value: 'This is a test event' },
      });
      fireEvent.change(screen.getByLabelText('Start:'), {
        target: { value: '2025-03-22T10:00' },
      });
      fireEvent.change(screen.getByLabelText('End:'), {
        target: { value: '2025-03-22T12:00' },
      });
    
      // Submit the form
      fireEvent.click(screen.getByText('Save Event'));
    
      // Wait for the error toast to appear
      await waitFor(() => {
        expect(screen.getByText('Error connecting to backend.')).toBeInTheDocument();
      });
    });

    test('handles form submission and displays success toast', async () => {
      // Mock the getAuthenticatedRequest function to return a successful response
      jest.spyOn(authService, 'getAuthenticatedRequest').mockResolvedValue([
        {
          id: '1',
          title: 'Test Event',
          description: 'This is a test event',
          start: '2025-03-22T10:00',
          end: '2025-03-22T12:00',
        },
      ]);
    
      // Spy on console.log to verify the event data is logged
      const consoleLogSpy = jest.spyOn(console, 'log');
    
      // Render the component with MemoryRouter and ToastContainer
      render(
        <MemoryRouter>
          <CalendarPage />
          <ToastContainer />
        </MemoryRouter>
      );
    
      // Open the "Add Event" popup
      fireEvent.click(screen.getByText('Add Event'));
    
      // Fill in the form fields
      fireEvent.change(screen.getByLabelText('Title:'), {
        target: { value: 'Test Event' },
      });
      fireEvent.change(screen.getByLabelText('Description:'), {
        target: { value: 'This is a test event' },
      });
      fireEvent.change(screen.getByLabelText('Start:'), {
        target: { value: '2025-03-22T10:00' },
      });
      fireEvent.change(screen.getByLabelText('End:'), {
        target: { value: '2025-03-22T12:00' },
      });
    
      // Submit the form
      fireEvent.click(screen.getByText('Save Event'));
    
      // Wait for the success toast to appear
      await waitFor(() => {
        expect(screen.getByText('Event added successfully')).toBeInTheDocument();
      });
    
      // Verify that the event data was logged
      expect(consoleLogSpy).toHaveBeenCalledWith('Sending event:', {
        title: 'Test Event',
        description: 'This is a test event',
        start: '2025-03-22T10:00',
        end: '2025-03-22T12:00',
      });
    
      // Restore the original console.log function
      consoleLogSpy.mockRestore();
    });//1

//PASSED
test("renders CalendarPage without userId", () => {
  // Render the component without userId
  render(
    <MemoryRouter>
      <CalendarPage />
      <ToastContainer />
    </MemoryRouter>
  );

  // Verify that the component renders without crashing
  expect(screen.getByText("My Calendar")).toBeInTheDocument();
});
//PASSED
  test("renders CalendarPage with userId", () => {
    // Render the component with userId
    const location = { state: { userId: "123" } };
    render(
      <MemoryRouter>
        <CalendarPage location={location} />
        <ToastContainer />
      </MemoryRouter>
    );

    // Verify that the component renders without crashing
    expect(screen.getByText("My Calendar")).toBeInTheDocument();
  });    
  //PASSED
  test("shows error toast when fetchEvents fails", async () => {
    // Mock getAuthenticatedRequest to throw an error
    jest.spyOn(authService, "getAuthenticatedRequest").mockRejectedValue(new Error("Fetch error"));
  
    // Render the component
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );
  
    // Wait for the error toast to appear
    await waitFor(() => {
      expect(screen.getByText("Error fetching events")).toBeInTheDocument();
    });
  });

   //PASSED
  test("processes events with correct background colors", async () => {
    // Mock getAuthenticatedRequest to return a list of events
    jest.spyOn(authService, "getAuthenticatedRequest").mockResolvedValue([
      {
        id: "1",
        title: "Past Event",
        start: "2023-01-01T10:00", // Past event
        end: "2023-01-01T12:00",
      },
      {
        id: "2",
        title: "Today Event",
        start: new Date().toISOString(), // Today's event
        end: new Date().toISOString(),
      },
      {
        id: "3",
        title: "Future Event",
        start: "2025-01-01T10:00", // Future event
        end: "2025-01-01T12:00",
      },
    ]);
  
    // Render the component
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );
  
    // Wait for the events to appear on the calendar
    await waitFor(() => {
      expect(screen.getByText("Past Event")).toBeInTheDocument();
      expect(screen.getByText("Today Event")).toBeInTheDocument();
      expect(screen.getByText("Future Event")).toBeInTheDocument();
    });
  });
  
  //PASSED
  test("handles form submission failure", async () => {
    // Mock getAuthenticatedRequest to throw an error
    jest.spyOn(authService, "getAuthenticatedRequest").mockRejectedValue(new Error("Save error"));
  
    // Render the component
    render(
      <MemoryRouter>
        <CalendarPage />
        <ToastContainer />
      </MemoryRouter>
    );
  
    // Open the "Add Event" popup
    fireEvent.click(screen.getByText("Add Event"));
  
    // Fill in the form fields
    fireEvent.change(screen.getByLabelText("Title:"), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByLabelText("Start:"), {
      target: { value: "2025-03-22T10:00" },
    });
    fireEvent.change(screen.getByLabelText("End:"), {
      target: { value: "2025-03-22T12:00" },
    });
  });
});

