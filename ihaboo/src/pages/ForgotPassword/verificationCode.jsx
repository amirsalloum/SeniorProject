import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Spinner from "../../component/Spinner"; // Import the Spinner component
import Logocomp from "../../component/Logocomp/Logocomp.jsx"; // Import LogoComp
import BgImagecomp from "../../component/BgImagecomp/BgImagecomp.jsx"; // Import BgImageComp

const VerificationCode = () => {
  const [otp, setOtp] = useState(new Array(6).fill("")); // OTP state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [canResend, setCanResend] = useState(false); // Disable resend initially
  const [countdown, setCountdown] = useState(120); // Start with 2-minute countdown
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {}; // Retrieve email from the previous page state

  // Handle OTP input changes
  const handleChange = (element, index) => {
    if (!isNaN(element.value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = element.value;
      setOtp(updatedOtp);

      if (element.nextSibling && element.value) {
        element.nextSibling.focus();
      }
    }
  };

  // Handle backspace and move to previous input
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "") {
      if (e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  // Automatically trigger the OTP submission when 6 digits are filled
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      handleSubmit();
    }
  }, [otp]);

  // Countdown effect for the resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true); // Enable button when countdown reaches 0
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Set initial countdown when page loads
  useEffect(() => {
    setCanResend(false); // Disable the button initially
    setCountdown(120); // Set 2-minute timer on page load
  }, []); // Empty dependency array to run only on initial load

  // Function to handle OTP submission and validation
  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const otpCode = otp.join("");

    if (otpCode.length !== 6) return; // Do nothing if OTP is incomplete

    setIsSubmitting(true);
    setShowSpinner(true); // Show spinner immediately

    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/validateOTP",
        { email, otp: otpCode }
      );

      // Show spinner for 2 seconds, even if the API response is fast
      setTimeout(() => {
        if (
          response.data.message ===
          "OTP validated successfully. You can now reset your password."
        ) {
          setSuccessMessage("OTP validated. Redirecting to reset password...");
          setErrorMessage("");
          navigate("/resetPasswordWithOTP", { state: { email, otp: otpCode } });
        } else {
          setErrorMessage("Invalid OTP. Please try again.");
        }
        setShowSpinner(false);
        setIsSubmitting(false);
      }, 2000); // 2-second delay for spinner
    } catch (error) {
      // Handle error and show spinner for at least 2 seconds
      setTimeout(() => {
        setErrorMessage("Error verifying OTP. Please try again.");
        setShowSpinner(false);
        setIsSubmitting(false);
      }, 2000); // 2-second delay for error
    }
  };

  // Function to handle OTP resend
  const handleResend = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!canResend) {
      setErrorMessage("Please wait before requesting another code.");
      return;
    }

    setIsSubmitting(true);
    setShowSpinner(true); // Show spinner immediately when resending

    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/forgotPassword",
        { email }
      );

      // Show spinner for 2 seconds, even if the API response is fast
      setTimeout(() => {
        if (response.data.message === "OTP sent successfully to your email.") {
          setSuccessMessage("Code resent successfully.");
          setCanResend(false); // Disable resend button
          setCountdown(120); // Restart 2-minute countdown
        } else {
          setErrorMessage("Failed to resend OTP. Please try again.");
        }
        setShowSpinner(false);
        setIsSubmitting(false);
      }, 2000); // 2-second delay for spinner
    } catch (error) {
      // Handle error and show spinner for at least 2 seconds
      setTimeout(() => {
        setErrorMessage("Error resending OTP. Please try again.");
        setShowSpinner(false);
        setIsSubmitting(false);
      }, 2000); // 2-second delay for error
    }
  };

  return (
    <div className="relative h-screen flex flex-col justify-start items-center bg-transparent text-white font-bold">
      {/* Background Image */}
      <BgImagecomp />
  
      {/* Form container */}
      <div className="bg-transparent p-5 text-center text-white max-w-md w-full relative flex flex-col items-center">
        {/* Dynamic Logo */}
        <Logocomp />

        <h2 className="text-2xl mb-8 font-bold text-[#D6B031] text-center">
          Enter Verification Code
        </h2>

        {/* Back to Login Link */}
        <Link
          to="/login"
          className="text-sm text-white hover:text-[#D6B031] mb-5 self-start ml-3 xs:ml-2 sm:ml-[13%] "
        >
          &laquo; Back to Login
        </Link>

        {/* Show spinner or OTP input */}
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <div className="flex justify-center gap-3 mb-5 ">
              {otp.map((data, index) => (
                <input
                  type="text"
                  name="otp"
                  maxLength="1"
                  key={index}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  className="w-10 h-12  text-2xl text-center border-2 border-[#D6B031] rounded-lg bg-white text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_5px_rgba(255,153,0,0.5)]"
                />
              ))}
            </div>

            {/* Resend OTP Button */}
            <button
              type="button"
              className="w-full max-w-[300px] p-3 rounded-[15px] bg-[#D6B031] text-black font-semibold text-sm cursor-pointer disabled:bg-gray-500 hover:bg-[#c7a535] transition-colors duration-200"
              onClick={handleResend}
              disabled={!canResend}
            >
              {canResend ? "Resend Code" : `Resend Code (${countdown}s)`}
            </button>
          </div>
        )}

        {/* Error and Success Messages */}
        {errorMessage && (
          <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-500 text-sm mt-3">{successMessage}</p>
        )}
      </div>
    </div>
  );
};

export default VerificationCode;
