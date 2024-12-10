import React, { useState, useEffect,useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveRequestSuccess from "../../components/LeaveRequestSuccess/LeaveRequestSuccess";
import Spinner from '../../component/Spinner'; // Import Spinner
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons'; // Import upload icon
import { FaTimes } from 'react-icons/fa'; // Import 'X' icon

const PERSONAL_LEAVE_TYPE_NAME = 'Personal Leave'; // Define constant to match your data

const LeaveModal = ({ onClose }) => {
  const modalRef = useRef(null); // Create a ref for the modal content
  const [formData, setFormData] = useState({
    startDateTime: '',
    endDateTime: '',
    notes: '',
    documentAttach: null,
    leaveTypeID: '',
    personalLeaveSubtype: '',
  });
  console.log('Form Data:', formData);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [isPersonalLeave, setIsPersonalLeave] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Success modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Confirmation modal state
  const [leaveExceedsBalance, setLeaveExceedsBalance] = useState(false); // State to track if leave exceeds balance
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [remainingLeave, setRemainingLeave] = useState(''); // New state for remaining leave

  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

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


  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/leave/types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, 
          },
        });

        const data = await response.json();
        if (response.ok) {
          setLeaveTypes(data.Data);
        } else {
          setError(data.error || 'Failed to load leave types');
        }
      } catch (error) {
        setError('Error fetching leave types');
      }
    };

    if (token) {
      fetchLeaveTypes();
    } else {
      setError('No token provided');
    }
  }, [token]);

  // Update selectedLeaveType and isPersonalLeave whenever leaveTypeID changes
  useEffect(() => {
    const selectedType = leaveTypes.find(
      (type) => type.leaveTypeID === parseInt(formData.leaveTypeID)
    );
    setSelectedLeaveType(selectedType);
    const isPersonal =
      selectedType &&
      selectedType.leaveTypeName.trim().toLowerCase() === PERSONAL_LEAVE_TYPE_NAME.toLowerCase();
    setIsPersonalLeave(isPersonal);

    // Reset personalLeaveSubtype if not Personal leave
    if (!isPersonal) {
      setFormData((prevData) => ({
        ...prevData,
        personalLeaveSubtype: '',
      }));
    }

  }, [formData.leaveTypeID, leaveTypes]);

  // Function to parse JWT token and extract userID
  const parseJwt = (token) => {
    if (!token) { return null; }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  // Function to get userID from token
  const getUserID = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const decodedToken = parseJwt(token);
    console.log('Decoded Token:', decodedToken);
    return decodedToken ? decodedToken.userID || decodedToken.id : null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Check if the selected file is a PDF
    if (file && file.type !== "application/pdf") {
      setFileError("Please upload a PDF file");
      setUploadSuccess(false); // Hide success message
      e.target.value = ''; // Clear the file input
      return;
    }

    // Reset any error and initiate the upload process
    setFileError('');
    setIsUploading(true); // Show spinner

    // Simulate file upload
    setTimeout(() => {
      setFormData((prevData) => ({ ...prevData, documentAttach: file }));
      setIsUploading(false); // Hide spinner
      setUploadSuccess(true); // Show success message
    }, 2000); // Simulated upload delay (2 seconds)
  };

  // Handler to remove the selected file
  const handleRemoveFile = () => {
    setFormData((prevData) => ({ ...prevData, documentAttach: null }));
    setUploadSuccess(false);
    setFileError('');
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const validateForm = () => {
    let errors = {};
    const { startDateTime, endDateTime } = formData;

    // Validate start and end date
    if (!startDateTime) errors.startDateTime = 'Start date and time are required';
    if (!endDateTime) errors.endDateTime = 'End date and time are required';

    if (new Date(endDateTime) < new Date(startDateTime)) {
      errors.dateRange = 'End date cannot be earlier than start date'; // Add date range validation message
    }

    if (!formData.leaveTypeID) errors.leaveTypeID = 'Leave type is required';

    if (isPersonalLeave) {
      if (!formData.documentAttach && !formData.notes) {
        errors.personalLeave = 'For Personal Leave, please provide either a document or notes.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    if (!selectedLeaveType) {
      setError('Invalid Leave Type selected');
      return;
    }

    const leaveFormData = new FormData();
    leaveFormData.append('startDateTime', formData.startDateTime);
    leaveFormData.append('endDateTime', formData.endDateTime);
    leaveFormData.append('notes', formData.notes);
    leaveFormData.append('leaveTypeName', selectedLeaveType.leaveTypeName);

    if (formData.documentAttach) {
      leaveFormData.append('documentAttach', formData.documentAttach);
    }

    // Get userID and include in the request
    const userID = getUserID();
    if (!userID) {
      setError('User ID not found');
      return;
    }
    console.log('Frontend - userID:', userID);
    leaveFormData.append('userID', userID);

    setIsSubmitting(true);
    setError(null);

    try {
      const leaveResponse = await fetch('http://localhost:3001/api/leave/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: leaveFormData,
      });

      const leaveResult = await leaveResponse.json();
      console.log('Leave Response:', leaveResult);
      if (!leaveResponse.ok) {
        setError(leaveResult.error || 'Failed to submit leave request');
        setIsSubmitting(false);
        return;
      }

      if (leaveResult.exceedsBalance) {
        // If the leave exceeds balance, capture remainingLeave and show confirmation modal
        setLeaveExceedsBalance(true);
        setRemainingLeave(leaveResult.remainingLeave || '');
        setShowConfirmationModal(true);
        setIsSubmitting(false); // Stop submitting state
        return;
      }

      if (leaveResult.filePath) {
        setFormData((prevData) => ({ ...prevData, documentAttach: null })); // Clear file after submission
      }

      await delay(1000); // Ensure the loading phase shows briefly
      
      setIsSuccessModalOpen(true); // If successful, hide LeaveModal and open the success modal

    } catch (error) {
      setError('Error submitting leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    // Resubmit the leave request with `allowOverBalance` flag
    if (!selectedLeaveType) {
      setError('Invalid Leave Type selected');
      return;
    }

    const leaveFormData = new FormData();
    leaveFormData.append('startDateTime', formData.startDateTime);
    leaveFormData.append('endDateTime', formData.endDateTime);
    leaveFormData.append('notes', formData.notes);
    leaveFormData.append('leaveTypeName', selectedLeaveType.leaveTypeName);
    leaveFormData.append('allowOverBalance', true); // Add this flag

    if (formData.documentAttach) {
      leaveFormData.append('documentAttach', formData.documentAttach);
    }

    // Get userID and include in the request
    const userID = getUserID();
    if (!userID) {
      setError('User ID not found');
      return;
    }
    console.log('Frontend - userID (confirm submit):', userID);
    leaveFormData.append('userID', userID);

    setIsSubmitting(true);

    try {
      const leaveResponse = await fetch('http://localhost:3001/api/leave/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: leaveFormData,
      });

      const leaveResult = await leaveResponse.json();
      if (!leaveResponse.ok) {
        setError(leaveResult.error || 'Failed to submit leave request');
        setIsSubmitting(false);
        return;
      }

      setShowConfirmationModal(false); // Close the confirmation modal
      setIsSuccessModalOpen(true); // Show success modal after submission

    } catch (error) {
      setError('Error submitting leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('Leave Type ID:', formData.leaveTypeID);
  console.log('Selected Leave Type:', selectedLeaveType);
  console.log('Is Personal Leave:', isPersonalLeave);

  return (
    <>
      {!isSuccessModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <div ref={modalRef} className="bg-white p-6 rounded-[15px] w-full max-w-lg md:max-w-2xl border-2 border-gray-400 relative">
            <button
              className="absolute top-4 right-4 text-2xl focus:outline-none"
              onClick={onClose}
            >
              ×
            </button>
            <h2 className="text-lg md:text-xl font-bold mb-4 border-b border-gray-300 pb-2 text-left">Leave Request</h2>

            {error && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{error}</p>}
            {validationErrors.startDateTime && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{validationErrors.startDateTime}</p>}
            {validationErrors.endDateTime && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{validationErrors.endDateTime}</p>}
            {validationErrors.dateRange && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{validationErrors.dateRange}</p>}
            {validationErrors.leaveTypeID && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{validationErrors.leaveTypeID}</p>}
            {validationErrors.personalLeave && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{validationErrors.personalLeave}</p>}
            {fileError && <p className="text-red-600 bg-red-100 border border-red-600 p-2 rounded my-2 text-sm">{fileError}</p>}

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="w-full md:w-1/2 md:pr-2">
                  <label className="block mb-2 text-sm font-medium ">Leave Type</label>
                  <select
                    name="leaveTypeID"
                    value={formData.leaveTypeID}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-[15px] bg-white pr-8 ${validationErrors.leaveTypeID ? 'border-red-500' : 'border-gray-400'} custom-select-arrow cursor-pointer`}
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((leaveType) => (
                      <option key={leaveType.leaveTypeID} value={leaveType.leaveTypeID}>
                        {leaveType.leaveTypeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-1/2 md:pl-2 mt-4 md:mt-0">
                  <label className="block mb-2 text-sm font-medium">Upload relevant documents here</label>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      className="flex items-center justify-center bg-gray-800 text-white py-2 px-4 rounded-[15px] hover:bg-gray-600 focus:outline-none w-full"
                      onClick={() => document.getElementById('fileInput').click()}
                    >
                      {!isUploading && (
                        <>
                          <FontAwesomeIcon icon={faUpload} className="mr-2" /> 
                          <span>Upload Document</span>
                        </>
                      )}
                      {isUploading && <Spinner />}
                    </button>
                    <input
                      type="file"
                      id="fileInput"
                      name="documentAttach"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Display Selected File with 'X' Button */}
                  {formData.documentAttach && (
                    <div className="flex items-center mt-2">
                      <span className="text-sm mr-2">{formData.documentAttach.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                        aria-label="Remove file"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  {/* Optional: Remove the upload success message if you prefer only showing the file name */}
                  {uploadSuccess && !formData.documentAttach && (
                    <p className="text-green-600 text-sm mt-2">File uploaded successfully!</p>
                  )}
                </div>
              </div>

              {/* Conditionally render sub-options and helper text when 'Personal Leave' is selected */}
              {isPersonalLeave && (
                <>
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">Personal Leave Subtype</label>
                    <select
                      name="personalLeaveSubtype"
                      value={formData.personalLeaveSubtype}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-[15px] bg-white pr-8 ${validationErrors.personalLeaveSubtype ? 'border-red-500' : 'border-gray-400'} custom-select-arrow cursor-pointer`}
                    >
                      <option value="">Select Subtype</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Parental Leave">Parental Leave</option>
                      <option value="Bereavement Leave">Bereavement Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    For Personal Leave, please provide either a document or notes.
                  </p>
                </>
              )}

              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="w-full md:w-1/2 md:pr-2">
                  <label className="block mb-2 text-sm font-medium">From Date</label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    value={formData.startDateTime}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-[15px] ${validationErrors.startDateTime ? 'border-red-500' : 'border-gray-400'}`}
                  />
                </div>

                <div className="w-full md:w-1/2 md:pl-2 mt-4 md:mt-0">
                  <label className="block mb-2 text-sm font-medium">To Date</label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    value={formData.endDateTime}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-[15px] ${validationErrors.endDateTime ? 'border-red-500' : 'border-gray-400'}`}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-400 rounded-[15px] resize-none overflow-hidden h-10"
                  style={{ height: '40px' }} // Adjust height to keep it small
                />
              </div>

              <div className="flex justify-end mt-4">
                <button type="submit" className="bg-gray-800 text-white py-2 px-6 rounded-[15px] hover:bg-gray-600" disabled={isSubmitting || fileError}>
                  {isSubmitting ? <Spinner /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <LeaveRequestSuccess 
          onClose={() => {
            setIsSuccessModalOpen(false);
            onClose();
            navigate('/leaveHistory');
          }} 
        />
      )}

      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center border-2 border-gray-400 relative">
            <h2 className="text-lg md:text-xl font-bold mb-4">Confirm Submission</h2>
            <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-4 font-semibold text-sm">
              Warning: Your leave request exceeds your balance. You have {remainingLeave}. Would you like to proceed?
            </div>
            <div className="flex justify-center space-x-4">
              <button className="bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-600" onClick={() => setShowConfirmationModal(false)}>
                Cancel
              </button>
              <button className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-400" onClick={handleConfirmSubmit}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveModal;
