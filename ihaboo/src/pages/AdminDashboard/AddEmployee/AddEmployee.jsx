import React, { useState } from 'react';
import PersonalInfoCard from '../../../components/PersonalInfoCard/PersonalInfoCard';
import EmploymentDetailsCard from '../../../components/AddEmploymentDetails/AddEmploymentDetails';
import WorkScheduleCard from '../../../components/AddWorkSchedule/AddWorkSchedule';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from "../../../component/Spinner"; // Ensure correct import path


const AddEmployee = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    email: '',
    phoneNumber: '',
    dob: '',
    gender: '',
    username: '',
    positionID: '',
    salaryTypeID: '',
    salary: '',
    departmentID: '',
    brancheID: '',
    statusID: '',
    roleID: '',
    startDate: '',
    contractTypeName: '',
    contractStartDate: '',
    contractEndDate: '',
    requiredWorkingHours: '',
    workSchedule: [
      { day: 'Mo', startTime: '', endTime: '' },
      { day: 'Tu', startTime: '', endTime: '' },
      { day: 'We', startTime: '', endTime: '' },
      { day: 'Th', startTime: '', endTime: '' },
      { day: 'Fr', startTime: '', endTime: '' }
    ],
  });
  
  const [profilePicture, setProfilePicture] = useState(null); // Profile picture state
  const [errorMessage, setErrorMessage] = useState(''); // Error message state for validation
  const [loading, setLoading] = useState(false); // Loading spinner state

  const navigate = useNavigate();


  // Handle input change for both personal info and employment details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle work schedule change
  const handleWorkScheduleChange = (updatedSchedule) => {
    setFormData((prevState) => ({
      ...prevState,
      workSchedule: updatedSchedule,
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (file) => {
    setProfilePicture(file);
  };

  const handleCancel = () => {
    navigate('/employees'); // Handle cancel action
  };

  // Validate required fields and work schedule logic
  const validateForm = () => {
    const {
      firstName, secondName, email, phoneNumber, dob, gender, username, positionID, salaryTypeID,
      salary, departmentID, brancheID, statusID, roleID, startDate, contractTypeName, contractStartDate,
      contractEndDate, requiredWorkingHours, workSchedule,
    } = formData;
  
    const dayNameMapping = {
      Mo: "Monday",
      Tu: "Tuesday",
      We: "Wednesday",
      Th: "Thursday",
      Fr: "Friday",
    };
  
    // Check for missing required fields
    if (
      !firstName || !secondName || !email || !phoneNumber || !dob || !gender || !username ||
      !positionID || !salaryTypeID || !salary || !departmentID || !brancheID || !statusID ||
      !roleID || !startDate || !contractTypeName || !contractStartDate || !contractEndDate ||
      !requiredWorkingHours || !workSchedule
    ) {
      setErrorMessage('Please fill in all required fields.');
      return false;
    }
  
    // Validate requiredWorkingHours is a positive number
    if (isNaN(requiredWorkingHours) || requiredWorkingHours <= 0) {
      setErrorMessage('Required working hours must be a positive number.');
      return false;
    }
  
    // Validate startDate is today or in the future
    const currentDate = new Date();
    const parsedStartDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Reset time component
    if (parsedStartDate < currentDate) {
      setErrorMessage('Start date cannot be in the past.');
      return false;
    }
  
    // Validate workSchedule
    if (!Array.isArray(formData.workSchedule) || formData.workSchedule.length === 0) {
      setErrorMessage('A valid work schedule is required.');
      return false;
    }
  
    const incompleteDays = formData.workSchedule.filter(
      schedule => (!schedule.startTime && schedule.endTime) || (schedule.startTime && !schedule.endTime)
    );
    if (incompleteDays.length > 0) {
      const days = incompleteDays
        .map(schedule => dayNameMapping[schedule.day] || schedule.day)
        .join(', ');
      setErrorMessage(`Each scheduled day must have both startTime and endTime. Incomplete days: ${days}`);
      return false;
    }
  
    // Additional validation for Full-Time contracts
    if (contractTypeName === 'Full-Time') {
      const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
      const daysInSchedule = formData.workSchedule.map(schedule => schedule.day);
      const missingDays = weekdays.filter(day => !daysInSchedule.includes(day));
      if (missingDays.length > 0) {
        const fullMissingDays = missingDays
          .map(day => dayNameMapping[day] || day)
          .join(', ');
        setErrorMessage(`For Full-Time contracts, work schedule must include all five weekdays (Monday to Friday). Missing days: ${fullMissingDays}`);
        return false;
      }
  
      const incompleteWeekdays = formData.workSchedule.filter(
        schedule => weekdays.includes(schedule.day) && (!schedule.startTime || !schedule.endTime)
      );
      if (incompleteWeekdays.length > 0) {
        const days = incompleteWeekdays
          .map(schedule => dayNameMapping[schedule.day] || schedule.day)
          .join(', ');
        setErrorMessage(`For Full-Time contracts, all five weekdays must have both startTime and endTime. Incomplete days: ${days}`);
        return false;
      }
    }
  
    return true;
  };
  

  // Handle Add Employee
  const handleAdd = async () => {
    // Clear any previous error message
    setErrorMessage('');

    // Validate the form before sending
    if (!validateForm()) {
      return;
    }

    setLoading(true); // Show loading spinner when adding employee

    try {
      let profilePicturePath = null;

      // Upload the profile picture first if available
      if (profilePicture) {
        const formDataForPicture = new FormData();
        formDataForPicture.append('profilePicture', profilePicture);

        const uploadResponse = await axios.post('http://localhost:3001/api/dashboard/uploadProfile', formDataForPicture, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        // Store the uploaded picture path
        profilePicturePath = uploadResponse.data.profilePicturePath;
      }

      // Prepare the work schedule to send to the backend
      const workScheduleToSend = formData.workSchedule.filter(
        schedule => schedule.startTime && schedule.endTime
      );

      // Now send the form data including the profile picture path
      const formDataToSend = {
        ...formData,
        profilePicture: profilePicturePath, // Include the uploaded picture path
        workSchedule: workScheduleToSend, // Only send non-empty schedules
      };

      console.log('Form data being sent:', formDataToSend);

      const response = await axios.post('http://localhost:3001/api/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      console.log('Server responded with:', response.data);
      navigate('/employees'); // Redirect after successful add
    } catch (error) {
      console.error('Error adding employee:', error);
      if (error.response) {
        setErrorMessage(error.response.data.error || 'An error occurred during the add operation.');
      } else {
        setErrorMessage('An error occurred during the add operation.');
      }
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <div className="relative p-5 bg-dashboard-gradient shadow-lg h-[305px] opacity-100 w-full rounded-none m-0">
      <div className="w-full max-w-[1030px] bg-white rounded-[20px] flex flex-col gap-4 overflow-y-auto p-6 divide-y divide-[#cdcdcccc]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20 rounded-2xl">
            <Spinner loading={loading} />
          </div>
        )}
        {errorMessage && (
          <div className="text-red-500 text-center mb-4">
            {errorMessage}
          </div>
        )}

        {/* Personal Info Section */}
        <div className="py-4">
          <PersonalInfoCard
            formData={formData}
            handleInputChange={handleInputChange}
            handleProfilePictureChange={handleProfilePictureChange}
            profilePicture={profilePicture}
          />
        </div>

        {/* Employment Details Section */}
        <div className="py-4">
          <EmploymentDetailsCard
            formData={formData}
            handleInputChange={handleInputChange}
            mode="add"
          />
        </div>

        {/* Work Schedule Section */}
        <div className="py-4">
          <WorkScheduleCard
            workSchedule={formData.workSchedule} // Corrected Prop
            handleWorkScheduleChange={handleWorkScheduleChange}
          />
        </div>

        {/* Buttons Section */}
        <div className="flex flex-row justify-end gap-4 mt-6 pt-4">
          <button
            className="py-2 px-4 bg-[#1f4061] text-white rounded-[15px] text-base cursor-pointer transition-colors duration-300 hover:bg-[#132d46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f4061]"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="py-2 px-4 bg-[#1f4061] text-white rounded-[15px] text-base cursor-pointer transition-colors duration-300 hover:bg-[#132d46] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f4061]"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? <Spinner /> : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
