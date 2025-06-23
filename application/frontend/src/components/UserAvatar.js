import React from 'react';

// Import avatar images from assets
import avatar1 from '../assets/avatars/avatar_1.png';
import avatar2 from '../assets/avatars/avatar_2.png';
import avatar3 from '../assets/avatars/avatar_3.png';
import avatar4 from '../assets/avatars/avatar_4.png';
import avatar5 from '../assets/avatars/avatar_5.png';
import avatar6 from '../assets/avatars/avatar_6.png';
import avatar7 from '../assets/avatars/avatar_7.png';
import avatar8 from '../assets/avatars/avatar_8.png';

const UserAvatar = ({ onSelect, currentAvatar }) => {
  // Available user avatars
  const avatarUrls = [
    avatar1, avatar2, avatar3, avatar4,
    avatar5, avatar6, avatar7, avatar8,
  ];

  // A const to handle avatar selection
  const handleSelect = (url) => {
    if (onSelect) {
      onSelect(url);
    }
  };

  return (
    <div data-testid="avatar-grid" style={{ width: '440px' }}>
      {Array.from({ length: Math.ceil(avatarUrls.length / 4) }, (_, rowIndex) => (
        <div
          key={rowIndex}
          data-testid="avatar-row"
          role="row"
          style={{ display: 'flex' }}
        >
          {avatarUrls.slice(rowIndex * 4, (rowIndex + 1) * 4).map((url, colIndex) => (
            <img
              data-testid="avatar-img"
              key={rowIndex * 4 + colIndex}
              src={url}
              alt={`Avatar ${rowIndex * 4 + colIndex + 1}`}
              onClick={() => handleSelect(url)}
              style={{
                width: '100px',
                height: '100px',
                margin: '5px',
                cursor: 'pointer',
                border: url === currentAvatar ? '2px solid #f2bac9' : '1px solid #bad7f5',
                borderRadius: '5%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default UserAvatar; 