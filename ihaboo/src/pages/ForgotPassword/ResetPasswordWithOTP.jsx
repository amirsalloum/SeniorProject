import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import eyeOpen from '../../assets/images/eyeOpen.svg';  // Import the eyeOpen icon
import eyeClosed from '../../assets/images/eyeClosed.svg';  // Import the eyeClosed icon
import Spinner from '../../component/Spinner'; // Import the Spinner component
import Logocomp from "../../component/Logocomp/Logocomp.jsx";
import BgImagecomp from "../../component/BgImagecomp/BgImagecomp.jsx";

const ResetPasswordWithOTP = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false); // To toggle new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // To toggle confirm password visibility
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve email and otp from previous page's state
  const email = location.state?.email || ''; 
  const otp = location.state?.otp || ''; // Ensure OTP is retrieved from state

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/resetPasswordWithOTP', {
        email,
        otp,
        newPassword,
      });

      if (response.data.message === 'Password reset successfully.') {
        setSuccessMessage('Password reset successfully. Redirecting to login...');
        setErrorMessage('');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage('Failed to reset password. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'new') setShowNewPassword(!showNewPassword);
    if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="relative h-screen flex flex-col justify-start items-center bg-transparent text-white font-bold">
      {/* Background Image */}
      <BgImagecomp />
  
      {/* Form container */}
      <div className="bg-transparent p-5 text-center text-white max-w-md w-full relative flex flex-col items-center">
        {/* Dynamic Logo */}
        <Logocomp />
  
        {/* Heading */}
        <h2 className="text-2xl mb-8 text-[#D6B031] text-center font-bold">
          Reset Your Password
        </h2>
  
        {/* Centered Form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
          {/* Return to Login Link at Top-Left */}
          <Link
            to="/login"
            className="text-sm text-white hover:text-[#D6B031] mb-5 self-start ml-5 xs:ml-2 sm:ml-[13%] "
          >
            &laquo; Back to Login
          </Link>
  
          {/* New Password Input */}
          <div className="relative mb-5 w-full max-w-[300px]">
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-3 pr-10 rounded-[15px] bg-white text-gray-800 text-sm font-normal placeholder:font-bold  placeholder:text-gray-400 focus:outline-none "
            />
            <img
              className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer select-none w-5"
              src={showNewPassword ? eyeOpen : eyeClosed}
              alt={showNewPassword ? 'Hide Password' : 'Show Password'}
              onClick={() => togglePasswordVisibility('new')}
            />
          </div>
  
          {/* Confirm Password Input */}
          <div className="relative mb-5 w-full max-w-[300px]">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full  p-3 pr-10 rounded-[15px] bg-white text-gray-800 text-sm font-normal placeholder:font-bold  placeholder:text-gray-400 focus:outline-none "
            />
            <img
              className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer select-none w-5"
              src={showConfirmPassword ? eyeOpen : eyeClosed}
              alt={showConfirmPassword ? 'Hide Password' : 'Show Password'}
              onClick={() => togglePasswordVisibility('confirm')}
            />
          </div>
  
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full max-w-[300px] p-3 rounded-[15px] bg-[#D6B031] text-black font-semibold text-sm cursor-pointer  "
          >
            {isSubmitting ? <Spinner /> : 'Reset Password'}
          </button>
        </form>
  
        {/* Error and Success Messages */}
        {errorMessage && (
          <p className="text-red-600 text-sm mt-5 bg-red-100 p-3 rounded-lg w-full max-w-sm text-center">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-500 text-sm mt-5 w-full max-w-sm text-center">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
  
  
  
};

export default ResetPasswordWithOTP;
