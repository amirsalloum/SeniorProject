// api/controllers/payroll.controller.js
import db from '../db.js';  // Ensure the database connection is correct
import jwt from 'jsonwebtoken'; // Assuming you're using JWT for token handling

// Controller to create a new payroll status
export const createPayrollStatus = (req, res) => {
  const { statusPayrollID, StatusPayrollName } = req.body;

// Validate input for creation
  if (!statusPayrollID && !StatusPayrollName) {
    return res.status(400).json({ error: "Please provide a StatusPayrollName for creating a payroll status" });
  }

  // If statusPayrollID is provided, perform an update
  if (statusPayrollID) {
    // Build the dynamic query and values for updating the payroll status
    let updateFields = [];
    let updateValues = [];

    if (StatusPayrollName) {
      updateFields.push('StatusPayrollName = ?');
      updateValues.push(StatusPayrollName);
    }

    updateValues.push(statusPayrollID);

    // Only proceed if there are fields to update
    if (updateFields.length > 0) {
      const updatePayrollStatusSql = `UPDATE status_Payroll_Record SET ${updateFields.join(', ')} WHERE statusPayrollID = ?`;

      db.query(updatePayrollStatusSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating payroll status:", err);
          return res.status(500).json({ error: "Error updating payroll status data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Payroll status updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    // If statusPayrollID is not provided, proceed with creation
    const sql = "INSERT INTO status_Payroll_Record (StatusPayrollName) VALUES (?)";
    const values = [StatusPayrollName];

    // Insert payroll status into the database
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create payroll status" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { statusPayrollID: result.insertId, StatusPayrollName }
      });
    });
  }
};

