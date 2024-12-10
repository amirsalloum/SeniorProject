
import React, { useState, useEffect } from 'react';
import Table from '../../../component/Table/Table';
import Pagination from '../../../component/Pagination/Pagination';
import { getUserRole } from '../../../utils/getUserRole';
import ExportButton from "../../../component/ExportButton/ExportButton";
import { useAuthFetch } from "../../../Authentication/useAuthContext"; 

const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const recordsPerPage = 10;
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  
  const [formVisible, setFormVisible] = useState(false);
  const [formAction, setFormAction] = useState('add'); 
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [fullName, setFullName] = useState('');
  const [actionName, setActionName] = useState('');
  const [actionDate, setActionDate] = useState('');
  
  const userRole = getUserRole();
  const { customFetch } = useAuthFetch(); 

  const fetchAttendanceRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let apiUrl = 'http://localhost:3001/api/attendance/getallAttendance';

      if (userRole === "Supervisor") {
        apiUrl = 'http://localhost:3001/api/attendance/getsupervisorattendance';
      }

      const data = await customFetch(apiUrl, { method: "GET" });

      if (data?.Data) {
        setAttendanceRecords(data.Data);
      } else {
        throw new Error("No attendance data found");
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setError(error.message || "Error fetching attendance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [userRole]);

  const filterRecords = (records) => {
    return records.filter((record) => {
      const recordDate = new Date(record.actionDate);
      const filterStartDate = startDate ? new Date(startDate) : null;
      const filterEndDate = endDate ? new Date(endDate) : null;
  
      const matchesStartDate = filterStartDate ? recordDate >= filterStartDate : true;
      const matchesEndDate = filterEndDate ? recordDate <= filterEndDate : true;
      const matchesActionType = actionType ? record.actionName.toLowerCase() === actionType.toLowerCase() : true;
      const matchesEmployeeName = selectedEmployeeName
        ? record.employeeName.toLowerCase().includes(selectedEmployeeName.toLowerCase())
        : true;
  
      return matchesStartDate && matchesEndDate && matchesActionType && matchesEmployeeName;
    });
  };

  const filteredRecords = filterRecords(attendanceRecords);
  const sortedRecords = filteredRecords.sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate));

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / recordsPerPage));

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleNextPageSet = () => {
    if (pageRange[2] < totalPages) {
      setPageRange(pageRange.map(page => page + 1));
      setCurrentPage(pageRange[1] + 1);
    }
  };

  const handlePrevPageSet = () => {
    if (pageRange[0] > 1) {
      setPageRange(pageRange.map(page => page - 1));
      setCurrentPage(pageRange[1] - 1);
    }
  };

  const actionColor = {
    "Check In": "bg-green-500",
    "Break Out": "bg-yellow-500",
    "Break In": "bg-blue-500",
    "Check Out": "bg-red-500",
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const apiUrl = formAction === 'add' 
      ? 'http://localhost:3001/api/attendance/record-fingerprint' 
      : `http://localhost:3001/api/attendance/update-fingerprint`;

    const body = {
      fullName,
      actionName,
      actionDate,
      fingerPrintID: formAction === 'edit' ? selectedRecord.fingerPrintID : undefined,
    };

    try {
      const response = await customFetch(apiUrl, {
        method: formAction === 'add' ? 'POST' : 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.Status === "Success" || response.Status === "Update Success") {
        fetchAttendanceRecords();
        resetForm();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error.message || "Error submitting form");
    }
  };

  const resetForm = () => {
    setFullName('');
    setActionName('');
    setActionDate('');
    setFormVisible(false);
    setSelectedRecord(null);
    setFormAction('add');
  };

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setFullName(record.employeeName);
    setActionName(record.actionName);
    setActionDate(record.actionDate);
    setFormAction('edit');
    setFormVisible(true);
  };

  return (
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg h-[550px] md:h-[360px] xl:h-[305px] opacity-100 w-full rounded-none">
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">
        Attendance History
      </h2>

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
        <p className="text-gray-500 text-sm">Loading attendance history...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-6 justify-between">
            <div className="flex items-center lg:flex-wrap gap-4">
              <div className="filter-item flex flex-col md:flex-wrap items-start w-full sm:w-auto">
                <label className="text-base text-white font-semibold mb-2">Employee Name</label>
                <input
                  type="text"
                  placeholder="Search employee name"
                  value={selectedEmployeeName}
                  onChange={(e) => setSelectedEmployeeName(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px] h-[40px] cursor-pointer"
                />
              </div>

              <div className="filter-item flex flex-col items-start w-full sm:w-auto">
                <label className="text-base text-white font-semibold mb-2">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px] h-[40px] cursor-pointer"
                />
              </div>

              <div className="filter-item flex flex-col items-start w-full sm:w-auto ">
                <label className="text-base text-white font-semibold mb-2">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[190px] h-[40px] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center mt-8">
              <ExportButton
                data={filteredRecords.map((record) => ({
                  employeeName: record.employeeName,
                  actionDate: new Date(record.actionDate).toLocaleDateString('en-GB'),
                  actionName: record.actionName,
                  actionTime: new Date(record.actionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                }))}
                fileName="admin_attendance_history"
                columns={[
                  { header: "Employee Name", key: "employeeName" },
                  { header: "Date", key: "actionDate" },
                  { header: "Action Type", key: "actionName" },
                  { header: "Action Time", key: "actionTime" },
                ]}
              />
              
              {userRole === "Admin" && (
                <button 
                  onClick={() => setFormVisible(true)} 
                  className="bg-gray-800 text-white py-2 px-4 rounded-[15px] hover:bg-[#163450] transition duration-300 focus:outline-none flex items-center justify-center ml-2">
                  +
                </button>
              )}
            </div>
          </div>

          {formVisible && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">
                  {formAction === 'add' ? 'Add Fingerprint Record' : 'Edit Fingerprint Record'}
                </h3>
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="border w-full px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Action Name</label>
                    <select
                      value={actionName}
                      onChange={(e) => setActionName(e.target.value)}
                      required
                      className="border w-full px-2 py-1 text-sm"
                    >
                      <option value="">Select Action</option>
                      <option value="Check In">Check In</option>
                      <option value="Break In">Break In</option>
                      <option value="Break Out">Break Out</option>
                      <option value="Check Out">Check Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Action Date</label>
                    <input
                      type="datetime-local"
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      required
                      className="border w-full px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gray-800 text-white px-4 py-2 rounded"
                    >
                      {formAction === 'add' ? 'Add' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Table
            columns={[
              { key: "employeeName", header: "Employee Name" },
              { key: "actionDate", header: "Action Date" },
              { key: "actionName", header: "Action Type" },
              { key: "actionTime", header: "Action Time" },
              ...(userRole === "Admin" ? [{ key: "edit", header: "Edit" }] : []),
            ]}
            data={currentRecords.map((record) => ({
              employeeName: record.employeeName,
              actionDate: new Date(record.actionDate).toLocaleDateString('en-GB'),
              actionName: (
                <div className="flex items-center">
                  <div className={`w-3 h-3 mr-2 rounded-full ${actionColor[record.actionName]}`}></div>
                  {record.actionName}
                </div>
              ),
              actionTime: new Date(record.actionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
              ...(userRole === "Admin" ? {
                edit: (
                  <button onClick={() => handleEditClick(record)} className="text-blue-400">
                    Edit
                  </button>
                )
              } : {}),
            }))}
            isLoading={isLoading}
            noDataMessage="No attendance records available"
          />

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

export default AdminAttendance;

