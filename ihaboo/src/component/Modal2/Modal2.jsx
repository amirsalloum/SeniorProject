import React, { useRef, useEffect } from 'react';

const Modal2 = ({ message, onClose }) => {
  const modalRef = useRef(null); // Reference to the modal container

  // Close the modal if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose(); // Close the modal if the click is outside
      }
    };

    // Attach event listener for clicks outside the modal
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 animate-fadeIn">
      <div
        ref={modalRef} // Attach ref to the modal container
        className="bg-white w-11/12 max-w-lg rounded-lg shadow-lg animate-slideDown"
      >
        {/* Modal Header */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-gray-800 text-xl font-semibold">Session Expired</h2>
          <button 
            className="text-gray-400 text-2xl hover:text-gray-600 transition-colors" 
            onClick={onClose}>
            &times;
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-4 text-gray-600 text-base">
          <p>{message}</p>
        </div>
        {/* Modal Footer */}
        <div className="bg-gray-100 p-4 text-right">
          <button 
            className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors" 
            onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div> 
  );
};

export default Modal2;
