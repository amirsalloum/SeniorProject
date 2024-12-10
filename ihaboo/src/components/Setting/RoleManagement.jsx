// File: ../../component/RoleManagement/RoleManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

/**
 * RoleManagement Component
 *
 * Handles CRUD operations for Roles using fetch API and integrates Table and Pagination components.
 */
const RoleManagement = () => {
  // State variables
  const [roles, setRoles] = useState([]); // Stores the list of roles
  const [newRoleName, setNewRoleName] = useState(''); // Stores the new role name input
  const [editingRole, setEditingRole] = useState(null); // Stores the role currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const rolesPerPage = 10; // Number of roles per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/user'; // Base API URL

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all roles from the backend.
   */
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/roles`, {
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
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Create a new role.
   */
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert('Role name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleName: newRoleName }),
      });
      const data = await response.json();
      if (response.ok) {
        setRoles([...roles, data.Data]); // Append the new role to the list
        setNewRoleName(''); // Clear the input field
      } else {
        setError(data.error || 'Failed to create role');
      }
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Error creating role');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing role.
   *
   * @param {number} roleID - ID of the role to delete.
   */
  const handleDeleteRole = async (roleID) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/delete-role/${roleID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(roles.filter((role) => role.roleID !== roleID)); // Remove the deleted role from the list
      } else {
        setError(data.error || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Error deleting role');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a role.
   *
   * @param {Object} role - Role object to edit.
   */
  const handleEditRole = (role) => {
    setEditingRole({ ...role }); // Set the role to be edited
  };

  /**
   * Handle input change for editing role name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingRole({
      ...editingRole,
      roleName: e.target.value,
    });
  };

  /**
   * Update an existing role.
   */
  const handleUpdateRole = async () => {
    if (!editingRole.roleName.trim()) {
      alert('Role name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-role`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleID: editingRole.roleID,
          roleName: editingRole.roleName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(
          roles.map((role) =>
            role.roleID === editingRole.roleID ? editingRole : role
          )
        ); // Update the specific role in the list
        setEditingRole(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(roles.length / rolesPerPage);
  const indexOfLastRole = currentPage * rolesPerPage;
  const indexOfFirstRole = indexOfLastRole - rolesPerPage;
  const currentRoles = roles.slice(indexOfFirstRole, indexOfLastRole);

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
    { key: "roleID", header: "Role #" },
    { key: "roleName", header: "Role Name" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `roleName` and `actions`
  const tableData = currentRoles.map((role) => ({
    ...role,
    roleName:
      editingRole && editingRole.roleID === role.roleID ? (
        <input
          type="text"
          value={editingRole.roleName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        role.roleName
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingRole && editingRole.roleID === role.roleID ? (
          <>
            <button
              onClick={handleUpdateRole}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              title="Save"
            >
              <FaSave className="mr-1" /> Save
            </button>
            <button
              onClick={() => setEditingRole(null)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Cancel"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleEditRole(role)}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Edit"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
            <button
              onClick={() => handleDeleteRole(role.roleID)}
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Role Management</h2>

      {/* Create Role Section */}
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Role</h3>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <input
            type="text"
            placeholder="Role Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleCreateRole}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 shadow-md w-full md:w-auto"
          >
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Role Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No roles available."
        handleRowClick={() => {}} // Optional: Define if needed
      />

      {/* Pagination */}
      {roles.length > rolesPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default RoleManagement;
