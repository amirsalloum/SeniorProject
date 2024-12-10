import React, { useState, useEffect } from "react";
import Spinner from "../../component/Spinner";

function AddEmploymentDetailsCard({ formData = {}, handleInputChange,  mode = "add" }) {
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryTypes, setSalaryTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRoleWarning, setShowRoleWarning] = useState(false); // To show message if no role is selected

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    let isMounted = true;

    const fetchEmploymentDetails = async () => {
      setIsLoading(true);
      try {
        const [
          positionsRes,
          departmentsRes,
          salaryTypesRes,
          contractTypesRes,
          branchesRes,
          employeesRes,
          statusesRes,
        ] = await Promise.all([
          fetch("http://localhost:3001/api/employee/positions", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/employee/departments", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/employee/salary-types", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/contracts/contract-types", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/employee/branches", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/employee/all-employees", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3001/api/user/statuses", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const [
          positionsData,
          departmentsData,
          salaryTypesData,
          contractTypesData,
          branchesData,
          employeesData,
          statusesData,
        ] = await Promise.all([
          positionsRes.json(),
          departmentsRes.json(),
          salaryTypesRes.json(),
          contractTypesRes.json(),
          branchesRes.json(),
          employeesRes.json(),
          statusesRes.json(),
        ]);

        if (isMounted) {
          setPositions(positionsData.Data || []);
          setDepartments(departmentsData.Data || []);
          setSalaryTypes(salaryTypesData.Data || []);
          setContractTypes(contractTypesData.Data || []);
          setBranches(branchesData.Data || []);
          setEmployees(employeesData.Data || []);
          setStatuses(statusesData.Data || []);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message || "Failed to load employment details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (token) {
      fetchEmploymentDetails();
    } else {
      setError("No authentication token found");
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (formData.roleID) {
      const filtered = positions.filter(
        (position) => position.roleID === parseInt(formData.roleID)
      );
      setFilteredPositions(filtered);
      setShowRoleWarning(false);
    } else if (formData.positionID) {
      // Only reset position when roleID becomes null and positionID is set
      setFilteredPositions([]);
      setShowRoleWarning(true);
      handleInputChange({ target: { name: "positionID", value: "" } });
    }
  }, [
    formData.roleID,
    positions,
    formData.positionID,
    handleInputChange,
  ]);

  return (
    <div className="flex flex-col bg-transparent w-full p-0 mb-4">
      <h2 className="text-[#424242] font-semibold mb-4 text-xl xs:text-2xl">
        Employment Details
      </h2>

      {isLoading && <Spinner />}
      {error && <p className="text-red-500 text-center my-2">{error}</p>}

      <div className="flex flex-col bg-transparent">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Position */}
          <div className="flex flex-col">
            <label htmlFor="positionID" className="text-sm mb-1 text-[#000000B3]">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              id="positionID"
              name="positionID"
              value={formData.positionID || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
              disabled={!formData.roleID} // Disable if no role is selected
            >
              <option value="" disabled>
                {showRoleWarning ? "Please select a role first" : "Select Position"}
              </option>
              {filteredPositions.map((position) => (
                <option key={position.positionID} value={position.positionID}>
                  {position.positionName}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label htmlFor="startDate" className="text-sm mb-1 text-[#000000B3]">
            Contract Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={formData.startDate || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
            />
          </div>

          {/* Contract Start Date */}
          <div className="flex flex-col">
            <label htmlFor="contractStartDate" className="text-sm mb-1 text-[#000000B3]">
              Contract Date <span className="text-red-500">*</span>
            </label>
            <input
              id="contractStartDate"
              type="date"
              name="contractStartDate"
              value={formData.contractStartDate || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
            />
          </div>

          {/* Contract End Date */}
          <div className="flex flex-col">
            <label htmlFor="contractEndDate" className="text-sm mb-1 text-[#000000B3]">
              Contract Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              id="contractEndDate"
              type="date"
              name="contractEndDate"
              value={formData.contractEndDate || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
            />
          </div>

          {/* Required Working Hours */}
          <div className="flex flex-col">
            <label htmlFor="requiredWorkingHours" className="text-sm mb-1 text-[#000000B3]">
              Required Working Hours <span className="text-red-500">*</span>
            </label>
            <input
              id="requiredWorkingHours"
              type="number"
              name="requiredWorkingHours"
              value={formData.requiredWorkingHours || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
              placeholder="Enter Required Working Hours"
              min="1"
              step="0.1"
            />
          </div>
          
          {/* Department */}
          <div className="flex flex-col">
            <label htmlFor="departmentID" className="text-sm mb-1 text-[#000000B3]">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="departmentID"
              name="departmentID"
              value={formData.departmentID || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.departmentID} value={dept.departmentID}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div className="flex flex-col">
            <label htmlFor="contractTypeName" className="text-sm mb-1 text-[#000000B3]">
              Contract Type <span className="text-red-500">*</span>
            </label>
            <select
              id="contractTypeName"
              name="contractTypeName"
              value={formData.contractTypeName || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
            >
              <option value="">Select Contract Type</option>
              {contractTypes.map((contract) => (
                <option
                  key={contract.contractTypeMasterID}
                  value={contract.contractTypeName}
                >
                  {contract.contractTypeName}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Type */}
          <div className="flex flex-col">
            <label htmlFor="salaryTypeID" className="text-sm mb-1 text-[#000000B3]">
              Salary Type <span className="text-red-500">*</span>
            </label>
            <select
              id="salaryTypeID"
              name="salaryTypeID"
              value={formData.salaryTypeID || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
            >
              <option value="">Select Salary Type</option>
              {salaryTypes.map((type) => (
                <option key={type.salaryTypeID} value={type.salaryTypeID}>
                  {type.salaryTypeName}
                </option>
              ))}
            </select>
          </div>

          {/* Status (Conditional Rendering) */}
          {mode === "add" && (
            <div className="flex flex-col">
              <label htmlFor="statusID" className="text-sm mb-1 text-[#000000B3]">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="statusID"
                name="statusID"
                value={formData.statusID || ""}
                onChange={handleInputChange}
                className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status.statusID} value={status.statusID}>
                    {status.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Report To */}
          <div className="flex flex-col">
            <label htmlFor="reportToID" className="text-sm mb-1 text-[#000000B3]">
              Report To <span className="text-red-500">*</span>
            </label>
            <select
              id="reportToID"
              name="reportToID"
              value={formData.reportToID || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeID} value={employee.employeeID}>
                  {employee.fullName ||
                    `${employee.firstName} ${employee.secondName}`}
                </option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div className="flex flex-col">
            <label htmlFor="brancheID" className="text-sm mb-1 text-[#000000B3]">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              id="brancheID"
              name="brancheID"
              value={formData.brancheID || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D] cursor-pointer"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.brancheID} value={branch.brancheID}>
                  {branch.brancheName}
                </option>
              ))}
            </select>
          </div>

          {/* Salary */}
          <div className="flex flex-col">
            <label htmlFor="salary" className="text-sm mb-1 text-[#000000B3]">
              Salary <span className="text-red-500">*</span>
            </label>
            <input
              id="salary"
              type="number"
              name="salary"
              value={formData.salary || ""}
              onChange={handleInputChange}
              className="w-full p-2 bg-[#fbfbfb] border border-[#4d4d4d66] rounded-lg text-sm focus:outline-none focus:border-[#0000004D]"
              placeholder="Enter Salary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddEmploymentDetailsCard;