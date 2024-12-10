
import db from '../db.js';  
import multer from 'multer';
import path from 'path';

// Helper function to retrieve employeeID from the token
const getEmployeeIdFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    const fetchUserSql = `
      SELECT u.employeeID, u.roleID, r.roleName, u.username
      FROM User u
      LEFT JOIN Role r ON u.roleID = r.roleID
      WHERE u.token = ?
    `;

    db.query(fetchUserSql, [token], (err, userResults) => {
      if (err) {
        console.error("Error fetching user by token:", err);
        return reject({ status: 500, message: "Error fetching user data", details: err.message });
      }

      if (userResults.length === 0) {
        return reject({ status: 404, message: "User not found or invalid token" });
      }

      const { employeeID, roleID, roleName, username } = userResults[0];

      resolve({ employeeID, roleID, roleName, username });
    });
  });
};

export const getEmployeeInfo = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let employeeData = null;

    // If an employeeId is provided, we assume admin usage to fetch that user's data
    if (employeeId) {
      const fetchEmployeeInfoSql = `
        SELECT 
          e.email, e.DOB, e.phoneNumber, e.gender, e.employeeID, e.reportToID, e.profilePicture,
          CONCAT(e.firstName, ' ', e.secondName) AS employeeName,
          r.roleName,
          u.username,
          supervisorUser.firstName AS reportToFirstName,
          supervisorUser.secondName AS reportToSecondName
        FROM employees e
        LEFT JOIN employees supervisorUser ON e.reportToID = supervisorUser.employeeID
        LEFT JOIN User u ON e.employeeID = u.employeeID
        LEFT JOIN Role r ON u.roleID = r.roleID
        WHERE e.employeeID = ?
      `;

      db.query(fetchEmployeeInfoSql, [employeeId], (err, employeeResults) => {
        if (err) {
          console.error("Error fetching employee information:", err);
          return res.status(500).json({ Error: "Error fetching employee information", Details: err.message });
        }

        if (employeeResults.length === 0) {
          return res.status(404).json({ Error: "Employee not found" });
        }

        const employeeInfo = employeeResults[0];
        return res.status(200).json({ Status: "Success", Data: employeeInfo });
      });
    } else {
      // If no employeeId is provided, use the token to find the current user
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ Error: "No token provided" });
      }
      const token = authHeader.split(' ')[1];

      const user = await getEmployeeIdFromToken(token);

      const fetchEmployeeInfoSql = `
        SELECT 
          e.email, e.DOB, e.phoneNumber, e.gender, e.employeeID, e.reportToID, e.profilePicture,
          CONCAT(e.firstName, ' ', e.secondName) AS employeeName,
          '${user.roleName}' AS roleName,
          '${user.username}' AS username,
          supervisorUser.firstName AS reportToFirstName,
          supervisorUser.secondName AS reportToSecondName
        FROM employees e
        LEFT JOIN employees supervisorUser ON e.reportToID = supervisorUser.employeeID
        WHERE e.employeeID = ?
      `;

      db.query(fetchEmployeeInfoSql, [user.employeeID], (err, employeeResults) => {
        if (err) {
          console.error("Error fetching employee information:", err);
          return res.status(500).json({ Error: "Error fetching employee information", Details: err.message });
        }

        if (employeeResults.length === 0) {
          return res.status(404).json({ Error: "Employee not found" });
        }

        const employeeInfo = employeeResults[0];
        return res.status(200).json({ Status: "Success", Data: employeeInfo });
      });
    }
  } catch (error) {
    console.error("Error getting employee info:", error);
    return res.status(500).json({ Error: "Server Error", Details: error.message });
  }
};

