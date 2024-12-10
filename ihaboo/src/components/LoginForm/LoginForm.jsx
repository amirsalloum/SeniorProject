import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
// import ReCAPTCHA from 'react-google-recaptcha';  // Commented out reCAPTCHA import for now
import eyeOpen from "../../assets/images/eyeOpen.svg";
import eyeClosed from "../../assets/images/eyeClosed.svg";
import Spinner from "../../component/Spinner"; // Import the Spinner component

function LoginForm() {
  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null); // Keeping this state but you won't use it for now
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    let formErrors = {};

    // Form validation
    if (!values.username) {
      formErrors.username = "Please enter your username.";
    }

    if (!values.password) {
      formErrors.password = "Please enter your password.";
    }

    /*
    // ReCAPTCHA validation
    // If you are going to add ReCAPTCHA validation, uncomment the following lines:
    if (!recaptchaToken) {
      formErrors.recaptcha = 'Please complete the reCAPTCHA.';
    }
    */

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      try {
        // Make the login API request
        const response = await axios.post(
          "http://localhost:3001/api/auth/login",
          {
            username: values.username,
            password: values.password,
            // recaptchaToken, // You can uncomment this later when reCAPTCHA is active
          }
        );

        if (response.data.Status === "Success") {
          localStorage.setItem("authToken", response.data.token);
          const isFirstLogin = response.data.isFirstLogin;
          if (isFirstLogin) {
            navigate("/resetPassword");
          } else {
            navigate("/");
          }
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            form: "Invalid credentials. Please try again.",
          }));
        }
      } catch (error) {
        // Handle errors more specifically based on the response code
        if (error.response) {
          if (error.response.status === 403) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              form: "Account is inactive. Please contact support.",
            }));
          } else if (error.response.status === 404) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              form: "Username does not exist.",
            }));
          } else if (error.response.status === 401) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              form: "Invalid password. Please try again.",
            }));
          } else {
            setErrors((prevErrors) => ({
              ...prevErrors,
              form: "An error occurred. Please try again later.",
            }));
          }
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            form: "A network error occurred. Please check your connection.",
          }));
        }
      } finally {
        // Stop the spinner regardless of success or error
        setIsSubmitting(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white font-bold">
      <div className="flex flex-col items-center justify-center w-full max-w-sm p-5">
        <h2 className="mb-7 text-left w-full text-white font-bold text-2xl leading-[48.41px]">
          <span className="text-[#D6B031]">Login to your Account</span>
        </h2>

        <form className="flex flex-col w-full" onSubmit={handleSubmit}>
          {/* Username */}
          <label htmlFor="username" className="mb-2 text-left text-xs">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            placeholder="Enter Your Username"
            value={values.username}
            onChange={(e) => {
              setValues({ ...values, username: e.target.value });
              setErrors((prevErrors) => ({ ...prevErrors, username: "" }));
            }}
            className="w-full sm:w-[300px] pr-10 p-2.5 mb-4 border border-gray-300 rounded-[15px] text-[14px] text-black font-normal focus:outline-none focus:border-gray-400 relative z-10"
          />
          {errors.username && (
            <p className="text-red-600 text-sm mb-2 p-2">{errors.username}</p>
          )}

          {/* Password */}
        <label htmlFor="password" className="mb-2 text-left text-xs">
          Password
        </label>
        <div className="relative w-full sm:w-[300px]">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            placeholder="Enter your Password"
            value={values.password}
            onChange={(e) => {
              setValues({ ...values, password: e.target.value });
              setErrors((prevErrors) => ({ ...prevErrors, password: "" }));
            }}
            className="w-full p-3 pr-10  border border-gray-300 rounded-[15px] text-[14px] text-black font-normal focus:outline-none focus:border-gray-400"
          />
          <img
            className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer w-5 h-5 right-3"
            src={showPassword ? eyeOpen : eyeClosed}
            alt={showPassword ? "Hide Password" : "Show Password"}
            onClick={togglePasswordVisibility}
          />
        </div>


          {/* Forgot password link */}
          <div className="relative  w-full sm:w-[300px] mt-2 mb-3">
            <Link
              to="/forgotPassword"
              className="absolute  top-1 right-0 text-gray-500 text-sm cursor-pointer z-10"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="p-2.5 bg-[#D6B031] text-black w-full sm:w-[300px] text-sm font-bold rounded-[15px] mt-8 mb-6 relative z-10"
          >
            {isSubmitting ? <Spinner /> : "Sign In"}
          </button>

          {/* Error Messages */}
          {errors.form && (
            <p className="text-red-600 text-sm mb-2 p-2 relative z-10">
              {errors.form}
            </p>
          )}

          {errors.recaptcha && (
            <p className="text-red-600 text-sm mb-2 p-2 relative z-10">
              {errors.recaptcha}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
