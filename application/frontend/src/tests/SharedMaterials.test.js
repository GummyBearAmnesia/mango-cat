import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SharedMaterials from '../pages/SharedMaterials';
import { BrowserRouter as Router } from "react-router-dom";
import { ref, getDownloadURL, uploadBytes, listAll, deleteObject } from 'firebase/storage';
import { getAuthenticatedRequest } from '../utils/authService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

jest.mock('../utils/authService');
jest.mock('firebase/storage'); 
jest.mock('../firebase-config.js');
jest.mock('react-toastify', () => {
  const actual = jest.requireActual('react-toastify'); // Preserve the actual module
  return {
    ...actual, // Spread actual exports
    toast: {
      error: jest.fn(),
      success: jest.fn(),
      dismiss: jest.fn(),
      clearWaitingQueue: jest.fn(),
    },
  };
});


describe('SharedMaterials', () => {
  let mockSocket;

  beforeEach(() => {
    getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
    uploadBytes.mockResolvedValue();
    getAuthenticatedRequest.mockResolvedValue({ roomCode: 'testRoomCode' });
    mockSocket = {
      addEventListener: jest.fn((event, callback) => {
        if (event === 'message') {
          // Store the callback to simulate WebSocket messages later
          mockSocket.onmessage = callback;
        }
      }),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    };

  });

  test('renders the component', () => {
    render(
      <Router>
        <SharedMaterials />
      </Router>
    );
      
    expect(screen.getByText('Shared Materials'));
    expect(screen.getByTestId('upload-materials-button')).toBeInTheDocument();
  });

  test('uploads a file successfully', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
        fireEvent.click(uploadButton); 
    });

    //find the hidden file input and simulate file selection
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    const fileUploadedEvent = { 
      type: "file_uploaded", 
      file: { name: 'avatar.png', url: 'http://example.com/avatar.png' } 
    };
    
    //trigger the WebSocket callback
    mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });

    await waitFor(() => expect(uploadBytes).toHaveBeenCalled());
    await waitFor(() => expect(getDownloadURL).toHaveBeenCalled());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("File Uploaded!", {"autoClose": 2000}));
    
    await waitFor(() => expect(screen.getByText('avatar.png')).toBeInTheDocument());
  });

  test('handles file upload error', async () => {
    render(
      <Router>
        <SharedMaterials />
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    uploadBytes.mockRejectedValueOnce(new Error('Upload error'));

    const uploadButton = screen.getByTestId('plus-upload-button');
    fireEvent.click(uploadButton); 

    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    await waitFor(() => expect(uploadBytes).toHaveBeenCalledWith(undefined, file));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error Uploading File', {"autoClose": 2000}));

  });

  test('deletes a file successfully', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket}/>
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
        fireEvent.click(uploadButton); 
    });

    //find the hidden file input and simulate file selection
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    const fileUploadedEvent = {
      type: 'file_uploaded',
      file: { name: 'avatar.png', url: 'https://example.com/avatar.png' },
    };
  
    // Trigger the WebSocket callback for file upload
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });
    });

    await waitFor(() => {
      expect(screen.getByText('avatar.png')).toBeInTheDocument();
    });

    const fileRef = { name: 'avatar.png' };
    listAll.mockResolvedValueOnce({ items: [fileRef] });
    deleteObject.mockResolvedValueOnce();

    const deleteButton = screen.getByTestId('material-delete');
    fireEvent.click(deleteButton);

    const fileDeletedEvent = {
      type: 'file_deleted',
      file: { name: 'avatar.png' },
    };

    //trigger the WebSocket callback for file deletion
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileDeletedEvent) });
    });

    await waitFor(() => expect(deleteObject).toHaveBeenCalledWith(undefined));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('File Deleted Successfully!', {"autoClose": 2000}));
    await waitFor(() => expect(screen.queryByText('avatar.png')).not.toBeInTheDocument());

  });

  test('handles file delete error', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket}/>
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
        fireEvent.click(uploadButton); 
    });

    //find the hidden file input and simulate file selection
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    const fileUploadedEvent = {
      type: 'file_uploaded',
      file: { name: 'avatar.png', url: 'https://example.com/avatar.png' },
    };
  
    //trigger the WebSocket callback for file upload
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });
    });

    await waitFor(() => expect(screen.getByText('avatar.png')).toBeInTheDocument());

    const fileRef = { name: 'avatar.png' };
    listAll.mockResolvedValueOnce({ items: [fileRef] });
    deleteObject.mockRejectedValueOnce(new Error('Delete error'));

    const deleteButton = screen.getByTestId('material-delete');
    fireEvent.click(deleteButton);

    await waitFor(() => expect(deleteObject).toHaveBeenCalledWith(undefined));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error Deleting File', {"autoClose": 2000}));

  });

  test('opens and closes the file modal', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket}/>
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
        fireEvent.click(uploadButton); 
    });

    //find the hidden file input and simulate file selection
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    const fileUploadedEvent = {
      type: 'file_uploaded',
      file: { name: 'avatar.png', url: 'https://example.com/avatar.png' },
    };
  
    //trigger the WebSocket callback for file upload
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });
    });

    await waitFor(() => {
      expect(screen.getByText('avatar.png')).toBeInTheDocument();
    });

    const fileRef = { name: 'avatar.png' };
    listAll.mockResolvedValueOnce({ items: [fileRef] });

    const fileLabel = screen.getByText('avatar.png');
    fireEvent.click(fileLabel);

    expect(screen.getByTitle('avatar.png')).toBeInTheDocument();

    const closeButton = screen.getByTestId('modal-materials-close');
    fireEvent.click(closeButton);

    await waitFor(() => expect(screen.queryByTitle('avatar.png')).not.toBeInTheDocument());

  });

  test('handles error fetching files', async () => {
    render(
      <Router>
        <SharedMaterials />
      </Router>
    );

    listAll.mockRejectedValueOnce(new Error('Fetch error'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error Fetching Files', {"autoClose": 2000}));
    
  });

  test('shows error toast when no file is selected', async () => {
    render(
      <Router>
        <SharedMaterials />
      </Router>
    );

    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } }); // No file selected
    });

    expect(toast.dismiss).toHaveBeenCalled();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No File Selected, Try Again!', {"autoClose": 2000}));

  });

  test('shows error toast when file already exists', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket}/>
      </Router>
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const input = screen.getByTestId('upload-materials-button');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    const fileUploadedEvent = {
      type: 'file_uploaded',
      file: { name: 'avatar.png', url: 'https://example.com/avatar.png' },
    };
  
    //trigger the WebSocket callback for file upload
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });
    });

    expect(screen.getByText('avatar.png')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } }); //simulate file selection
    });

    expect(toast.dismiss).toHaveBeenCalled();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This File Already Exists! Please Rename Your File!', {"autoClose": 2000}));
    expect(input.value).toBe('');

  });

  test('fetches and sets files state', async () => {
    const mockFiles = [
      { name: 'file1.pdf', fullPath: 'shared-materials/file1.pdf' },
      { name: 'file2.docx', fullPath: 'shared-materials/file2.docx' },
    ];
  
    listAll.mockResolvedValueOnce({ items: mockFiles.map(file => ({ name: file.name, fullPath: file.fullPath })) });
    
    getDownloadURL.mockImplementation(async (ref) => `https://example.com/${ref.fullPath}`);
  
    render(
      <Router>
        <SharedMaterials />
      </Router>
    );
  
    await waitFor(() => {
      expect(getDownloadURL).toHaveBeenCalledTimes(mockFiles.length);
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.docx')).toBeInTheDocument();
    });
  });



  test('removes file from state when file_deleted WebSocket message is received', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );
  
    const file = { name: 'avatar.png', url: 'https://example.com/avatar.png', type: 'image/png' };
    const fileUploadedEvent = {
      type: 'file_uploaded',
      file,
    };
  
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileUploadedEvent) });
    });
  
    await waitFor(() => expect(screen.getByText('avatar.png')).toBeInTheDocument());
  
    const fileDeletedEvent = {
      type: 'file_deleted',
      fileName: 'avatar.png',
    };
  
    await act(async () => {
      mockSocket.onmessage({ data: JSON.stringify(fileDeletedEvent) });
    });
  
    await waitFor(() => expect(screen.queryByText('avatar.png')).not.toBeInTheDocument());
  });

  test('sends file_uploaded WebSocket message when a file is uploaded', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );
  
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  
    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
      fireEvent.click(uploadButton);
    });
  
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  
    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'file_uploaded',
          file: { name: 'avatar.png', url: 'https://example.com/avatar.png', type: 'image/png' },
        })
      );
    });
  });

  test('clears file input after successful upload', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );
  
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  
    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
      fireEvent.click(uploadButton);
    });
  
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  
    expect(input.value).toBe('');
  });


  test('displays success toast after file upload', async () => {
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );
  
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  
    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
      fireEvent.click(uploadButton);
    });
  
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('File Uploaded!', { autoClose: 2000 });
    });
  });

  test('displays error toast if file upload fails', async () => {
    uploadBytes.mockRejectedValueOnce(new Error('Upload failed'));
  
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );
  
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  
    const uploadButton = screen.getByTestId('plus-upload-button');
    await act(async () => {
      fireEvent.click(uploadButton);
    });
  
    const input = screen.getByTestId('upload-materials-button');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error Uploading File', { autoClose: 2000 });
    });
  });

});