export const updateEmployeeInfo = (req, res) => {
  const { email, phoneNumber, DOB, profilePicture  } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1];

  // Query to find the user by token and retrieve the employeeID
  const fetchUserSql = `SELECT employeeID FROM User WHERE token = ?`;

  db.query(fetchUserSql, [token], (err, userResults) => {
    if (err) {
      console.error("Error fetching user by token:", err);
      return res.status(500).json({ Error: "Error fetching user data", Details: err.message });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ Error: "User not found or invalid token" });
    }

    const employeeID = userResults[0].employeeID;

    // Update the employee information in the database
    const updateEmployeeSql = `
      UPDATE employees 
      SET email = ?, phoneNumber = ?, DOB = ?, profilePicture = ?
      WHERE employeeID = ?
    `;

    db.query(updateEmployeeSql, [email, phoneNumber, DOB, profilePicture, employeeID], (err, result) => {
      if (err) {
        console.error("Error updating employee information:", err);
        return res.status(500).json({ Error: "Error updating employee information", Details: err.message });
      }

      return res.status(200).json({ Status: "Success", Message: "Profile updated successfully" });
    });
  });
};
   
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/pictures/'); // Adjust the destination as needed
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`); // Add timestamp to avoid filename conflicts
  },
});
const upload = multer({ storage });              

export const uploadProfilePicture = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Query to find the user by token and retrieve the employeeID
  const fetchUserSql = `SELECT employeeID FROM User WHERE token = ?`;

  db.query(fetchUserSql, [token], (err, userResults) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching user by token', details: err.message });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found or invalid token' });
    }  

    const employeeID = userResults[0].employeeID; // Fixing employeeID case
    const profilePicturePath = `/public/pictures/${req.file.filename}`;
    const fullProfilePictureUrl = `http://localhost:3001${profilePicturePath}`;

    // SQL query to update employee's profile picture
    const sql = "UPDATE employees SET profilePicture = ? WHERE employeeID = ?"; // Correct employeeID case
    db.query(sql, [profilePicturePath, employeeID], (err, result) => { // Use employeeID correctly
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.status(200).json({
        message: 'Profile picture uploaded successfully',
        profilePicturePath: fullProfilePictureUrl, // Return the full URL
      });
    });
  });
};
export const uploadMiddleware = upload.single('profilePicture');



export const EmploymentDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let employeeID = null;

    if (employeeId) {
      // If employeeId is provided, use that to fetch data
      employeeID = employeeId;
    } else {
      // Otherwise, use the token to find the user's employeeID
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log("No Authorization header found");
        return res.status(401).json({ Error: "No token provided" });
      }
      const token = authHeader.split(' ')[1];
      const user = await getEmployeeIdFromToken(token);
      employeeID = user.employeeID;
    }

    // Query to fetch employee data including position, work status, department, salary type, branch,
    // status, contract type, and contract start and end dates
    const fetchEmployeeSql = `
      SELECT 
        p.positionName AS positionName,
        w.statusName AS workStatusName,
        e.firstName, e.secondName, e.email,
        e.StartDate, e.renewalDate, e.totalLeave, e.salary,
        e.phoneNumber, e.gender, e.DOB,
        d.departmentName AS departmentName,
        s.salaryTypeName AS salaryTypeName,
        b.brancheName AS branchName,
        status.status AS employmentStatus,
        ctm.contractTypeName AS contractTypeName,
        ct.startDate AS contractStartDate,
        ct.endDate AS contractEndDate,
        ct.requiredWorkingHours AS requiredWorkingHours

      FROM employees e
      LEFT JOIN Positionn p ON e.positionID = p.positionID
      LEFT JOIN Work_Status w ON e.workStatusID = w.workStatusID
      LEFT JOIN Department d ON e.departmentID = d.departmentID
      LEFT JOIN Salary_Type s ON e.salaryTypeID = s.salaryTypeID
      LEFT JOIN Branches b ON e.brancheID = b.brancheID
      LEFT JOIN User u ON u.employeeID = e.employeeID
      LEFT JOIN Status status ON u.statusID = status.statusID
      LEFT JOIN Contract_Type ct ON ct.employeeID = e.employeeID
      LEFT JOIN Contract_Type_Master ctm ON ct.contractTypeMasterID = ctm.contractTypeMasterID
      WHERE e.employeeID = ?
    `;

    db.query(fetchEmployeeSql, [employeeID], (err, employeeResults) => {
      if (err) {
        console.error("Error fetching employee:", err);
        return res.status(500).json({ Error: "Error fetching employee data", Details: err.message });
      }

      if (employeeResults.length === 0) {
        return res.status(404).json({ Error: "Employee not found" });
      }

      // Extracting the current employee's data for renewal date checking
      let employee = employeeResults[0];
      let renewalDate = new Date(employee.renewalDate);
      const currentDate = new Date();

      // Check and update renewal date if the current date is greater than or equal to the renewal date
      while (currentDate >= renewalDate) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1); // Update to next year if expired
      }

      // If renewal date is updated, update it in the database
      const updateRenewalSql = `UPDATE employees SET renewalDate = ? WHERE employeeID = ?`;
      db.query(updateRenewalSql, [renewalDate, employeeID], (updateErr) => {
        if (updateErr) {
          console.error("Error updating renewal date:", updateErr);
          return res.status(500).json({ Error: "Error updating renewal date", Details: updateErr.message });
        }

        // After updating the renewal date, send the updated employee details in the response
        employee.renewalDate = renewalDate; // Reflect the updated renewal date
        return res.json({ Status: "Fetch Success", Data: employee });
      });
    });
  } catch (error) {
    console.error("Error in EmploymentDetails:", error);
    return res.status(500).json({ Error: "Server Error", Details: error.message });
  }
};