export const generatePayroll = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Fetch all employees
    const employeesQuery = `SELECT * FROM employees`;
    db.query(employeesQuery, (err, employees) => {
      if (err) {
        console.error('Error fetching employees:', err);
        return res.status(500).json({ message: 'Failed to fetch employees', error: err });
      }

      const payrolls = [];

      employees.forEach(async (employee) => {
        // Fetch the contract type for the employee to get the required working hours
        const contractTypeQuery = `
          SELECT requiredWorkingHours FROM Contract_Type
          WHERE contractTypeID = ?;
        `;
        db.query(contractTypeQuery, [employee.contractTypeID], (err, contractTypeResult) => {
          if (err) {
            console.error('Error fetching contract type:', err);
            return res.status(500).json({ message: 'Failed to fetch contract type', error: err });
          }

          const requiredWorkingHours = contractTypeResult[0]?.requiredWorkingHours;
          if (!requiredWorkingHours) {
            return res.status(400).json({ message: 'Required working hours not found for contract type' });
          }

          // Calculate total working hours for the employee in the specified period
          const totalWorkingHoursQuery = `
            SELECT SUM(totalWorkingHours) AS totalWorkingHours
            FROM WeeklyWorkingHours
            WHERE employeeID = ? AND weekStartDate >= ? AND weekEndDate <= ?
          `;
          db.query(totalWorkingHoursQuery, [employee.employeeID, startDate, endDate], (err, totalWorkingHoursResult) => {
            if (err) {
              console.error('Error fetching working hours:', err);
              return res.status(500).json({ message: 'Failed to calculate working hours', error: err });
            }

            const totalWorkingHours = totalWorkingHoursResult[0]?.totalWorkingHours || 0;

            // Determine if the employee should receive a bonus or deduction
            let deductions = 0;
            let bonus = 0;

            if (totalWorkingHours < requiredWorkingHours) {
              deductions = 50; // Deduction for fewer hours worked
            } else if (totalWorkingHours > requiredWorkingHours) {
              bonus = 100; // Bonus for overtime worked
            }

            const totalAmount = employee.salary + bonus - deductions;

            // Create a payroll record
            const payrollQuery = `
              INSERT INTO Payroll_Record (periodStart, periodEnd, bonus, deductions, totalAmount, employeeID, statusPayrollID, expectedDate)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [startDate, endDate, bonus, deductions, totalAmount, employee.employeeID, 1, new Date()]; // Default to "Pending Payment"

            db.query(payrollQuery, values, (err, result) => {
              if (err) {
                console.error('Error creating payroll record:', err);
                return res.status(500).json({ message: 'Failed to create payroll record', error: err });
              }

              payrolls.push({ payrollID: result.insertId, ...values });

              // If all payrolls are created, return the response
              if (payrolls.length === employees.length) {
                res.status(201).json({
                  message: 'Payroll generated successfully!',
                  data: payrolls,
                });
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate payroll', error });
  }
};

export const createPayrollRecord = (req, res) => {
  const {
    payrollID,
    periodStart,
    periodEnd,
    bonus,
    deductions,
    totalAmount,
    fullName,  // Replace employeeID with fullName
    statusPayrollName,  // Replace statusPayrollID with statusPayrollName
    expectedDate,
    confirmationDatetime,
    paidDateTime
  } = req.body;

  // Validate input for creation
  if (!payrollID && (!periodStart || !periodEnd || !totalAmount || !fullName || !statusPayrollName)) {
    return res.status(400).json({ error: "Please provide periodStart, periodEnd, totalAmount, fullName, and statusPayrollName for creating a payroll record" });
  }

  // If payrollID is provided, perform an update
  if (payrollID) {
    // Build the dynamic query and values for updating the payroll record
    let updateFields = [];
    let updateValues = [];

    if (periodStart) {
      updateFields.push('periodStart = ?');
      updateValues.push(periodStart);
    }
    if (periodEnd) {
      updateFields.push('periodEnd = ?');
      updateValues.push(periodEnd);
    }
    if (bonus) {
      updateFields.push('bonus = ?');
      updateValues.push(bonus);
    }
    if (deductions) {
      updateFields.push('deductions = ?');
      updateValues.push(deductions);
    }
    if (totalAmount) {
      updateFields.push('totalAmount = ?');
      updateValues.push(totalAmount);
    }
    if (expectedDate) {
      updateFields.push('expectedDate = ?');
      updateValues.push(expectedDate);
    }
    if (confirmationDatetime) {
      updateFields.push('confirmationDatetime = ?');
      updateValues.push(confirmationDatetime);
    }
    if (paidDateTime) {
      updateFields.push('paidDateTime = ?');
      updateValues.push(paidDateTime);
    }

    updateValues.push(payrollID);

    // Only proceed if there are fields to update
    if (updateFields.length > 0) {
      const updatePayrollRecordSql = `UPDATE Payroll_Record SET ${updateFields.join(', ')} WHERE payrollID = ?`;

      db.query(updatePayrollRecordSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating payroll record:", err);
          return res.status(500).json({ error: "Error updating payroll record data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Payroll record updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    // If payrollID is not provided, proceed with creation
    // Step 1: Get employeeID from fullName
    const getEmployeeIDSql = `
      SELECT e.employeeID 
      FROM employees e 
      JOIN User u ON e.employeeID = u.employeeID 
      WHERE CONCAT(e.firstName, ' ', e.secondName) = ?`;

    db.query(getEmployeeIDSql, [fullName], (err, employeeResult) => {
      if (err) {
        console.error('Database query error (finding employeeID):', err);
        return res.status(500).json({ error: "Failed to find employee by full name" });
      }

      if (employeeResult.length === 0) {
        return res.status(404).json({ error: `User with full name '${fullName}' not found` });
      }

      const employeeID = employeeResult[0].employeeID;

      // Step 2: Get statusPayrollID from statusPayrollName
      const getStatusPayrollIDSql = "SELECT statusPayrollID FROM status_Payroll_Record WHERE StatusPayrollName = ?";
      db.query(getStatusPayrollIDSql, [statusPayrollName], (err, statusPayrollResult) => {
        if (err) {
          console.error('Database query error (finding statusPayrollID):', err);
          return res.status(500).json({ error: "Failed to find status payroll by name" });
        }

        if (statusPayrollResult.length === 0) {
          return res.status(404).json({ error: `Status Payroll '${statusPayrollName}' not found` });
        }

        const statusPayrollID = statusPayrollResult[0].statusPayrollID;

        // Step 3: Insert the payroll record into the Payroll_Record table
        const insertPayrollRecordSql = `
          INSERT INTO Payroll_Record (
            periodStart, periodEnd, bonus, deductions, totalAmount, employeeID, statusPayrollID, expectedDate, confirmationDatetime, paidDateTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [periodStart, periodEnd, bonus, deductions, totalAmount, employeeID, statusPayrollID, expectedDate, confirmationDatetime, paidDateTime];

        db.query(insertPayrollRecordSql, values, (err, result) => {
          if (err) {
            console.error('Database query error (inserting payroll record):', err);
            return res.status(500).json({ error: "Failed to create payroll record" });
          }

          res.status(201).json({
            Status: "Success",
            Data: { payrollID: result.insertId }
          });
        });
      });
    });
  }
};

// Controller to delete a payroll status
export const deletePayrollStatus = (req, res) => {
  const { statusPayrollID } = req.params;

  if (!statusPayrollID) {
    return res.status(400).json({ error: "Please provide a statusPayrollID to delete" });
  }

  // Begin a transaction to handle the deletion process
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Transaction error", details: err.message });
    }

    // Step 1: Update related payroll records to remove the reference to the status
    const updateRelatedPayrollSql = `
      UPDATE Payroll_Record 
      SET statusPayrollID = NULL 
      WHERE statusPayrollID = ?;
    `;
    db.query(updateRelatedPayrollSql, [statusPayrollID], (err) => {
      if (err) {
        console.error("Error updating related payroll records:", err);
        return db.rollback(() => {
          res.status(500).json({ error: "Error updating related payroll records", details: err.message });
        });
      }

      // Step 2: Delete the payroll status itself
      const deletePayrollStatusSql = "DELETE FROM status_Payroll_Record WHERE statusPayrollID = ?";
      db.query(deletePayrollStatusSql, [statusPayrollID], (err, result) => {
        if (err) {
          console.error("Error deleting payroll status:", err);
          return db.rollback(() => {
            res.status(500).json({ error: "Error deleting payroll status", details: err.message });
          });
        }

        // Check if the payroll status was actually deleted
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: "Payroll status not found or already deleted" });
          });
        }

        // Commit the transaction if all deletions are successful
        db.commit(err => {
          if (err) {
            console.error("Commit error:", err);
            return db.rollback(() => {
              res.status(500).json({ error: "Commit error", details: err.message });
            });
          }
          return res.status(200).json({ Status: "Delete Success", Message: "Payroll status deleted successfully" });
        });
      });
    });
  });
};

