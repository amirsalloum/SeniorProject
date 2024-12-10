import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PersonalInfoCard from '../../../components/PersonalInfoCard/PersonalInfoCard';
import EmploymentDetailsCard from '../../../components/AddEmploymentDetails/AddEmploymentDetails';
import WorkScheduleCard from '../../../components/AddWorkSchedule/AddWorkSchedule';
import axios from 'axios';
import Spinner from "../../../component/Spinner"; // Ensure correct import path


const daysOfWeek = [
  { full: "Monday", short: "Mo" },
  { full: "Tuesday", short: "Tu" },
  { full: "Wednesday", short: "We" },
  { full: "Thursday", short: "Th" },
  { full: "Friday", short: "Fr" },
];

const EditEmployee = () => {
  const { id } = useParams(); // Get employee ID from URL
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
    workSchedule: [],
    profilePicture: null,
  });
  const [profilePicture, setProfilePicture] = useState(null); // Profile picture management
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Loading spinner state
  const [errorMessage, setErrorMessage] = useState(''); // Error message state for validation

  // Helper function to format dates to YYYY-MM-DD in local time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-CA'); // 'en-CA' locale ensures 'YYYY-MM-DD' format
  };


// Helper function to format time to 'HH:MM' in 24-hour format
const formatTime = (timeString) => {
  if (!timeString) return '';
  const date = new Date(`1970-01-01T${timeString}`);
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC', // Use UTC to prevent time zone offsets
  });
};


  // Fetch employee data on page load
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/employee/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        console.log('Employee Data:', response.data);
        const employeeData = response.data.Data;

        // Ensure the data is properly formatted for the form
        setFormData({
          firstName: employeeData.firstName || '',
          secondName: employeeData.secondName || '',
          email: employeeData.email || '',
          phoneNumber: employeeData.phoneNumber || '',
          dob: formatDate(employeeData.DOB), // Format the DOB
          gender: employeeData.gender || '',
          username: employeeData.username || '',
          positionID: employeeData.positionID || '',
          salaryTypeID: employeeData.salaryTypeID || '',
          salary: employeeData.salary || '',
          departmentID: employeeData.departmentID || '',
          brancheID: employeeData.brancheID || '',
          reportToID: employeeData.reportToID || '',
          statusID: employeeData.statusID || '',
          roleID: employeeData.roleID || '',
          startDate: formatDate(employeeData.StartDate), // Format the start date
          contractTypeName: employeeData.contractTypeName || '',
          contractStartDate: formatDate(employeeData.contractStartDate), // Format contract start date
          contractEndDate: formatDate(employeeData.contractEndDate), // Format contract end date
          requiredWorkingHours: employeeData.requiredWorkingHours || '', // Set requiredWorkingHours
          workSchedule: daysOfWeek.map((dayObj) => {
            const schedule = (employeeData.workSchedule || []).find(s => s.day === dayObj.short) || {};
            return {
              day: dayObj.short,
              startTime: formatTime(schedule.startTime),
              endTime: formatTime(schedule.endTime),
            };
          }),
          profilePicture: employeeData.profilePicture || null, // Set profile picture from the backend
        });

        // Set the profile picture if it exists in the fetched data
        if (employeeData.profilePicture) {
          setProfilePicture(employeeData.profilePicture);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setErrorMessage('Failed to fetch employee data.');
      }
    };

    fetchEmployeeData();
  }, [id]);

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

  // Handle file selection for profile picture
  const handleProfilePictureChange = (file) => {
    setProfilePicture(file);
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
  

  // Handle Update Employee
  const handleUpdate = async () => {
    // Clear any previous error message
    setErrorMessage('');

    // Validate the form before sending
    if (!validateForm()) return;

    setLoading(true); // Show loading spinner when updating employee

    try {
      let profilePicturePath = formData.profilePicture;

      // Upload the profile picture if it's updated
      if (profilePicture && typeof profilePicture !== 'string') { // Check if it's a file, not a URL
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

      // Send the updated form data including the profile picture path
      const formDataToSend = {
        ...formData,
        profilePicture: profilePicturePath, // Include the uploaded picture path
        employeeID: id, // Include employee ID for the update
        workSchedule: workScheduleToSend, // Only send non-empty schedules
      };

      console.log('Form data being sent:', formDataToSend);

      const response = await axios.put('http://localhost:3001/api/auth/updateregister', formDataToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      console.log('Server responded with:', response.data);
      navigate('/employees'); // Redirect after successful update
    } catch (error) {
      console.error('Error updating employee:', error);
      if (error.response) {
        setErrorMessage(error.response.data.error || 'An error occurred during the update.');
      } else {
        setErrorMessage('An error occurred during the update.');
      }
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  const handleCancel = () => {
    navigate('/employees'); // Handle cancel action
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
            mode="edit"
          />
        </div>

        {/* Work Schedule Section */}
        <div className="py-4">
          <WorkScheduleCard
            workSchedule={formData.workSchedule}
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
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? <Spinner /> : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;