export const getWorkSchedules = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let employeeID = null;

    if (employeeId) {
      // If employeeId is provided, use that to fetch data
      employeeID = employeeId;
    } else {
      // Otherwise, use the token to find the user's employeeID
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ Error: "No token provided" });
      }

      const token = authHeader.split(' ')[1];
      const user = await getEmployeeIdFromToken(token);
      employeeID = user.employeeID;
    }

    // Query to get work schedules for the employee
    const fetchWorkSchedulesSql = `
      SELECT startTime, endTime, day
      FROM Work_Schedules
      WHERE employeeID = ?`;

    db.query(fetchWorkSchedulesSql, [employeeID], (err, workScheduleResults) => {
      if (err) {
        console.error("Error fetching work schedules:", err);
        return res.status(500).json({ Error: "Error fetching work schedules", Details: err.message });
      }

      if (workScheduleResults.length === 0) {
        return res.status(404).json({ Error: "No work schedules found for this employee" });
      }

      // Return the work schedules
      return res.status(200).json({
        Status: "Success",
        Data: workScheduleResults
      });
    });
  } catch (error) {
    console.error("Error in getWorkSchedules:", error);
    return res.status(500).json({ Error: "Server Error", Details: error.message });
  }
};
// controllers/leave.controller.js


export const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let employeeID = null;

    if (employeeId) {
      employeeID = employeeId;
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ Error: "No token provided" });
      }

      const token = authHeader.split(' ')[1];
      const fetchUserSql = `SELECT employeeID FROM User WHERE token = ?`;
      const userResults = await new Promise((resolve, reject) => {
        db.query(fetchUserSql, [token], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (userResults.length === 0) {
        return res.status(404).json({ Error: "User not found for the provided token" });
      }

      employeeID = userResults[0].employeeID;
    }

    // Fetch leave balance
    const fetchLeaveBalanceSql = `
      SELECT 
          lt.leaveTypeName, 
          COALESCE(lb.balance, 0) AS accruedLeaveHours, -- Fetch static balance only
          COALESCE(SUM(
              CASE 
                  WHEN lr.statusLeaveID = 2 THEN TIMESTAMPDIFF(MINUTE, lr.startDateTime, lr.endDateTime)
                  ELSE 0
              END
          ), 0) AS usedLeaveMinutes
      FROM Leave_Type lt
      LEFT JOIN Leave_Balance lb ON lb.leaveTypeID = lt.leaveTypeID AND lb.employeeID = ?
      LEFT JOIN Leave_Request lr ON lr.leaveTypeID = lt.leaveTypeID AND lr.employeeID = ?
      WHERE lt.leaveTypeName IN ('Annual Leave', 'Personal Leave')
      GROUP BY lt.leaveTypeName, lb.balance;

    `;

    const leaveBalanceResults = await new Promise((resolve, reject) => {
      db.query(fetchLeaveBalanceSql, [employeeID, employeeID], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (leaveBalanceResults.length === 0) {
      return res.status(404).json({ Error: "No leave balance data found for the employee" });
    }

    // Helper function to format hours into days, hours, and minutes
    const formatHoursToDHM = (hoursDecimal) => {
      const totalMinutes = Math.round(hoursDecimal * 60); // Convert hours to minutes
      const days = Math.floor(totalMinutes / (24 * 60)); // Extract days
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60); // Extract hours
      const minutes = totalMinutes % 60; // Remaining minutes
      return `${days} days, ${hours} hrs, ${minutes} min`;
    };

    const responseData = {};
    leaveBalanceResults.forEach((leave) => {
      const { leaveTypeName, accruedLeaveHours = 0, usedLeaveMinutes = 0 } = leave;

      // Convert used leave minutes and remaining minutes to hours for formatting
      const usedLeaveHours = usedLeaveMinutes / 60;
      const remainingLeaveHours = Math.max(0, accruedLeaveHours - usedLeaveHours);

      responseData[leaveTypeName] = {
        accruedLeave: formatHoursToDHM(accruedLeaveHours),
        usedLeave: formatHoursToDHM(usedLeaveHours),
        remainingLeave: formatHoursToDHM(remainingLeaveHours),
      };
    });

    res.status(200).json({
      Status: "Success",
      Data: responseData,
    });
  } catch (error) {
    console.error("Error in getLeaveBalance:", error);
    return res.status(500).json({ Error: "Server Error", Details: error.message });
  }
};





