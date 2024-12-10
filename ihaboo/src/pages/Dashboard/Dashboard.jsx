
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileCard from "../../components/ProfileCard/ProfileCard";
import EmploymentDetails from '../../components/EmploymentDetailsCard/EmploymentDetailsCard';
import AttendanceAndLeaveSummary from '../../components/LeaveSummaryCard/LeaveSummaryCard';
import ScheduleCard from '../../components/ScheduleCard/ScheduleCard';
import previousIcon from "../../assets/images/previousIcon.svg";
function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Access the current location and state

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  // Check if the user came from the employees page
  const showBackButton = location.state?.fromEmployeesPage;

  return (
    <div className="relative p-5 bg-dashboard-gradient shadow-lg h-[305px] opacity-100 w-full rounded-none m-0">
      {/* Back Button (conditionally rendered) */}
      {showBackButton && (
        <div className="mb-3">
        <button
          onClick={handleBack}
          className="flex items-center p-2 bg-[#1f4061] text-white rounded-lg shadow-md hover:bg-[#123450] transition duration-300"
        >
          <img src={previousIcon} alt="Back" className="w-5 h-5 " />
        </button>

        </div>
      )}

      {/* Dashboard Content */}
      <div className="flex flex-col gap-2.5">
        <ProfileCard />
        <EmploymentDetails />
        <AttendanceAndLeaveSummary showHeading={true} height="auto" />
        <ScheduleCard />
      </div>
    </div>
  );
}

export default Dashboard;
