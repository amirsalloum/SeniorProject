import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client"; // Import Socket.IO client
import { useAuthFetch } from "../../Authentication/useAuthContext"; // Import the custom fetch hook
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Spinner from "../../component/Spinner";
import {
  faCircleCheck,
  faCirclePause,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const socket = io("http://localhost:3001"); // Establish WebSocket connection outside the component

const EmploymentDetails = ({ employeeId }) => {
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { customFetch } = useAuthFetch(); // Use the custom fetch function
  const { employeeId: routeEmployeeId } = useParams();

  // Determine final ID to use
  const finalEmployeeId = employeeId || routeEmployeeId || null;

  // Fetch employee data function
  const fetchEmployeeData = async () => {
    try {
      let endpoint = "http://localhost:3001/api/dashboard/employmentDetails";
      if (finalEmployeeId) {
        endpoint = `http://localhost:3001/api/dashboard/employmentDetails/${finalEmployeeId}`;
      }

      const data = await customFetch(endpoint, { method: "GET" });

      if (data?.Data) {
        setEmployee((prevData) => {
          // Update state only if data has changed
          return JSON.stringify(prevData) !== JSON.stringify(data.Data)
            ? data.Data
            : prevData;
        });
        setError(null);
      } else {
        setError("No employment data found");
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Failed to load employee data");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchEmployeeData().then(() => setIsLoading(false)); // Initial fetch of employee data

    socket.on("employeeUpdated", fetchEmployeeData); // Re-fetch data on update

    return () => {
        socket.off("employeeUpdated"); // Clean up WebSocket event listener
    };
}, []);


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="text-green-500"
            title="Active"
          />
        );
      case "inactive":
        return (
          <FontAwesomeIcon
            icon={faCirclePause}
            className="text-yellow-500"
            title="Inactive"
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!employee) {
    return <p>No employment data found</p>;
  }

  return (
    <div className="bg-white rounded-[15px] p-6  mb-4 shadow-md">
      {/* Header with Status Icon */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-left">Employment Details</h2>
        <div className="text-2xl">{getStatusIcon(employee.employmentStatus)}</div>
      </div>

      <div className="flex flex-col gap-3 mt-4 lg:flex-row lg:justify-between lg:gap-14">
        {/* Column 1 */}
        <div className="flex-1 flex flex-col pr-5">
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Position:</strong>{" "}
            {employee.positionName || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Work Status:</strong>{" "}
            {employee.workStatusName || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Contract Start Date:</strong>{" "}
            {formatDate(employee.StartDate)}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Contract Type:</strong>{" "}
            {employee.contractTypeName || "N/A"}
          </p>
        </div>

        {/* Column 2 */}
        <div className="flex-1 flex flex-col pr-5">
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Department:</strong>{" "}
            {employee.departmentName || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Salary Type:</strong>{" "}
            {employee.salaryTypeName || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Renewal Date:</strong>{" "}
            {formatDate(employee.renewalDate)}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Contract Date:</strong>{" "}
            {formatDate(employee.contractStartDate)}
          </p>
        </div>

        {/* Column 3 */}
        <div className="flex-1 flex flex-col">
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Branch:</strong>{" "}
            {employee.branchName || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Salary:</strong>{" "}
            ${employee.salary ? parseFloat(employee.salary).toFixed(2) : "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Required Working Hours:</strong>{" "}
            {employee.requiredWorkingHours || "N/A"}
          </p>
          <p className="my-1 text-sm">
            <strong className="text-gray-600 font-semibold">Contract Expiry Date:</strong>{" "}
            {formatDate(employee.contractEndDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmploymentDetails;
