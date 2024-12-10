import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader'; // Import the loader

const Spinner = ({ loading ,size = 20}) => {
  return (
    <div className="spinner-container">
      <ClipLoader
        color="#ffffff" // You can change the color
        loading={loading}
        size={size} // Size of the spinner
      />
    </div>
  );
};

export default Spinner;