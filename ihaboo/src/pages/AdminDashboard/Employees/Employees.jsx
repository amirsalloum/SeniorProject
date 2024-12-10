import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Table from "../../../component/Table/Table";
import Pagination from "../../../component/Pagination/Pagination";
import ExportButton from "../../../component/ExportButton/ExportButton";
import { FaEdit, FaInfoCircle, FaPlus } from "react-icons/fa";
import { FaToggleOn, FaToggleOff } from "react-icons/fa"; 
import { getUserRole } from "../../../utils/getUserRole";
import Spinner from "../../../component/Spinner";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRange, setPageRange] = useState([1, 2, 3]);
  const recordsPerPage = 10;
  const navigate = useNavigate();

  const userRole = getUserRole();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        let apiUrl = "http://localhost:3001/api/employee/all-employees";

        if (userRole === "Supervisor") {
          apiUrl = "http://localhost:3001/api/employee/supervisor-employees";
        }

        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.Data) {
          setEmployees(response.data.Data);
        } else {
          throw new Error("No employee data found");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setError(error.message || "Error fetching employee data");
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [userRole]);

  const filterRecords = (records) => {
    return records.filter((employee) => {
      const matchesEmployeeName = employeeName
        ? employee.fullName.toLowerCase().includes(employeeName.toLowerCase())
        : true;

      const matchesDepartment = department
        ? employee.department === department
        : true;

      const matchesStatus = statusFilter
        ? employee.status.toLowerCase() === statusFilter.toLowerCase()
        : true;

      return matchesEmployeeName && matchesDepartment && matchesStatus;
    });
  };

  const filteredEmployees = filterRecords(employees);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredEmployees.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / recordsPerPage)
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

  const handleAddEmployee = () => {
    navigate("/add-employee");
  };

  const handleViewEmployeeDashboard = (employeeID) => {
    navigate(`/${employeeID}`, { state: { fromEmployeesPage: true } });
  };
  
  const handleEditEmployee = (employeeID) => {
    navigate(`/edit-employee/${employeeID}`);
  };

  // Map the string status to a numeric statusID
  const getStatusID = (status) => {
    return status === "Active" ? 1 : 2;
  };

  // Function to toggle employee status with confirmation
  const handleToggleEmployeeStatus = async (employeeID, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const confirmMessage = `Are you sure you want to change the employee’s status to ${newStatus}?`;
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return; // If the user cancels, do nothing

    try {
      const token = localStorage.getItem("authToken");
      const newStatusID = getStatusID(newStatus);

      const response = await axios.put(
        `http://localhost:3001/api/user/updateStatus/${employeeID}`,
        { statusID: newStatusID },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setEmployees((prevEmployees) =>
          prevEmployees.map((emp) =>
            emp.employeeID === employeeID ? { ...emp, status: newStatus } : emp
          )
        );
      } else {
        throw new Error("Failed to update employee status.");
      }
    } catch (error) {
      console.error("Error updating employee status:", error);
      alert("An error occurred while updating the employee status.");
    }
  };

  return (
    <div className="relative p-5 bg-gradient-to-r from-[#1f4061] to-[#92afcf] shadow-lg h-[305px] opacity-100 w-full rounded-none">
      <h2 className="text-2xl text-white mb-5 font-bold tracking-wide font-inter w-full">
        Employees
      </h2>

      {/* Filter Section */}
      <div className="flex flex-col xs:flex-row xs:items-end mb-4">
        <div className="grid grid-cols-1 gap-4 xs:flex xs:space-x-4">
          {/* Employee Name Filter */}
          <div className="flex flex-col">
            <label className="text-base text-white font-semibold mb-2">
              Employee Name
            </label>
            <input
              type="text"
              placeholder="Employee Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full xs:w-[200px] h-[35px] xs:h-[40px]"
            />
          </div>

          {/* Department Filter */}
          <div className="flex flex-col">
            <label className="text-base text-white font-semibold mb-2">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full xs:w-[200px] h-[35px] xs:h-[40px] cursor-pointer"
            >
              <option value="">All</option>
              <option value="IT">IT</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-base text-white font-semibold mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-white rounded-[8px] text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full xs:w-[200px] h-[35px] xs:h-[40px] cursor-pointer"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Export and Add Employee Buttons */}
        <div className="mt-7 xs:mt-0 xs:ml-auto flex gap-2">
          {userRole === "Admin" && (
            <button
              className="bg-gray-800 text-white rounded-[15px] px-4 py-2 hover:bg-[#163450] transition duration-300 flex items-center"
              onClick={handleAddEmployee}
            >
              <FaPlus className="mr-2" /> Employee
            </button>
          )}

          <ExportButton
            data={filteredEmployees.map((employee) => ({
              fullName: employee.fullName,
              username: employee.username,
              phone: employee.phone,
              email: employee.email,
              department: employee.department,
              role: employee.role,
              status: employee.status,
              reportTo: employee.reportTo,
              addedBy: employee.addedBy,
            }))}
            fileName="employee_management"
            columns={[
              { header: "Full Name", key: "fullName" },
              { header: "Username", key: "username" },
              { header: "Phone", key: "phone" },
              { header: "Email", key: "email" },
              { header: "Department", key: "department" },
              { header: "Role", key: "role" },
              { header: "Status", key: "status" },
              { header: "Report To", key: "reportTo" },
              { header: "Added By", key: "addedBy" },
            ]}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* Table Section */}
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-[300px]">
          <Spinner loading={isLoading} size={60} />
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-300 bg-white">
            <Table
              columns={[
                { key: "fullName", header: "Full Name" },
                { key: "username", header: "Username" },
                { key: "phone", header: "Phone" },
                { key: "department", header: "Department" },
                { key: "role", header: "Role" },
                //{ key: "addedBy", header: "Added By" },
                { key: "status", header: "Status" },
                { key: "actions", header: "Actions" },
              ]}
              data={currentRecords.map((employee) => ({
                ...employee,
                status: (
                  <>
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        employee.status === "Active"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    ></span>
                    {employee.status}
                  </>
                ),
                actions: (
                  <div className="flex gap-5">
                    <FaInfoCircle
                      className="text-lg text-[#1f4061] cursor-pointer"
                      onClick={() =>
                        handleViewEmployeeDashboard(employee.employeeID)
                      }
                    />
                    {userRole === "Admin" && (
                      <FaEdit
                        className="text-lg text-[#1f4061] cursor-pointer"
                        onClick={() => handleEditEmployee(employee.employeeID)}
                      />
                    )}
                    {userRole === "Admin" && (
                      employee.status === "Active" ? (
                        <FaToggleOn
                          className="text-lg text-green-600 cursor-pointer"
                          onClick={() =>
                            handleToggleEmployeeStatus(
                              employee.employeeID,
                              employee.status
                            )
                          }
                        />
                      ) : (
                        <FaToggleOff
                          className="text-lg text-gray-500 cursor-pointer"
                          onClick={() =>
                            handleToggleEmployeeStatus(
                              employee.employeeID,
                              employee.status
                            )
                          }
                        />
                      )
                    )}
                  </div>
                ),
              }))}
              isLoading={isLoading}
              noDataMessage="No employees available"
              handleRowClick={() => {}}
            />
          </div>

          {/* Pagination */}
          {filteredEmployees.length > recordsPerPage && (
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

export default EmployeeManagement;
