import React from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import Dashboard from '../pages/Dashboard'; 
import { BrowserRouter as Router } from "react-router-dom";

//mock the necessary modules
jest.mock('../pages/Analytics', () => () => <div>Mocked Analytics</div>);
jest.mock('../components/ToDoListComponents/newToDoList', () => () => <div>Mocked ToDoList</div>);
jest.mock("axios");
jest.mock("@fontsource/vt323", () => {}); 
jest.mock("@fontsource/press-start-2p", () => {});  
jest.mock('../firebase-config.js');
jest.mock('../assets/blueberry.jpeg', () => 'blueberry.jpeg');
jest.mock('../assets/generate.PNG', () => 'generate.PNG');
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

jest.mock('@mui/material', () => ({
  Dialog: ({ children, open }) => open ? <div>{children}</div> : null,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogContent: ({ children }) => <div>{children}</div>,
  Button: ({ children }) => <button>{children}</button>,
}));

jest.mock("@mui/icons-material/PlayArrow", () => "PlayArrowIcon");
jest.mock("@mui/icons-material/Pause", () => "PauseIcon");
jest.mock("@mui/icons-material/SkipNext", () => "SkipNextIcon");


jest.mock("../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3", () => "mock-audio-file-1");
jest.mock("../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3", () => "mock-audio-file-2");
jest.mock("../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3", () => "mock-audio-file-3");
jest.mock("../assets/music/Defqwop - Heart Afire (feat. Strix).mp3", () => "mock-audio-file-4");
jest.mock("../assets/music/[Rhythm Root] Wii Shop Channel Main Theme (HQ).mp3", () => "mock-audio-file-5");
jest.mock("../assets/music/[K.K. Slider] Bubblegum K.K. - K.K. Slider.mp3", () => "mock-audio-file-6");
jest.mock("../assets/music/[Gyro Zeppeli] Pokemon X & Y-Bicycle theme [OST].mp3", () => "mock-audio-file-7");


describe("Dashboard", () => {
  test('renders the Dashboard heading', () => {
    render(
      <Router>
        <Dashboard/>
      </Router>
    ); 

    //check for the main heading
    const heading = screen.getByRole('heading', { name: /dashboard/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('dashboard-heading');

    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('main-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();

  });

  test('renders all child components in correct panels', () => {
    render(
      <Router>
        <Dashboard />
      </Router>
    );

    const dashboardContent = screen.getByTestId('dashboard-content-test');
  
    //left panel
    const leftPanel = dashboardContent.querySelector('.dashboard-left-panel');
    expect(leftPanel).toBeInTheDocument();
    expect(leftPanel.querySelector('.dashboard-panel')).toBeInTheDocument();
    
    //main panel
    const mainPanel = dashboardContent.querySelector('.dashboard-main-panel');
    expect(mainPanel).toBeInTheDocument();
    expect(mainPanel.children.length).toBe(2);
    
    //right panel
    const rightPanel = dashboardContent.querySelector('.dashboard-right-panel');
    expect(rightPanel).toBeInTheDocument();
    expect(rightPanel.querySelector('.to-do-list')).toBeInTheDocument();

  });

});