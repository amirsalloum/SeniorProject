import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import LeaveModal from "../../components/LeaveModal/LeaveModal";
import { useAuthFetch } from "../../Authentication/useAuthContext";
import Table from "../../component/Table/Table";
import ExportButton from "../../component/ExportButton/ExportButton";
import Pagination from "../../component/Pagination/Pagination";
import AttendanceAndLeaveSummary from "../../components/LeaveSummaryCard/LeaveSummaryCard";
import { useLocation } from "react-router-dom"; 
import Spinner from "../../component/Spinner";


const socket = io("http://localhost:3001"); // Initialize Socket.IO

const LeaveHistory = () => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionDate, setActionDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const recordsPerPage = 12;

  const { customFetch } = useAuthFetch();
  const intervalRef = useRef(null);

  // Extract leaveRequestID from the URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leaveRequestID = queryParams.get("leaveRequestID");

  const handleLeaveRequestClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLeaveHistory = async () => {
      try {
        const data = await customFetch(
          "http://localhost:3001/api/leave/leave-history",
          {
            method: "GET",
          }
        );

        if (isMounted) {
          setLeaveHistory((prevData) => {
            if (JSON.stringify(prevData) !== JSON.stringify(data.Data)) {
              return data.Data;
            } else {
              return prevData;
            }
          });
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching leave history:", error);
        if (isMounted) {
          setError(error.message || "Failed to load leave history");
        }
      }
    };

    const initialFetch = async () => {
      setIsLoading(true);
      await fetchLeaveHistory();
      setIsLoading(false);
    };

    initialFetch();

    // Real-time updates for new leave requests
    socket.on("newLeaveRequest", (data) => {
      console.log("New leave request received:", data);
      fetchLeaveHistory();
    });

    // Real-time updates for leave status changes
    socket.on("leaveStatusUpdate", ({ leaveRequestID, status }) => {
      console.log("Leave request updated:", leaveRequestID, status);
      fetchLeaveHistory();
    });

    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
      socket.off("newLeaveRequest");
      socket.off("leaveStatusUpdate"); // Clean up listeners
    };
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleDateString("en-US", options).replace(",", "");
  };

  const handleRowClick = (leave) => {
    setSelectedLeave(leave);
  };

  const getSimplifiedStatus = (actionTaken) => {
    const lowerAction = actionTaken.toLowerCase();
    if (lowerAction.includes("approved")) {
      return "Approved";
    } else if (lowerAction.includes("rejected")) {
      return "Rejected";
    }
    return "Pending";
  };

  const getStatusDotColor = (actionTaken) => {
    const lowerAction = actionTaken.toLowerCase();
    if (lowerAction.includes("approved")) {
      return "bg-green-500";
    } else if (lowerAction.includes("rejected")) {
      return "bg-red-500";
    } else {
      return "bg-yellow-500";
    }
  };

  // Filter records based on filters and leaveRequestID if provided
  const filteredLeaveHistory = leaveHistory.filter((leave) => {
    const leaveActionDate = new Date(leave.actionDate);
    const filterActionDate = actionDate ? new Date(actionDate) : null;
    
    const matchesActionDate = filterActionDate
      ? leaveActionDate.toDateString() === filterActionDate.toDateString()
      : true;
    

    const matchesLeaveType = leaveType
      ? leave.leaveTypeName === leaveType
      : true;

    const matchesStatus = statusFilter
      ? getSimplifiedStatus(leave.actionTaken).toLowerCase() ===
        statusFilter.toLowerCase()
      : true;

    let matchesLeaveRequestID = true;
    if (leaveRequestID) {
      matchesLeaveRequestID = leave.leaveRequestID === parseInt(leaveRequestID);
    }

    return (
      matchesLeaveType &&
      matchesActionDate &&
      matchesStatus &&
      matchesLeaveRequestID
    );
  });

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
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg   h-[550px] md:h-[460px]   xl:h-[305px] opacity-100 w-full rounded-none">
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">
        Leave History
      </h2>

      {/* Leave Balance Card */}
      <div className="xs:w-[400px] w-[400px] sm:w-[550px] md:w-[720px] lg:w-full">
        <AttendanceAndLeaveSummary showHeading={false} className="w-full" />
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}
      {isLoading && (
        <div className="flex justify-center items-center w-full h-[300px]">
          <Spinner loading={isLoading} size={60} /> {/* Larger spinner for this page */}
        </div>
      )}
      {/* Filter Section */}
         <div className="flex flex-wrap items-center  gap-4  mb-6">
              <div className="flex items-center lg:flex-wrap gap-4 ">
              <div className="filter-item flex flex-col md:flex-wrap items-start w-full  sm:w-auto">
          <label 
            htmlFor="actionDate" 
            className="text-base text-white font-semibold mb-2"
          >
            Action Date
          </label>
          <input
            id="actionDate"
            type="date"
            className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]   lg:w-[190px] h-[40px] sm:h-[40px] cursor-pointer"
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
          />
        </div>
        
        {/* Status Filter */}
        <div className="filter-item flex flex-col items-start w-full sm:w-auto">
          <label
            htmlFor="statusFilter"
            className="text-base text-white font-semibold mb-2"
          >
            Status
          </label>
          <select
            id="statusFilter"
            className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]   lg:w-[190px] h-[40px] sm:h-[40px] pr-8 custom-select-arrow cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        </div>

        <div className="flex lg:flex-wrap  items-center gap-4 ">
        <div className="filter-item flex flex-col items-start w-full  sm:w-auto">
          
          <label
            htmlFor="leaveType"
            className="text-base text-white font-semibold mb-2"
          >
            Leave Type  
          </label> 
          
          <select
            id="leaveType"
            className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]   lg:w-[190px] h-[40px] sm:h-[40px] pr-8 custom-select-arrow cursor-pointer"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            
            <option value="">All</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Personal Leave">Personal Leave</option>  
          </select>  
        </div>
       
        {/* Export Button */}
        <div className="filter-item flex flex-col items-start w-full sm:w-auto">
            <label className="text-base text-transparent font-semibold mb-2">
              Export
            </label>
          <ExportButton
  data={filteredLeaveHistory.map((leave) => {
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
      status = hrDecision; // If HR decided, use HR decision as status
    } else if (supervisorDecision !== "Pending") {
      status = supervisorDecision; // If Supervisor decided, use Supervisor decision if HR didn't decide yet
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
    };
  })}
  fileName="leave_history"
  columns={[
    { header: "Leave Type", key: "leaveTypeName"  },
    { header: "Leave Period", key: "leavePeriod"  },
    { header: "Action Date/Time (Submit)", key: "actionDateTime"  },
    { header: "Status", key: "status" },
    { header: "Supervisor", key: "supervisor" },
    { header: "Supervisor Decision", key: "supervisorDecision" },
    { header: "Supervisor Action Date", key: "supervisorActionDate" },
    { header: "Supervisor Reject Reason", key: "supervisorRejectReason" },
    { header: "HR", key: "hr" },
    { header: "HR Decision", key: "hrDecision" },
    { header: "HR Action Date", key: "hrActionDate" },
    { header: "HR Reject Reason", key: "hrRejectReason" },
    { header: "Notes", key: "notes" },                 
  ]}
