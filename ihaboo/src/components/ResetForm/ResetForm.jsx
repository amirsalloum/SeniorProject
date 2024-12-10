import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import eyeOpen from "../../assets/images/eyeOpen.svg";
import eyeClosed from "../../assets/images/eyeClosed.svg";
import Spinner from "../../component/Spinner"; // Import the Spinner component

const ResetForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Add state for loading spinner
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = {};

    if (!oldPassword)
      validationErrors.oldPassword = "* Old password is required";
    if (!newPassword)
      validationErrors.newPassword = "* New password is required";
    if (!confirmPassword)
      validationErrors.confirmPassword = "* Confirm your new password";

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      validationErrors.confirmPassword = "* New passwords do not match";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true); // Show the spinner during form submission

    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/resetPassword",
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.Status === "Success") {
        setSuccessMessage("Password reset successfully. Redirecting...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(
          response.data.Error || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false); // Hide the spinner after submission is complete
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "old") setShowOldPassword(!showOldPassword);
    if (field === "new") setShowNewPassword(!showNewPassword);
    if (field === "confirm") setShowConfirmPassword(!showConfirmPassword);
  };


  return (
    <div className="flex flex-col items-center">
      <h2 className="text-[#D6B031] text-2xl font-bold mt-3 mb-5 text-left w-full xs:w-[250px] sm:w-[300px]">
        Reset Your Password
      </h2>
      <form
        className="flex flex-col gap-3 mt-4 w-full xs:w-[250px] sm:w-[300px]"
        onSubmit={handleSubmit}
      >
    {/* Old Password */}
    <div className="relative mb-3 w-full">
    <input
        type={showOldPassword ? "text" : "password"}
        className={`w-full p-3 text-[14px] rounded-[15px] border ${
        errors.oldPassword ? "border-red-600" : "border-gray-300"
        } bg-white text-black`}
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => {
        setOldPassword(e.target.value);
        setErrors((prev) => ({ ...prev, oldPassword: "" }));
        }}
    />
    <img
        className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer w-5 h-5"
        src={showOldPassword ? eyeOpen : eyeClosed}
        alt={showOldPassword ? "Hide Password" : "Show Password"}
        onClick={() => togglePasswordVisibility("old")}
    />
    {errors.oldPassword && (
        <p className="text-red-600 text-sm mt-2">{errors.oldPassword}</p>
    )}
    </div>

    {/* New Password */}
    <div className="relative mb-3 w-full">
    <input
        type={showNewPassword ? "text" : "password"}
        className={`w-full p-3 text-[14px] rounded-[15px] border ${
        errors.newPassword ? "border-red-600" : "border-gray-300"
        } bg-white text-black`}
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => {
        setNewPassword(e.target.value);
        setErrors((prev) => ({ ...prev, newPassword: "" }));
        }}
    />
    <img
        className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer w-5 h-5"
        src={showNewPassword ? eyeOpen : eyeClosed}
        alt={showNewPassword ? "Hide Password" : "Show Password"}
        onClick={() => togglePasswordVisibility("new")}
    />
    {errors.newPassword && (
        <p className="text-red-600 text-sm mt-2">{errors.newPassword}</p>
    )}
    </div>

    {/* Confirm Password */}
    <div className="relative mb-3 w-full">
    <input
        type={showConfirmPassword ? "text" : "password"}
        className={`w-full p-3 text-[14px] rounded-[15px] border ${
        errors.confirmPassword ? "border-red-600" : "border-gray-300"
        } bg-white text-black`}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => {
        setConfirmPassword(e.target.value);
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }}
    />
    <img
        className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer w-5 h-5"
        src={showConfirmPassword ? eyeOpen : eyeClosed}
        alt={showConfirmPassword ? "Hide Password" : "Show Password"}
        onClick={() => togglePasswordVisibility("confirm")}
    />
    {errors.confirmPassword && (
        <p className="text-red-600 text-sm mt-2">{errors.confirmPassword}</p>
        
    )}
    </div>


        {error && <p className="text-red-600 text-sm">{error}</p>}
        {successMessage && (
          <p className="text-green-600 text-sm">{successMessage}</p>
        )}

        {/* Reset Password Button */}
        <button
          type="submit"
          className="p-2.5 bg-[#D6B031] text-black w-full sm:w-[300px] text-sm font-bold rounded-[15px] relative z-10"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner /> : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetForm;
