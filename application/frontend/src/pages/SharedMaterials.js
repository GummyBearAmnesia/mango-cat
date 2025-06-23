import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react";
import { storage } from "../firebase-config";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ref,
  getDownloadURL,
  uploadBytes,
  listAll,
  deleteObject,
} from "firebase/storage";
import { getAuthenticatedRequest, getAccessToken } from "../utils/authService";
import "../styles/SharedMaterials.css";


/*
This handles the shared materials box in the group study page.
Allows users to upload images or files which can be viewed by all users.
After all users have left the study room all of these files are deleted.
All files are stored on firebase, and the page updates for all users via websocket publishers and consumers.
*/

function SharedMaterials({ socket }) {
  const [files, setFiles] = useState([]);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  // Fetch files and setup websocket receiver
  useEffect(() => {
    const fetchFiles = async () => {
      // Fetches files from backend
      const data = await getAuthenticatedRequest("/shared_materials/", "GET");
      setRoomCode(data.roomCode);
      const listRef = ref(storage, `shared-materials/${roomCode}/`);
      try {
        const res = await listAll(listRef);
        const filePromises = res.items.map(async (itemRef) => {
          const fileUrl = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            url: fileUrl,
            type: itemRef.contentType,
          };
        });
        const files = await Promise.all(filePromises);
        setFiles(files);
      } catch (error) {
        toast.dismiss();
        setTimeout(() => {
          toast.error("Error Fetching Files", {
            autoClose: 2000,
          });
        }, 500);
      }
    };

    fetchFiles();

    // Listen for websocket messages
    if (socket) {
      const handleWebSocketMessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "file_uploaded") {
          // Add the new file to the list
          setFiles((prevFiles) => [...prevFiles, data.file]);
        } else if (data.type === "file_deleted") {
          // Remove the deleted file from the list
          setFiles((prevFiles) =>
            prevFiles.filter((file) => file.name !== data.fileName)
          );
        }
      };

      socket.addEventListener("message", handleWebSocketMessage);

      // Clean up WebSocket listener on unmount
      return () => {
        socket.removeEventListener("message", handleWebSocketMessage);
      };
    }
  }, [roomCode]);

  // Code for uploading a file

  const handleUploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.dismiss();
      setTimeout(() => {
        toast.error("No File Selected, Try Again!", {
          autoClose: 2000,
        });
      }, 500);
      return;
    }

    const fileExists = files.some(
      (existingFile) => existingFile.name === file.name
    );
    if (fileExists) {
      toast.dismiss();
      setTimeout(() => {
        toast.error("This File Already Exists! Please Rename Your File!", {
          autoClose: 2000,
        });
      }, 500);
      event.target.value = "";
      return;
    }

    const fileRef = ref(storage, `shared-materials/${roomCode}/${file.name}`);
    try {
      // Download the file from firebase
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      const newFile = { name: file.name, url: fileUrl, type: file.type };


      // Notify other users via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: "file_uploaded",
          file: newFile,
        });
        console.log("Sharing a file via websocket! :", message);
        socket.send(message);
      }

      //clear the previous file to allow same file to be uploaded whilst still triggering onChange
      event.target.value = "";

      toast.dismiss();
      setTimeout(() => {
        toast.success("File Uploaded!", {
          autoClose: 2000,
        });
      }, 500);
    } catch (error) {
      toast.dismiss();
      setTimeout(() => {
        toast.error("Error Uploading File", {
          autoClose: 2000,
        });
      }, 500);
    }
  };

  // Code for deleting a file

  const handleDeleteFile = async (fileName) => {
    const fileRef = ref(storage, `shared-materials/${roomCode}/${fileName}`);
    try {
      await deleteObject(fileRef);
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName)
      );

      // Notify other users via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: "file_deleted",
          fileName: fileName,
        });
        console.log("Deleting file via websocket! :", message);
        socket.send(message);
      }

      toast.dismiss();
      setTimeout(() => {
        toast.success("File Deleted Successfully!", {
          autoClose: 2000,
        });
      }, 500);
    } catch (error) {
      toast.dismiss();
      setTimeout(() => {
        toast.error("Error Deleting File", {
          autoClose: 2000,
        });
      }, 500);
    }
  };


  // Popup to view shared file
  const openFileModal = (file) => {
    setSelectedFile(file);
    setFileModalOpen(true);
    toast.dismiss();
    toast.clearWaitingQueue();
  };

  // Close popup
  const closeFileModal = () => {
    setFileModalOpen(false);
    setSelectedFile(null);
    toast.dismiss();
    toast.clearWaitingQueue();
  };

  return (
    <div className="shared-materials-container">
      <ToastContainer position="top-center" />

      <div className="shared-materials-content">
        <h1 className="sm-title">Shared Materials</h1>

        {/* Button to upload a material */}
        <input
          type="file"
          accept=".doc,.docx,.ppt,.pptx,.pdf,image/*"
          data-testid="upload-materials-button"
          id="upload-materials"
          onChange={handleUploadFile}
          className="upload-materials-button"
          style={{ display: "none" }}
        />
        <label
          htmlFor="upload-materials"
          data-testid="plus-upload-button"
          className="upload-materials-label"
        >
          +
        </label>

        {/* Displays all shared files in a scrollable list */}
        <div className="display-files-container" data-testid="display-files-container">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span
                onClick={() => openFileModal(file)}
                style={{ cursor: "pointer" }}
                className="file-name-label"
              >
                {file.name}
              </span>
              <button
                onClick={() => handleDeleteFile(file.name)}
                className="file-delete-button"
                data-testid="material-delete"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Popup to view shared file */}
        {fileModalOpen && (
          <div className="file-modal-container">
            <div className="file-modal-content">
              <span
                className="file-close-button"
                onClick={() => closeFileModal()}
                style={{ cursor: "pointer" }}
                data-testid="modal-materials-close"
              >
                &times;
              </span>
              <h2 className="file-modal-title">{selectedFile?.name}</h2>
              {selectedFile && (
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.name}
                  className="file-iframe"
                ></iframe>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedMaterials;