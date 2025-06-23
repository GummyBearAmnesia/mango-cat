import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

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
jest.mock('../firebase-config.js') ;
jest.mock('../assets/thestudyspot.jpeg', () => 'thestudyspot.jpeg');
jest.mock('../assets/blueberry.jpeg', () => 'blueberry.jpeg');
jest.mock('../assets/generate.PNG', () => 'generate.PNG');

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

test('renders welcome heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/The Study Spot/i); // Or any text present in Welcome.js
    expect(headingElement).toBeInTheDocument();
});  
 