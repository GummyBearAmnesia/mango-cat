import React, { useState, useEffect } from "react";
import { storage } from "../firebase-config";
import { Navigate, useNavigate } from "react-router-dom";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getAuthenticatedRequest, getAccessToken } from "../utils/authService";
import defaultAvatar from "../assets/avatars/avatar_2.png";
import UserAvatar from "../components/UserAvatar";
import UserBadges from "../components/UserBadges";
import "../styles/ProfileBox.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


/*
The profile box is the profile panel on the dashboard, it displays the username,
profile picture, description and user badges. It also has a link to the calendar.

The profile box also allows the user to upload their own profile picture or change their
description.
*/


function ProfileBox() {

  // useNavigate for page navigation
  const navigate = useNavigate();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [userBadges, setUserBadges] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // Stores user data
  const [userData, setUserData] = useState({
    username: null,
    description: "",
    image: defaultAvatar, //default image
    avatarSrc: null, //represents selectable PFPs
  });
  // Stores the edited description
  const [editedDescription, setEditedDescription] = useState(
    userData.description
  );

  // Method to navigate the the calendar page
  const gotoCalendar = () => {
    const user_id = localStorage.getItem("user_id");
    console.log(user_id);
    navigate(`/calendar/`, {
      state: { userId: user_id },
    });
  };

  // Fetches user data on page loading ( user profile picture, data, badges )
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getAuthenticatedRequest("/profile/", "GET");

        //fetch profile picture from firebase using user_id
        const imageRef = ref(storage, `avatars/${data.username}`);
        const imageUrl = await getDownloadURL(imageRef).catch(
          () => defaultAvatar
        ); //default image if not found

        //update user data
        setUserData({
          username: data.username || "N/A",
          description: data.description || "",
          image: imageUrl,
          avatarSrc: imageUrl,
        });

        //fetch user badges
        const badges = await getUserBadges();
        setUserBadges(badges);
      } catch (error) {
        toast.error("error fetching user data");
      }
    };

    fetchUserData();
  }, []);


  // Method to change the user's profile picture or avatar
  const handleChangeAvatar = async (event) => {
    //get the selected file
    const file = event.target.files[0];
    if (!file || !userData.username) {
      toast.error("no valid user id or file selected");
      return;
    }
    //get the file reference from firebase
    const fileRef = ref(storage, `avatars/${userData.username}`);
    try {
      //upload file to firebase
      await uploadBytes(fileRef, file);

      //get imageURL
      const imageUrl = await getDownloadURL(fileRef);

      //update userData with new imageURL
      setUserData((prevData) => ({
        ...prevData,
        image: imageUrl,
        avatarSrc: imageUrl,
      }));

      toast.success("avatar uploaded successfully");
    } catch (error) {
      toast.error("error uploading avatar");
    }
  };


  // Method to log out and redirect to the welcome page
  const handleLogOff = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("loggedInUser");
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Method to update the user description and save it in the backend
  const handleSaveDescription = async () => {
    try {
      //update new description in the backend
      const data = await getAuthenticatedRequest("/description/", "PUT", {
        description: editedDescription,
      });

      // set new user description
      setUserData((prevData) => ({
        ...prevData,
        description: data.description,
      }));

      toast.success("description updated successfully");
    } catch (error) {
      toast.error("error updating description");
    }
  };

  // allows the user to change to one of the default profile pictures
  // this is updated and saved in the backend
  // alternatively the user can upload their own picture which is added to firebase and saved there
  const handleDefaultPFP = async (avatarSrc) => {
    const fileRef = ref(storage, `avatars/${userData.username}`);
    try {
      //upload file to firebase
      const response = await fetch(avatarSrc);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);

      //get imageURL
      const imageUrl = await getDownloadURL(fileRef);

      //update userData with new imageURL
      setUserData((prevData) => ({
        ...prevData,
        image: imageUrl,
        avatarSrc: avatarSrc,
      }));

      toast.success("avatar selected successfully");
    } catch (error) {
      toast.error("error selecting avatar from defaults");
    }
  };

  // retrieves the user's badges
  const getUserBadges = async () => {
    try {
      //get badges from rewards model in backend
      const badges = await getAuthenticatedRequest("/badges/", "GET");
      return badges;
    } catch (error) {
      toast.error("error fetching user badges");
      return [];
    }
  };



  return (
    <div className="profile-container">
      <ToastContainer position="top-center" />
      <div className="profile-box">
        <h1 className="profile-title">Profile</h1>
        <div className="picture-container">
          <div className="container1">

            {/* Displays the user's profile picture */}
            <img src={userData.image} alt="logo" className="profile-pic" data-testid="image-profile-src" />

            {/* Displays the user's username*/}
            <h1 className="profile-username">{userData.username}</h1>

            {/* Allows the user to access their inventory, showing their badge collection */}
            {/* Badges are study achievements which the users can collect */}
            <button
              className="inventory-button"
              onClick={() => setShowInventory(!showInventory)}
              aria-label={
                showInventory
                  ? "Hide Badge Collection"
                  : "View Badge Collection"
              }
            >
              🏆
            </button>

            {/* Button which redirects to the calendar page */}
            <button
              className="CalendarButton"
              data-testid="calendar-button-profile"
              onClick={gotoCalendar}
            >
              📅
            </button>

            {/* Allows the user to change their avatar / profile picture */}
            <input
              type="file"
              accept="image/*"
              data-testid="file-input"
              id="change-avatar"
              onChange={handleChangeAvatar}
              className="change-avatar-button"
              style={{ display: "none" }}
            />
          </div>

          {/* Container which displays the user's description, log off and profile edit buttons*/}
          <div className="main-profile-container">

            {/* Displays the user's description*/}
            <div className="description-display-container">
              <p className="description-display">{userData.description}</p>
            </div>

            {/* Button allows the user to log out and redirects the home / welcome page */}
            <div className="profile-button-container">
              <button
                type="button"
                className="logoff-button"
                onClick={handleLogOff}
              >
                Logout
              </button>

              {/* Button opening popup to allow users to edit their profile */}
              <button
                type="button"
                data-testid="show-more-button"
                className="profile-edit-button"
                onClick={() => setShowModal(true)}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>


        {/* This handles the popup which allows users to edit their profile*/}
        {showModal && (
          <div className="modal-profile">
            <div className="modal-content-profile">

              {/* Button to close popup */}
              <span
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                &times;
              </span>

              {/* Change default avatar or upload your own */}
              <div className="profile-popup-container">
                <div className="inventory-align">
                  <label htmlFor="change-avatar" className="upload-button">
                    UPLOAD AVATAR
                  </label>
                  <button
                    className="default-select-button"
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  >
                    DEFAULT AVATARS
                  </button>
                </div>
                {/* Select from default avatars*/}
                {showAvatarSelector && (
                  <div className="avatar-selector">
                    <UserAvatar
                      onSelect={handleDefaultPFP}
                      currentAvatar={userData.avatarSrc}
                    />
                  </div>
                )}
              </div>

              {/* Update profile description by typing and saving */}
              <textarea
                className="profile-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Please Enter Description"
              />

              {/* Save new description and new profile picture */}
              <button
                type="button"
                className="save-desc-button"
                onClick={handleSaveDescription}
              >
                SAVE DESCRIPTION
              </button>
            </div>
          </div>
        )}


        {/* Handles popup which shows badge inventory */}
        {/* Again the badges are study acheivements which the users can collect*/}
        {showInventory && (
          <div className="inventory-content">
            <div className="inventory-display-content">
              <span
                className="close-button"
                onClick={() => setShowInventory(false)}
              >
                &times;
              </span>
              <h2>Your Badge Collection</h2>
              <UserBadges userBadges={userBadges} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileBox;
