import React, { useState, useEffect } from "react";
import { useAuthFetch } from "../../Authentication/useAuthContext";
import Table from "../../component/Table/Table";
import Pagination from "../../component/Pagination/Pagination";
import ExportButton from "../../component/ExportButton/ExportButton";
import Spinner from "../../component/Spinner";

// Helper function to format date in 'YYYY-MM-DD' format
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-GB'); // 'en-GB' for day/month/year format
};

// Helper function to format time to 'HH:MM' in 24-hour format
const formatTime = (timeString) => {
  if (!timeString) return '';

  // Parse the time string as UTC
  const date = new Date(`1970-01-01T${timeString}Z`); // 'Z' ensures UTC interpretation

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return '';
  }

  // Get the user's locale and time zone
  const userLocale = navigator.language || 'en-US'; // Default to 'en-US' if undefined
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Automatically detect time zone

  // Return the formatted time in the user's local time zone
  return date.toLocaleTimeString(userLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: userTimeZone, // Use the user's detected time zone
  });
};

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const recordsPerPage = 7;

  const { customFetch } = useAuthFetch();

  // Fetch Payroll Data
  const fetchPayrollData = async () => {
    try {
      const response = await customFetch(
        "http://localhost:3001/api/payroll/getPayrollRecords", // Replace with actual backend endpoint
        { method: "GET" }
      );

      if (response?.Status === "Success" && Array.isArray(response.Payroll)) {
        setPayrollData(response.Payroll);
        setError(null);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      setError(error.message || "Failed to load payroll data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  // Filter the data based on selected week range
  const filteredData = selectedWeek
    ? payrollData.filter(
        (week) =>
          week.weekStart === selectedWeek || week.weekEnd === selectedWeek
      )
    : payrollData;

  // Sort the data to display days from earliest to latest
  const sortedData = filteredData.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  // Flatten payroll data into a single array of dailyDetails
  const flattenedDailyDetails = sortedData.flatMap((week) => {
    return week.dailyDetails.map((day) => ({
      ...day,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
    }));
  });

  const currentRecords = flattenedDailyDetails.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(flattenedDailyDetails.length / recordsPerPage));

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
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg h-[550px] md:h-[360px] xl:h-[305px] opacity-100 w-full rounded-none">
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">Payroll</h2>

      {/* Filter Section: Week */}
      <div className="flex justify-between mb-6">
        <div className="flex flex-col xs:flex-row gap-4">
          {/* Week Filter */}
          <div className="flex flex-col">
            <label className="text-base text-white font-semibold mb-2">Select Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full xs:w-[200px] h-[35px] xs:h-[40px] cursor-pointer"
            >
              <option value="">All Weeks</option>
              {payrollData.map((week) => (
                <option key={week.weekStart} value={week.weekStart}>
                  {`${week.weekStart} - ${week.weekEnd}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center items-center w-full h-[300px]">
          <Spinner loading={isLoading} size={60} />
        </div>
      ) : (
        <>
          {/* Export Section */}
          <div className="flex justify-end mb-6">
            <ExportButton
              data={flattenedDailyDetails.map((record) => ({
                day: formatDate(record.day),
                start: formatTime(record.start) || "N/A",
                finish: formatTime(record.finish) || "N/A",
                breakAmount: record.breakAmount,
                totalWorkedHours: record.totalWorkedHours,
                baseSalary: record.baseSalary,
              }))}
              fileName="weekly_payroll"
              columns={[
                { header: "Day", key: "day" },
                { header: "Start", key: "start" },
                { header: "Finish", key: "finish" },
                { header: "Break Hours", key: "breakAmount" },
                { header: "Total Worked Hours", key: "totalWorkedHours" },
                { header: "Base Salary", key: "baseSalary" },
              ]}
            />
          </div>

          {/* Display Total Amount and Bonus separately */}
          <div className="flex justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Total Amount:</h3>
              <p className="text-white">{filteredData[0]?.totalAmount || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Bonus:</h3>
              <p className="text-white">{filteredData[0]?.bonus || "N/A"}</p>
            </div>
          </div>

          {/* Table Section: Daily Details */}
          <div>
            <Table
              columns={[
                { key: "day", header: "Day" },
                { key: "start", header: "Start" },
                { key: "finish", header: "Finish" },
                { key: "breakAmount", header: "Break Hours" },
                { key: "totalWorkedHours", header: "Worked Hours" },
                { key: "baseSalary", header: "Base Salary" },
              ]}
              data={currentRecords.map((record) => ({
                ...record,
                start: formatTime(record.start) || "N/A",
                finish: formatTime(record.finish) || "N/A",
                day: formatDate(record.day),
              }))}
              isLoading={isLoading}
              noDataMessage="No payroll data available"
            />
          </div>

          {/* Pagination Section */}
          {flattenedDailyDetails.length > recordsPerPage && (
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

export default Payroll;
