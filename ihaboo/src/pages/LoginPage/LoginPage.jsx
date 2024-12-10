import React from 'react';
import LoginForm from "../../components/LoginForm/LoginForm";
import LoginImage from "../../assets/images/LoginImage.svg";
import Logo from "../../assets/images/Logo.svg";

function LoginPage() {
  return (
    <div className="flex w-full h-screen bg-gradient-to-r from-[#373B3D] to-[#1A1E21]">
      {/* Image container: visible on screens larger than xs, hidden on xs */}
      <img
        src={LoginImage}
        alt="Login Background"
        className="block xs:hidden absolute top-20 left-0 w-full h-full object-cover object-contain"
      />
      <img
        src={Logo}
        alt="Logo"
        className="block xs:hidden absolute top-5 left-1/2 transform -translate-x-1/2 w-[150px]"
      />
      <div className="hidden xs:block flex-1 w-1/2 h-full relative overflow-hidden">
        <img
          src={LoginImage}
          alt="Login Background Image"
          className="w-full h-full object-contain object-left"
        />
        <img
          src={Logo}
          alt="Logo"
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[300px]"
        />
      </div>
  
      {/* Login form container */}
      <div className="flex-1 w-full xs:w-1/2 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
