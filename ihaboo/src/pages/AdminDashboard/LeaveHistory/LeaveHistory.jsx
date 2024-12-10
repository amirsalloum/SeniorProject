
import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client"; // Import Socket.IO client
import Table from "../../../component/Table/Table";
import Pagination from "../../../component/Pagination/Pagination";
import { FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { getUserRole } from "../../../utils/getUserRole";
import ExportButton from "../../../component/ExportButton/ExportButton";

// Initialize Socket.IO client
const socket = io("http://localhost:3001"); // Replace with your server URL if different

const AdminLeaveHistory = () => {
  // State Variables
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [employeeName, setEmployeeName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const recordsPerPage = 10;

  // User Role and Authentication Token
  const userRole = getUserRole();
  const token = localStorage.getItem("authToken");
  const tokenUserID = token ? JSON.parse(atob(token.split(".")[1])).userID : null;

  // Extract leaveRequestID from the URL (if present)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leaveRequestID = queryParams.get("leaveRequestID");

  // Function to Fetch Leave History Data
  const fetchLeaveHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine API URL based on User Role
      let apiUrl = "http://localhost:3001/api/leave/allLeave-history";
      if (userRole === "Supervisor") {
        apiUrl = "http://localhost:3001/api/leave/supervisorLeave-history";
      }

      // Make API Request
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check for Data Presence
      if (response.data && response.data.Data) {
        setLeaveHistory(response.data.Data);
      } else {
        throw new Error("No leave history data found");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      setError(error.message || "Error fetching leave history");
      setIsLoading(false);
    }
  };

  // useEffect Hook to Fetch Data and Set Up Socket Listeners
  useEffect(() => {
    fetchLeaveHistory();

    // Listen for real-time new leave requests
    socket.on("newLeaveRequest", (data) => {
      console.log("New leave request received:", data);
      fetchLeaveHistory(); // Refetch leave history data on new leave request
    });

    // Listen for real-time leave status updates
    socket.on("leaveStatusUpdate", (data) => {
      console.log("Leave status update received:", data);
      fetchLeaveHistory(); // Refetch leave history data on status update
    });

    // Clean up Socket Listeners on Component Unmount
    return () => {
      socket.off("newLeaveRequest");
      socket.off("leaveStatusUpdate");
    };
  }, [userRole, token, leaveRequestID]);

  // Utility Function to Format Date and Time
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleDateString("en-US", options);
  };

  // Utility Function to Format Leave Period
  const formatLeavePeriod = (start, end) => {
    const formattedStart = formatDateTime(start);
    const formattedEnd = formatDateTime(end);
    if (formattedStart === "Invalid Date" || formattedEnd === "Invalid Date") {
      return "Invalid Date";
    }
    return `${formattedStart} - ${formattedEnd}`;
  };

  // Handler for Action Buttons (Approve/Reject)
  const handleActionClick = (leaveRequest, action) => {
    setSelectedLeave(leaveRequest);
    setActionType(action);
    setShowModal(true);
  };

  // Handler for Details Button
  const handleDetailsClick = (leaveRequest) => {
    setSelectedLeave(leaveRequest);
    setShowDetailsModal(true);
  };

  // Handler for Confirming Actions in Modal
  const handleConfirmAction = async () => {
    if (!selectedLeave) return;

    const apiUrl =
      userRole === "Supervisor"
        ? "http://localhost:3001/api/leave/supervisor-decision"
        : "http://localhost:3001/api/leave/hr-decision";

    const decisionPayload = {
      userID: tokenUserID,
      leaveRequestID: selectedLeave.leaveRequestID,
      decision: actionType,
      rejectReason: actionType === "reject" ? rejectReason : null,
    };

    try {
      await axios.post(apiUrl, decisionPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setRejectReason("");
      fetchLeaveHistory(); // Update the data without page reload
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error processing the request.";
      
      // **Selective Error Handling:**
      if (
        !(userRole === "Supervisor" && errorMsg === "Leave request not found or already processed by supervisor")
      ) {
        setError(errorMsg);
      } else {
        console.warn("Supervisor attempted to process an already handled leave request.");
        setShowModal(false);
        setRejectReason("");
      }
    }
  };

  // Handler for Exporting Data to CSV
  const handleExport = () => {
    const csvContent = [
      ["Employee Name", "Leave Type", "Leave Period", "Action Date", "Status"],
      ...leaveHistory.map((leave) => [
        leave.employeeName,
        leave.leaveTypeName,
        `${formatDateTime(leave.startDateTime)} - ${formatDateTime(leave.endDateTime)}`,
        formatDateTime(leave.actionDate),
        leave.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leave_history.csv";
    link.click();
  };

  // Function to Filter Leave Records Based on Filters
  const filterRecords = (records) => {
    let filtered = records.filter((leave) => {
      const leaveActionDate = new Date(leave.actionDate);
      const filterActionDate = actionDate ? new Date(actionDate) : null;
      
      const matchesActionDate = filterActionDate
        ? leaveActionDate.toDateString() === filterActionDate.toDateString()
        : true;

      const matchesEmployeeName = employeeName
        ? leave.employeeName.toLowerCase().includes(employeeName.toLowerCase())
        : true;
      const matchesLeaveType = leaveType
        ? leave.leaveTypeName === leaveType
        : true;
     
      const matchesStatus = statusFilter
        ? leave.status.toLowerCase() === statusFilter.toLowerCase()
        : true;

      return (
        matchesEmployeeName &&
        matchesLeaveType &&
        matchesActionDate &&
        matchesStatus
      );
    });

    if (leaveRequestID) {
      filtered = filtered.filter(
        (leave) => leave.leaveRequestID === parseInt(leaveRequestID)
      );
    }

    return filtered;
  };

  // Apply Filters to Leave History Data
  const filteredLeaveHistory = filterRecords(leaveHistory);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredLeaveHistory.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaveHistory.length / recordsPerPage)
  );

  // Pagination Handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleNextPageSet = () => {
    if (pageRange[2] < totalPages) {
      const newRange = pageRange.map((page) => page + 1);
      setPageRange(newRange);
      setCurrentPage(newRange[1]);
    }
  };

  const handlePrevPageSet = () => {
    if (pageRange[0] > 1) {
      const newRange = pageRange.map((page) => page - 1);
      setPageRange(newRange);
      setCurrentPage(newRange[1]);
    }
  };
  function formatToExcelDate(dateStr) {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj)) return "";
  
    // Format as YYYY-MM-DD HH:mm:ss
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  return (
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg h-[305px] opacity-100 w-full rounded-none">
      <h2 className="text-2xl text-white mb-5 font-bold tracking-wide font-inter w-[314px]">Leave History</h2>
  
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-end mb-4">
        <div className="filter-group flex flex-col gap-2 w-1/5">
          <label htmlFor="employeeName" className="text-white text-sm font-bold">
            Employee Name
          </label>
          <input
            id="employeeName"
            type="text"
            placeholder=" by employee name"
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[180px] cursor-pointer"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </div>
  
        <div className="filter-group flex flex-col gap-2 w-1/5">
  <label htmlFor="actionDate" className="text-white text-sm font-bold">
    Action Date
  </label>
  <input
    id="actionDate"
    type="date"
    className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[180px] cursor-pointer"
    value={actionDate}
    onChange={(e) => setActionDate(e.target.value)}
  />
</div>

  
        <div className="filter-group flex flex-col gap-2 w-1/5">
          <label htmlFor="leaveType" className="text-white text-sm font-bold">
            Leave Type
          </label>
          <select
            id="leaveType"
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[180px] h-[38px] pr-8 custom-select-arrow cursor-pointer"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="">All</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
          </select>
        </div>
  
        <div className="filter-group flex flex-col gap-2 w-1/5">
          <label htmlFor="statusFilter" className="text-white text-sm font-bold">
            Status
          </label>
          <select
            id="statusFilter"
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[180px] h-[38px] pr-8 custom-select-arrow cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
  
        <div className="flex items-center ml-auto">
<ExportButton
  data={leaveHistory.map((leave) => {
    const actionDateTime = formatToExcelDate(leave.actionDate);
    const supervisorActionDate = formatToExcelDate(leave.supervisorActionDate);
    const hrActionDate = formatToExcelDate(leave.hrActionDate);

    const start = formatToExcelDate(leave.startDateTime);
    const end = formatToExcelDate(leave.endDateTime);
    const leavePeriod = start && end ? `${start} - ${end}` : "";

    const supervisorDecision = leave.supervisorDecision && leave.supervisorDecision.trim() !== "" 
      ? leave.supervisorDecision 
      : "Pending";

    const hrDecision = leave.hrDecision && leave.hrDecision.trim() !== "" 
      ? leave.hrDecision 
      : "Pending";

    const supervisorRejectReason = leave.supervisorRejectReason && leave.supervisorRejectReason.trim() !== "" 
      ? leave.supervisorRejectReason 
      : "";

    const hrRejectReason = leave.hrRejectReason && leave.hrRejectReason.trim() !== ""
      ? leave.hrRejectReason
      : "";

    const notes = leave.notes && leave.notes.trim() !== "" ? leave.notes : "";

    // Determine status
    let status = "Pending";
    if (hrDecision !== "Pending") {
      status = hrDecision;
    } else if (supervisorDecision !== "Pending") {
      status = supervisorDecision;
    }

    return {
      leaveTypeName: leave.leaveTypeName || "",
      leavePeriod: leavePeriod,
      actionDateTime: actionDateTime,
      status: status,
      supervisor: leave.supervisor || "",
      supervisorDecision: supervisorDecision,
      supervisorActionDate: supervisorActionDate,
      supervisorRejectReason: supervisorRejectReason,
      hr: leave.hr || "",
      hrDecision: hrDecision,
      hrActionDate: hrActionDate,
      hrRejectReason: hrRejectReason,
      notes: notes,
      supervisorName: "omar ghourany", // Hardcoded as requested
      hrName: "ihab ahmad"            // Hardcoded as requested
    };
  })}
  fileName="adminleavehistory"
  columns={[
    { header: "Leave Type", key: "leaveTypeName" },
    { header: "Leave Period", key: "leavePeriod" },
    { header: "Action Date/Time (Submit)", key: "actionDateTime" },
    { header: "Status", key: "status" },
    { header: "Supervisor", key: "supervisorName" },
    { header: "Supervisor Decision", key: "supervisorDecision" },
    { header: "Supervisor Action Date", key: "supervisorActionDate" },
    { header: "Supervisor Reject Reason", key: "supervisorRejectReason" },
    { header: "HR", key: "hrName" },
    { header: "HR Decision", key: "hrDecision" },
    { header: "HR Action Date", key: "hrActionDate" },
    { header: "HR Reject Reason", key: "hrRejectReason" },
    { header: "Notes", key: "notes" },
  ]}
/>
        </div>
      </div>

      {/* Error or Loading Messages */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {isLoading ? (
        <p className="text-gray-500 mt-4">Loading leave history...</p>
      ) : (
        <>
          {/* Table Section */}
          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg mt-5">
            <Table
              columns={[
                { key: "employeeName", header: "Name" },
                { key: "leaveTypeName", header: "Leave Type" },
                { key: "leavePeriod", header: "Leave Period" },
                { key: "actionDate", header: "Action Date" },
                { key: "status", header: "Status" },
                { key: "actions", header: "Actions" },
              ]}
              data={currentRecords.map((leave) => ({
                ...leave,
                leavePeriod: `${formatLeavePeriod(leave.startDateTime, leave.endDateTime)}`,
                actionDate: formatDateTime(leave.actionDate),
                status: (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        leave.status === "Approved"
                          ? "bg-green-500"
                          : leave.status === "Rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    ></span>
                    <span>{leave.status}</span>
                  </div>
                ),
                actions: (
                  <div className="flex items-center gap-2">
                    <FaInfoCircle
                      className="text-blue-500 cursor-pointer"
                      onClick={() => handleDetailsClick(leave)}
                    />
                    {/* Supervisors: Only if Pending and no supervisor decision */}
                    {userRole === "Supervisor" && leave.status === "Pending" && !leave.supervisorDecision && (
                      <>
                        <button
                          className="text-green-500"
                          onClick={() => handleActionClick(leave, "approve")}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="text-red-500"
                          onClick={() => handleActionClick(leave, "reject")}
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    {/* HR and Admin: Show buttons for all pending leave requests */}
                    {(userRole === "HR" || userRole === "Admin") && leave.status === "Pending" && (
                      <>
                        <button
                          className="text-green-500"
                          onClick={() => handleActionClick(leave, "approve")}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="text-red-500"
                          onClick={() => handleActionClick(leave, "reject")}
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                  </div>
                ),
              }))}
              isLoading={isLoading}
              handleRowClick={(row) => console.log("Row clicked", row)}
              rowClassName={(leave) =>
                leave.leaveRequestID === parseInt(leaveRequestID)
                  ? "bg-blue-100 border-l-4 border-blue-500"
                  : ""
              }
              noDataMessage="No leave history available"
            />
          </div>
        
          {/* Pagination */}
          {filteredLeaveHistory.length > recordsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageRange={pageRange}
              onPageChange={handlePageChange}
              onNextPageSet={handleNextPageSet}
              onPrevPageSet={handlePrevPageSet}
            />
          )}
        </>
      )}

      {/* Approve/Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl p-6 rounded-md shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Leave Request</h3>
              <button
                className="text-xl text-gray-700 hover:text-black"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-gray-600">
              {actionType === 'approve'
                ? 'Do you want to approve this leave?'
                : 'Do you want to confirm the leave rejection? Please write the reason.'}
            </p>
            {actionType === 'reject' && (
              <>
                <div className="mt-4">
                  <textarea
                    id="reason"
                    className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                    placeholder="Reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    className="py-2 px-6 w-32 rounded-[15px] text-white bg-gray-800 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={handleConfirmAction}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}

            {actionType === 'approve' && (
              <div className="flex justify-end mt-4">
                <button
                  className="py-2 px-6 w-32 rounded-[15px] text-white bg-gray-800 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={handleConfirmAction}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-[1100px] max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold">Leave Details</h3>
              <button
                className="text-lg text-gray-700 hover:text-black"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {/* Supervisor Container */}
              <div className="bg-green-100 p-4 rounded-lg shadow">
                <p className="mb-2 text-sm">
                  <span className="font-bold">Supervisor Name:</span>{' '}
                  <span className="font-normal">{selectedLeave.supervisorName || 'N/A'}</span>
                </p>
                <p className="mb-2 text-sm">
                  <span className="font-bold">Supervisor Decision:</span>{' '}
                  {selectedLeave.supervisorDecision && selectedLeave.supervisorDecision !== 'N/A' ? (
                    <>
                      <span
                        className={`w-2.5 h-2.5 inline-block rounded-full ${
                          selectedLeave.supervisorDecision.toLowerCase() === 'approved'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        } mr-2`}
                      ></span>
                      <span className="font-normal">{selectedLeave.supervisorDecision}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 inline-block rounded-full bg-yellow-500 mr-2"></span>
                      <span className="font-normal">Pending</span>
                    </>
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-bold">Action Date:</span>{' '}
                  <span className="font-normal">{formatDateTime(selectedLeave.supervisorActionDate) || 'N/A'}</span>
                </p>
              </div>

              {/* HR Container */}
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <p className="mb-2 text-sm">
                  <span className="font-bold">HR Name:</span>{' '}
                  <span className="font-normal">{selectedLeave.hrName || 'N/A'}</span>
                </p>
                <p className="mb-2 text-sm">
                  <span className="font-bold">HR Decision:</span>{' '}
                  {selectedLeave.hrDecision && selectedLeave.hrDecision !== 'N/A' ? (
                    <>
                      <span
                        className={`w-2.5 h-2.5 inline-block rounded-full ${
                          selectedLeave.hrDecision.toLowerCase() === 'approved'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        } mr-2`}
                      ></span>
                      <span className="font-normal">{selectedLeave.hrDecision}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 inline-block rounded-full bg-yellow-500 mr-2"></span>
                      <span className="font-normal">Pending</span>
                    </>
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-bold">Action Date:</span>{' '}
                  <span className="font-normal">{formatDateTime(selectedLeave.hrActionDate) || 'N/A'}</span>
                </p>
              </div>

              {/* Final Status Container */}
              <div className="bg-orange-100 p-4 rounded-lg shadow">
                <p className="mb-2 text-sm">
                  <span className="font-bold">Final Status:</span>{' '}
                  <span
                    className={`w-2.5 h-2.5 inline-block rounded-full ${
                      selectedLeave.status.toLowerCase() === 'approved'
                        ? 'bg-green-500'
                        : selectedLeave.status.toLowerCase() === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    } mr-2`}
                  ></span>
                  <span className="font-normal">{selectedLeave.status}</span>
                </p>
                <p className="mb-2 text-sm">
                  <span className="font-bold">Notes:</span>{' '}
                  <span className="font-normal">{selectedLeave.notes || 'No notes provided.'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-bold">Document:</span>{' '}
                  {selectedLeave.documentAttach ? (
                    <a
                      className="text-blue-500 underline hover:no-underline"
                      href={`http://localhost:3001/api/leave/view-document/${selectedLeave.documentAttach}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Document
                    </a>
                  ) : (
                    'No document attached.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLeaveHistory;