// LogoComponent.jsx
import React from "react";
import Logo from "../../assets/images/Logo.svg";

const LogoComp = ({ className = "", altText = "Logo" }) => {
  return (
    <img
      src={Logo}
      alt={altText}
      className={`w-54  transform scale-50 mx-auto  ${className}`}
    />
  );
};

export default LogoComp;
