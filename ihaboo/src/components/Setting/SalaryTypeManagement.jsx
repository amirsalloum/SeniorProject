// File: ../../component/SalaryTypeManagement/SalaryTypeManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

/**
 * SalaryTypeManagement Component
 *
 * Handles CRUD operations for Salary Types using fetch API and integrates Table and Pagination components.
 */
const SalaryTypeManagement = () => {
  // State variables
  const [salaryTypes, setSalaryTypes] = useState([]); // Stores the list of salary types
  const [newSalaryTypeName, setNewSalaryTypeName] = useState(''); // Stores the new salary type name input
  const [editingSalaryType, setEditingSalaryType] = useState(null); // Stores the salary type currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const salaryTypesPerPage = 10; // Number of salary types per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/employee'; // Base API URL

  // Fetch salary types on component mount
  useEffect(() => {
    fetchSalaryTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all salary types from the backend.
   */
  const fetchSalaryTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/salary-types`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSalaryTypes(data.Data || []); // Update salaryTypes state with fetched data
      } else {
        setError(data.error || 'Failed to fetch salary types'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching salary types:', err);
      setError('Error fetching salary types'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Create a new salary type.
   */
  const handleCreateSalaryType = async () => {
    if (!newSalaryTypeName.trim()) {
      alert('Salary Type name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createSalaryType`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ salaryTypeName: newSalaryTypeName }),
      });
      const data = await response.json();
      if (response.ok) {
        setSalaryTypes([...salaryTypes, data.Data]); // Append the new salary type to the list
        setNewSalaryTypeName(''); // Clear the input field
      } else {
        setError(data.error || 'Failed to create salary type');
      }
    } catch (err) {
      console.error('Error creating salary type:', err);
      setError('Error creating salary type');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing salary type.
   *
   * @param {number} salaryTypeID - ID of the salary type to delete.
   */
  const handleDeleteSalaryType = async (salaryTypeID) => {
    if (!window.confirm('Are you sure you want to delete this salary type?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/deleteSalaryType/${salaryTypeID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSalaryTypes(salaryTypes.filter((st) => st.salaryTypeID !== salaryTypeID)); // Remove the deleted salary type from the list
      } else {
        setError(data.error || 'Failed to delete salary type');
      }
    } catch (err) {
      console.error('Error deleting salary type:', err);
      setError('Error deleting salary type');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a salary type.
   *
   * @param {Object} st - Salary Type object to edit.
   */
  const handleEditSalaryType = (st) => {
    setEditingSalaryType({ ...st }); // Set the salary type to be edited
  };

  /**
   * Handle input change for editing salary type name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingSalaryType({
      ...editingSalaryType,
      salaryTypeName: e.target.value,
    });
  };

  /**
   * Update an existing salary type.
   */
  const handleUpdateSalaryType = async () => {
    if (!editingSalaryType.salaryTypeName.trim()) {
      alert('Salary Type name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createSalaryType`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salaryTypeID: editingSalaryType.salaryTypeID,
          salaryTypeName: editingSalaryType.salaryTypeName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSalaryTypes(
          salaryTypes.map((st) =>
            st.salaryTypeID === editingSalaryType.salaryTypeID ? editingSalaryType : st
          )
        ); // Update the specific salary type in the list
        setEditingSalaryType(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update salary type');
      }
    } catch (err) {
      console.error('Error updating salary type:', err);
      setError('Error updating salary type');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(salaryTypes.length / salaryTypesPerPage);
  const indexOfLastSalaryType = currentPage * salaryTypesPerPage;
  const indexOfFirstSalaryType = indexOfLastSalaryType - salaryTypesPerPage;
  const currentSalaryTypes = salaryTypes.slice(indexOfFirstSalaryType, indexOfLastSalaryType);

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
    { key: "salaryTypeID", header: "Salary Type #" },
    { key: "salaryTypeName", header: "Salary Type Name" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `salaryTypeName` and `actions`
  const tableData = currentSalaryTypes.map((st) => ({
    ...st,
    salaryTypeName:
      editingSalaryType && editingSalaryType.salaryTypeID === st.salaryTypeID ? (
        <input
          type="text"
          value={editingSalaryType.salaryTypeName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        st.salaryTypeName
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingSalaryType && editingSalaryType.salaryTypeID === st.salaryTypeID ? (
          <>
            <button
              onClick={handleUpdateSalaryType}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              title="Save"
            >
              <FaSave className="mr-1" /> Save
            </button>
            <button
              onClick={() => setEditingSalaryType(null)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Cancel"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEditSalaryType(st)}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Edit"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
            <button
              onClick={() => handleDeleteSalaryType(st.salaryTypeID)}
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Salary Type Management</h2>

      {/* Create Salary Type Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Salary Type</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Salary Type Name"
            value={newSalaryTypeName}
            onChange={(e) => setNewSalaryTypeName(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full max-w-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleCreateSalaryType}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 shadow-md w-full max-w-xs md:w-auto"
          >
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Salary Type Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No salary types available."
        handleRowClick={() => {}} // Optional: Define if needed
      />

      {/* Pagination */}
      {salaryTypes.length > salaryTypesPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default SalaryTypeManagement;
