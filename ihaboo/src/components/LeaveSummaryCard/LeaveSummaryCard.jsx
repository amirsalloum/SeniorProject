import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Spinner from "../../component/Spinner";

// Initialize socket once outside the component
const socket = io("http://localhost:3001");

const AttendanceAndLeaveSummary = ({
  employeeId,
  showHeading = true,
  height = "auto",
}) => {
  const [leaveData, setLeaveData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem("authToken");
  const { employeeId: routeEmployeeId } = useParams();

  // Determine the final employee ID to use
  const finalEmployeeId = employeeId || routeEmployeeId || null;

  // Function to fetch leave data
  const fetchLeaveData = async () => {
    try {
      let endpoint = "http://localhost:3001/api/dashboard/leaveBalance";
      if (finalEmployeeId) {
        endpoint = `http://localhost:3001/api/dashboard/leaveBalance/${finalEmployeeId}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveData(data.Data || {});
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData(); // Initial fetch on mount

    socket.on("updateLeaveBalance", fetchLeaveData); // Listen for leave balance updates

    return () => {
      socket.off("updateLeaveBalance"); // Clean up WebSocket event listener
    };
  }, []);

  const getProgress = (usedLeave, accruedLeave) => {
    const usedMinutes = parseMinutes(usedLeave);
    const accruedMinutes = parseMinutes(accruedLeave);
    return accruedMinutes > 0 ? (usedMinutes / accruedMinutes) * 100 : 0;
  };

  const parseMinutes = (leaveString) => {
    if (!leaveString) return 0;
    const parts = leaveString.split(/[\s,]+/);
    let totalMinutes = 0;

    parts.forEach((part, index) => {
      if (part.includes("days")) {
        totalMinutes += parseInt(parts[index - 1], 10) * 24 * 60;
      } else if (part.includes("hr")) {
        totalMinutes += parseInt(parts[index - 1], 10) * 60;
      } else if (part.includes("min")) {
        totalMinutes += parseInt(parts[index - 1], 10);
      }
    });

    return totalMinutes;
  };

  // Extract data for Annual and Personal leaves
  const annualLeave = leaveData?.["Annual Leave"] || {
    accruedLeave: "0 days, 0 hr, 0 min",
    usedLeave: "0 days, 0 hr, 0 min",
    remainingLeave: "0 days, 0 hr, 0 min",
  };
  const personalLeave = leaveData?.["Personal Leave"] || {
    accruedLeave: "0 days, 0 hr, 0 min",
    usedLeave: "0 days, 0 hr, 0 min",
    remainingLeave: "0 days, 0 hr, 0 min",
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div
      className="bg-white rounded-[15px] pb-6 lg:p-4 mb-4 shadow-md"
      style={{ height }}
    >
      {showHeading && (
        <h2 className="mt-2 text-xl font-semibold ml-4 mb-8">Leave Summary</h2>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-4">
        {/* Annual Leave */}
        <div className="flex-1 text-left mx-4 max-w-sm relative">
          <span className="text-sm text-gray-700 block mb-2">Annual Leave</span>
          <div className="w-full rounded-lg overflow-hidden h-2 mt-2 bg-[#a1d8a3]">
            <div
              className="h-full rounded-lg"
              style={{
                width: `${getProgress(
                  annualLeave.usedLeave,
                  annualLeave.accruedLeave
                )}%`,
                backgroundColor: "#1faf24",
              }}
            ></div>
          </div>
          <span className="text-xs text-gray-700 block mt-2 text-right">
          {`${annualLeave.usedLeave}  Used / ${annualLeave.accruedLeave}  Accrued`} 
          </span>
        </div>

        {/* Personal Leave */}
        <div className="flex-1 text-left mx-4 max-w-sm relative">
          <span className="text-sm text-gray-700 block mb-2">Personal Leave</span>
          <div className="w-full rounded-lg overflow-hidden h-2 mt-2 bg-[#e099c2]">
            <div
              className="h-full rounded-lg"
              style={{
                width: `${getProgress(
                  personalLeave.usedLeave,
                  personalLeave.accruedLeave
                )}%`,
                backgroundColor: "#e2158d",
              }}
            ></div>
          </div>
          <span className="text-xs text-gray-700 block mt-2 text-right">
          {`${personalLeave.usedLeave} Used / ${personalLeave.accruedLeave} Accrued`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAndLeaveSummary;
