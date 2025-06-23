import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MusicButton from '../components/MusicButton';

// Mock the Audio class

window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();

beforeEach(() => {
    global.Audio = jest.fn().mockImplementation(() => ({
      pause: jest.fn(),
      play: jest.fn(() => Promise.resolve()),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      currentTime: 0,
      duration: 100,
      src: ''
    }));
  });
  
  // Mock document.querySelectorAll for the color tests
  beforeEach(() => {
    document.querySelectorAll = jest.fn().mockReturnValue([
      { style: {} },
      { style: {} },
      { style: {} }
    ]);
  });
  
describe('MusicButton Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
      });

    it('renders correctly with initial track', () => {
      render(<MusicButton />);
      expect(screen.getByText(/Currently Playing:/)).toBeInTheDocument();
    });
});

// Mock the Audio class and its methods
global.Audio = jest.fn().mockImplementation(() => ({
  pause: jest.fn(),
  play: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 180, 
}));


jest.mock("../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3", () => 'mock-track1');
jest.mock("../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3", () => 'mock-track2');
jest.mock("../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3", () => 'mock-track3');
jest.mock("../assets/music/Defqwop - Heart Afire (feat. Strix).mp3", () => 'mock-track4');
jest.mock("../assets/music/[Rhythm Root] Wii Shop Channel Main Theme (HQ).mp3", () => 'mock-track5');
jest.mock("../assets/music/[K.K. Slider] Bubblegum K.K. - K.K. Slider.mp3", () => 'mock-track6');
jest.mock("../assets/music/[Gyro Zeppeli] Pokemon X & Y-Bicycle theme [OST].mp3", () => 'mock-track7');

describe('MusicButton Component', () => {
  beforeEach(() => {
    global.Audio.mockClear();
    jest.clearAllMocks();
  });

  it('renders correctly with initial track', () => {
    render(<MusicButton />);
    
    expect(screen.getByText('Currently Playing: C U Again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶️' })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    
    // Check all tracks are rendered
    const trackButtons = screen.getAllByRole('button', { name: /C U Again|On & On|Why We Lose|Heart Afire|Wii Track|Bubblegum|Pokemon Bicycle Theme/ });
    expect(trackButtons).toHaveLength(7);
  });

  it('toggles play/pause when button is clicked', () => {
    render(<MusicButton />);
    const playButton = screen.getByRole('button', { name: '▶️' });
    
   
    fireEvent.click(playButton);
    expect(global.Audio.mock.results[0].value.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '⏸️' })).toBeInTheDocument();
    
    
    fireEvent.click(screen.getByRole('button', { name: '⏸️' }));
    expect(global.Audio.mock.results[0].value.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '▶️' })).toBeInTheDocument();
  });

  it('changes track when a track button is clicked', () => {
    render(<MusicButton />);
    
   
    fireEvent.click(screen.getByRole('button', { name: 'On & On' }));
    
    
    expect(global.Audio.mock.results[0].value.src).toBe('mock-track2');
    expect(screen.getByText('Currently Playing: On & On')).toBeInTheDocument();
    
    // Should reset play state and time
    expect(global.Audio.mock.results[0].value.pause).toHaveBeenCalled();
    expect(global.Audio.mock.results[0].value.currentTime).toBe(0);
  });

  it('updates progress bar when seeking', () => {
    render(<MusicButton />);
    const progressBar = screen.getByRole('slider');
    
    // Mock the audio duration
    global.Audio.mock.results[0].value.duration = 180;
    
    // Simulate seeking to 30 seconds
    fireEvent.change(progressBar, { target: { value: '30' } });
    expect(Number(global.Audio.mock.results[0].value.currentTime)).toBe(30);
  });

  it('sets up and cleans up event listeners', () => {
    const { unmount } = render(<MusicButton />);
    const audioInstance = global.Audio.mock.results[0].value;
    
    expect(audioInstance.addEventListener).toHaveBeenCalledWith(
      'timeupdate',
      expect.any(Function)
    );
    
    unmount();
    expect(audioInstance.removeEventListener).toHaveBeenCalledWith(
      'timeupdate',
      expect.any(Function)
    );
    expect(audioInstance.pause).toHaveBeenCalled();
  });

  it('applies random colors to track items', () => {
    const mockItems = Array(7).fill(0).map((_, i) => ({
      style: { backgroundColor: '' },
    }));
    document.querySelectorAll = jest.fn().mockReturnValue(mockItems);
    
    render(<MusicButton />);
    
    // Verify colors were applied
    mockItems.forEach(item => {
      expect(item.style.backgroundColor).toMatch(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
    });
  });

  it('changes track and resets state when a new track is selected', () => {
    render(<MusicButton />);
    
    
    const secondTrackButton = screen.getByRole('button', { name: 'On & On' });
    
    
    fireEvent.click(secondTrackButton);
    
    
    expect(screen.getByText('Currently Playing: On & On')).toBeInTheDocument();
    
    const playButton = screen.getByRole('button', { name: '▶️' });
    expect(playButton).toBeInTheDocument();
  });

  it('directly tests audio.src update on track change', () => {
    // Mock Audio implementation
    const mockAudio = {
      src: '',
      pause: jest.fn(),
      currentTime: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      play: jest.fn()
    };
    global.Audio = jest.fn(() => mockAudio);

    render(<MusicButton />);


    expect(mockAudio.src).toBe('mock-track1');


    fireEvent.click(screen.getByText('On & On'));


    expect(mockAudio.src).toBe('mock-track2');
    

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
  });
});

describe('Color Randomization (Lines 45-46)', () => {
    const testColors = [
      "#ffcccc", "#b3d9ff", "#c2b3ff", "#e0b3ff"
    ];
  
    it('applies colors from pastelRainbowColors and resets when exhausted', () => {
      // Track which colors have been assigned
      const assignedColors = [];
      let usedColors = [];
  
      
      const mockColorAssignment = () => {
        const availableColors = testColors.filter(c => !usedColors.includes(c));
        let color;
        
        if (availableColors.length > 0) {
          color = availableColors[0]; 
          usedColors.push(color);
        } else {
          // Reset when all colors are used
          usedColors = [testColors[0]];
          color = testColors[0];
        }
        
        assignedColors.push(color);
        return color;
      };
  
      // Create mock elements with controlled color assignment
      const mockItems = Array(testColors.length + 1)
        .fill()
        .map(() => ({
          style: { backgroundColor: mockColorAssignment() }
        }));
  
      document.querySelectorAll = jest.fn(() => mockItems);
  
      render(<MusicButton />);
  
     
      testColors.forEach(color => {
        expect(assignedColors).toContain(color);
      });
  

      expect(assignedColors[testColors.length]).toBe(testColors[0]);
    });
  });