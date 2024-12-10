import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from 'react-icons/fa';

/**
 * HolidayManagement Component
 *
 * Handles CRUD operations for Holidays using fetch API and integrates Table and Pagination components.
 */
const HolidayManagement = () => {
  // State variables
  const [holidays, setHolidays] = useState([]); // Stores the list of holidays
  const [newHoliday, setNewHoliday] = useState({
    holidayName: '',
    startDate: '',
    endDate: '',
  }); // Stores the new holiday input
  const [editingHoliday, setEditingHoliday] = useState(null); // Stores the holiday currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const holidaysPerPage = 10; // Number of holidays per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/employee'; // Base API URL for holidays

  // Fetch holidays on component mount
  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all holidays from the backend.
   */
  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/holidays`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHolidays(data.Data || []); // Update holidays state with fetched data
      } else {
        setError(data.Message || 'Failed to fetch holidays'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError('Error fetching holidays'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Handle input change for creating a new holiday.
   *
   * @param {Object} e - Event object.
   */
  const handleNewHolidayChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday({ ...newHoliday, [name]: value });
  };

  /**
   * Create a new holiday.
   */
  const handleCreateHoliday = async () => {
    const { holidayName, startDate, endDate } = newHoliday;

    // Validate input
    if (!holidayName.trim() || !startDate || !endDate) {
      setError('Please provide Holiday Name, Start Date, and End Date');
      return;
    }

    // Ensure endDate is not before startDate
    if (new Date(endDate) < new Date(startDate)) {
      setError('End Date cannot be earlier than Start Date');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-holiday`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newHoliday),
      });
      const data = await response.json();
      if (response.ok) {
        // Append the new holiday to the list
        setHolidays([...holidays, data.Data]);
        // Reset the newHoliday state
        setNewHoliday({
          holidayName: '',
          startDate: '',
          endDate: '',
        });
      } else {
        setError(data.Message || 'Failed to create holiday');
      }
    } catch (err) {
      console.error('Error creating holiday:', err);
      setError('Error creating holiday');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing holiday.
   *
   * @param {number} holidayID - ID of the holiday to delete.
   */
  const handleDeleteHoliday = async (holidayID) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/deleteholiday/${holidayID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHolidays(holidays.filter((holiday) => holiday.holidayID !== holidayID)); // Remove the deleted holiday from the list
      } else {
        setError(data.Message || 'Failed to delete holiday');
      }
    } catch (err) {
      console.error('Error deleting holiday:', err);
      setError('Error deleting holiday');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a holiday.
   *
   * @param {Object} holiday - Holiday object to edit.
   */
  const handleEditHoliday = (holiday) => {
    setEditingHoliday({ ...holiday }); // Set the holiday to be edited
  };

  /**
   * Handle input change for editing holiday details.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingHoliday({
      ...editingHoliday,
      [name]: value,
    });
  };

  /**
   * Update an existing holiday.
   */
  const handleUpdateHoliday = async () => {
    const { holidayID, holidayName, startDate, endDate } = editingHoliday;

    // Validate input
    if (!holidayName.trim() || !startDate || !endDate) {
      setError('Please provide Holiday Name, Start Date, and End Date');
      return;
    }

    // Ensure endDate is not before startDate
    if (new Date(endDate) < new Date(startDate)) {
      setError('End Date cannot be earlier than Start Date');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-holiday`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          holidayID,
          holidayName,
          startDate,
          endDate,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setHolidays(
          holidays.map((holiday) =>
            holiday.holidayID === holidayID ? editingHoliday : holiday
          )
        ); // Update the specific holiday in the list
        setEditingHoliday(null); // Exit editing mode
      } else {
        setError(data.Message || 'Failed to update holiday');
      }
    } catch (err) {
      console.error('Error updating holiday:', err);
      setError('Error updating holiday');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(holidays.length / holidaysPerPage);
  const indexOfLastHoliday = currentPage * holidaysPerPage;
  const indexOfFirstHoliday = indexOfLastHoliday - holidaysPerPage;
  const currentHolidays = holidays.slice(indexOfFirstHoliday, indexOfLastHoliday);

  /**
   * Handle page change.
   *
   * @param {number} page - The page number to navigate to.
   */
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Define columns for the Table component
  const columns = [
    { key: "holidayID", header: "Holiday #" },
    { key: "holidayName", header: "Holiday Name" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `holidayName`, `startDate`, `endDate`, and `actions`
  const tableData = currentHolidays.map((holiday) => ({
    ...holiday,
    holidayName:
      editingHoliday && editingHoliday.holidayID === holiday.holidayID ? (
        <input
          type="text"
          name="holidayName"
          value={editingHoliday.holidayName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        holiday.holidayName
      ),
    startDate:
      editingHoliday && editingHoliday.holidayID === holiday.holidayID ? (
        <input
          type="date"
          name="startDate"
          value={editingHoliday.startDate}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        new Date(holiday.startDate).toLocaleDateString()
      ),
    endDate:
      editingHoliday && editingHoliday.holidayID === holiday.holidayID ? (
        <input
          type="date"
          name="endDate"
          value={editingHoliday.endDate}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        new Date(holiday.endDate).toLocaleDateString()
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingHoliday && editingHoliday.holidayID === holiday.holidayID ? (
          <>
            <FaSave
              className="text-lg text-[#1f4061] cursor-pointer"
              onClick={handleUpdateHoliday}
              title="Save"
            />
            <FaTimes
              className="text-lg text-[#1f4061] cursor-pointer"
              onClick={() => setEditingHoliday(null)}
              title="Cancel"
            />
          </>
        ) : (
          <>
            <FaEdit
              className="text-lg text-[#1f4061] cursor-pointer"
              onClick={() => handleEditHoliday(holiday)}
              title="Edit"
            />
            <FaTrash
              className="text-lg text-red-600 cursor-pointer"
              onClick={() => handleDeleteHoliday(holiday.holidayID)}
              title="Delete"
            />
          </>
        )}
      </div>
    ),
  }));

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-300">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Holiday Management</h2>

      {/* Create Holiday Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Holiday</h3>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            name="holidayName"
            placeholder="Holiday Name"
            value={newHoliday.holidayName}
            onChange={handleNewHolidayChange}
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto flex-1"
          />
          <input
            type="date"
            name="startDate"
            placeholder="Start Date"
            value={newHoliday.startDate}
            onChange={handleNewHolidayChange}
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          />
          <input
            type="date"
            name="endDate"
            placeholder="End Date"
            value={newHoliday.endDate}
            onChange={handleNewHolidayChange}
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          />
          <button
            onClick={handleCreateHoliday}
            className="bg-gray-800 text-white py-2 px-4 rounded-[15px] hover:bg-[#163450] transition duration-300 focus:outline-none flex items-center justify-center"
            disabled={loading}
          >
            <FaPlus className="mr-1" /> Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Holiday Table */}
      <div className="p-6 bg-white rounded-xl border border-gray-300 mb-4">
        <Table
          columns={columns}
          data={tableData}
          isLoading={loading}
          noDataMessage="No holidays available."
          handleRowClick={() => {}} // Optional: Define if needed
          className="border border-gray-300" // Table border
          cellClass="border border-gray-200" // Cell borders
        />
      </div>

      {/* Pagination */}
      {holidays.length > holidaysPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default HolidayManagement;






