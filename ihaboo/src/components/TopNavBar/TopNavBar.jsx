import React from 'react';
import { FaBars } from 'react-icons/fa';
import NotificationBell from '../../component/NotificationBell/NotificationBell';

const TopNavbar = ({ toggleMenu }) => {
  return (
    <nav className="h-15.5 bg-white flex items-center justify-between px-5 shadow-md border-b-1 border-gray-200">
      {/* Hamburger Icon - Only affects xs screens */}
      <button onClick={toggleMenu} className="lg:hidden text-gray-800">
        <FaBars className="text-2xl" />
      </button>

      {/* Logo */}
      <h2 className="text-xl font-bold font-sans">
        <span className="text-yellow-500">GOLD</span>
        <span className="text-gray-600">TIGER</span>
      </h2>

      {/* Notification Bell */}
      <NotificationBell />
    </nav>
  );
};

export default TopNavbar;

