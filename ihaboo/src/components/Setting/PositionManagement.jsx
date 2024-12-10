// File: ../../component/PositionManagement/PositionManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

/**
 * PositionManagement Component
 *
 * Handles CRUD operations for Positions using fetch API and integrates Table and Pagination components.
 */
const PositionManagement = () => {
  // State variables
  const [positions, setPositions] = useState([]); // Stores the list of positions
  const [roles, setRoles] = useState([]); // Stores the list of roles
  const [newPositionName, setNewPositionName] = useState(''); // Stores the new position name input
  const [newRoleID, setNewRoleID] = useState(''); // Stores the new role ID input
  const [editingPosition, setEditingPosition] = useState(null); // Stores the position currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const positionsPerPage = 10; // Number of positions per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/employee'; // Base API URL

  // Fetch positions and roles on component mount
  useEffect(() => {
    fetchPositions();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all positions from the backend.
   */
  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/positions`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPositions(data.Data || []); // Update positions state with fetched data
      } else {
        setError(data.error || 'Failed to fetch positions'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Error fetching positions'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Fetch all roles from the backend.
   */
  const fetchRoles = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/roles`, { // Corrected the endpoint
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(data.Data || []); // Update roles state with fetched data
      } else {
        setError(data.error || 'Failed to fetch roles'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Error fetching roles'); // Set generic error message
    }
  };

  /**
   * Create a new position.
   */
  const handleCreatePosition = async () => {
    if (!newPositionName.trim() || !newRoleID) {
      alert('Position name and role must be provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createPosition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ positionName: newPositionName, roleID: newRoleID }),
      });
      const data = await response.json();
      if (response.ok) {
        setPositions([...positions, data.Data]); // Append the new position to the list
        setNewPositionName(''); // Clear the input field
        setNewRoleID(''); // Clear the role select
      } else {
        setError(data.error || 'Failed to create position');
      }
    } catch (err) {
      console.error('Error creating position:', err);
      setError('Error creating position');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing position.
   *
   * @param {number} positionID - ID of the position to delete.
   */
  const handleDeletePosition = async (positionID) => {
    if (!window.confirm('Are you sure you want to delete this position?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/deletePosition/${positionID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPositions(positions.filter((pos) => pos.positionID !== positionID)); // Remove the deleted position from the list
      } else {
        setError(data.error || 'Failed to delete position');
      }
    } catch (err) {
      console.error('Error deleting position:', err);
      setError('Error deleting position');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a position.
   *
   * @param {Object} pos - Position object to edit.
   */
  const handleEditPosition = (pos) => {
    setEditingPosition({ ...pos }); // Set the position to be edited
  };

  /**
   * Handle input change for editing position name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingPosition({
      ...editingPosition,
      positionName: e.target.value,
    });
  };

  /**
   * Handle select change for editing role ID.
   *
   * @param {Object} e - Event object.
   */
  const handleEditRoleChange = (e) => {
    setEditingPosition({
      ...editingPosition,
      roleID: e.target.value,
    });
  };

  /**
   * Update an existing position.
   */
  const handleUpdatePosition = async () => {
    if (!editingPosition.positionName.trim() || !editingPosition.roleID) {
      alert('Position name and role must be provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createPosition`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          positionID: editingPosition.positionID,
          positionName: editingPosition.positionName,
          roleID: editingPosition.roleID,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPositions(
          positions.map((pos) =>
            pos.positionID === editingPosition.positionID ? editingPosition : pos
          )
        ); // Update the specific position in the list
        setEditingPosition(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update position');
      }
    } catch (err) {
      console.error('Error updating position:', err);
      setError('Error updating position');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(positions.length / positionsPerPage);
  const indexOfLastPosition = currentPage * positionsPerPage;
  const indexOfFirstPosition = indexOfLastPosition - positionsPerPage;
  const currentPositions = positions.slice(indexOfFirstPosition, indexOfLastPosition);

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

  // Define columns for the Table component without "Status" and with a render function for "Actions"
  const columns = [
    { key: "positionID", header: "Position #" },
    { key: "positionName", header: "Position Name" },
    { key: "roleName", header: "Role Name" }, // Assuming roleName is part of position data
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `positionName`, `roleName`, and `actions`
  const tableData = currentPositions.map((pos) => ({
    ...pos,
    positionName:
      editingPosition && editingPosition.positionID === pos.positionID ? (
        <input
          type="text"
          value={editingPosition.positionName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        pos.positionName
      ),
    roleName:
      editingPosition && editingPosition.positionID === pos.positionID ? (
        <select
          value={editingPosition.roleID}
          onChange={handleEditRoleChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <option value="">Select Role</option>
          {roles.map((role) => (
            <option key={role.roleID} value={role.roleID}>
              {role.roleName}
            </option>
          ))}
        </select>
      ) : (
        pos.roleName // Assuming the API includes roleName in the position data
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingPosition && editingPosition.positionID === pos.positionID ? (
          <>
            <button
              onClick={handleUpdatePosition}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              title="Save"
            >
              <FaSave className="mr-1" /> Save
            </button>
            <button
              onClick={() => setEditingPosition(null)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Cancel"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEditPosition(pos)}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Edit"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
            <button
              onClick={() => handleDeletePosition(pos.positionID)}
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Position Management</h2>

      {/* Create Position Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Position</h3>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <input
            type="text"
            placeholder="Position Name"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <select
            value={newRoleID}
            onChange={(e) => setNewRoleID(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.roleID} value={role.roleID}>
                {role.roleName}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreatePosition}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 shadow-md w-full md:w-auto"
          >
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Position Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No positions available."
        handleRowClick={() => {}} // Optional: Define if needed
      />

      {/* Pagination */}
      {positions.length > positionsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default PositionManagement;
