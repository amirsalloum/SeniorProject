import React, { useRef, useEffect } from 'react';

const Modal = ({ actions, employeeName, date, onClose }) => {
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
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div
        ref={modalRef} // Attach ref to the modal container
        className="bg-white p-6 rounded-lg w-10/12 max-w-sm sm:max-w-md relative shadow-lg border border-gray-300"
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-4 mt-4">
          Actions for {employeeName} on {date}
        </h3>

        {/* Divider */}
        <hr className="my-3 border-gray-300" />

        {/* Actions List */}
        <ul className="list-none p-0">
          {actions && actions.length > 0 ? (
            actions.map((action, index) => (
              <li key={index} className="flex items-center space-x-2 my-1">
                <span
                  className={`font-bold ${
                    {
                      'check-in': 'text-green-600',
                      'check-out': 'text-red-600',
                      'break-in': 'text-yellow-500',
                      'break-out': 'text-blue-600',
                    }[action.actionName.replace(/\s+/g, '-').toLowerCase()] || ''
                  }`}
                >
                  {action.actionName}
                </span>
                <span className="font-semibold text-black">
                  : {new Date(action.actionDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </li>
            ))
          ) : (
            <li className="text-gray-600 text-center">No actions available for this date.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
