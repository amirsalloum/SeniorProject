import React, { useState, useEffect, useRef } from "react";
import { useAuthFetch } from "../../Authentication/useAuthContext";
import Table from "../../component/Table/Table";
import Pagination from "../../component/Pagination/Pagination";
import ExportButton from "../../component/ExportButton/ExportButton";
import Spinner from "../../component/Spinner"; // Add the import

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionType, setActionType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const recordsPerPage = 10;

  const { customFetch } = useAuthFetch();
  const intervalRef = useRef(null);

  // Mapping action IDs to names
  const actionIDToName = {
    1: "Check In",
    2: "Check Out",
    3: "Break In",
    4: "Break Out",
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await customFetch(
        "http://localhost:3001/api/attendance/getAttendanceRecord",
        {
          method: "GET",
        }
      );

      if (
        response?.Status === "Success" &&
        Array.isArray(response.AttendanceRecords)
      ) {
        setAttendanceRecords((prevData) => {
          if (
            JSON.stringify(prevData) !==
            JSON.stringify(response.AttendanceRecords)
          ) {
            return response.AttendanceRecords;
          }
          return prevData;
        });
        setError(null);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      setError(error.message || "Failed to load attendance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAttendanceRecords();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [startDate, endDate, actionType]);

  const filterRecords = (records) => {
    return records.filter((record) => {
      const recordDate = new Date(record.actionDate);
      const filterStartDate = startDate ? new Date(startDate) : null;
      const filterEndDate = endDate ? new Date(endDate) : null;

      const matchesStartDate = filterStartDate
        ? recordDate >= filterStartDate
        : true;
      const matchesEndDate = filterEndDate ? recordDate <= filterEndDate : true;
      const matchesActionType = actionType
        ? actionIDToName[record.actionID]?.toLowerCase() === actionType.toLowerCase()
        : true;

      return matchesStartDate && matchesEndDate && matchesActionType;
    });
  };

  const filteredRecords = filterRecords(attendanceRecords);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords
  .sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate))
  .slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / recordsPerPage)
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

  return (
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg   h-[550px] md:h-[360px]   xl:h-[305px] opacity-100 w-full rounded-none">
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">
        Attendance History
      </h2>

      {/* Summary Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between bg-white rounded-[8px] p-3 mb-4 shadow-md sm:space-y-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-700 text-base font-medium">
          <span>Total Attendance Days</span>
          <span className="font-bold text-black">{filteredRecords.length}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-700 text-base font-medium">
          <span>Total Absences</span>
          <span className="font-bold text-black">15</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-700 text-base font-medium">
          <span>Punctuality</span>
          <span className="font-bold text-black">Good</span>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-[300px]">
          <Spinner loading={isLoading} size={60} />
        </div>
      ) : (

        <>


          {/* Filter Section aligned with Export Button */}
            <div className="flex flex-wrap items-center  gap-4  mb-6">
              <div className="flex items-center lg:flex-wrap gap-4 ">
              {/* From Date Input */}
              <div className="filter-item flex flex-col md:flex-wrap items-start w-full  sm:w-auto">
                <label
                  htmlFor="FromDate"
                  className="text-base text-white font-semibold mb-2  "
                >            
                 From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]   lg:w-[190px] h-[40px] sm:h-[40px] cursor-pointer"
                  placeholder="mm / dd / yyyy"
                />
              </div>

              {/* To Date Input */}
              <div className="filter-item flex flex-col items-start w-full sm:w-auto">
                <label
                    htmlFor="ToDate"
                    className="text-base text-white font-semibold mb-2"
                  >
                   Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]  lg:w-[190px] h-[40px] sm:h-[40px] cursor-pointer"
                  placeholder="mm / dd / yyyy"
                />
              </div>
              </div>  


              
              <div className="flex  items-center gap-4 ">
              {/* Action Type Select */}
              <div className="filter-item flex flex-col items-start w-full  sm:w-auto">
              <label
                  htmlFor="actionType"
                  className="text-base text-white font-semibold mb-2"
                >
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px]  sm:w-[190px]   lg:w-[190px] h-[40px] sm:h-[40px] pr-8 custom-select-arrow cursor-pointer"
                  >
                  <option value="">All</option>
                  <option value="Check In">Check In</option>
                  <option value="Check Out">Check Out</option>
                  <option value="Break In">Break In</option>
                  <option value="Break Out">Break Out</option>
                </select>
              </div>
          
          
            {/* Export Button positioned to the left */}
            <div className="filter-item flex flex-col items-start w-full sm:w-auto">
            <label className="text-base text-transparent font-semibold mb-2">
              Export
            </label>
              <ExportButton
                data={filteredRecords.map((record) => ({
                  actionDate: new Date(record.actionDate).toLocaleDateString(),
                  actionName: actionIDToName[record.actionID] || "Unknown",
                  actionTime: new Date(record.actionDate).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit", hour12: true }
                  ),
                }))}
                fileName="attendance_history"
                columns={[
                  { header: "Date", key: "actionDate" },
                  { header: "Action Type", key: "actionName" },
                  { header: "Action Time", key: "actionTime" },
                ]}
              />
            </div>
          </div>
          </div>

          {/* Table Section */}
          <div >
            <Table
              columns={[
                { key: "actionDate", header: "Date" },
                { key: "actionName", header: "Action Type" },
                { key: "actionTime", header: "Action Time" },
              ]}
              data={currentRecords.map((record) => ({
                ...record,
                actionTime: new Date(record.actionDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                actionDate: new Date(record.actionDate).toLocaleDateString("en-GB"),
                actionName: (
                  <>
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        actionIDToName[record.actionID] === "Check In"
                          ? "bg-green-500"
                          : actionIDToName[record.actionID] === "Check Out"
                          ? "bg-red-600"
                          : actionIDToName[record.actionID] === "Break In"
                          ? "bg-blue-500"
                          : actionIDToName[record.actionID] === "Break Out"
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    {actionIDToName[record.actionID] || "Unknown"}
                  </>
                ),
              }))}
              isLoading={isLoading}
              handleRowClick={() => {}}
              noDataMessage="No attendance records available"
            />
          </div>

          {/* Pagination Section */}
          {filteredRecords.length > recordsPerPage && (
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
    </div>
  );
};

export default Attendance;