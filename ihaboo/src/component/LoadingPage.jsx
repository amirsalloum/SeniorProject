// src/LoadingPage.jsx
import React from 'react';
import Logo from "../assets/images/Logo.svg"; // Path to your logo image

const LoadingPage = () => {
  return (
    <div className="relative p-5 bg-dashboard-gradient shadow-lg h-[305px] opacity-100 w-full rounded-none m-0">
      <div className="flex flex-col justify-center items-center space-y-4 h-full">
        {/* Logo Image */}
        <img
          src={Logo} // Ensure the path is correct
          alt="Loading..."
          className="w-32 h-32 object-contain"
          style={{
            animation: 'fadeInOut 2s ease-in-out infinite', // Animation applied here
          }}
        />
        <style>
          {`
            @keyframes fadeInOut {
              0% {
                opacity: 0;
              }
              50% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default LoadingPage;
