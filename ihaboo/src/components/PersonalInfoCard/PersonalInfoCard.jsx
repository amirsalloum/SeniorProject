import React, { useState, useEffect } from "react";
import AvatarPlaceholder from "../../assets/images/noprofile.jpeg"; // Default avatar image

function PersonalInfoCard({
  formData = {},
  handleInputChange,
  handleProfilePictureChange,
}) {
  const [profilePicture, setProfilePicture] = useState(AvatarPlaceholder); // Default avatar placeholder
  const [roles, setRoles] = useState([]); // Initialize roles state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch token from localStorage
  const token = localStorage.getItem("authToken");

  // Fetch roles from the backend
  useEffect(() => {
    let isMounted = true; // Track if the component is still mounted

    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/user/roles", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Retrieve token from localStorage
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setRoles(data.Data || []);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        if (isMounted) {
          setError(error.message || "Failed to load roles");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (token) {
      fetchRoles();
    } else {
      setError("No authentication token found");
    }

    return () => {
      isMounted = false; // Cleanup: prevent state updates if the component is unmounted
    };
  }, [token]);

  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(URL.createObjectURL(file)); // Preview the image
      handleProfilePictureChange(file); // Pass the selected file to parent component
    }
  };

  // Ensure the profile picture is updated based on the fetched data
  useEffect(() => {
    if (formData.profilePicture) {
      if (typeof formData.profilePicture === "string") {
        // Check if it's already a URL string
        if (formData.profilePicture.startsWith("http")) {
          setProfilePicture(formData.profilePicture);
        } else {
          setProfilePicture(`http://localhost:3001${formData.profilePicture}`);
        }
      }
    }
  }, [formData.profilePicture]);

  return (
    <div className="flex flex-col bg-transparent w-full">
      <h2 className="text-[#424242] font-semibold mb-4 text-xl xs:text-2xl">
        Personal Information
      </h2>

      {/* Loading and Error Display */}
      {isLoading && <p className="text-gray-700">Loading...</p>}
      {error && <p className="text-red-500 text-center my-2">{error}</p>}

      {/* Profile Section */}
      <div className="flex flex-col xs:flex-row items-center mb-6">
        <div className="relative">
          <img
            src={profilePicture}
            alt="Profile"
            className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover border-4 cursor-pointer border-yellow-600 transition-transform duration-300 ease-in-out hover:scale-110 z-10"
            onClick={() => document.getElementById("profilePictureUpload").click()}
          />
          <input
            type="file"
            id="profilePictureUpload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <div className="mt-4 xs:mt-0 xs:ml-6 flex flex-col">
          <label className="font-bold text-sm xs:text-xl">Profile Picture</label>
          <label className="text-gray-400 text-sm xs:text-base">
            Drag and drop a picture here, or click to select
          </label>
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col bg-transparent">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* First Column */}
          <div className="flex flex-col bg-transparent">
            {/* First Name Field */}
            <div className="flex flex-col">
              <label htmlFor="firstName" className="text-sm mb-1 text-[#000000B3]">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200"
                placeholder="Enter first name"
              />
            </div>

            {/* Email Field */}
            <div className="flex flex-col mt-4">
              <label htmlFor="email" className="text-sm mb-1 text-[#000000B3]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200"
                placeholder="Enter email address"
              />
            </div>

            {/* Username Field */}
            <div className="flex flex-col mt-4">
              <label htmlFor="username" className="text-sm mb-1 text-[#000000B3]">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Second Column */}
          <div className="flex flex-col bg-transparent">
            {/* Last Name Field */}
            <div className="flex flex-col">
              <label htmlFor="secondName" className="text-sm mb-1 text-[#000000B3]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="secondName"
                type="text"
                name="secondName"
                value={formData.secondName || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200"
                placeholder="Enter last name"
              />
            </div>

            {/* Phone Number Field */}
            <div className="flex flex-col mt-4">
              <label htmlFor="phoneNumber" className="text-sm mb-1 text-[#000000B3]">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role Field */}
            <div className="flex flex-col mt-4">
              <label htmlFor="roleID" className="text-sm mb-1 text-[#000000B3]">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="roleID"
                name="roleID"
                value={formData.roleID || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200 cursor-pointer"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.roleID} value={role.roleID}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Third Column */}
          <div className="flex flex-col bg-transparent">
            {/* Date of Birth Field */}
            <div className="flex flex-col">
              <label htmlFor="dob" className="text-sm mb-1 text-[#000000B3]">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200"
              />
            </div>

            {/* Gender Field */}
            <div className="flex flex-col mt-4">
              <label htmlFor="gender" className="text-sm mb-1 text-[#000000B3]">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] transition-colors duration-200 cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoCard;