// Controller to delete a payroll record
export const deletePayrollRecord = (req, res) => {
  const { payrollID } = req.params;

  if (!payrollID) {
    return res.status(400).json({ error: "Please provide a payrollID to delete" });
  }

  // Delete the payroll record
  const deletePayrollRecordSql = "DELETE FROM Payroll_Record WHERE payrollID = ?";
  db.query(deletePayrollRecordSql, [payrollID], (err, result) => {
    if (err) {
      console.error("Error deleting payroll record:", err);
      return res.status(500).json({ error: "Failed to delete payroll record", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Payroll record not found or already deleted" });
    }

    res.status(200).json({ Status: "Delete Success", Message: "Payroll record deleted successfully" });
  });
};





const formatDateTime = (date) => {
  if (!date) return null; // Handle null dates
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const calculateWeeklyPayroll = async (req, res) => {
  try {
    const now = new Date();

    // Step 1: Fetch employees and their contract details who have start date <= current date
    const fetchEmployeesSql = `
      SELECT 
        e.employeeID, 
        e.StartDate,
        ct.requiredWorkingHours
      FROM employees e
      JOIN Contract_Type ct ON e.employeeID = ct.employeeID
      WHERE e.StartDate <= ?;  -- Ensure we only fetch employees who have started before the current date
    `;

    const employees = await new Promise((resolve, reject) => {
      db.query(fetchEmployeesSql, [now], (err, results) => {
        if (err) {
          console.error("Error fetching employees:", err);
          reject(err);
        } else {
          console.log(`Fetched employees: ${results.length}`);
          resolve(results);
        }
      });
    });

    if (employees.length === 0) {
      console.log("No employees to process for payroll.");
      return res.status(200).json({
        Status: "Success",
        Message: "No employees to process for payroll at this time.",
        Data: [],
      });
    }

    const payrollTasks = employees.map((employee) => {
      return new Promise(async (resolve, reject) => {
        const { employeeID, requiredWorkingHours, StartDate } = employee;

        // Skip employees whose StartDate is in the future
        const employeeStartDate = new Date(StartDate);
        if (employeeStartDate > now) {
          console.log(`Employee ${employeeID} has a future StartDate. Skipping.`);
          return resolve(); // Skip this employee
        }

        // Step 2: Calculate week start and week end (Monday to Sunday)
        const firstWeekStartDate = new Date(employeeStartDate);
        firstWeekStartDate.setDate(firstWeekStartDate.getDate() - firstWeekStartDate.getDay() + 1); // Monday
        firstWeekStartDate.setHours(0, 0, 0, 0); // Ensure the time is midnight

        const lastWeekStartDate = new Date(now);
        lastWeekStartDate.setDate(lastWeekStartDate.getDate() - lastWeekStartDate.getDay() + 1); // Monday
        lastWeekStartDate.setHours(0, 0, 0, 0); // Ensure it's Monday at 00:00:00

        let weekStartDate = new Date(firstWeekStartDate);
        const weeksToProcess = [];

        while (weekStartDate <= lastWeekStartDate) {
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6); // Sunday
          weekEndDate.setHours(23, 59, 59, 999); // End of Sunday (23:59:59)

          weeksToProcess.push({
            weekStartDate: new Date(weekStartDate),
            weekEndDate: new Date(weekEndDate),
          });

          weekStartDate.setDate(weekStartDate.getDate() + 7); // Move to the next week
        }

        // Process each week for the employee
        const weekTasks = weeksToProcess.map((week) => {
          return new Promise((resolve, reject) => {
            const formattedWeekStartDate = week.weekStartDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const formattedWeekEndDate = week.weekEndDate.toISOString().split('T')[0]; // YYYY-MM-DD

            // Step 3: Fetch attendance data for the week
            const fetchAttendanceSql = `
              SELECT actionID, actionDate
              FROM Finger_Print
              WHERE employeeID = ? AND DATE(actionDate) BETWEEN ? AND ?
              ORDER BY actionDate ASC;
            `;

            db.query(fetchAttendanceSql, [employeeID, formattedWeekStartDate, formattedWeekEndDate], (err, attendanceData) => {
              if (err) {
                console.error(`Error fetching attendance data for employee ${employeeID}:`, err);
                return reject(err);
              }

              if (attendanceData.length === 0) {
                console.log(`No attendance data for employee ${employeeID} in this week.`);
                return resolve(); // Skip if no attendance data
              }

              // Step 4: Calculate daily details
              const dailyDetails = [];
              let totalBaseSalary = 0;

              for (let i = 0; i < 7; i++) {
                const currentDate = new Date(week.weekStartDate);
                currentDate.setDate(currentDate.getDate() + i);

                const dailyAttendance = attendanceData.filter((action) => {
                  const actionDate = new Date(action.actionDate);
                  return actionDate.toDateString() === currentDate.toDateString();
                });

                let totalWorkedMinutes = 0;
                let totalBreakMinutes = 0;
                let lastCheckIn = null;
                let breakStart = null;
                let start = null;
                let finish = null;

                dailyAttendance.forEach((action) => {
                  if (action.actionID === 1) {
                    lastCheckIn = new Date(action.actionDate); // Check In
                    if (!start) start = lastCheckIn; // Set the first check-in as the start time
                  } else if (action.actionID === 2 && lastCheckIn) {
                    const checkOut = new Date(action.actionDate); // Check Out
                    totalWorkedMinutes += (checkOut - lastCheckIn) / (1000 * 60);
                    finish = checkOut; // Update the finish time to the latest check-out
                    lastCheckIn = null;
                  } else if (action.actionID === 3) {
                    breakStart = new Date(action.actionDate); // Break Start
                  } else if (action.actionID === 4 && breakStart) {
                    const breakEnd = new Date(action.actionDate); // Break End
                    totalBreakMinutes += (breakEnd - breakStart) / (1000 * 60);
                    breakStart = null;
                  }
                });

                const totalWorkedHours = totalWorkedMinutes / 60;
                const breakHours = totalBreakMinutes / 60;
                const baseSalary = totalWorkedHours - breakHours;

                totalBaseSalary += baseSalary;

                dailyDetails.push({
                  day: currentDate.toISOString().split('T')[0], // Correct date format (YYYY-MM-DD)
                  start: formatDateTime(start), // Format start time
                  finish: formatDateTime(finish), // Format finish time
                  totalWorkedHours: totalWorkedHours.toFixed(2),
                  breakAmount: breakHours.toFixed(2),
                  baseSalary: baseSalary.toFixed(2),
                });

                // Step 5: Insert daily payroll details into Daily_Payroll_Details table
                const insertDailyDetailSql = `
                  INSERT INTO Daily_Payroll_Details (
                    employeeID, day, start, finish, totalWorkedHours, breakAmount, baseSalary, weekStartDate, weekEndDate
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    totalWorkedHours = VALUES(totalWorkedHours),
                    breakAmount = VALUES(breakAmount),
                    baseSalary = VALUES(baseSalary);
                `;

                db.query(
                  insertDailyDetailSql,
                  [
                    employeeID,
                    currentDate.toISOString().split('T')[0], // Format the day as YYYY-MM-DD
                    formatDateTime(start),
                    formatDateTime(finish),
                    totalWorkedHours.toFixed(2),
                    breakHours.toFixed(2),
                    baseSalary.toFixed(2),
                    formattedWeekStartDate, // Week start in YYYY-MM-DD format
                    formattedWeekEndDate, // Week end in YYYY-MM-DD format
                  ],
                  (err) => {
                    if (err) {
                      console.error(`Error inserting daily payroll details for employee ${employeeID}:`, err);
                      return reject(err);
                    }
                  }
                );
              }

              // Step 6: Calculate total for the week
              const totalAmount = totalBaseSalary;

              // Insert payroll record into Payroll_Record table
              const insertPayrollSql = `
                INSERT INTO Payroll_Record (
                  periodStart, periodEnd, bonus, deductions, totalAmount, employeeID, statusPayrollID, expectedDate
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  totalAmount = VALUES(totalAmount),
                  bonus = VALUES(bonus),
                  deductions = VALUES(deductions),
                  expectedDate = VALUES(expectedDate);
              `;

              db.query(
                insertPayrollSql,
                [
                  formattedWeekStartDate, // periodStart (Monday)
                  formattedWeekEndDate, // periodEnd (Sunday)
                  0, // bonus (assuming zero for simplicity)
                  0, // deductions (assuming zero for simplicity)
                  totalAmount, // totalAmount
                  employeeID, // employeeID
                  1, // statusPayrollID (assuming 1 is the "processed" status)
                  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), // expectedDate
                ],
                (err) => {
                  if (err) {
                    console.error(`Error inserting payroll for employee ${employeeID}:`, err);
                    return reject(err);
                  }

                  resolve({
                    employeeID,
                    weeklyPayroll: {
                      totalAmount: totalAmount.toFixed(2),
                      dailyDetails,
                    },
                  });
                }
              );
            });
          });
        });

        await Promise.all(weekTasks);
        resolve();
      });
    });

    const payrollResults = await Promise.all(payrollTasks);

    res.status(200).json({
      Status: "Success",
      Message: "Weekly payroll calculated successfully",
      Data: payrollResults,
    });
  } catch (err) {
    console.error("Error calculating payroll:", err);
    res.status(500).json({ error: "Error calculating payroll", details: err.message });
  }
};



export const getAllPayrollRecords = async (req, res) => {
  try {
    // The userID is already extracted from the token by the authentication middleware
    const employeeID = req.user.userID;

    // Fetch all weekly payroll records for the employee
    const fetchWeeklyPayrollSql = `
      SELECT 
        pr.periodStart, 
        pr.periodEnd, 
        pr.totalAmount, 
        pr.bonus, 
        pr.deductions
      FROM Payroll_Record pr
      WHERE pr.employeeID = ?
      ORDER BY pr.periodStart DESC;
    `;

    const weeklyPayrollRecords = await new Promise((resolve, reject) => {
      db.query(fetchWeeklyPayrollSql, [employeeID], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (weeklyPayrollRecords.length === 0) {
      return res.status(404).json({ Error: "No payroll data found for the specified employee" });
    }

    // Fetch daily details for each week
    const fetchDailyDetailsSql = `
      SELECT 
        dpd.day, 
        dpd.start, 
        dpd.finish, 
        dpd.totalWorkedHours, 
        dpd.breakAmount, 
        dpd.baseSalary, 
        dpd.weekStartDate, 
        dpd.weekEndDate
      FROM Daily_Payroll_Details dpd
      WHERE dpd.employeeID = ?
      ORDER BY dpd.weekStartDate DESC, dpd.day ASC;
    `;

    const dailyDetails = await new Promise((resolve, reject) => {
      db.query(fetchDailyDetailsSql, [employeeID], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Helper function to format date to YYYY-MM-DD (removing time)
    const formatDateToYMD = (date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Adjust for timezone offset
      return d.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'
    };

    // Helper function to format time to HH:MM:SS (local time)
    const formatTime = (time) => {
      const date = new Date(time);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Adjust for timezone offset
      return date.toLocaleTimeString('en-GB', { hour12: false }); // Format time to 'HH:mm:ss'
    };

    // Combine weekly and daily details
    const payrollData = weeklyPayrollRecords.map((week) => {
      const weekStart = formatDateToYMD(week.periodStart);  // Format to date only
      const weekEnd = formatDateToYMD(week.periodEnd);      // Format to date only

      // Ensure totalAmount is a valid number before calling toFixed()
      const totalAmount = parseFloat(week.totalAmount) || 0;
      const bonus = parseFloat(week.bonus) || 0;
      const deductions = parseFloat(week.deductions) || 0;

      return {
        weekStart,
        weekEnd,
        totalAmount: totalAmount.toFixed(2), // Apply .toFixed() after parsing to float
        bonus: bonus.toFixed(2),
        deductions: deductions.toFixed(2),
        // Filter dailyDetails by comparing formatted weekStart and weekEnd
        dailyDetails: dailyDetails.filter(
          (day) => formatDateToYMD(day.weekStartDate) === weekStart && formatDateToYMD(day.weekEndDate) === weekEnd
        ).map((day) => ({
          ...day,
          day: formatDateToYMD(day.day), // Format date for display
          start: day.start ? formatTime(day.start) : null, // Format time
          finish: day.finish ? formatTime(day.finish) : null, // Format time
        })),
      };
    });

    res.status(200).json({
      Status: "Success",
      Payroll: payrollData,
    });
  } catch (error) {
    console.error("Error fetching payroll data:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ Error: "Invalid or expired token", Details: error.message });
    }

    res.status(500).json({ Error: "Failed to fetch payroll data", Details: error.message });
  }
};


export const getAllEmployeesPayrollRecords = async (req, res) => {
  try {
    // Fetch all payroll records for all employees
    const fetchAllPayrollRecordsSql = `
      SELECT 
        pr.employeeID,
        pr.periodStart, 
        pr.periodEnd, 
        pr.totalAmount, 
        pr.bonus, 
        pr.deductions
      FROM Payroll_Record pr
      ORDER BY pr.periodStart DESC;
    `;

    const allPayrollRecords = await new Promise((resolve, reject) => {
      db.query(fetchAllPayrollRecordsSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (allPayrollRecords.length === 0) {
      return res.status(404).json({ Error: "No payroll records found for any employee" });
    }

    // Fetch daily details for all employees
    const fetchAllDailyDetailsSql = `
      SELECT 
        dpd.employeeID, 
        dpd.day, 
        dpd.start, 
        dpd.finish, 
        dpd.totalWorkedHours, 
        dpd.breakAmount, 
        dpd.baseSalary, 
        dpd.weekStartDate, 
        dpd.weekEndDate
      FROM Daily_Payroll_Details dpd
      ORDER BY dpd.weekStartDate DESC, dpd.day ASC;
    `;

    const allDailyDetails = await new Promise((resolve, reject) => {
      db.query(fetchAllDailyDetailsSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Helper function to format date to YYYY-MM-DD (removing time)
    const formatDateToYMD = (date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Adjust for timezone offset
      return d.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'
    };

    // Helper function to format time to HH:MM:SS (local time)
    const formatTime = (time) => {
      const date = new Date(time);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Adjust for timezone offset
      return date.toLocaleTimeString('en-GB', { hour12: false }); // Format time to 'HH:mm:ss'
    };

    // Combine weekly and daily details for each employee
    const payrollData = allPayrollRecords.map((week) => {
      const weekStart = formatDateToYMD(week.periodStart);  // Format to date only
      const weekEnd = formatDateToYMD(week.periodEnd);      // Format to date only

      // Ensure totalAmount is a valid number before calling toFixed()
      const totalAmount = parseFloat(week.totalAmount) || 0;
      const bonus = parseFloat(week.bonus) || 0;
      const deductions = parseFloat(week.deductions) || 0;

      return {
        employeeID: week.employeeID,
        weekStart,
        weekEnd,
        totalAmount: totalAmount.toFixed(2), // Apply .toFixed() after parsing to float
        bonus: bonus.toFixed(2),
        deductions: deductions.toFixed(2),
        // Filter dailyDetails by comparing formatted weekStart and weekEnd
        dailyDetails: allDailyDetails.filter(
          (day) => formatDateToYMD(day.weekStartDate) === weekStart && formatDateToYMD(day.weekEndDate) === weekEnd && day.employeeID === week.employeeID
        ).map((day) => ({
          ...day,
          day: formatDateToYMD(day.day), // Format date for display
          start: day.start ? formatTime(day.start) : null, // Format time
          finish: day.finish ? formatTime(day.finish) : null, // Format time
        })),
      };
    });

    res.status(200).json({
      Status: "Success",
      Payroll: payrollData,
    });
  } catch (error) {
    console.error("Error fetching payroll data:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ Error: "Invalid or expired token", Details: error.message });
    }

    res.status(500).json({ Error: "Failed to fetch payroll data", Details: error.message });
  }
};


