// File: ../../component/DepartmentManagement/DepartmentManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

/**
 * DepartmentManagement Component
 *
 * Handles CRUD operations for Departments using fetch API and integrates Table and Pagination components.
 */
const DepartmentManagement = () => {
  // State variables
  const [departments, setDepartments] = useState([]); // Stores the list of departments
  const [newDepartmentName, setNewDepartmentName] = useState(''); // Stores the new department name input
  const [editingDepartment, setEditingDepartment] = useState(null); // Stores the department currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const departmentsPerPage = 10; // Number of departments per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/employee'; // Base API URL

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all departments from the backend.
   */
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/departments`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.Data || []); // Update departments state with fetched data
      } else {
        setError(data.error || 'Failed to fetch departments'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Error fetching departments'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Create a new department.
   */
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert('Department name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createDepartment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ departmentName: newDepartmentName }),
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments([...departments, data.Data]); // Append the new department to the list
        setNewDepartmentName(''); // Clear the input field
      } else {
        setError(data.error || 'Failed to create department');
      }
    } catch (err) {
      console.error('Error creating department:', err);
      setError('Error creating department');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing department.
   *
   * @param {number} departmentID - ID of the department to delete.
   */
  const handleDeleteDepartment = async (departmentID) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/deleteDepartment/${departmentID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(departments.filter((dept) => dept.departmentID !== departmentID)); // Remove the deleted department from the list
      } else {
        setError(data.error || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Error deleting department');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a department.
   *
   * @param {Object} dept - Department object to edit.
   */
  const handleEditDepartment = (dept) => {
    setEditingDepartment({ ...dept }); // Set the department to be edited
  };

  /**
   * Handle input change for editing department name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingDepartment({
      ...editingDepartment,
      departmentName: e.target.value,
    });
  };

  /**
   * Update an existing department.
   */
  const handleUpdateDepartment = async () => {
    if (!editingDepartment.departmentName.trim()) {
      alert('Department name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createDepartment`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          departmentID: editingDepartment.departmentID,
          departmentName: editingDepartment.departmentName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(
          departments.map((dept) =>
            dept.departmentID === editingDepartment.departmentID ? editingDepartment : dept
          )
        ); // Update the specific department in the list
        setEditingDepartment(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update department');
      }
    } catch (err) {
      console.error('Error updating department:', err);
      setError('Error updating department');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(departments.length / departmentsPerPage);
  const indexOfLastDepartment = currentPage * departmentsPerPage;
  const indexOfFirstDepartment = indexOfLastDepartment - departmentsPerPage;
  const currentDepartments = departments.slice(indexOfFirstDepartment, indexOfLastDepartment);

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
    { key: "departmentID", header: "Department #" },
    { key: "departmentName", header: "Department Name" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `departmentName` and `actions`
  const tableData = currentDepartments.map((dept) => ({
    ...dept,
    departmentName:
      editingDepartment && editingDepartment.departmentID === dept.departmentID ? (
        <input
          type="text"
          value={editingDepartment.departmentName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        dept.departmentName
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingDepartment && editingDepartment.departmentID === dept.departmentID ? (
          <>
            <button
              onClick={handleUpdateDepartment}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              title="Save"
            >
              <FaSave className="mr-1" /> Save
            </button>
            <button
              onClick={() => setEditingDepartment(null)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Cancel"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEditDepartment(dept)}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Edit"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
            <button
              onClick={() => handleDeleteDepartment(dept.departmentID)}
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Department Management</h2>

      {/* Create Department Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Department</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Department Name"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full max-w-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleCreateDepartment}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 shadow-md"
          >
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Department Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No departments available."
        handleRowClick={() => {}} // Optional: Define if needed
      />

      {/* Pagination */}
      {departments.length > departmentsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default DepartmentManagement;
