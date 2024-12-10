

import React from 'react';
import { useNavigate } from 'react-router-dom';

const LeaveRequestSuccess = ({ onClose }) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose(); // Close the modal first
    navigate('/leaveHistory'); // Redirect to Leave History page
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 rounded-lg w-[400px] max-w-[90%] shadow-lg relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2.5 right-2.5 bg-transparent border-none text-xl cursor-pointer"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl text-[#333]">Successful Leave Request!</h2>
        <p className="my-[15px] text-base">
          Your leave request has been submitted successfully.
        </p>
        <button
          onClick={handleContinue}
          className="bg-gray-800 text-white px-5 py-2.5 rounded-md cursor-pointer text-base hover:bg-[#555]"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LeaveRequestSuccess;
