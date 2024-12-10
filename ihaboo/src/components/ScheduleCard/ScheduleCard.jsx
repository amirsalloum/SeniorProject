import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Spinner from "../../component/Spinner";

const socket = io("http://localhost:3001"); // Initialize WebSocket connection outside the component

const ScheduleCard = ({ employeeId }) => {
  const [workSchedules, setWorkSchedules] = useState([]); // State to store work schedules
  const [error, setError] = useState(null); // State for errors
  const [isLoading, setIsLoading] = useState(true); // State for loading
  const token = localStorage.getItem("authToken"); // Retrieve token from local storage
  const { employeeId: routeEmployeeId } = useParams();

  // Determine the final ID to use
  const finalEmployeeId = employeeId || routeEmployeeId || null;

  // Map abbreviated day names to full day names
  const dayNameMap = {
    Mo: "Monday",
    Tu: "Tuesday",
    We: "Wednesday",
    Th: "Thursday",
    Fr: "Friday",
    Sa: "Saturday",
    Su: "Sunday",
  };

  // Define weekdays (Monday to Friday)
  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr"];

  // Fetch work schedules function
  const fetchWorkSchedules = async () => {
    setIsLoading(true);
    try {
      let endpoint = "http://localhost:3001/api/dashboard/workSchedule";
      if (finalEmployeeId) {
        endpoint = `http://localhost:3001/api/dashboard/workSchedule/${finalEmployeeId}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setWorkSchedules(data.Data || []); // Set work schedules from response
      setError(null);
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      setError("Error loading schedules");
      setWorkSchedules([]); // Reset schedules on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkSchedules(); // Initial fetch on mount

    socket.on("employeeUpdated", fetchWorkSchedules); // Listen for schedule updates

    return () => {
      socket.off("employeeUpdated"); // Clean up WebSocket event listener
    };
  }, []);

// Helper function to format times
const formatTime = (timeString) => {
  if (!timeString || timeString === "00:00:00") return "N/A";
  const date = new Date(`1970-01-01T${timeString}`);
  if (isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // Use UTC to prevent time zone offsets
  });
};


  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="bg-white rounded-[15px] p-4 shadow-md mb-4">
      <h2 className="mt-1 mb-6 ml-4 text-xl font-semibold text-black">
        Work Schedule
      </h2>

      {/* Responsive Layout for Small Screens */}
      <div className="flex flex-col gap-2 px-2 md:hidden">
        {daysOfWeek.map((dayAbbr, index) => {
          const schedule = workSchedules.find((sched) => sched.day === dayAbbr);
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 text-center font-bold bg-blue-100 p-2 mx-1 min-w-[80px] rounded-[15px] text-gray-800">
                <span>{dayNameMap[dayAbbr]}</span>
              </div>
              <div className="flex-1 text-center bg-red-100 p-2 mx-1 rounded-[15px] text-gray-700 text-sm overflow-hidden text-ellipsis">
                {schedule
                  ? `${formatTime(schedule.startTime)} - ${formatTime(
                      schedule.endTime
                    )}`
                  : "N/A - N/A"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Layout for Medium and Larger Screens */}
      <div className="hidden md:flex justify-between px-2 pb-1">
        {/* Display days as columns */}
        {daysOfWeek.map((dayAbbr, index) => (
          <div
            key={index}
            className="flex-1 text-center font-bold bg-blue-100 p-2 mx-1 min-w-[80px] rounded-[15px] text-gray-800"
          >
            <span>{dayNameMap[dayAbbr]}</span>
          </div>
        ))}
      </div>

      <div className="hidden md:flex justify-between px-2 pb-1">
        {/* Display time ranges as columns */}
        {daysOfWeek.map((dayAbbr, index) => {
          const schedule = workSchedules.find((sched) => sched.day === dayAbbr);
          return (
            <div
              key={index}
              className="flex-1 text-center bg-red-100 p-2 mx-1 min-w-[80px] rounded-[15px] text-gray-700 text-sm overflow-hidden text-ellipsis"
            >
              {schedule
                ? `${formatTime(schedule.startTime)} - ${formatTime(
                    schedule.endTime
                  )}`
                : "N/A - N/A"}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleCard;
