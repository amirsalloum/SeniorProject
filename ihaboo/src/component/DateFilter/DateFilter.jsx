import React, { useRef } from 'react';
import './DateFilter.scss';

const DateFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const startDateRef = useRef(null); // Reference for start date input
  const endDateRef = useRef(null);   // Reference for end date input

  // Function to handle clicking on the container to trigger the date picker
  const handleStartDateClick = () => {
    startDateRef.current.focus();
  };

  const handleEndDateClick = () => {
    endDateRef.current.focus();
  };

  return (
    <div className="date-filter">
      {/* Container to trigger the date picker when clicked */}
      <div className="date-input-container" onClick={handleStartDateClick}>
        <label htmlFor="startDate">From Date</label>
        <input 
          id="startDate" 
          type="date" 
          className="custom-date-input"
          value={startDate} 
          onChange={(e) => onStartDateChange(e.target.value)} 
          ref={startDateRef} // Attach the reference to the input
        />
      </div>

      {/* Container to trigger the date picker when clicked */}
      <div className="date-input-container" onClick={handleEndDateClick}>
        <label htmlFor="endDate">To Date</label>
        <input 
          id="endDate" 
          type="date" 
          className="custom-date-input"
          value={endDate} 
          onChange={(e) => onEndDateChange(e.target.value)} 
          ref={endDateRef} // Attach the reference to the input
        />
      </div>
    </div>
  );
};

export default DateFilter;
