// BackgroundImage.jsx
import React from "react";
import LoginImage from "../../assets/images/LoginPageImage.jpg"; 

const BgImagecomp = ({ className = "", overlay = true }) => {
  return (
    <div className={`absolute inset-0 z-[-1] ${className}`}>
      <img
        src={LoginImage}
        alt="Background Image"
        className="w-full h-full object-cover blur-sm"
      />
      {overlay && <div className="absolute inset-0 bg-black opacity-80"></div>}
    </div>
  );
};

export default BgImagecomp;
