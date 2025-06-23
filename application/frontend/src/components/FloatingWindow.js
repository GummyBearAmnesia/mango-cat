import React from 'react';
import Draggable from 'react-draggable';
import MusicButton from './MusicButton'; // Adjust path as necessary


//creating a floating window for the free tracks, to be able to move it around on the group study page
function FloatingMusicPlayer({ isOpen, onClose }) {
    if (!isOpen) return null; // Don't render if not open

    return (
        <Draggable handle=".handle">
            <div className="floating-window" style={{
                position: 'fixed',
                top: '10%',
                left: '10%',
                width: 'auto',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
                borderRadius: '10px',
                zIndex: 1000,
                cursor: 'move'
            }}>
                <div className="handle" style={{ marginBottom: '10px', cursor: 'move' }}>
                    <strong >Free Tracks:</strong>
                    <button onClick={onClose} style={{ float: 'right', cursor: 'pointer' }}>X</button>
                </div>
                <MusicButton />
            </div>
        </Draggable>
    );
}

export default FloatingMusicPlayer;
