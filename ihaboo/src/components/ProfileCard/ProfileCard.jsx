import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Avatar from "../../assets/images/noprofile.jpeg";
import axios from "axios";
import Spinner from "../../component/Spinner";
import PhoneInputOnly from "../../component/PhoneInput/PhoneInput"; // Incorporated PhoneInput
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client"; // Import Socket.IO client

const socket = io("http://localhost:3001"); // Initialize WebSocket connection outside the component

const EmployeeCard = ({ employeeId }) => {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("authToken");

  // If employeeId is not provided as a prop, we also check route parameters
  const { employeeId: routeEmployeeId } = useParams();

  // Determine final ID to use
  const finalEmployeeId = employeeId || routeEmployeeId || null;

  // Fetch profile data function
  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      let endpoint = "http://localhost:3001/api/dashboard/fullemployee";
      if (finalEmployeeId) {
        endpoint = `http://localhost:3001/api/dashboard/fullemployee/${finalEmployeeId}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.Data) {
        setProfileData(data.Data);
        setFormData({
          email: data.Data.email,
          phoneNumber: data.Data.phoneNumber,
          DOB: data.Data.DOB,
          profilePicture: data.Data.profilePicture,
          // Include additional fields if necessary
        });
      } else {
        setError("No profile data found");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError(`Failed to fetch profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [token, finalEmployeeId]);

  useEffect(() => {
    if (token) {
      fetchProfileData(); // Initial fetch on mount

      socket.on("employeeUpdated", fetchProfileData); // Listen for employee updates

      return () => {
        socket.off("employeeUpdated", fetchProfileData); // Clean up WebSocket event listener
      };
    } else {
      setError("No authentication token found");
    }
  }, [token, fetchProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneNumberChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      phoneNumber: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    setFormData({
      ...formData,
      profilePicturePreview: URL.createObjectURL(file),
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      if (finalEmployeeId && finalEmployeeId !== profileData.employeeID.toString()) {
        setError("You do not have permission to edit this profile.");
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      let uploadedProfilePicturePath = profileData.profilePicture;

      if (profilePicture) {
        const uploadFormData = new FormData();
        uploadFormData.append("profilePicture", profilePicture);

        const uploadResponse = await axios.post(
          "http://localhost:3001/api/dashboard/uploadProfile",
          uploadFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (uploadResponse.status === 200) {
          uploadedProfilePicturePath = uploadResponse.data.profilePicturePath;
        } else {
          throw new Error("Failed to upload profile picture");
        }
      }

      const formattedDOB = new Date(formData.DOB).toISOString().split("T")[0];
      const response = await fetch(
        "http://localhost:3001/api/dashboard/updateemployee",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            profilePicture: uploadedProfilePicturePath,
            DOB: formattedDOB,
            employeeID: profileData.employeeID,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save update: ${errorText}`);
      }

      setProfileData({
        ...profileData,
        ...formData,
        profilePicture: uploadedProfilePicturePath,
        DOB: formattedDOB,
      });

      setIsEditing(false);
      setError(null);

      // Emit update event
      socket.emit("employeeUpdated", { employeeID: profileData.employeeID });
    } catch (error) {
      console.error("Error saving update:", error);
      setError(`Failed to save update: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    if (!finalEmployeeId || finalEmployeeId === profileData.employeeID.toString()) {
      fileInputRef.current.click();
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profileData) {
      setFormData({
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        DOB: profileData.DOB,
        profilePicture: profileData.profilePicture,
        // Reset additional fields if necessary
      });
      setProfilePicture(null); // Reset profile picture state
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="error-message text-red-500 text-center">{error}</p>;
  }

  if (!profileData) {
    return <p className="text-center">No profile data available</p>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Determine if editing is allowed
  const canEdit = !finalEmployeeId || finalEmployeeId === profileData.employeeID.toString();

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-[15px] p-4 mb-4 shadow-lg relative">
      {/* Profile Picture Container */}
      <div
        className={`flex-shrink-0 flex items-center mb-4 lg:mb-0 lg:mr-5 justify-center lg:justify-start cursor-pointer ${
          isEditing && canEdit ? "hover:opacity-80" : ""
        }`}
        onClick={isEditing && canEdit ? handleProfilePictureClick : undefined}
      >
        <img
          src={
            formData.profilePicturePreview ||
            profileData.profilePicture ||
            Avatar
          }
          alt="Profile"
          className="w-24 h-24 sm:w-20 sm:h-20 xs:w-16 xs:h-16 rounded-full object-cover border-4 border-yellow-600 transition-transform duration-300 ease-in-out hover:scale-110 z-10"
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={!isEditing || !canEdit}
        />
      </div>

      {/* Profile Details Container */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold mt-1 text-center lg:text-left">
            {profileData.employeeName}
          </h2>
          {!isEditing && canEdit && (
            <button
              className="bg-gray-800 text-white px-3 py-1 rounded-full cursor-pointer hover:bg-gray-700 active:bg-gray-800"
              onClick={() => setIsEditing(true)}
              aria-label="Edit Profile"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          )}
        </div>

        {/* Responsive Stacking of Columns */}
        <div className="flex flex-col md:flex-row gap-5 mt-1">
          {/* Column 1 */}
          <div className="flex flex-col w-full">
            {/* Username Field (Optional: Uncomment if needed)
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Username: </strong>
              {isEditing && canEdit ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username || "Not assigned"}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1 cursor-not-allowed"
                  disabled
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.username || "Not assigned"}
                </span>
              )}
            </p>
            */}
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Email: </strong>
              {isEditing && canEdit ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.email}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Date of Birth: </strong>
              {isEditing && canEdit ? (
                <input
                  type="date"
                  name="DOB"
                  value={formData.DOB?.split("T")[0] || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {formatDate(profileData.DOB)}
                </span>
              )}
            </p>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col w-full">
            
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Gender: </strong>
              {isEditing && canEdit ? (
                <input
                  type="text"
                  name="gender"
                  value={profileData.gender}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1 cursor-not-allowed"
                  disabled
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.gender}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Phone: </strong>
              {isEditing && canEdit ? (
                <PhoneInputOnly
                  onPhoneNumberChange={handlePhoneNumberChange}
                  initialPhone={formData.phoneNumber || ""}
                  defaultCountry="LB"
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.phoneNumber}
                </span>
              )}
            </p>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col w-full">
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Report To: </strong>
              {isEditing && canEdit ? (
                <input
                  type="text"
                  name="reportTo"
                  value={
                    profileData.reportToFirstName && profileData.reportToSecondName
                      ? `${profileData.reportToFirstName} ${profileData.reportToSecondName}`
                      : "Not assigned"
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1 cursor-not-allowed"
                  disabled
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.reportToFirstName && profileData.reportToSecondName
                    ? `${profileData.reportToFirstName} ${profileData.reportToSecondName}`
                    : "Not assigned"}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 font-semibold my-1">
              <strong>Role: </strong>
              {isEditing && canEdit ? (
                <input
                  type="text"
                  name="role"
                  value={profileData.roleName || "Not assigned"}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm mt-1 cursor-not-allowed"
                  disabled
                />
              ) : (
                <span className="text-sm text-gray-900 font-normal">
                  {profileData.roleName || "Not assigned"}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Save and Cancel Buttons */}
        {isEditing && canEdit && (
          <div className="flex gap-4 mt-4 w-full justify-end">
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700"
              onClick={handleSave}
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? <Spinner /> : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;
