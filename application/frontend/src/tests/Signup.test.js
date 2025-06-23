import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Signup from '../pages/Signup';
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

describe('Signup', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('renders signup form', () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    expect(screen.getByLabelText('First name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Username:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Your motto in life :):')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password:')).toBeInTheDocument();
    expect(screen.getByLabelText('I accept the terms and conditions')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button-click')).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    const firstNameInput = screen.getByLabelText('First name:');
    const lastNameInput = screen.getByLabelText('Last name:');
    const emailInput = screen.getByLabelText('Email:');
    const usernameInput = screen.getByLabelText('Username:');
    const descriptionInput = screen.getByLabelText('Your motto in life :):');
    const passwordInput = screen.getByLabelText('Password:');
    const passwordConfirmationInput = screen.getByLabelText('Confirm password:');
    const acceptTermsCheckbox = screen.getByLabelText('I accept the terms and conditions');

    fireEvent.change(firstNameInput, { target: { name: 'firstname', value: 'John' } });
    fireEvent.change(lastNameInput, { target: { name: 'lastname', value: 'Doe' } });
    fireEvent.change(emailInput, { target: { name: 'email', value: 'john.doe@example.com' } });
    fireEvent.change(usernameInput, { target: { name: 'username', value: '@johndoe' } });
    fireEvent.change(descriptionInput, { target: { name: 'description', value: 'A brief description' } });
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'Password123' } });
    fireEvent.change(passwordConfirmationInput, { target: { name: 'passwordConfirmation', value: 'Password123' } });
    fireEvent.click(acceptTermsCheckbox);

    expect(firstNameInput.value).toBe('John');
    expect(lastNameInput.value).toBe('Doe');
    expect(emailInput.value).toBe('john.doe@example.com');
    expect(usernameInput.value).toBe('@johndoe');
    expect(descriptionInput.value).toBe('A brief description');
    expect(passwordInput.value).toBe('Password123');
    expect(passwordConfirmationInput.value).toBe('Password123');
    expect(acceptTermsCheckbox.checked).toBe(true);
  });

  test('validates form fields and sets errors', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('First name:'), { target: { name: 'firstname', value: '' } });
    fireEvent.change(screen.getByLabelText('Last name:'), { target: { name: 'lastname', value: '' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { name: 'email', value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: 'invalid' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Confirm password:'), { target: { name: 'passwordConfirmation', value: 'weak123' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('First Name is required')).toBeInTheDocument();
      expect(screen.getByText('Last Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Username must consist of @ followed by at least three alphanumericals')).toBeInTheDocument();
      expect(screen.getByText('Password must contain an uppercase character, a lowercase character, and a number.')).toBeInTheDocument();
    });
  });

  test('handles successful signup', async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: 'Signup successful!' },
    });

    jest.useFakeTimers();

    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('First name:'), { target: { name: 'firstname', value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name:'), { target: { name: 'lastname', value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { name: 'email', value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: '@johndoe' } });
    fireEvent.change(screen.getByLabelText('Your motto in life :):'), { target: { name: 'description', value: 'A brief description' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'Password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password:'), { target: { name: 'passwordConfirmation', value: 'Password123' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Signup successful!', {
        hideProgressBar: true,
      });
    });

    jest.advanceTimersByTime(1800);

    expect(navigateMock).toHaveBeenCalledWith('/login');

    jest.useRealTimers();

  });

  test('handles signup failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Signup failed'));

    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('First name:'), { target: { name: 'firstname', value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name:'), { target: { name: 'lastname', value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { name: 'email', value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: '@johndoe' } });
    fireEvent.change(screen.getByLabelText('Your motto in life :):'), { target: { name: 'description', value: 'A brief description' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'Password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password:'), { target: { name: 'passwordConfirmation', value: 'Password123' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred. Please try again.');
    });

  });

  test('blocks signup if terms and conditions are not accepted', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('First name:'), { target: { name: 'firstname', value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name:'), { target: { name: 'lastname', value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { name: 'email', value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: '@johndoe' } });
    fireEvent.change(screen.getByLabelText('Your motto in life :):'), { target: { name: 'description', value: 'A brief description' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'Password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password:'), { target: { name: 'passwordConfirmation', value: 'Password123' } });

    //submit the form without accepting terms and conditions
    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You must accept the terms and conditions.');
    });

  });


  test('sets error if username is null', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: '' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

  });

  test('sets error if password is null', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: '' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

  });

  test('sets error if username is already taken', async () => {
    axios.get.mockResolvedValueOnce({ data: { exists: true } });
    axios.get.mockResolvedValueOnce({ data: { exists: true } });

    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('Username:'), { target: { name: 'username', value: '@takenusername' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('This username is already taken, please enter another')).toBeInTheDocument();
    });

  });

  test('sets error if password does not meet complexity requirements', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'weak' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('Password must contain an uppercase character, a lowercase character, and a number.')).toBeInTheDocument();
    });

  });

  test('sets error if password confirmation does not match password', async () => {
    render(
      <Router>
        <Signup />
      </Router>
    );

    fireEvent.change(screen.getByLabelText('Password:'), { target: { name: 'password', value: 'Password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password:'), { target: { name: 'passwordConfirmation', value: 'Password456' } });
    fireEvent.click(screen.getByLabelText('I accept the terms and conditions'));

    fireEvent.click(screen.getByTestId('signup-button-click'));

    await waitFor(() => {
      expect(screen.getByText('Password confirmation needs to match password')).toBeInTheDocument();
    });

  });

});