import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import Welcome from '../pages/Welcome';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../assets/thestudyspot.jpeg', () => 'thestudyspot.jpeg');

describe('Welcome Component', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });



  test('renders welcome page correctly', () => {
    render(
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByText('The Study Spot')).toBeInTheDocument();

    const image = screen.getByAltText('logo');
    expect(image).toBeInTheDocument();
    expect(image).toHaveClass('welcome-image');

    expect(screen.getByRole('button', { name: 'LOGIN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CREATE ACCOUNT' })).toBeInTheDocument();

  });

  test('navigates to login page when LOGIN button is clicked', () => {
    render(
      <Router>
        <Welcome />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    expect(navigateMock).toHaveBeenCalledWith('/login');

  });

  test('navigates to signup page when CREATE ACCOUNT button is clicked', () => {
    render(
      <Router>
        <Welcome />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: 'CREATE ACCOUNT' }));

    expect(navigateMock).toHaveBeenCalledWith('/signup');
    
  });

});