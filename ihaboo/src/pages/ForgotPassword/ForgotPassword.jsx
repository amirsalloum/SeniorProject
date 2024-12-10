import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Spinner from "../../component/Spinner.jsx"; // Import your spinner component
import Logocomp from "../../component/Logocomp/Logocomp.jsx";
import BgImagecomp from "../../component/BgImagecomp/BgImagecomp.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResendOTP, setCanResendOTP] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setIsEmailValid(false);
      setErrorMessage("Please enter a valid email address.");
      return;
    } else {
      setIsEmailValid(true);
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/forgotPassword",
        { email }
      );

      if (response.data.message === "OTP sent successfully to your email.") {
        setSuccessMessage("Reset Code sent to your email.");
        setErrorMessage("");
        setCanResendOTP(false);

        setTimeout(() => {
          setCanResendOTP(true);
        }, 2 * 60 * 1000);

        setTimeout(() => {
          navigate("/VerificationCode", { state: { email } });
        }, 2000);
      } else {
        setErrorMessage(
          "Unexpected response from the server. Please try again."
        );
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        setErrorMessage("Please wait 2 minutes before requesting another OTP.");
      } else if (error.response && error.response.status === 404) {
        setErrorMessage("Email not found. Please enter a valid email address.");
      } else {
        setErrorMessage("Failed to send. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen flex flex-col justify-start items-center bg-transparent text-white font-bold ">
      {/* Background Image */}
      <BgImagecomp />

      {/* Form container */}
      <div className="bg-transparent p-5  text-center text-white max-w-lg w-full relative">
        {/* Dynamic Logo */}
        <Logocomp />

        <h2 className="text-2xl mb-8 text-[#D6B031] text-center font-bold">
          Reset Password
        </h2>

        {/* Back to Login Link */}
        <div className="flex flex-col items-start max-w-[300px] space-y-1 self-start  ml-6 xs:ml-2 sm:ml-[15%] mb-5">
  {/* Back to Login Link */}
  <Link
    to="/login"
    className="text-sm text-white hover:text-[#D6B031] ml-4 xs:ml-2 sm:ml-[5%] mb-2"
  >
    &laquo; Back to Login
  </Link>

  {/* Instruction Text */}
  <p className="text-sm text-white w-full text-left ml-4">
    Kindly enter your email address to receive a code for password reset.
  </p>
</div>


<form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
  <input
    type="email"
    placeholder="Email"
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      setIsEmailValid(true);
    }}
    className={`max-w-[300px] w-full p-3 rounded-[15px] mb-5 bg-white text-gray-800 text-sm font-normal placeholder:font-bold placeholder:text-gray-400 focus:outline-none ${
      !isEmailValid && "ring-2 ring-red-500"
    }`}
    required
  />

  <button
    type="submit"
    disabled={!canResendOTP || isSubmitting}
    className={`max-w-[300px] w-full p-3 rounded-[15px] bg-[#D6B031] text-black font-semibold text-sm ${
      canResendOTP ? "hover:bg-[#d4b13c]" : "bg-gray-500"
    } ${isSubmitting && "cursor-not-allowed"}`}
  >
    {isSubmitting ? "Please Wait..." : "Email password reset code"}
  </button>
</form>



        {/* Error and Success Messages */}
        {errorMessage && (
          <p className="text-red-600 text-sm mt-5 bg-red-100 p-3 rounded-lg w-[97%]">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-500 text-sm mt-5 w-[97%]">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