/>

      </div>
      </div>
</div>
      {/* Table Section */}
      <div >
        <Table
          columns={[
            { key: "leaveTypeName", header: "Leave Type" },
            { key: "leavePeriod", header: "Leave Period" },
            { key: "actionDate", header: "Action Date" },
            { key: "status", header: "Status" },
          ]}
          data={currentRecords.map((leave) => ({
            ...leave,
            leaveTypeName:
              leave.leaveTypeName === "Casual Leave"
                ? "Annual Leave"
                : leave.leaveTypeName,
            leavePeriod: `${formatDateTime(
              leave.startDateTime
            )} - ${formatDateTime(leave.endDateTime)}`,
            actionDate: formatDateTime(leave.actionDate),
            status: (
              <div className="flex items-center">
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusDotColor(
                    leave.actionTaken
                  )}`}
                ></span>
                <span>{getSimplifiedStatus(leave.actionTaken)}</span>
              </div>
            ),
          }))}
          isLoading={isLoading}
          handleRowClick={handleRowClick}
          rowClassName={(leave) =>
            leave.leaveRequestID === parseInt(leaveRequestID)
              ? "highlighted-row"
              : ""
          }
          noDataMessage="No leave history available"
        />
      </div>

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





{selectedLeave && (
  <div
    className="modal fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-50"
    onClick={closeModal}
  >
    <div
      className="modal-content bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center w-full">
        <h3 className="text-xl font-semibold mb-4">Leave History Details</h3>
        <button
          className="text-xl text-gray-700 hover:text-black"
          onClick={closeModal}
        >
          ✕
        </button>
      </div>

      <div className="details-header grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="detail-item flex">
          <p className="detail-title text-gray-500 mr-2">Employee:</p>
          <p className="detail-value text-gray-900">
            {selectedLeave.employeeName || "N/A"}
          </p>
        </div>
        <div className="detail-item flex">
          <p className="detail-title text-gray-500 mr-2">
            Document Attachment:
          </p>
          {selectedLeave.documentAttach ? (
            <a
              href={`http://localhost:3001/api/leave/view-document/${selectedLeave.documentAttach}`}
              className="detail-value text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Document
            </a>
          ) : (
            <span className="detail-value text-gray-900">
              No document attached
            </span>
          )}
        </div>
        <div className="detail-item flex">
          <p className="detail-title text-gray-500 mr-2">Period:</p>
          <span className="detail-value text-gray-900">
            {`${formatDateTime(selectedLeave.startDateTime)} - ${formatDateTime(
              selectedLeave.endDateTime
            )}`}
          </span>
        </div>
        <div className="detail-item flex">
          <p className="detail-title text-gray-500 mr-2">Action Date:</p>
          <p className="detail-value text-gray-900">
            {formatDateTime(selectedLeave.actionDate) || "N/A"}
          </p>
        </div>

        {/* Conditionally render the notes only if they exist and are not just whitespace */}
        {selectedLeave.notes && selectedLeave.notes.trim() !== "" && (
          <div className="detail-item flex md:col-span-2">
            <p className="detail-title text-gray-500 mr-2">Notes:</p>
            <div className="detail-value text-gray-900 whitespace-pre-wrap break-words overflow-auto max-h-52">
              {selectedLeave.notes}
            </div>
          </div>
        )}
      </div>

      <div className="supervisor-hr-container grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="section bg-green-100 border border-green-200 rounded-lg p-4 w-full">
          <p className="flex">
            <span className="section-title text-gray-500 mr-2">
              Supervisor:
            </span>
            <span className="name-value text-gray-900">
              {selectedLeave.supervisor || "N/A"}
            </span>
          </p>
          <p className="status mt-2 flex items-center">
            <span className="status-label text-gray-500 mr-2">Status:</span>
            <span
              className={`status-dot ${
                selectedLeave.supervisorDecision === "Rejected"
                  ? "bg-red-500"
                  : selectedLeave.supervisorDecision === "Approved"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              } rounded-full inline-block w-3 h-3 mr-2`}
            ></span>
            <span className="status-value text-gray-900">
              {selectedLeave.supervisorDecision || "Pending"}
            </span>
          </p>
          <p className="action-date mt-2 flex">
            <span className="text-gray-500 mr-2">Action Date:</span>
            <span className="text-gray-900">
              {formatDateTime(selectedLeave.supervisorActionDate) || "N/A"}
            </span>
          </p>

          {/* Conditionally render the supervisor reject reason only if it exists and is not just whitespace */}
          {selectedLeave.supervisorRejectReason &&
            selectedLeave.supervisorRejectReason.trim() !== "" && (
              <p className="reject-reason mt-2 flex">
                <span className="text-gray-500 mr-2 whitespace-nowrap">
                  Reject Reason:
                </span>
                <span className="text-gray-900 whitespace-pre-wrap break-words overflow-auto max-h-24">
                  {selectedLeave.supervisorRejectReason}
                </span>
              </p>
            )}
        </div>

        <div className="section bg-blue-100 border border-blue-200 rounded-lg p-4 w-full">
          <p className="flex">
            <span className="section-title text-gray-500 mr-2">HR:</span>
            <span className="name-value text-gray-900">
              {selectedLeave.hr || "N/A"}
            </span>
          </p>
          <p className="status mt-2 flex items-center">
            <span className="status-label text-gray-500 mr-2">Status:</span>
            <span
              className={`status-dot ${
                selectedLeave.hrDecision === "Rejected"
                  ? "bg-red-500"
                  : selectedLeave.hrDecision === "Approved"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              } rounded-full inline-block w-3 h-3 mr-2`}
            ></span>
            <span className="status-value text-gray-900">
              {selectedLeave.hrDecision || "Pending"}
            </span>
          </p>
          <p className="action-date mt-2 flex">
            <span className="text-gray-500 mr-2">Action Date:</span>
            <span className="text-gray-900">
              {formatDateTime(selectedLeave.hrActionDate) || "N/A"}
            </span>
          </p>

          {/* Conditionally render the HR reject reason only if it exists and is not just whitespace */}
          {selectedLeave.hrRejectReason &&
            selectedLeave.hrRejectReason.trim() !== "" && (
              <p className="reject-reason mt-2 flex">
                <span className="text-gray-500 mr-2 whitespace-nowrap">
                  Reject Reason:
                </span>
                <span className="text-gray-900 whitespace-pre-wrap break-words overflow-auto max-h-24">
                  {selectedLeave.hrRejectReason}
                </span>
              </p>
            )}
        </div>
      </div>
    </div>
  </div>
)}


      {isModalOpen && <LeaveModal onClose={closeModal} />}
    </div>
  );
};

export default LeaveHistory;

