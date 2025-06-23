import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Login from '../pages/Login';
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';


jest.mock('axios');
jest.mock('react-toastify', () => {
    const actual = jest.requireActual('react-toastify'); 
    return { 
      ...actual, 
      toast: { 
        error: jest.fn(),
        success: jest.fn(),
        info: jest.fn(),
      },
    };
}); 
  
jest.mock('react-router-dom', () => ({
...jest.requireActual('react-router-dom'),
useNavigate: jest.fn(),
}));
  
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Login', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });




  test('renders login form', () => {
    render(
      <Router>
        <Login />
      </Router>
    );
    expect(screen.getByTestId('email-label')).toBeInTheDocument();
    expect(screen.getByTestId('password-label')).toBeInTheDocument();
    expect(screen.getByTestId('login-click-button')).toBeInTheDocument();
  });




  test('handles form input changes', () => {
    render(
      <Router>
        <Login />
      </Router>
    );

    const emailInput = screen.getByTestId('email-input-field');
    const passwordInput = screen.getByTestId('password-input-field')

    fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });




  test('handles successful login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        userId: '123',
        username: 'testuser',
      },
    });

    jest.useFakeTimers();

    render(
      <Router>
        <Login />
      </Router>
    );

    fireEvent.change(screen.getByTestId('email-input-field'), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input-field'), {
      target: { name: 'password', value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-click-button'));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
      expect(localStorage.getItem('user_id')).toBe('123');
      expect(localStorage.getItem('loggedInUser')).toBe(
        JSON.stringify({ email: 'test@example.com', username: 'testuser' })
      );
      expect(toast.success).toHaveBeenCalledWith('Login Successful!', {
        hideProgressBar: true,
      });
      
    });

    jest.advanceTimersByTime(1500);

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/testuser', {
        state: { userName: 'testuser' },
    });

    jest.useRealTimers();

  });




  test('handles login failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
    });

    render(
      <Router>
        <Login />
      </Router>
    );

    fireEvent.change(screen.getByTestId('email-input-field'), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input-field'), {
      target: { name: 'password', value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-click-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });



  test('blocks login if user is already logged in', () => {
    localStorage.setItem(
      'loggedInUser',
      JSON.stringify({ email: 'test@example.com', username: 'testuser' })
    );

    render(
      <Router>
        <Login />
      </Router>
    );

    expect(toast.info).toHaveBeenCalledWith(
      'You are already logged in as testuser. Please log out first, or refresh the page.'
    );

    fireEvent.click(screen.getByTestId('login-click-button'));

    expect(toast.error).toHaveBeenCalledWith(
      'You are already logged in as testuser. Please log out first, or refresh the page'
    );
  });



  test('clears localStorage on beforeunload', () => {
    render(
      <Router>
        <Login />
      </Router>
    );

    window.dispatchEvent(new Event('beforeunload'));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('loggedInUser')).toBeNull();
  });


  test('displays error toast when an error occurs during login', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <Router>
        <Login />
      </Router>
    );

    fireEvent.change(screen.getByTestId('email-input-field'), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input-field'), {
      target: { name: 'password', value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-click-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred. Please try again.');
    });

  });

});