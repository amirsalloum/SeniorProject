// api/controllers/workSchedule.controller.js
import db from '../db.js';  // Ensure your DB connection is correct

// Controller to create or update a work schedule
export const createWorkSchedule = (req, res) => {
  const { scheduleID, fullName, startTime, endTime, day } = req.body;

  // Validate input for creation
  if (!scheduleID && (!fullName || !day)) {
    return res.status(400).json({ error: "Please provide fullName, day, startTime, and endTime for creating a work schedule." });
  }

  // Check for invalid combinations of startTime and endTime
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return res.status(400).json({
      error: "Both startTime and endTime must be provided together for a scheduled day."
    });
  }

  // Fetch contract type for validation
  const getContractTypeSql = `
    SELECT ctm.contractTypeName
    FROM Contract_Type ct
    JOIN Contract_Type_Master ctm ON ct.contractTypeMasterID = ctm.contractTypeMasterID
    JOIN employees e ON ct.employeeID = e.employeeID
    WHERE CONCAT(e.firstName, ' ', e.secondName) = ?
  `;

  db.query(getContractTypeSql, [fullName], (err, result) => {
    if (err) {
      console.error("Database query error (fetching contract type):", err);
      return res.status(500).json({ error: "Failed to fetch contract type for the employee." });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `No contract type found for employee '${fullName}'.` });
    }

    const contractTypeName = result[0].contractTypeName;

    if (scheduleID) {
      // If scheduleID is provided, perform an update
      let updateFields = [];
      let updateValues = [];

      if (startTime) {
        updateFields.push('startTime = ?');
        updateValues.push(startTime);
      }
      if (endTime) {
        updateFields.push('endTime = ?');
        updateValues.push(endTime);
      }
      if (day) {
        updateFields.push('day = ?');
        updateValues.push(day);
      }

      updateValues.push(scheduleID);

      // Proceed with update only if there are fields to update
      if (updateFields.length > 0) {
        const updateWorkScheduleSql = `UPDATE Work_Schedules SET ${updateFields.join(', ')} WHERE scheduleID = ?`;

        db.query(updateWorkScheduleSql, updateValues, (err, result) => {
          if (err) {
            console.error("Error updating work schedule:", err);
            return res.status(500).json({ error: "Error updating work schedule data", details: err.message });
          }

          return res.status(200).json({ Status: "Update Success", Message: "Work schedule updated successfully" });
        });
      } else {
        return res.status(400).json({ error: "No fields provided to update." });
      }
    } else {
      // Insert validation for Full-Time contracts
      if (contractTypeName === 'Full-Time') {
        const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

        const getEmployeeScheduleSql = `
          SELECT day FROM Work_Schedules ws
          JOIN employees e ON ws.employeeID = e.employeeID
          WHERE CONCAT(e.firstName, ' ', e.secondName) = ?
        `;

        db.query(getEmployeeScheduleSql, [fullName], (err, scheduleResult) => {
          if (err) {
            console.error("Database query error (fetching work schedule):", err);
            return res.status(500).json({ error: "Failed to fetch current work schedule." });
          }

          const existingDays = scheduleResult.map(row => row.day);
          const missingDays = weekdays.filter(day => !existingDays.includes(day));

          if (missingDays.length > 0) {
            return res.status(400).json({
              error: `For Full-Time contracts, all weekdays (Monday to Friday) must have a work schedule. Missing days: ${missingDays.join(', ')}`
            });
          }

          // Insert new schedule
          insertNewSchedule();
        });
      } else {
        // Insert new schedule for Part-Time contracts without additional validation
        insertNewSchedule();
      }

      function insertNewSchedule() {
        const getEmployeeIDSql = `
          SELECT e.employeeID 
          FROM employees e 
          JOIN User u ON e.employeeID = u.employeeID 
          WHERE CONCAT(e.firstName, ' ', e.secondName) = ?`;

        db.query(getEmployeeIDSql, [fullName], (err, employeeResult) => {
          if (err) {
            console.error('Database query error (finding employeeID):', err);
            return res.status(500).json({ error: "Failed to find employee by full name." });
          }

          if (employeeResult.length === 0) {
            return res.status(404).json({ error: `User with full name '${fullName}' not found.` });
          }

          const employeeID = employeeResult[0].employeeID;

          const insertWorkScheduleSql = `
            INSERT INTO Work_Schedules (employeeID, startTime, endTime, day) VALUES (?, ?, ?, ?)`;
          const values = [employeeID, startTime, endTime, day];

          db.query(insertWorkScheduleSql, values, (err, result) => {
            if (err) {
              console.error('Database query error (inserting work schedule):', err);
              return res.status(500).json({ error: "Failed to create work schedule." });
            }

            res.status(201).json({
              Status: "Success",
              Data: { scheduleID: result.insertId, employeeID, startTime, endTime, day }
            });
          });
        });
      }
    }
  });
};



// Controller to delete a work schedule by scheduleID
export const deleteWorkSchedule = (req, res) => {
  const { scheduleID } = req.params;

  // Validate input
  if (!scheduleID) {
    return res.status(400).json({ error: "Please provide a scheduleID to delete" });
  }

  // SQL to delete the work schedule
  const deleteWorkScheduleSql = "DELETE FROM Work_Schedules WHERE scheduleID = ?";

  db.query(deleteWorkScheduleSql, [scheduleID], (err, result) => {
    if (err) {
      console.error("Error deleting work schedule:", err);
      return res.status(500).json({ error: "Failed to delete work schedule", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Work schedule not found or already deleted" });
    }

    res.status(200).json({ Status: "Delete Success", Message: "Work schedule deleted successfully" });
  });
};