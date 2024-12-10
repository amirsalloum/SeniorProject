import React from 'react';
import LogoImage from "../../assets/images/Logo.png";
import { FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GTIR from "../../assets/images/GTIR.svg";
import GTAM from "../../assets/images/GTAM.svg";
import GTRS from "../../assets/images/GTRS.svg";
import GTIS from "../../assets/images/GTIS.svg";
import GTFM from "../../assets/images/GTFM.svg";
import GTLM from "../../assets/images/GTLM.svg";


const FirstMenu = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/api/auth/logout'); // Update this URL with your actual logout endpoint
      localStorage.removeItem('authToken'); // Clear any authentication tokens
      navigate("/login"); // Navigate back to the login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col justify-between bg-gray-800 w-16 h-screen p-2 text-white">
      {/* Logo Section */}
      <div className="flex flex-col items-center">
        <img src={LogoImage} alt="Gold Tiger Logo" className="w-16 h-8 opacity-1 mt-1 transform rotate-4" />
        <h2 className="text-[10px] font-bold leading-tight mt-1 text-center">
          <span className="text-yellow-500">Gold</span>
          <span className="text-white">Tiger</span>
        </h2>
      </div>

      {/* Menu Items Section */}
      <div className="flex flex-col items-center gap-5 mt-4 flex-grow">
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTIR} alt="GTIR" className="w-7 h-8 opacity-1" />
          <span>GTIR</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTAM} alt="GTAM" className="w-7 h-8 opacity-1" />
          <span>GTAM</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTRS} alt="GTRS" className="w-7 h-8 opacity-1" />
          <span>GTRS</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTLM} alt="GTLM" className="w-7 h-8 opacity-1" />
          <span >GTLM</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTIS} alt="GTIS" className="w-7 h-8 opacity-1" />
          <span>GTIS</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <img src={GTFM} alt="GTFM" className="w-7 h-8 opacity-1" />
          <span >GTFM</span>
        </div>
      </div>

      {/* Bottom Section for Support and Logout */}
      <div className="flex flex-col items-center gap-4 pb-2">
        <div className="flex flex-col items-center text-gray-400">
          <FaQuestionCircle className="text-2xl" />
          <span className="text-xs">Support</span>
        </div>
        <div 
          className="flex flex-col items-center text-gray-400 cursor-pointer hover:text-yellow-500"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="text-lg mb-1 transition-colors duration-300" />
          <span className="text-xs mt-1 transition-colors duration-300">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default FirstMenu;