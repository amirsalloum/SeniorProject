// File: ../../component/BranchManagement/BranchManagement.js

import React, { useState, useEffect } from 'react';
import Pagination from "../../component/Pagination/Pagination";
import Table from "../../component/Table/Table"; // Ensure this path is correct
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from 'react-icons/fa';

/**
 * BranchManagement Component
 *
 * Handles CRUD operations for Branches using fetch API and integrates Table and Pagination components.
 */
const BranchManagement = () => {
  // State variables
  const [branches, setBranches] = useState([]); // Stores the list of branches
  const [newBranchName, setNewBranchName] = useState(''); // Stores the new branch name input
  const [editingBranch, setEditingBranch] = useState(null); // Stores the branch currently being edited
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded or an operation is in progress
  const [error, setError] = useState(null); // Stores error messages

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // Current active page
  const branchesPerPage = 10; // Number of branches per page

  // API configuration
  const token = localStorage.getItem('authToken'); // Retrieve the auth token from localStorage
  const API_URL = 'http://localhost:3001/api/employee'; // Base API URL

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch all branches from the backend.
   */
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the auth token in headers
        },
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(data.Data || []); // Update branches state with fetched data
      } else {
        setError(data.error || 'Failed to fetch branches'); // Set error message from response
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Error fetching branches'); // Set generic error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Create a new branch.
   */
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      setError('Branch name cannot be empty'); // Set custom error message
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createBranch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brancheName: newBranchName }),
      });
      const data = await response.json();
      if (response.ok) {
        setBranches([...branches, data.Data]); // Append the new branch to the list
        setNewBranchName(''); // Clear the input field
      } else {
        setError(data.error || 'Failed to create branch');
      }
    } catch (err) {
      console.error('Error creating branch:', err);
      setError('Error creating branch');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an existing branch.
   *
   * @param {number} brancheID - ID of the branch to delete.
   */
  const handleDeleteBranch = async (brancheID) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/deleteBranch/${brancheID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(branches.filter((branch) => branch.brancheID !== brancheID)); // Remove the deleted branch from the list
      } else {
        setError(data.error || 'Failed to delete branch');
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError('Error deleting branch');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable editing mode for a branch.
   *
   * @param {Object} branch - Branch object to edit.
   */
  const handleEditBranch = (branch) => {
    setEditingBranch({ ...branch }); // Set the branch to be edited
  };

  /**
   * Handle input change for editing branch name.
   *
   * @param {Object} e - Event object.
   */
  const handleEditInputChange = (e) => {
    setEditingBranch({
      ...editingBranch,
      brancheName: e.target.value,
    });
  };

  /**
   * Update an existing branch.
   */
  const handleUpdateBranch = async () => {
    if (!editingBranch.brancheName.trim()) {
      setError('Branch name cannot be empty'); // Set custom error message
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/createBranch`, { // Using POST for both create and update
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brancheID: editingBranch.brancheID,
          brancheName: editingBranch.brancheName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(
          branches.map((branch) =>
            branch.brancheID === editingBranch.brancheID ? editingBranch : branch
          )
        ); // Update the specific branch in the list
        setEditingBranch(null); // Exit editing mode
      } else {
        setError(data.error || 'Failed to update branch');
      }
    } catch (err) {
      console.error('Error updating branch:', err);
      setError('Error updating branch');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(branches.length / branchesPerPage);
  const indexOfLastBranch = currentPage * branchesPerPage;
  const indexOfFirstBranch = indexOfLastBranch - branchesPerPage;
  const currentBranches = branches.slice(indexOfFirstBranch, indexOfLastBranch);

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
    { key: "brancheID", header: "Branch #" },
    { key: "brancheName", header: "Branch Name" },
    { key: "actions", header: "Actions" },
  ];

  // Map data to include JSX for `brancheName` and `actions`
  const tableData = currentBranches.map((branch) => ({
    ...branch,
    brancheName:
      editingBranch && editingBranch.brancheID === branch.brancheID ? (
        <input
          type="text"
          value={editingBranch.brancheName}
          onChange={handleEditInputChange}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-xs shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      ) : (
        branch.brancheName
      ),
    actions: (
      <div className="flex justify-center space-x-2">
        {editingBranch && editingBranch.brancheID === branch.brancheID ? (
          <>
                    <FaSave
                      className="text-lg text-[#1f4061] cursor-pointer"
                      onClick={handleUpdateBranch}
                    />
                    <FaTimes
                      className="text-lg text-[#1f4061] cursor-pointer"
                      onClick={() =>
                        setEditingBranch(null)
                      }
                    />
          </>
        ) : (
          <>

                      <FaEdit
                        className="text-lg text-[#1f4061] cursor-pointer"
                        onClick={() =>
                          handleEditBranch(branch)
                        }
                      />
                      <FaTrash
                        className="text-lg text-red-600 cursor-pointer"
                        onClick={() =>
                          handleDeleteBranch(branch.brancheID)
                        }
                      />
          </>
        )}
      </div>
    ),
  }));

  return (
    <div className="bg-white rounded-[15px] p-6  mb-4 shadow-md
    ">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Branch Management</h2>

      {/* Create Branch Section */}
      <div className="mb-6 ">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Create New Branch</h3>
        <div className="flex items-center space-x-4 ">
            <input
            type="text"
            placeholder="Branch Name"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="p-2 bg-white rounded-[15px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full xs:w-[200px] h-[35px] xs:h-[40px]"
            />
          <div className="flex justify-end "> {/* Aligns button to the right */}
            <button
              onClick={handleCreateBranch}
              className="bg-gray-800 text-white py-2 px-4 rounded-[15px] hover:bg-[#163450] transition duration-300 focus:outline-none flex items-center justify-center"
            >
            <span className="text-yellow-500 mr-1 text-base font-bold "><FaPlus className="mr-1" /></span> Create
            </button>
          </div>
        </div>
      </div>
      {/* Error Message */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Branch Table */}
      <div className="p-6 bg-white rounded-xl border border-gray-300 mb-4">
        
      <Table
        columns={columns}
        data={tableData}
        isLoading={loading}
        noDataMessage="No branches available."
        handleRowClick={() => {}} // Optional: Define if needed
        className="border border-gray-300" // Table border
        cellClass="border border-gray-200" // Cell borders
      />
      </div>
      {/* Pagination */}
      {branches.length > branchesPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default BranchManagement;
