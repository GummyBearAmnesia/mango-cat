import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import StudyTimer from '../components/StudyTimer';
import '@testing-library/jest-dom';

//ok all the tests are passing but the code coverage is low im sorry

// Mock the image import directly
jest.mock('../assets/blueberry.jpeg', () => 'mocked-blueberry-path');

// Mock firebase config
jest.mock('../firebase-config.js', () => ({}));

// Mock Audio before importing the component
const mockPlayFn = jest.fn();
const mockPauseFn = jest.fn();

// Most important part - mock the Audio constructor
window.HTMLMediaElement.prototype.play = mockPlayFn;
window.HTMLMediaElement.prototype.pause = mockPauseFn;

// Mock react-toastify
jest.mock('react-toastify', () => {
  const actual = jest.requireActual('react-toastify');
  return {
    ...actual,
    toast: {
      error: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    },
    ToastContainer: () => <div data-testid="toast-container" />
  };
});

// More robust localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('StudyTimer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorageMock.clear();
    mockPlayFn.mockClear();
    mockPauseFn.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders initial welcome screen', () => {
    render(<StudyTimer />);
    expect(screen.getByText(/Start Timer/i)).toBeInTheDocument();
  });

  test('loads settings from localStorage', () => {
    localStorageMock.getItem.mockImplementation(key => {
      if (key === 'studyLength') return '2700';
      if (key === 'breakLength') return '600';
      if (key === 'rounds') return '3';
      return null;
    });
    
    render(<StudyTimer />);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('studyLength');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('breakLength');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('rounds');
  });

  test('handles empty study time input', () => {
    const { toast } = require('react-toastify');
    render(<StudyTimer />);
    
    // Get all inputs
    const inputs = screen.getAllByRole('spinbutton');
    
    // Set empty study time
    act(() => {
      fireEvent.change(inputs[0], { target: { value: '0' } });
      fireEvent.change(inputs[1], { target: { value: '0' } });
      fireEvent.change(inputs[2], { target: { value: '0' } });
    });
    
    // Try to start timer
    fireEvent.click(screen.getByText(/Start Timer/i));
    
    expect(toast.error).toHaveBeenCalledWith('Focus time input is empty.');
  });

  test('starts timer when start button is clicked', async () => {
    render(<StudyTimer />);
    
    // Find and click start button
    const startButton = screen.getByText(/Start Timer/i);
    act(() => {
      fireEvent.click(startButton);
    });
    
    // Check that timer is displayed
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/\d+:\d{2}/);
      expect(screen.getByText(/Round 1\/4/i)).toBeInTheDocument();
    });
  });

  test('pauses and resumes timer', async () => {
    render(<StudyTimer />);
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Find and click pause button
    const pauseButton = await screen.findByText('Pause');
    act(() => {
      fireEvent.click(pauseButton);
    });
    
    // Check that Resume button appears
    expect(screen.getByText('Resume')).toBeInTheDocument();
    
    // Click Resume button
    act(() => {
      fireEvent.click(screen.getByText('Resume'));
    });
    
    // Check that Pause button appears again
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  test('resets timer', async () => {
    render(<StudyTimer />);
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Advance timer
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    // Find and click reset button
    const resetButton = await screen.findByText('Reset');
    act(() => {
      fireEvent.click(resetButton);
    });
    
    // Check that timer resets to original time
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/\d+:\d{2}/);
      expect(screen.getByText(/Round 1\/4/i)).toBeInTheDocument();
    });
  });

  test('toggles sound setting', () => {
    render(<StudyTimer />);
    
    // Find sound toggle button (heart emoji)
    const soundToggle = screen.getByText('💜');
    
    // Toggle sound off
    act(() => {
      fireEvent.click(soundToggle);
    });
    
    // Check if it changed
    expect(screen.getByText('🤍')).toBeInTheDocument();
    
    // Toggle sound back on
    act(() => {
      fireEvent.click(screen.getByText('🤍'));
    });
    
    // Check if it changed back
    expect(screen.getByText('💜')).toBeInTheDocument();
  });

  test('handles back button click', async () => {
    render(<StudyTimer />);
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Find and click back button (triangle)
    const backButton = document.querySelector('.triangle').parentElement;
    act(() => {
      fireEvent.click(backButton);
    });
    
    // Check that we're back to the welcome screen
    expect(screen.getByText(/Start Timer/i)).toBeInTheDocument();
  });

  

  test('handles zero-length break time', async () => {
    render(<StudyTimer />);
    
    // Set short study time and zero break time
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '0' } }); // 0 minutes study
      fireEvent.change(inputs[2], { target: { value: '2' } }); // 2 seconds study
      fireEvent.change(inputs[3], { target: { value: '0' } }); // 0 hours break
      fireEvent.change(inputs[4], { target: { value: '0' } }); // 0 minutes break
      fireEvent.change(inputs[5], { target: { value: '0' } }); // 0 seconds break
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Wait for study time to end
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Since break is 0, it should immediately go to round 2
    await waitFor(() => {
      expect(screen.getByText(/Round 2\/4/i)).toBeInTheDocument();
    });
  });

  test('completes all rounds and shows completion screen', async () => {
    render(<StudyTimer />);
    
    // Set short times and only 2 rounds
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '0' } }); // 0 minutes study
      fireEvent.change(inputs[2], { target: { value: '1' } }); // 1 second study
      fireEvent.change(inputs[4], { target: { value: '0' } }); // 0 minutes break
      fireEvent.change(inputs[5], { target: { value: '1' } }); // 1 second break
      fireEvent.change(inputs[6], { target: { value: '2' } }); // 2 rounds total
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Complete round 1 study
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Complete round 1 break
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Complete round 2 study
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByText(/Well done!/i)).toBeInTheDocument();
      expect(screen.getByText(/Here, have a blueberry/i)).toBeInTheDocument();
    });
    
    // Test starting a new session from completion screen
    act(() => {
      fireEvent.click(screen.getByText(/Start New Session/i));
    });
    
    // Should be back at welcome screen
    expect(screen.getByText(/Start Timer/i)).toBeInTheDocument();
  });

  test('plays sound when timer ends if enabled', async () => {
    render(<StudyTimer />);
    
    // Set short study time
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '0' } }); // 0 minutes
      fireEvent.change(inputs[2], { target: { value: '1' } }); // 1 second
    });
    
    // Make sure sound is enabled (it is by default, but let's be explicit)
    const soundToggle = screen.getByText('💜');
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Complete study time
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check that sound was played
    expect(mockPlayFn).toHaveBeenCalled();
  });

  test('does not play sound when timer ends if disabled', async () => {
    render(<StudyTimer />);
    
    // Set short study time
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '0' } }); // 0 minutes
      fireEvent.change(inputs[2], { target: { value: '1' } }); // 1 second
    });
    
    // Turn sound off
    const soundToggle = screen.getByText('💜');
    act(() => {
      fireEvent.click(soundToggle);
    });
    
    // Reset mockPlay count
    mockPlayFn.mockClear();
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Complete study time
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check that sound was not played
    expect(mockPlayFn).not.toHaveBeenCalled();
  });

  test('handles mouse events on various buttons', async () => {
    render(<StudyTimer />);
    
    // Test hover on Start Timer button
    const startButton = screen.getByText(/Start Timer/i);
    fireEvent.mouseEnter(startButton);
    fireEvent.mouseLeave(startButton);
    
    // Start timer
    act(() => {
      fireEvent.click(startButton);
    });
    
    // Test hover on Pause button
    const pauseButton = await screen.findByText('Pause');
    fireEvent.mouseEnter(pauseButton);
    fireEvent.mouseLeave(pauseButton);
    
    // Test hover on Reset button
    const resetButton = screen.getByText('Reset');
    fireEvent.mouseEnter(resetButton);
    fireEvent.mouseLeave(resetButton);
    
    // Test hover on back button
    const backButton = document.querySelector('.triangle').parentElement;
    fireEvent.mouseEnter(backButton);
    fireEvent.mouseLeave(backButton);
  });

  test('updates timer display correctly during countdown', () => {
    jest.useFakeTimers();
    render(<StudyTimer />);
    
    // Set a specific time
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '2' } }); // 2 minutes
      fireEvent.change(inputs[2], { target: { value: '0' } }); // 0 seconds
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Initial time should be 02:00
    expect(screen.getByText('02:00')).toBeInTheDocument();
    
    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Time should now be 01:59
    expect(screen.getByText('01:59')).toBeInTheDocument();
    
    // Advance 59 more seconds
    act(() => {
      jest.advanceTimersByTime(59000);
    });
    
    // Time should now be 01:00
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  test('properly shows round progression through multiple rounds', async () => {
    render(<StudyTimer />);
    
    // Set very short study and break times
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '0' } }); // 0 minutes study
      fireEvent.change(inputs[2], { target: { value: '1' } }); // 1 second study
      fireEvent.change(inputs[4], { target: { value: '0' } }); // 0 minutes break
      fireEvent.change(inputs[5], { target: { value: '1' } }); // 1 second break
      fireEvent.change(inputs[6], { target: { value: '3' } }); // 3 rounds
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Initially round 1
    expect(screen.getByText(/Round 1\/3/i)).toBeInTheDocument();
    
    // Complete round 1 study
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Now in break time, still round 1
    await waitFor(() => {
      expect(screen.getAllByText(/Break/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Round 1\/3/i)).toBeInTheDocument();
    
    // Complete round 1 break
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Now in round 2 study
    await waitFor(() => {
      expect(screen.getByText(/Round 2\/3/i)).toBeInTheDocument();
    });
    
    // Complete round 2 study
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Complete round 2 break
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Now in round 3 study
    await waitFor(() => {
      expect(screen.getByText(/Round 3\/3/i)).toBeInTheDocument();
    });
  });

  test('handles changing round number input', () => {
    render(<StudyTimer />);
    
    // Find rounds input
    const inputs = screen.getAllByRole('spinbutton');
    const roundsInput = inputs[6];
    
    // Change to 7 rounds
    act(() => {
      fireEvent.change(roundsInput, { target: { value: '7' } });
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Check if rounds display is updated
    expect(screen.getByText(/Round 1\/7/i)).toBeInTheDocument();
  });

  test('formats time with hours correctly', () => {
    render(<StudyTimer />);
    
    // Set time with hours
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[0], { target: { value: '1' } }); // 1 hour
      fireEvent.change(inputs[1], { target: { value: '5' } }); // 5 minutes
      fireEvent.change(inputs[2], { target: { value: '30' } }); // 30 seconds
    });
    
    // Start timer
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    // Check formatted time (1:05:30)
    expect(screen.getByText('1:05:30')).toBeInTheDocument();
  });

  test('automatically clears error messages after timeout', async () => {
    const { toast } = require('react-toastify');
    jest.useFakeTimers();
    
    render(<StudyTimer />);
    
    // Trigger an error message
    const inputs = screen.getAllByRole('spinbutton');
    act(() => {
      fireEvent.change(inputs[0], { target: { value: '0' } });
      fireEvent.change(inputs[1], { target: { value: '0' } });
      fireEvent.change(inputs[2], { target: { value: '0' } });
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    expect(toast.error).toHaveBeenCalled();
    
    // Fast-forward time to trigger error clearing
    act(() => {
      jest.advanceTimersByTime(3500); // Just over 3 seconds
    });
    
    // If implementation uses toast.dismiss, we could check for that
    // For now, we'll just verify toast isn't called again, which is an indirect way
    // to confirm error handling worked
    toast.error.mockClear();
    
    act(() => {
      fireEvent.click(screen.getByText(/Start Timer/i));
    });
    
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  test('loads default values when no localStorage settings exist', () => {
    // Clear existing mock implementation
    localStorageMock.getItem.mockImplementation(() => null);
    
    render(<StudyTimer />);
    
    // Check that default values are used
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0].value).toBe('0');   // Default study hours
    expect(inputs[1].value).toBe('25');  // Default study minutes
    expect(inputs[3].value).toBe('0');   // Default break hours
    expect(inputs[4].value).toBe('5');   // Default break minutes
    expect(inputs[6].value).toBe('4');   // Default rounds
  });
});

