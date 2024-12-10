// File: ../../component/StatusManagement/StatusManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

/**
 * StatusManagement Component
 *
 * Handles CRUD operations for Statuses using fetch API and integrates Table and Pagination components.
 */
const StatusManagement = () => {
  // State variables
  const [statuses, setStatuses] = useState([]); // Stores the list of statuses
  const [newStatusName, setNewStatusName] = useState(''); // Stores the new status name input
  const [editingStatus, setEditingStatus] = useState(null); // Stores the status currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const statusesPerPage = 10; // Number of statuses per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/user'; // Base API URL

  // Fetch statuses on component mount
  useEffect(() => {
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all statuses from the backend.
   */
  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/statuses`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStatuses(data.Data || []); // Update statuses state with fetched data
      } else {
        setError(data.error || 'Failed to fetch statuses'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setError('Error fetching statuses'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Create a new status.
   */
  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      alert('Status name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusName: newStatusName }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatuses([...statuses, data.Data]); // Append the new status to the list
        setNewStatusName(''); // Clear the input field
      } else {
        setError(data.error || 'Failed to create status');
      }
    } catch (err) {
      console.error('Error creating status:', err);
      setError('Error creating status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing status.
   *
   * @param {number} statusID - ID of the status to delete.
   */
  const handleDeleteStatus = async (statusID) => {
    if (!window.confirm('Are you sure you want to delete this status?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/delete-status/${statusID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStatuses(statuses.filter((st) => st.statusID !== statusID)); // Remove the deleted status from the list
      } else {
        setError(data.error || 'Failed to delete status');
      }
    } catch (err) {
      console.error('Error deleting status:', err);
      setError('Error deleting status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a status.
   *
   * @param {Object} st - Status object to edit.
   */
  const handleEditStatus = (st) => {
    setEditingStatus({ ...st }); // Set the status to be edited
  };

  /**
   * Handle input change for editing status name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingStatus({
      ...editingStatus,
      statusName: e.target.value,
    });
  };

  /**
   * Update an existing status.
   */
  const handleUpdateStatus = async () => {
    if (!editingStatus.statusName.trim()) {
      alert('Status name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-status`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          statusID: editingStatus.statusID,
          statusName: editingStatus.statusName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatuses(
          statuses.map((st) =>
            st.statusID === editingStatus.statusID ? editingStatus : st
          )
        ); // Update the specific status in the list
        setEditingStatus(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(statuses.length / statusesPerPage);
  const indexOfLastStatus = currentPage * statusesPerPage;
  const indexOfFirstStatus = indexOfLastStatus - statusesPerPage;
  const currentStatuses = statuses.slice(indexOfFirstStatus, indexOfLastStatus);

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
    { key: "statusID", header: "Status #" },
    { key: "statusName", header: "Status Name" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `statusName` and `actions`
  const tableData = currentStatuses.map((st) => ({
    ...st,
    statusName:
      editingStatus && editingStatus.statusID === st.statusID ? (
        <input
          type="text"
          value={editingStatus.statusName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        st.status
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingStatus && editingStatus.statusID === st.statusID ? (
          <>
            <button
              onClick={handleUpdateStatus}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              title="Save"
            >
              <FaSave className="mr-1" /> Save
            </button>
            <button
              onClick={() => setEditingStatus(null)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Cancel"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEditStatus(st)}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Edit"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
            <button
              onClick={() => handleDeleteStatus(st.statusID)}
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              title="Delete"
            >
              <FaTrash className="mr-1" /> Delete
            </button>
          </>
        )}
      </div>
    ),
  }));

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-300">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Status Management</h2>

      {/* Create Status Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Status</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Status Name"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full max-w-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleCreateStatus}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 shadow-md w-full max-w-xs md:w-auto"
          >
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Status Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No statuses available."
        handleRowClick={() => {}} // Optional: Define if needed
      />

      {/* Pagination */}
      {statuses.length > statusesPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default StatusManagement;
