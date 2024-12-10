import db from '../db.js';  // Ensure the database connection is correct
import schedule from 'node-schedule';
import {io} from '../app.js';


export const getWeeklyWorkingHours = (req, res) => {
  const { employeeID, weekStartDate, weekEndDate } = req.query;

  // Validate input
  if (!employeeID || !weekStartDate || !weekEndDate) {
    return res.status(400).json({ error: "Please provide employeeID, weekStartDate, and weekEndDate" });
  }

  // SQL query to fetch weekly working hours
  const sql = `
    SELECT * 
    FROM Weekly_Working_Hours
    WHERE employeeID = ? 
    AND weekStartDate = ? 
    AND weekEndDate = ?
  `;

  db.query(sql, [employeeID, weekStartDate, weekEndDate], (err, results) => {
    if (err) {
      console.error("Error fetching weekly working hours:", err);
      return res.status(500).json({ error: "Error fetching weekly working hours", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No records found for the specified week and employee" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};


// Reusable function to calculate weekly working hours
const performWeeklyCalculation = async () => {
  const now = new Date();

  // Fetch all employees and their contract details
  const employeesSql = `
    SELECT 
      e.employeeID, 
      e.StartDate, 
      ct.contractTypeID, 
      ct.requiredWorkingHours, 
      ctm.contractTypeName 
    FROM employees e
    JOIN Contract_Type ct ON e.employeeID = ct.employeeID
    JOIN Contract_Type_Master ctm ON ct.contractTypeMasterID = ctm.contractTypeMasterID;
  `;

  return new Promise((resolve, reject) => {
    db.query(employeesSql, [], async (err, employees) => {
      if (err) {
        console.error("Error fetching employees:", err);
        return reject(err);
      }

      let tasks = employees.map((employee) => {
        return new Promise((resolve, reject) => {
          const { employeeID, StartDate, contractTypeID, requiredWorkingHours, contractTypeName } = employee;

          // Ensure required fields are not null or undefined
          if (!employeeID || !contractTypeID || requiredWorkingHours == null || !StartDate) {
            console.error(`Invalid employee data: ${JSON.stringify(employee)}`);
            return reject(new Error("Invalid employee data"));
          }

          // Parse the employee's StartDate
          const employeeStartDate = new Date(StartDate);
          const currentDate = new Date();

          // If the employee's StartDate is in the future, skip processing
          if (employeeStartDate > currentDate) {
            console.log(`Employee ${employeeID} has a future StartDate. Skipping.`);
            return resolve();
          }

          // Calculate the number of weeks between StartDate and current date
          const weeksToProcess = [];

          // Start from the Monday of the employee's StartDate week
          const firstWeekStartDate = new Date(employeeStartDate);
          firstWeekStartDate.setDate(firstWeekStartDate.getDate() - firstWeekStartDate.getDay() + 1); // Monday

          // Start from the Monday of the current week
          const lastWeekStartDate = new Date(currentDate);
          lastWeekStartDate.setDate(lastWeekStartDate.getDate() - lastWeekStartDate.getDay() + 1); // Monday

          // Initialize the weekStartDate for iteration
          let weekStartDate = new Date(firstWeekStartDate);

          // Loop through each week from StartDate to current date
          while (weekStartDate <= lastWeekStartDate) {
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6); // Sunday

            weeksToProcess.push({
              weekStartDate: new Date(weekStartDate),
              weekEndDate: new Date(weekEndDate),
            });

            // Move to the next week
            weekStartDate.setDate(weekStartDate.getDate() + 7);
          }

          // Process each week for the employee
          let weekTasks = weeksToProcess.map((week) => {
            return new Promise((resolve, reject) => {
              const formattedWeekStartDate = week.weekStartDate.toISOString().split("T")[0];
              const formattedWeekEndDate = week.weekEndDate.toISOString().split("T")[0];

              // Check if leave balance already updated for this week
              const checkLeaveBalanceSql = `
                SELECT 1 
                FROM Leave_Balance 
                WHERE employeeID = ? 
                  AND lastUpdatedDate = ?;
              `;

              db.query(checkLeaveBalanceSql, [employeeID, formattedWeekStartDate], (err, results) => {
                if (err) {
                  console.error(`Error checking leave balance for employee ${employeeID}:`, err);
                  return reject(err);
                }

                // Skip update if leave balance already exists for this week
                if (results.length > 0) {
                  console.log(`Leave balance already updated for employee ${employeeID} for week starting ${formattedWeekStartDate}. Skipping.`);
                  return resolve();
                }

                // Fetch attendance data for the week
                const attendanceSql = `
                  SELECT actionID, actionDate 
                  FROM Finger_Print 
                  WHERE employeeID = ? AND DATE(actionDate) BETWEEN ? AND ?
                  ORDER BY actionDate ASC;
                `;

                db.query(attendanceSql, [employeeID, formattedWeekStartDate, formattedWeekEndDate], (err, actions) => {
                  if (err) {
                    console.error(`Error fetching actions for employee ${employeeID}:`, err);
                    return reject(err);
                  }

                  // Calculate total working hours
                  let totalWorkingMinutes = 0;
                  let lastCheckIn = null;
                  let breakStart = null;

                  actions.forEach((action) => {
                    if (action.actionID === 1) {
                      lastCheckIn = new Date(action.actionDate); // Check In
                    } else if (action.actionID === 2 && lastCheckIn) {
                      const checkOut = new Date(action.actionDate); // Check Out
                      const workDuration = (checkOut - lastCheckIn) / (1000 * 60);
                      totalWorkingMinutes += workDuration;
                      lastCheckIn = null;
                    } else if (action.actionID === 3) {
                      breakStart = new Date(action.actionDate); // Break Start
                    } else if (action.actionID === 4 && breakStart) {
                      const breakEnd = new Date(action.actionDate); // Break End
                      const breakDuration = (breakEnd - breakStart) / (1000 * 60);
                      totalWorkingMinutes -= breakDuration;
                      breakStart = null;
                    }
                  });

                  totalWorkingMinutes = Math.max(0, totalWorkingMinutes);
                  const totalWorkingHours = (totalWorkingMinutes / 60).toFixed(2);

                  const effectiveWorkingHours = Math.min(totalWorkingHours, requiredWorkingHours);

                  // Insert or update weekly working hours
                  const workingHoursSql = `
                    INSERT INTO Weekly_Working_Hours (employeeID, weekStartDate, weekEndDate, totalWorkingHours)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE totalWorkingHours = VALUES(totalWorkingHours);
                  `;

                  db.query(
                    workingHoursSql,
                    [employeeID, formattedWeekStartDate, formattedWeekEndDate, totalWorkingHours],
                    (err, results) => {
                      if (err) {
                        console.error(`Error updating weekly working hours for employee ${employeeID}:`, err);
                        return reject(err);
                      }

                      // Continue with leave balance updates
                      const personalLeaveRate = 1.462;
                      const annualLeaveRate = 2.923;

                      const accruedPersonalLeave = (effectiveWorkingHours / requiredWorkingHours) * personalLeaveRate;
                      const accruedAnnualLeave = (effectiveWorkingHours / requiredWorkingHours) * annualLeaveRate;

                      // Update Leave_Balance Table
                      const updateLeaveBalanceSql = `
                        INSERT INTO Leave_Balance (employeeID, leaveTypeID, contractTypeID, balance, lastUpdatedDate)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                          balance = balance + VALUES(balance),
                          lastUpdatedDate = VALUES(lastUpdatedDate);
                      `;

                      const leaveTypes = [
                        { leaveTypeID: 1, accruedLeave: accruedAnnualLeave }, // Annual Leave
                        { leaveTypeID: 2, accruedLeave: accruedPersonalLeave }, // Personal Leave
                      ];

                      const leaveTasks = leaveTypes.map((leaveType) => {
                        return new Promise((resolve, reject) => {
                          db.query(
                            updateLeaveBalanceSql,
                            [
                              employeeID,
                              leaveType.leaveTypeID,
                              contractTypeID,
                              leaveType.accruedLeave,
                              formattedWeekStartDate, // Update lastUpdatedDate to the current week start
                            ],
                            (err) => {
                              if (err) {
                                console.error(
                                  `Error updating Leave Balance for EmployeeID: ${employeeID}, LeaveTypeID: ${leaveType.leaveTypeID}`,
                                  err
                                );
                                return reject(err);
                              }
                              console.log(
                                `Leave Balance updated successfully for EmployeeID: ${employeeID}, LeaveTypeID: ${leaveType.leaveTypeID} for week starting ${formattedWeekStartDate}`
                              );
                              resolve();
                            }
                          );
                        });
                      });

                      Promise.all(leaveTasks)
                        .then(() => {
                          console.log(`Leave balances updated for employee ${employeeID} for week starting ${formattedWeekStartDate}`);
                          resolve();
                        })
                        .catch((err) => reject(err));
                    }
                  );
                });
              });
            });
          });

          Promise.all(weekTasks)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      });

      Promise.all(tasks)
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  });
};



// API Handler
export const calculateWeeklyWorkingHours_LeaveBalance = async (req, res) => {
  try {
    await performWeeklyCalculation();
    res.status(200).json({ Status: "Success", Message: "Weekly working hours and Leave Balance calculated successfully" });
  } catch (err) {
    console.error("Error calculating weekly working hours or Leave Balance:", err);
    res.status(500).json({ error: "Error calculating weekly working hours or Leave Balance", details: err.message });
  }
};

// Scheduled Job
schedule.scheduleJob('59 23 * * 0', async () => {
  console.log(`Scheduled job triggered at ${new Date().toISOString()}`);
  try {
    await performWeeklyCalculation();
    console.log("Scheduled job completed successfully.");
  } catch (err) {
    console.error("Error in scheduled job:", err);
  }
});


// Controller to create or update an action
export const createAction = (req, res) => {
  const { actionID, actionName } = req.body;
  // Validate input for creation
  if (!actionID && !actionName) {
    return res.status(400).json({ error: "Please provide an actionName for creating an action" });
  }
  // If actionID is provided, perform an update
  if (actionID) {
    // Build the dynamic query and values for updating the action
    let updateFields = [];
    let updateValues = [];

    if (actionName) {
      updateFields.push('actionName = ?');
      updateValues.push(actionName);
    }

    updateValues.push(actionID);

    // Only proceed if there are fields to update
    if (updateFields.length > 0) {
      const updateActionSql = `UPDATE Actions SET ${updateFields.join(', ')} WHERE actionID = ?`;

      db.query(updateActionSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating action:", err);
          return res.status(500).json({ error: "Error updating action data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Action updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    // If actionID is not provided, proceed with creation
    const sql = "INSERT INTO Actions (actionName) VALUES (?)";
    const values = [actionName];

    // Insert action into the database
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create action" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { actionID: result.insertId, actionName }
      });
    });
  }
};

// Controller to delete an action
export const deleteAction = (req, res) => {
  const { actionID } = req.params;

  if (!actionID) {
    return res.status(400).json({ error: "Please provide an actionID to delete" });
  }

  // Step 1: Update related records to remove references to the action
  const updateRelatedRecordsSql = `
    UPDATE Finger_Print
    SET actionID = NULL
    WHERE actionID = ?;
  `;

  db.query(updateRelatedRecordsSql, [actionID], (err, updateResult) => {
    if (err) {
      console.error("Error updating related records to remove references to the action:", err);
      return res.status(500).json({ error: "Failed to update related records", details: err.message });
    }

    // Step 2: Delete the action after updating references
    const deleteActionSql = "DELETE FROM Actions WHERE actionID = ?";
    db.query(deleteActionSql, [actionID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting action:", err);
        return res.status(500).json({ error: "Error deleting action", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Action not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Action and associated references deleted successfully" });
    });
  });
};


// Normalize the date format to YYYY-MM-DDTHH:mm:ss
const normalizeDate = (dateString) => {
  const [year, month, day, time] = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{2}:\d{2})$/).slice(1);
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`;  // Append seconds
};

export const recordFingerprint = (req, res) => {
  const { fingerPrintID, fullName, actionName, actionDate } = req.body;

  if (!fullName || !actionName || !actionDate) {
    return res.status(400).json({
      error: "Please provide fullName, actionName, and actionDate for creating or updating a fingerprint record"
    });
  }

  let normalizedActionDate;
  try {
    normalizedActionDate = normalizeDate(actionDate);
  } catch (err) {
    return res.status(400).json({
      error: "Invalid actionDate format. Please provide a valid date"
    });
  }

  const parsedDate = new Date(normalizedActionDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      error: "Invalid actionDate format. Please provide a valid date"
    });
  }

  const formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

  if (fingerPrintID) {
    // Update fingerprint record
    const updateFingerprintSql = `
      UPDATE Finger_Print 
      SET actionDate = ? 
      WHERE fingerPrintID = ?
    `;
    db.query(updateFingerprintSql, [formattedDate, fingerPrintID], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Error updating fingerprint record data",
          details: err.message,
        });
      }

      return res.status(200).json({
        Status: "Update Success",
        Message: "Fingerprint record updated successfully",
      });
    });
  } else {
    // Insert a new fingerprint record
    const getEmployeeIDSql = `SELECT e.employeeID FROM employees e WHERE CONCAT(e.firstName, ' ', e.secondName) = ?`;
    db.query(getEmployeeIDSql, [fullName], (err, employeeResult) => {
      if (err) return res.status(500).json({ error: "Failed to find employee by full name" });

      if (employeeResult.length === 0) return res.status(404).json({ error: `User with full name '${fullName}' not found` });

      const employeeID = employeeResult[0].employeeID;
      const getActionIDSql = "SELECT actionID FROM Actions WHERE actionName = ?";
      db.query(getActionIDSql, [actionName], (err, actionResult) => {
        if (err) return res.status(500).json({ error: "Failed to find action by name" });

        if (actionResult.length === 0) return res.status(404).json({ error: `Action '${actionName}' not found` });

        const actionID = actionResult[0].actionID;
        const checkExistingFingerprintSql = `
          SELECT fingerPrintID FROM Finger_Print 
          WHERE employeeID = ? AND actionID = ? AND DATE(actionDate) = DATE(?)
        `;
        db.query(checkExistingFingerprintSql, [employeeID, actionID, formattedDate], (err, existingResult) => {
          if (err) return res.status(500).json({ error: "Failed to check existing fingerprint record" });

          if (existingResult.length > 0) {
            return res.status(400).json({ error: "Fingerprint record already exists for this employee and action on the given date" });
          } else {
            const insertFingerprintSql = `
              INSERT INTO Finger_Print (employeeID, actionID, actionDate) 
              VALUES (?, ?, ?)
            `;
            const values = [employeeID, actionID, formattedDate];
            db.query(insertFingerprintSql, values, (err, result) => {
              if (err) return res.status(500).json({ error: "Failed to record fingerprint action", details: err });
              res.status(201).json({
                Status: "Success",
                Data: { fingerPrintID: result.insertId, employeeID, actionID, actionDate: formattedDate },
              });
            });
          }
        });
      });
    });
  }
};

export const updateFingerprint = (req, res) => {
  const { fingerPrintID, actionName, actionDate } = req.body;

  if (!fingerPrintID || !actionName || !actionDate) {
    return res.status(400).json({
      error: "Please provide fingerPrintID, actionName, and actionDate for updating the fingerprint record"
    });
  }

  let normalizedActionDate;
  try {
    normalizedActionDate = normalizeDate(actionDate);
  } catch (err) {
    return res.status(400).json({
      error: "Invalid actionDate format. Please provide a valid date"
    });
  }

  const parsedDate = new Date(normalizedActionDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      error: "Invalid actionDate format. Please provide a valid date"
    });
  }

  const formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

  const getActionIDSql = "SELECT actionID FROM Actions WHERE actionName = ?";
  db.query(getActionIDSql, [actionName], (err, actionResult) => {
    if (err) return res.status(500).json({ error: "Failed to find action by name" });

    if (actionResult.length === 0) return res.status(404).json({ error: `Action '${actionName}' not found` });

    const actionID = actionResult[0].actionID;
    const updateFingerprintSql = `
      UPDATE Finger_Print 
      SET actionID = ?, actionDate = ? 
      WHERE fingerPrintID = ?
    `;
    db.query(updateFingerprintSql, [actionID, formattedDate, fingerPrintID], (err, result) => {
      if (err) return res.status(500).json({
        error: "Error updating fingerprint record data",
        details: err.message,
      });

      return res.status(200).json({
        Status: "Update Success",
        Message: "Fingerprint record updated successfully",
      });
    });
  });
};




// Controller to delete a fingerprint record
export const deleteFingerprintRecord = (req, res) => {
  const { fingerPrintID } = req.params;

  if (!fingerPrintID) {
    return res.status(400).json({ error: "Please provide a fingerPrintID to delete" });
  }

  const deleteFingerprintSql = "DELETE FROM Finger_Print WHERE fingerPrintID = ?";
  db.query(deleteFingerprintSql, [fingerPrintID], (err, result) => {
    if (err) {
      console.error("Error deleting fingerprint record:", err);
      return res.status(500).json({ error: "Error deleting fingerprint record", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Fingerprint record not found" });
    }

    return res.status(200).json({ Status: "Delete Success", Message: "Fingerprint record deleted successfully" });
  });
};
export const getEmployeeAttendanceRecords = (req, res) => {
  // Extract token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'

  // Query to find the user by token and retrieve the employeeID
  const fetchUserSql = `SELECT employeeID FROM User WHERE token = ?`;

  db.query(fetchUserSql, [token], (err, userResults) => {
    if (err) {
      console.error("Error fetching user by token:", err);
      return res.status(500).json({ error: "Error fetching user data", details: err.message });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or invalid token" });
    }

    const employeeID = userResults[0].employeeID;

    // Query to get attendance records for the employee
    const fetchAttendanceRecordsSql = `
      SELECT fp.fingerPrintID, fp.actionID, a.actionName, fp.actionDate
      FROM finger_print fp
      JOIN actions a ON fp.actionID = a.actionID
      WHERE fp.employeeID = ?
      ORDER BY fp.actionDate DESC
    `;

    db.query(fetchAttendanceRecordsSql, [employeeID], (err, records) => {
      if (err) {
        console.error("Error fetching attendance records:", err);
        return res.status(500).json({ error: "Error fetching attendance records", details: err.message });
      }

      if (records.length === 0) {
        return res.status(404).json({ error: "No attendance records found for this employee" });
      }

      // Return the attendance records
      return res.status(200).json({
        Status: "Success",
        AttendanceRecords: records,
      });
    });
  });
};




export const getAllAttendanceRecords = (req, res) => {
  // SQL query to fetch relevant fields for attendance records
  const sql = `
    SELECT 
      fp.fingerPrintID, 
      fp.employeeID, 
      CONCAT(e.firstName, ' ', e.secondName) AS employeeName,  -- Employee's full name
      fp.actionID, 
      a.actionName, 
      fp.actionDate
    FROM 
      Finger_Print fp
    INNER JOIN 
      employees e ON fp.employeeID = e.employeeID
    INNER JOIN 
      Actions a ON fp.actionID = a.actionID
    ORDER BY 
      fp.actionDate DESC
  `;

  // Execute the query to fetch attendance records
  db.query(sql, [], (err, results) => {
    if (err) {
      console.error('Error fetching attendance records:', err.message);
      return res.status(500).json({
        Status: "Error",
        Message: "Error fetching attendance records",
        Details: err.message,
      });
    }

    // Return the fetched data
    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};




export const getSupervisorAttendanceRecords = (req, res) => {
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

    // SQL query to fetch attendance records of employees that report to this supervisor
    const sql = `
      SELECT 
        fp.fingerPrintID, 
        fp.employeeID, 
        CONCAT(e.firstName, ' ', e.secondName) AS employeeName,  -- Employee's full name
        fp.actionID, 
        a.actionName, 
        fp.actionDate
      FROM 
        Finger_Print fp
      INNER JOIN 
        employees e ON fp.employeeID = e.employeeID
      INNER JOIN 
        Actions a ON fp.actionID = a.actionID
      WHERE 
        e.reportToID = ?  -- Filter by the supervisor's employeeID (only their direct reports)
      ORDER BY 
        fp.actionDate DESC
    `;

    // Execute the query with the supervisorID as the filter
    db.query(sql, [supervisorID], (err, results) => {
      if (err) {
        console.error('Error fetching supervisor employees attendance records:', err);
        return res.status(500).json({ error: "Error fetching supervisor employees attendance records" });
      }

      // Return the fetched data
      res.status(200).json({
        Status: "Success",
        Data: results,
      });
    });
  });
};



// Controller to get all actions of an employee on a specific date
export const getEmployeeActionsByDate = (req, res) => {
  const { employeeID, date } = req.params;

  // Validate input
  if (!employeeID || !date) {
    return res.status(400).json({ error: "Please provide employeeID and date" });
  }

  // SQL query to fetch all actions of the employee on the given date
  const sql = `
    SELECT 
      fp.fingerPrintID, 
      a.actionName, 
      fp.actionDate
    FROM 
      Finger_Print fp
    INNER JOIN 
      Actions a ON fp.actionID = a.actionID
    WHERE 
      fp.employeeID = ? 
      AND DATE(fp.actionDate) = DATE(?)
    ORDER BY 
      fp.actionDate ASC
  `;

  // Execute the query
  db.query(sql, [employeeID, date], (err, results) => {
    if (err) {
      console.error("Error fetching employee actions by date:", err);
      return res.status(500).json({ error: "Error fetching employee actions by date", details: err.message });
    }

    // Return the fetched data
    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};