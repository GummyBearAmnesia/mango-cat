import React, { useState, useEffect } from 'react';
import 'tailwindcss';
import '@fontsource/vt323';
import '@fontsource/press-start-2p';
import blueberryImg from '../assets/blueberry.jpeg';
import '../styles/StudyTimer.css'; // Import the CSS file
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Study Timer in the Group Study Room
const StudyTimer = ({ roomId, isHost, onClose, "data-testid": dataTestId }) => {
  // State variables for timer settings
  const [studyLength, setStudyLength] = useState(25); // Study duration - deafault 25 mins
  const [breakLength, setBreakLength] = useState(5);
  const [rounds, setRounds] = useState(4);  // Total no. of rounds of study+break
  const [currentRound, setCurrentRound] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(studyLength * 60); // Time left in seconds
  const [isRunning, setIsRunning] = useState(false);  // Whether timer is running or not
  const [currentPage, setCurrentPage] = useState('welcome');
  const [isMinimized, setIsMinimized] = useState(false);  // If timer is minimised or not
  const [isPaused, setIsPaused] = useState(false);
  const [playSound, setPlaySound] = useState(true); //Play sound on timer completion
  const [studyTime, setStudyTime] = useState({ hours: 0, minutes: 25, seconds: 0 });  // Study time input
  const [breakTime, setBreakTime] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [errorMessage, setErrorMessage] = useState(''); // Error message for invalid inputs

  // Sound effect for timer completion
  const completionSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');

  // On component mount, load the saved settings from localStorage
  useEffect(() => {
    const savedStudyLength = localStorage.getItem('studyLength');
    const savedBreakLength = localStorage.getItem('breakLength');
    const savedRounds = localStorage.getItem('rounds');

    if (savedStudyLength) setStudyLength(parseInt(savedStudyLength));
    if (savedBreakLength) setBreakLength(parseInt(savedBreakLength));
    if (savedRounds) setRounds(parseInt(savedRounds));
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('studyLength', studyLength);
    localStorage.setItem('breakLength', breakLength);
    localStorage.setItem('rounds', rounds);
  };

  // Validate time input values
  const validateTimeInput = (time, type) => {
    if (time.hours < 0 || time.hours > 99) {
      toast.error(`Invalid ${type} hours. Please enter a value between 0 and 99.`);
      return false;
    }
    if (time.minutes < 0 || time.minutes > 59) {
      toast.error(`Invalid ${type} minutes. Please enter a value between 0 and 59.`);
      return false;
    }
    if (time.seconds < 0 || time.seconds > 59) {
      toast.error(`Invalid ${type} seconds. Please enter a value between 0 and 59.`);
      return false;
    }
    return true;
  };

  // Start the timer if all valid
  const startTimer = () => {
    if (!validateTimeInput(studyTime, 'study') || !validateTimeInput(breakTime, 'break')) {
      return;
    }

    if (studyTime.hours === 0 && studyTime.minutes === 0 && studyTime.seconds === 0) {
      toast.error('Focus time input is empty.');
      return;
    }

    // Conversion to seconds
    const totalStudySeconds = (
      studyTime.hours * 3600 +
      studyTime.minutes * 60 +
      studyTime.seconds
    );

    const totalBreakSeconds = (
      breakTime.hours * 3600 +
      breakTime.minutes * 60 +
      breakTime.seconds
    );

    // Set timer state
    setTimeLeft(totalStudySeconds);
    setStudyLength(totalStudySeconds);
    setBreakLength(totalBreakSeconds);
    setCurrentRound(1);
    setIsBreak(false);
    setIsRunning(true);
    setCurrentPage('timer');
    
    // Save settings
    saveSettings();
  };

  useEffect(() => {
    let interval;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            if (playSound) {
              completionSound.play();
            }

            // When timer is completed
            if (!isBreak) {
              if (currentRound >= rounds) {
                setCurrentPage('completed');
                setIsRunning(false);
                return 0;
              }
              setIsBreak(true);
              // Special case: If break length is 0, immediately go to next round
              if (breakLength === 0) {
                setCurrentRound(prev => prev + 1);
                setIsBreak(false);
                return studyLength;
              }
              return breakLength;
            } else {
              setCurrentRound(prev => prev + 1);
              setIsBreak(false);
              return studyLength;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, isBreak, currentRound, rounds, breakLength, studyLength, playSound]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle pause/resume
  const toggleTimer = () => {
    setIsPaused(!isPaused);
  };

  // Reset the timer
  const resetTimer = () => {
    const totalStudySeconds = (
      studyTime.hours * 3600 +
      studyTime.minutes * 60 +
      studyTime.seconds
    );

    setTimeLeft(totalStudySeconds);
    setCurrentRound(1);
    setIsBreak(false);
    setIsRunning(true);
    setIsPaused(false);
  };

  // Handle back button click
  const handleBack = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(studyLength * 60);
    setCurrentRound(1);
    setIsBreak(false);
    setCurrentPage('welcome');
  };

  const clearError = () => {
    setErrorMessage('');
  };

  // Automatically clear error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // a CSS class for minimised state
  const timerWrapperClass = isMinimized ? "study-timer-wrapper minimized" : "study-timer-wrapper";

  return (
    <div className="study-timer-container">
      <ToastContainer position="top-center" />
      
      <div className={timerWrapperClass} data-testid={dataTestId}>
        <div className="mini-header">
          {isRunning ? 
            `${isBreak ? 'Break' : 'Focus'} - ${formatTime(timeLeft)}` : 
            'Study Timer'}
        </div>
        
        <div className="timer-content">
          {currentPage === 'completed' ? (
            <div className="p-4 w-80 flex flex-col bg-[#F0F3FC] timer-handle" style={{ height: "350px", position: "relative" }}>
              <div className="mt-8 text-center" style={{ 
                color: '#bac6f1', 
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '15px'
              }}>
                Well done!
                <br />
                Here, have a blueberry
              </div>
              
              <img 
                src={blueberryImg} 
                alt="Blueberry"
                style={{
                  display: 'block',
                  width: '160px',
                  margin: '20px auto 15px auto',
                  background: 'none',
                  backgroundColor: 'transparent'
                }}
              />
              
              <div style={{ 
                position: "absolute", 
                bottom: "10px",
                left: "0",
                width: "100%",
                padding: "0 10px 20px 10px"
              }}>
                <button
                  onClick={() => {
                    setCurrentPage('welcome');
                    setCurrentRound(1);
                    setIsBreak(false);
                    setTimeLeft(studyLength);
                    setIsRunning(false);
                  }}
                  className="w-full text-white rounded-lg"
                  style={{
                    backgroundColor: '#d1cbed',
                    fontFamily: '"Press Start 2P", monospace',
                    transition: 'background-color 0.3s, transform 0.3s',
                    color: 'white',
                    borderRadius: '0.5rem',
                    padding: '12px 4px',
                    fontSize: '15px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#8e99e3';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#d1cbed';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Start New Session
                </button>
              </div>
            </div>
          ) : !isRunning ? (
            <div className="p-4 w-80 min-height flex flex-col bg-[#F0F3FC] timer-handle">
              <div className="flex flex-col items-center px-8">
                <div className="text-2xl mb-4 press-start" style={{ color: '#bac6f1' }}>
                  Set Your Study Timer
                </div>

                <div className="w-full space-y-3">
                  <div className="flex flex-col items-center space-y-2">
                    <label className="input-label" style={{
                      color: '#d1cbed',
                      fontSize: '20px'
                    }}>Study Time</label>
                    <div className="flex justify-center gap-4">
                      <input
                        type="number"
                        value={studyTime.hours}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 99) {
                            setStudyTime({ ...studyTime, hours: value });
                          }
                        }}
                        min="0"
                        max="99"
                        placeholder="0"
                      />
                      <input
                        type="number"
                        value={studyTime.minutes}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 59) {
                            setStudyTime({ ...studyTime, minutes: value });
                          }
                        }}
                        min="0"
                        max="59"
                        placeholder="0"
                      />
                      <input
                        type="number"
                        value={studyTime.seconds}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 59) {
                            setStudyTime({ ...studyTime, seconds: value });
                          }
                        }}
                        min="0"
                        max="59"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <label className="input-label" style={{
                      color: '#d1cbed',
                      fontSize: '20px'
                    }}>Break Time</label>
                    <div className="flex justify-center gap-4">
                      <input
                        type="number"
                        value={breakTime.hours}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 99) {
                            setBreakTime({ ...breakTime, hours: value });
                          }
                        }}
                        min="0"
                        max="99"
                        placeholder="0"
                      />
                      <input
                        type="number"
                        value={breakTime.minutes}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 59) {
                            setBreakTime({ ...breakTime, minutes: value });
                          }
                        }}
                        min="0"
                        max="59"
                        placeholder="0"
                      />
                      <input
                        type="number"
                        value={breakTime.seconds}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 59) {
                            setBreakTime({ ...breakTime, seconds: value });
                          }
                        }}
                        min="0"
                        max="59"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center" style={{ width: 'auto', position: 'relative' }}>
                    <label className="input-label" style={{
                      color: '#d1cbed',
                      fontSize: '20px'
                    }}>Rounds</label>

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0' }}>
                      <input
                        type="number"
                        value={rounds}
                        onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="4"
                        style={{ width: '3rem' }}
                      />
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginLeft: '0',
                        position: 'absolute',
                        left: '5rem'
                      }}>
                        <button
                          onClick={(e) => setPlaySound(!playSound)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {playSound ? '💜' : '🤍'}
                        </button>
                        <span className="input-label" style={{
                          color: '#d1cbed',
                          fontSize: '20px',
                          marginLeft: '10px',
                          width: '150px',
                          lineHeight: '1.2',
                          textAlign: 'left'
                        }}>
                          Play sound when timer ends
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full px-4" style={{ marginTop: '10px' }}>
                  <button
                    onClick={startTimer}
                    className="start-timer-button"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8e99e3';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#d1cbed';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Start Timer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 w-80 min-height bg-[#F0F3FC] timer-handle" style={{ height: '370px', position: 'relative' }}>
              <div className="absolute w-full" style={{
                top: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                flexDirection: 'row',
                flexWrap: 'nowrap'
              }}>
                <button
                  onClick={handleBack}
                  data-testid="back-button"
                  style={{
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '20px',
                    zIndex: 5
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.triangle').style.borderRightColor = '#8e99e3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.triangle').style.borderRightColor = '#d1cbed';
                  }}
                >
                  <div
                    className="triangle"
                    data-testid="triangle"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderRight: '12px solid #d1cbed',
                      borderBottom: '8px solid transparent',
                      transition: 'border-right-color 0.3s'
                    }}
                  />
                </button>

                <h2 className="press-start" style={{
                  color: '#bac6f1',
                  fontSize: '20px',
                  lineHeight: 1.2,
                  margin: 0,
                  textAlign: 'center',
                  display: 'inline-block',
                  minHeight: '48px',
                  paddingTop: '0px'
                }}>
                  {isBreak ? (
                    <>
                      Break<br />
                      Time!
                    </>
                  ) : (
                    <>
                      Lock in<br />
                      or else!
                    </>
                  )}
                </h2>
              </div>

              <div className="absolute w-full" style={{
                bottom: '140px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <div style={{
                  color: '#bac6f1',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '50px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '50px',
                left: '0',
                right: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0 24px'
              }}>
                <div style={{
                  width: '100%',
                  marginBottom: '15px',
                  textAlign: 'center',
                  transform: 'translateY(10px)',
                  position: 'relative',
                }}>
                  <span style={{
                    color: '#d1cbed',
                    fontFamily: 'VT323, monospace',
                    fontSize: '20px',
                    display: 'block',
                    paddingTop: '5px'
                  }}>
                    Round {currentRound}/{rounds}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  width: '100%'
                }}>
                  <button
                    onClick={toggleTimer}
                    style={{
                      backgroundColor: '#d1cbed',
                      color: 'white',
                      fontFamily: 'VT323, monospace',
                      padding: '10px 0',
                      width: '110px',
                      height: '45px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      transition: 'background-color 0.3s, transform 0.3s',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8e99e3';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#d1cbed';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>
                      {isPaused ? 'Resume' : 'Pause'}
                    </span>
                  </button>

                  <button
                    onClick={resetTimer}
                    style={{
                      backgroundColor: '#d1cbed',
                      color: 'white',
                      fontFamily: 'VT323, monospace',
                      padding: '10px 0',
                      width: '110px',
                      height: '45px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      transition: 'background-color 0.3s, transform 0.3s',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8e99e3';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#d1cbed';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>
                      Reset
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
