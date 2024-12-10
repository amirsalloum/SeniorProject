// api/controllers/employee.controller.js
import db from '../db.js';  // Ensure your DB connection is correct
import jwt from 'jsonwebtoken';

// Create or Update Branch
export const createBranch = (req, res) => {
  const { brancheID, brancheName } = req.body;

  if (!brancheID && !brancheName) {
    return res.status(400).json({ error: "Please provide a brancheName for creating a branch" });
  }

  if (brancheID) {
    let updateFields = [];
    let updateValues = [];

    if (brancheName) {
      updateFields.push('brancheName = ?');
      updateValues.push(brancheName);
    }

    updateValues.push(brancheID);

    if (updateFields.length > 0) {
      const updateBranchSql = `UPDATE Branches SET ${updateFields.join(', ')} WHERE brancheID = ?`;

      db.query(updateBranchSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating branch:", err);
          return res.status(500).json({ error: "Error updating branch data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Branch updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Branches (brancheName) VALUES (?)";
    const values = [brancheName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create branch" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { brancheID: result.insertId, brancheName }
      });
    });
  }
};

// Fetch All Branches
export const getAllBranches = (req, res) => {
  const sql = "SELECT * FROM Branches";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching branches:", err);
      return res.status(500).json({ error: "Failed to fetch branches" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Branch by ID
export const getBranchById = (req, res) => {
  const { brancheID } = req.params;

  if (!brancheID) {
    return res.status(400).json({ error: "Please provide a brancheID" });
  }

  const sql = "SELECT * FROM Branches WHERE brancheID = ?";

  db.query(sql, [brancheID], (err, result) => {
    if (err) {
      console.error("Error fetching branch:", err);
      return res.status(500).json({ error: "Failed to fetch branch details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};


// Delete Branch
// Controller to delete a branch
export const deleteBranch = (req, res) => {
  const { brancheID } = req.params;

  if (!brancheID) {
    return res.status(400).json({ error: "Please provide a brancheID to delete" });
  }

  // Step 1: Update employees that reference this branch to set brancheID to NULL or a default value
  const updateEmployeesSql = "UPDATE employees SET brancheID = NULL WHERE brancheID = ?";
  db.query(updateEmployeesSql, [brancheID], (err, updateResult) => {
    if (err) {
      console.error("Error updating employees to remove branch reference:", err);
      return res.status(500).json({ error: "Failed to update employees", details: err.message });
    }

    // Step 2: Delete the branch after updating employees
    const deleteBranchSql = "DELETE FROM Branches WHERE brancheID = ?";
    db.query(deleteBranchSql, [brancheID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting branch:", err);
        return res.status(500).json({ error: "Failed to delete branch", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Branch not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Branch and associated references deleted successfully" });
    });
  });
};


// Create or Update Department
export const createDepartment = (req, res) => {
  const { departmentID, departmentName } = req.body;

  if (!departmentID && !departmentName) {
    return res.status(400).json({ error: "Please provide a departmentName for creating a department" });
  }

  if (departmentID) {
    let updateFields = [];
    let updateValues = [];

    if (departmentName) {
      updateFields.push('departmentName = ?');
      updateValues.push(departmentName);
    }

    updateValues.push(departmentID);

    if (updateFields.length > 0) {
      const updateDepartmentSql = `UPDATE Department SET ${updateFields.join(', ')} WHERE departmentID = ?`;

      db.query(updateDepartmentSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating department:", err);
          return res.status(500).json({ error: "Error updating department data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Department updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Department (departmentName) VALUES (?)";
    const values = [departmentName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create department" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { departmentID: result.insertId, departmentName }
      });
    });
  }
};


// Fetch All Departments
export const getAllDepartments = (req, res) => {
  const sql = "SELECT * FROM Department";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Failed to fetch departments" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Department by ID
export const getDepartmentById = (req, res) => {
  const { departmentID } = req.params;

  if (!departmentID) {
    return res.status(400).json({ error: "Please provide a departmentID" });
  }

  const sql = "SELECT * FROM Department WHERE departmentID = ?";

  db.query(sql, [departmentID], (err, result) => {
    if (err) {
      console.error("Error fetching department:", err);
      return res.status(500).json({ error: "Failed to fetch department details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};

// Delete Department
// Controller to delete a department
export const deleteDepartment = (req, res) => {
  const { departmentID } = req.params;

  if (!departmentID) {
    return res.status(400).json({ error: "Please provide a departmentID to delete" });
  }

  // Step 1: Update employees that reference this department to set departmentID to NULL or a default value
  const updateEmployeesSql = "UPDATE employees SET departmentID = NULL WHERE departmentID = ?";
  db.query(updateEmployeesSql, [departmentID], (err, updateResult) => {
    if (err) {
      console.error("Error updating employees to remove department reference:", err);
      return res.status(500).json({ error: "Failed to update employees", details: err.message });
    }

    // Step 2: Delete the department after updating employees
    const deleteDepartmentSql = "DELETE FROM Department WHERE departmentID = ?";
    db.query(deleteDepartmentSql, [departmentID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting department:", err);
        return res.status(500).json({ error: "Failed to delete department", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Department not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Department and associated references deleted successfully" });
    });
  });
};

// Create or Update Position
export const createPosition = (req, res) => {
  const { positionID, positionName } = req.body;

  if (!positionID && !positionName) {
    return res.status(400).json({ error: "Please provide a positionName for creating a position" });
  }

  if (positionID) {
    let updateFields = [];
    let updateValues = [];

    if (positionName) {
      updateFields.push('positionName = ?');
      updateValues.push(positionName);
    }

    updateValues.push(positionID);

    if (updateFields.length > 0) {
      const updatePositionSql = `UPDATE Positionn SET ${updateFields.join(', ')} WHERE positionID = ?`;

      db.query(updatePositionSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating position:", err);
          return res.status(500).json({ error: "Error updating position data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Position updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Positionn (positionName) VALUES (?)";
    const values = [positionName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create position" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { positionID: result.insertId, positionName }
      });
    });
  }
};


// Fetch All Positions
export const getAllPositions = (req, res) => {
  const sql = "SELECT * FROM Positionn";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching positions:", err);
      return res.status(500).json({ error: "Failed to fetch positions" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Position by ID
export const getPositionById = (req, res) => {
  const { positionID } = req.params;

  if (!positionID) {
    return res.status(400).json({ error: "Please provide a positionID" });
  }

  const sql = "SELECT * FROM Positionn WHERE positionID = ?";

  db.query(sql, [positionID], (err, result) => {
    if (err) {
      console.error("Error fetching position:", err);
      return res.status(500).json({ error: "Failed to fetch position details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Position not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};


// Delete Position
// Controller to delete a position
export const deletePosition = (req, res) => {
  const { positionID } = req.params;

  if (!positionID) {
    return res.status(400).json({ error: "Please provide a positionID to delete" });
  }

  // Step 1: Update employees that reference this position to set positionID to NULL or a default value
  const updateEmployeesSql = "UPDATE employees SET positionID = NULL WHERE positionID = ?";
  db.query(updateEmployeesSql, [positionID], (err, updateResult) => {
    if (err) {
      console.error("Error updating employees to remove position reference:", err);
      return res.status(500).json({ error: "Failed to update employees", details: err.message });
    }

    // Step 2: Delete the position after updating employees
    const deletePositionSql = "DELETE FROM Positionn WHERE positionID = ?";
    db.query(deletePositionSql, [positionID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting position:", err);
        return res.status(500).json({ error: "Failed to delete position", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Position not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Position and associated references deleted successfully" });
    });
  });
};


// Create or Update Salary Type
export const createSalaryType = (req, res) => {
  const { salaryTypeID, salaryTypeName } = req.body;

  if (!salaryTypeID && !salaryTypeName) {
    return res.status(400).json({ error: "Please provide a salaryTypeName for creating a salary type" });
  }

  if (salaryTypeID) {
    let updateFields = [];
    let updateValues = [];

    if (salaryTypeName) {
      updateFields.push('salaryTypeName = ?');
      updateValues.push(salaryTypeName);
    }

    updateValues.push(salaryTypeID);

    if (updateFields.length > 0) {
      const updateSalaryTypeSql = `UPDATE Salary_Type SET ${updateFields.join(', ')} WHERE salaryTypeID = ?`;

      db.query(updateSalaryTypeSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating salary type:", err);
          return res.status(500).json({ error: "Error updating salary type data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Salary type updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Salary_Type (salaryTypeName) VALUES (?)";
    const values = [salaryTypeName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create salary type" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { salaryTypeID: result.insertId, salaryTypeName }
      });
    });
  }
};


// Fetch All Salary Types
export const getAllSalaryTypes = (req, res) => {
  const sql = "SELECT * FROM Salary_Type";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching salary types:", err);
      return res.status(500).json({ error: "Failed to fetch salary types" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Salary Type by ID
export const getSalaryTypeById = (req, res) => {
  const { salaryTypeID } = req.params;

  if (!salaryTypeID) {
    return res.status(400).json({ error: "Please provide a salaryTypeID" });
  }

  const sql = "SELECT * FROM Salary_Type WHERE salaryTypeID = ?";

  db.query(sql, [salaryTypeID], (err, result) => {
    if (err) {
      console.error("Error fetching salary type:", err);
      return res.status(500).json({ error: "Failed to fetch salary type details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Salary type not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};

// Delete Salary Type
// Controller to delete a salary type
export const deleteSalaryType = (req, res) => {
  const { salaryTypeID } = req.params;

  if (!salaryTypeID) {
    return res.status(400).json({ error: "Please provide a salaryTypeID to delete" });
  }

  // Step 1: Update employees that reference this salary type to set salaryTypeID to NULL or a default value
  const updateEmployeesSql = "UPDATE employees SET salaryTypeID = NULL WHERE salaryTypeID = ?";
  db.query(updateEmployeesSql, [salaryTypeID], (err, updateResult) => {
    if (err) {
      console.error("Error updating employees to remove salary type reference:", err);
      return res.status(500).json({ error: "Failed to update employees", details: err.message });
    }

    // Step 2: Delete the salary type after updating employees
    const deleteSalaryTypeSql = "DELETE FROM Salary_Type WHERE salaryTypeID = ?";
    db.query(deleteSalaryTypeSql, [salaryTypeID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting salary type:", err);
        return res.status(500).json({ error: "Failed to delete salary type", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Salary type not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Salary type and associated references deleted successfully" });
    });
  });
};

// Create or Update Work Status
export const createWorkStatus = (req, res) => {
  const { workStatusID, statusName } = req.body;

  if (!workStatusID && !statusName) {
    return res.status(400).json({ error: "Please provide a statusName for creating a work status" });
  }

  if (workStatusID) {
    let updateFields = [];
    let updateValues = [];

    if (statusName) {
      updateFields.push('statusName = ?');
      updateValues.push(statusName);
    }

    updateValues.push(workStatusID);

    if (updateFields.length > 0) {
      const updateWorkStatusSql = `UPDATE Work_Status SET ${updateFields.join(', ')} WHERE workStatusID = ?`;

      db.query(updateWorkStatusSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating work status:", err);
          return res.status(500).json({ error: "Error updating work status data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Work status updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Work_Status (statusName) VALUES (?)";
    const values = [statusName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create work status" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { workStatusID: result.insertId, statusName }
      });
    });
  }
};


// Fetch All Work Statuses
export const getAllWorkStatuses = (req, res) => {
  const sql = "SELECT * FROM Work_Status";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching work statuses:", err);
      return res.status(500).json({ error: "Failed to fetch work statuses" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Work Status by ID
export const getWorkStatusById = (req, res) => {
  const { workStatusID } = req.params;

  if (!workStatusID) {
    return res.status(400).json({ error: "Please provide a workStatusID" });
  }

  const sql = "SELECT * FROM Work_Status WHERE workStatusID = ?";

  db.query(sql, [workStatusID], (err, result) => {
    if (err) {
      console.error("Error fetching work status:", err);
      return res.status(500).json({ error: "Failed to fetch work status details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Work status not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};

// Delete Work Status
// Controller to delete a work status
export const deleteWorkStatus = (req, res) => {
  const { workStatusID } = req.params;

  if (!workStatusID) {
    return res.status(400).json({ error: "Please provide a workStatusID to delete" });
  }

  // Step 1: Update employees that reference this work status to set workStatusID to NULL or a default value
  const updateEmployeesSql = "UPDATE employees SET workStatusID = NULL WHERE workStatusID = ?";
  db.query(updateEmployeesSql, [workStatusID], (err, updateResult) => {
    if (err) {
      console.error("Error updating employees to remove work status reference:", err);
      return res.status(500).json({ error: "Failed to update employees", details: err.message });
    }

    // Step 2: Delete the work status after updating employees
    const deleteWorkStatusSql = "DELETE FROM Work_Status WHERE workStatusID = ?";
    db.query(deleteWorkStatusSql, [workStatusID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting work status:", err);
        return res.status(500).json({ error: "Failed to delete work status", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Work status not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Work status and associated references deleted successfully" });
    });
  });
};

// Fetch all employees, accessible only to Admin
export const getAllEmployees = (req, res) => {
  
  // Extract token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ Error: "Authorization token missing" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'

  try {
    // Verify and decode the token using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_jwt_secret');

    // Check if the user has the 'Admin' or 'HR' role
    const allowedRoles = ['Admin', 'HR'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ Error: "Access denied: Admins and HR only" });
    }

    // SQL query to fetch all employee profiles, including their supervisor's name and the admin who added them
    const fetchAllEmployeesSql = `
      SELECT 
        e.employeeID, 
        CONCAT(e.firstName, ' ', e.secondName) AS fullName, 
        u.username,
        e.phoneNumber AS phone, 
        e.email, 
        d.departmentName AS department, 
        r.roleName AS role, 
        s.status AS status, 
        CONCAT(supervisor.firstName, ' ', supervisor.secondName) AS reportTo, 
        CONCAT(addedBy.firstName, ' ', addedBy.secondName) AS addedBy
      FROM employees e
      LEFT JOIN employees supervisor ON e.reportToID = supervisor.employeeID
      LEFT JOIN employees addedBy ON e.addBy = addedBy.employeeID
      JOIN department d ON e.departmentID = d.departmentID
      JOIN user u ON e.employeeID = u.employeeID
      JOIN role r ON u.roleID = r.roleID
      JOIN status s ON u.statusID = s.statusID
    `;

    // Execute the query
    db.query(fetchAllEmployeesSql, (err, employeeResults) => {
      if (err) {
        console.error("Database error while fetching employees:", err);
        return res.status(500).json({ Error: "Internal server error while fetching employee data", Details: err.message });
      }

      // If no employees are found, return a 404 status
      if (employeeResults.length === 0) {
        return res.status(404).json({ Error: "No employees found" });
      }

      // Return all employee profiles
      return res.status(200).json({
        Status: "Success",
        Data: employeeResults
      });
    });
  } catch (error) {
    // Handle invalid or expired token
    console.error("JWT verification error:", error);
    return res.status(403).json({ Error: "Invalid or expired token" });
  }
};


// Controller to get an employee by their ID
export const getEmployeeById = (req, res) => {
  const { employeeID } = req.params;

  // Extract token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ Error: "Authorization token missing" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'

  try {
    // Verify and decode the token using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_jwt_secret');

    // Check if the user has the required role
    if (decoded.role !== 'Admin' && decoded.role !== 'HR') {
      return res.status(403).json({ Error: "Access denied: Admins and HR only" });
    }

    // SQL query to fetch all employee details, including related entities like supervisor and work schedule
    const fetchEmployeeByIdSql = `
      SELECT 
        e.employeeID,
        e.firstName,
        e.secondName,
        e.phoneNumber,
        e.email,
        e.gender,
        e.DOB,
        e.StartDate,
        e.renewalDate,
        e.salary,
        e.profilePicture,
        e.positionID,
        e.reportToID, 
        p.positionName,
        e.salaryTypeID,
        st.salaryTypeName,
        e.workStatusID,
        ws.statusName AS workStatusName,
        e.departmentID,
        d.departmentName,
        e.brancheID,
        b.brancheName,
        u.username,
        u.statusID,
        s.status,
        u.roleID,
        r.roleName,
        ct.startDate AS contractStartDate,
        ct.endDate AS contractEndDate,
        ct.requiredWorkingHours AS requiredWorkingHours, -- Added requiredWorkingHours
        ctm.contractTypeName,
        CONCAT(supervisor.firstName, ' ', supervisor.secondName) AS reportToFirstName,
        CONCAT(addedBy.firstName, ' ', addedBy.secondName) AS addedBy
      FROM employees e
      LEFT JOIN employees supervisor ON e.reportToID = supervisor.employeeID
      LEFT JOIN employees addedBy ON e.addBy = addedBy.employeeID
      JOIN department d ON e.departmentID = d.departmentID
      JOIN user u ON e.employeeID = u.employeeID
      JOIN role r ON u.roleID = r.roleID
      JOIN status s ON u.statusID = s.statusID
      LEFT JOIN Branches b ON e.brancheID = b.brancheID
      LEFT JOIN Positionn p ON e.positionID = p.positionID
      LEFT JOIN Salary_Type st ON e.salaryTypeID = st.salaryTypeID
      LEFT JOIN Work_Status ws ON e.workStatusID = ws.workStatusID
      LEFT JOIN Contract_Type ct ON e.employeeID = ct.employeeID
      LEFT JOIN Contract_Type_Master ctm ON ct.contractTypeMasterID = ctm.contractTypeMasterID
      WHERE e.employeeID = ?
    `;

    // Execute the SQL query to get employee details
    db.query(fetchEmployeeByIdSql, [employeeID], (err, employeeResult) => {
      if (err) {
        console.error("Database error while fetching employee by ID:", err);
        return res.status(500).json({ 
          Error: "Internal server error while fetching employee data", 
          Details: err.message 
        });
      }

      // If no employee is found, return a 404 status
      if (employeeResult.length === 0) {
        return res.status(404).json({ Error: "Employee not found" });
      }

      const employeeData = employeeResult[0];
      console.log("Employee Data fetched:", employeeData);

      // SQL query to fetch the work schedule of the employee
      const fetchWorkScheduleSql = `
        SELECT day, startTime, endTime
        FROM Work_Schedules
        WHERE employeeID = ?
      `;

      // Execute the SQL query to get the employee's work schedule
      db.query(fetchWorkScheduleSql, [employeeID], (scheduleErr, workScheduleResults) => {
        if (scheduleErr) {
          console.error("Database error while fetching work schedule:", scheduleErr);
          return res.status(500).json({ 
            Error: "Internal server error while fetching work schedule", 
            Details: scheduleErr.message 
          });
        }

        // Attach the work schedule to the employee's data
        employeeData.workSchedule = workScheduleResults;

        // Return the employee data along with the work schedule
        return res.status(200).json({
          Status: "Success",
          Data: employeeData
        });
      });
    });
  } catch (error) {
    // Handle invalid or expired token
    console.error("JWT verification error:", error);
    return res.status(403).json({ Error: "Invalid or expired token" });
  }
};


export const getSupervisorEmployees = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'

  // Query to find the supervisor's employeeID from the token
  const fetchSupervisorSql = `SELECT employeeID FROM User WHERE token = ?`;

  db.query(fetchSupervisorSql, [token], (err, supervisorResults) => {
    if (err) {
      console.error("Error fetching supervisor by token:", err);
      return res.status(500).json({ error: "Error fetching supervisor data", Details: err.message });
    }

    if (supervisorResults.length === 0) {
      return res.status(404).json({ error: "Supervisor not found or invalid token" });
    }

    const supervisorID = supervisorResults[0].employeeID;

    // SQL query to fetch employees that report to this supervisor
    const fetchSupervisorEmployeesSql = `
      SELECT 
        e.employeeID, 
        CONCAT(e.firstName, ' ', e.secondName) AS fullName, 
        u.username,
        e.phoneNumber AS phone, 
        e.email, 
        d.departmentName AS department, 
        r.roleName AS role, 
        s.status AS status, 
        CONCAT(supervisor.firstName, ' ', supervisor.secondName) AS reportTo, 
        CONCAT(addedBy.firstName, ' ', addedBy.secondName) AS addedBy
      FROM employees e
      LEFT JOIN employees supervisor ON e.reportToID = supervisor.employeeID
      LEFT JOIN employees addedBy ON e.addBy = addedBy.employeeID
      JOIN department d ON e.departmentID = d.departmentID
      JOIN user u ON e.employeeID = u.employeeID
      JOIN role r ON u.roleID = r.roleID
      JOIN status s ON u.statusID = s.statusID
      WHERE e.reportToID = ?  -- Filter by the supervisor's employeeID
    `;

    // Execute the query with the supervisorID as the filter
    db.query(fetchSupervisorEmployeesSql, [supervisorID], (err, employeeResults) => {
      if (err) {
        console.error("Error fetching supervisor employees:", err);
        return res.status(500).json({ error: "Error fetching supervisor employees" });
      }

      // If no employees are found, return a 404 status
      if (employeeResults.length === 0) {
        return res.status(404).json({ error: "No employees found reporting to this supervisor" });
      }

      // Return the employees who report to the supervisor
      return res.status(200).json({
        Status: "Success",
        Data: employeeResults
      });
    });
  });
};


// Controller to create or update a holiday
export const createHoliday = (req, res) => {
  const { holidayID, holidayName, startDate, endDate } = req.body;

  // Validate input for creation or update
  if (!holidayName || !startDate || !endDate) {
    return res.status(400).json({ Status: "Error", Message: "Please provide holidayName, startDate, and endDate" });
  }

  if (holidayID) {
    // Update existing holiday
    // Build dynamic query based on provided fields
    let updateFields = [];
    let updateValues = [];

    if (holidayName) {
      updateFields.push('holidayName = ?');
      updateValues.push(holidayName);
    }
    if (startDate) {
      updateFields.push('startDate = ?');
      updateValues.push(startDate);
    }
    if (endDate) {
      updateFields.push('endDate = ?');
      updateValues.push(endDate);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ Status: "Error", Message: "No fields provided to update" });
    }

    const updateHolidaySql = `UPDATE Holiday SET ${updateFields.join(', ')} WHERE holidayID = ?`;
    updateValues.push(holidayID);

    db.query(updateHolidaySql, updateValues, (err, result) => {
      if (err) {
        console.error("Error updating holiday:", err);
        return res.status(500).json({ Status: "Error", Message: "Failed to update holiday", Details: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ Status: "Error", Message: "Holiday not found or already updated" });
      }

      res.status(200).json({ Status: "Success", Message: "Holiday updated successfully" });
    });
  } else {
    // Create new holiday
    const sql = "INSERT INTO Holiday (holidayName, startDate, endDate) VALUES (?, ?, ?)";
    db.query(sql, [holidayName, startDate, endDate], (err, result) => {
      if (err) {
        console.error('Error inserting holiday:', err);
        return res.status(500).json({ Status: "Error", Message: "Failed to create holiday" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { holidayID: result.insertId, holidayName, startDate, endDate }
      });
    });
  }
};

// Controller to get all holidays
export const getHolidays = (req, res) => {
  const sql = "SELECT * FROM Holiday ORDER BY startDate";

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching holidays:', err);
      return res.status(500).json({ Status: "Error", Message: "Failed to fetch holidays" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};


// Controller to get a specific holiday by ID
export const getHolidayById = (req, res) => {
  const { holidayID } = req.params;

  if (!holidayID) {
    return res.status(400).json({ Status: "Error", Message: "Please provide a holidayID" });
  }

  const sql = "SELECT * FROM Holiday WHERE holidayID = ?";

  db.query(sql, [holidayID], (err, result) => {
    if (err) {
      console.error("Error fetching holiday:", err);
      return res.status(500).json({ Status: "Error", Message: "Failed to fetch holiday details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ Status: "Error", Message: "Holiday not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};


// Controller to delete a holiday
export const deleteHoliday = (req, res) => {
  const { holidayID } = req.params;

  if (!holidayID) {
    return res.status(400).json({ Status: "Error", Message: "Please provide a holidayID to delete" });
  }

  const deleteHolidaySql = "DELETE FROM Holiday WHERE holidayID = ?";

  db.query(deleteHolidaySql, [holidayID], (err, result) => {
    if (err) {
      console.error("Error deleting holiday:", err);
      return res.status(500).json({ Status: "Error", Message: "Failed to delete holiday", Details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: "Error", Message: "Holiday not found or already deleted" });
    }

    res.status(200).json({ Status: "Success", Message: "Holiday deleted successfully" });
  });
};
