// src/controllers/leave.controller.js
import db from '../db.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { calculateAccruedLeave } from '../Utils/calculateAccruedLeave.js';  // Import the helper function
import { io } from "../app.js";


export const createLeaveType = (req, res) => {
  const { leaveTypeID, leaveTypeName } = req.body;

  // Validate input for creation
  if (!leaveTypeID && !leaveTypeName) {
    return res.status(400).json({ error: "Please provide a leaveTypeName for creating a leave type" });
  }

  // If leaveTypeID is provided, perform an update
  if (leaveTypeID) {
    let updateFields = [];
    let updateValues = [];

    if (leaveTypeName) {
      updateFields.push('leaveTypeName = ?');
      updateValues.push(leaveTypeName);
    }

    updateValues.push(leaveTypeID);

    if (updateFields.length > 0) {
      const updateLeaveTypeSql = `UPDATE Leave_Type SET ${updateFields.join(', ')} WHERE leaveTypeID = ?`;
      db.query(updateLeaveTypeSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating leave type:", err);
          return res.status(500).json({ error: "Error updating leave type data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Leave type updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Leave_Type (leaveTypeName) VALUES (?)";
    const values = [leaveTypeName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create leave type" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { leaveTypeID: result.insertId, leaveTypeName }
      });
    });
  }
};

// Controller to delete a leave type
export const deleteLeaveType = (req, res) => {
  const { leaveTypeID } = req.params;

  if (!leaveTypeID) {
    return res.status(400).json({ error: "Please provide a leaveTypeID to delete" });
  }

  // Step 1: Check if the leave type is used in any leave requests
  const checkRelatedLeaveRequestsSql = "SELECT leaveRequestID FROM Leave_Request WHERE leaveTypeID = ?";
  db.query(checkRelatedLeaveRequestsSql, [leaveTypeID], (err, relatedRequests) => {
    if (err) {
      console.error("Error checking related leave requests:", err);
      return res.status(500).json({ error: "Failed to check related leave requests", details: err.message });
    }

    // If there are related leave requests, delete them first
    if (relatedRequests.length > 0) {
      const deleteRelatedLeaveRequestsSql = "DELETE FROM Leave_Request WHERE leaveTypeID = ?";
      db.query(deleteRelatedLeaveRequestsSql, [leaveTypeID], (err, result) => {
        if (err) {
          console.error("Error deleting related leave requests:", err);
          return res.status(500).json({ error: "Failed to delete related leave requests", details: err.message });
        }

        // Proceed to delete the leave type after related records are removed
        deleteLeaveTypeEntry(leaveTypeID, res);
      });
    } else {
      // If no related requests, proceed to delete the leave type directly
      deleteLeaveTypeEntry(leaveTypeID, res);
    }
  });
};

// Helper function to delete the leave type entry
const deleteLeaveTypeEntry = (leaveTypeID, res) => {
  const deleteLeaveTypeSql = "DELETE FROM Leave_Type WHERE leaveTypeID = ?";
  db.query(deleteLeaveTypeSql, [leaveTypeID], (err, result) => {
    if (err) {
      console.error("Error deleting leave type:", err);
      return res.status(500).json({ error: "Failed to delete leave type", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Leave type not found or already deleted" });
    }

    res.status(200).json({ Status: "Delete Success", Message: "Leave type deleted successfully" });
  });
}

// Controller to get all leave types
export const getLeaveTypes = (req, res) => {
  const sql = "SELECT leaveTypeID, leaveTypeName FROM Leave_Type";
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: "Failed to fetch leave types" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "No leave types found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: data
    });
  });
};

// Controller to create or update a leave status type
export const createLeaveStatus = (req, res) => {
  const { statusLeaveID, statusLeaveName } = req.body;

  if (!statusLeaveID && !statusLeaveName) {
    return res.status(400).json({ error: "Please provide a statusLeaveName for creating a leave status" });
  }

  if (statusLeaveID) {
    let updateFields = [];
    let updateValues = [];

    if (statusLeaveName) {
      updateFields.push('statusLeaveName = ?');
      updateValues.push(statusLeaveName);
    }

    updateValues.push(statusLeaveID);

    if (updateFields.length > 0) {
      const updateLeaveStatusSql = `UPDATE Leave_Status SET ${updateFields.join(', ')} WHERE statusLeaveID = ?`;
      db.query(updateLeaveStatusSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating leave status:", err);
          return res.status(500).json({ error: "Error updating leave status data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Leave status updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Leave_Status (statusLeaveName) VALUES (?)";
    const values = [statusLeaveName];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create leave status type" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { statusLeaveID: result.insertId, statusLeaveName }
      });
    });
  }
};

// Controller to delete a leave status
export const deleteLeaveStatus = (req, res) => {
  const { statusLeaveID } = req.params;

  if (!statusLeaveID) {
    return res.status(400).json({ error: "Please provide a statusLeaveID to delete" });
  }

  // Step 1: Update leave requests that reference this leave status to set statusLeaveID to NULL or a default value
  const updateLeaveRequestsSql = "UPDATE Leave_Request SET statusLeaveID = NULL WHERE statusLeaveID = ?";
  db.query(updateLeaveRequestsSql, [statusLeaveID], (err, updateResult) => {
    if (err) {
      console.error("Error updating leave requests to remove leave status reference:", err);
      return res.status(500).json({ error: "Failed to update leave requests", details: err.message });
    }

    // Step 2: Delete the leave status after updating references in leave requests
    const deleteLeaveStatusSql = "DELETE FROM Leave_Status WHERE statusLeaveID = ?";
    db.query(deleteLeaveStatusSql, [statusLeaveID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting leave status:", err);
        return res.status(500).json({ error: "Failed to delete leave status", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Leave status not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Leave status and associated references deleted successfully" });
    });
  });
}; 


// Function to get the employee ID from the user ID
const getEmployeeIDFromUserID = (userID, callback) => {
  const sql = `SELECT employeeID FROM User WHERE userID = ?`;
  db.query(sql, [userID], (err, result) => {
    if (err) {
      console.error('Error fetching employeeID:', err);
      callback(err, null);
    } else if (result.length === 0) {
      callback(new Error('Employee not found for the provided userID'), null);
    } else {
      callback(null, result[0].employeeID);
    }
  });
};
//notify employees for the acceptance of his request
const notifyEmployee = (employeeID, message, leaveRequestID, submittedByUserID) => {
  const insertNotificationSql = `
    INSERT INTO Notifications (userID, message, isRead, createdAt, submittedByUserID, leaveRequestID)
    VALUES (?, ?, 0, NOW(), ?, ?)
  `;

  db.query(insertNotificationSql, [employeeID, message, submittedByUserID, leaveRequestID], (err) => {
    if (err) {
      console.error("Error inserting notification for employee:", err);
    } else {
      io.emit("notification-received", { userID: employeeID, message });
    }
  });
};


const notifyAdmin = (leaveRequestID, submittedByUserID, message) => {
  const fetchAdminSql = `SELECT u.userID FROM User u WHERE u.roleID = 1`;

  db.query(fetchAdminSql, (err, adminUsers) => {
    if (err) {
      console.error("Error fetching Admins:", err);
      return;
    }

    adminUsers.forEach((adminUser) => {
      const insertNotificationSql = `
        INSERT INTO Notifications (userID, message, isRead, createdAt, submittedByUserID, leaveRequestID)
        VALUES (?, ?, 0, NOW(), ?, ?)
      `;
      db.query(insertNotificationSql, [adminUser.userID, message, submittedByUserID, leaveRequestID], (err) => {
        if (!err) {
          io.emit("notification-received", { userID: adminUser.userID, message });
        }
      });
    });
  });
};



//notify supervisors for an employee submitting a leave request
const notifySupervisor = (reportToID, employeeID, leaveRequestID, message) => {
  const insertNotificationSql = `
    INSERT INTO Notifications (userID, message, isRead, createdAt, submittedByUserID, leaveRequestID)
    VALUES (?, ?, 0, NOW(), ?, ?)
  `;
  db.query(insertNotificationSql, [reportToID, message, employeeID, leaveRequestID], (err) => {
    if (!err) {
      io.emit("notification-received", { userID: reportToID, message });
    }
  });
};
// notifying hrs for an employee submitting a leave request
const notifyHRs = (leaveRequestID, submittedByUserID, message) => {
  const fetchHRsSql = `SELECT u.userID FROM User u WHERE u.roleID = 3`;

  db.query(fetchHRsSql, (err, hrUsers) => {
    if (!err) {
      hrUsers.forEach((hrUser) => {
        const insertNotificationSql = `
          INSERT INTO Notifications (userID, message, isRead, createdAt, submittedByUserID, leaveRequestID)
          VALUES (?, ?, 0, NOW(), ?, ?)
        `;
        db.query(insertNotificationSql, [hrUser.userID, message, submittedByUserID, leaveRequestID], (err) => {
          if (!err) {
            io.emit("notification-received", { userID: hrUser.userID, message });
          }
        });
      });
    }
  });
};



export const submitLeaveRequest = (req, res) => {
  const {
    startDateTime,
    endDateTime,
    notes,
    leaveTypeName,
    allowOverBalance,
    userID: requestUserID,
  } = req.body;
  const tokenUserID = req.user.userID;

  // Log the user IDs for debugging
  console.log('Backend - requestUserID:', requestUserID);
  console.log('Backend - tokenUserID:', tokenUserID);

  // Security check: Ensure userID in the request body matches the token's userID
  if (parseInt(requestUserID) !== parseInt(tokenUserID)) {
    return res
      .status(403)
      .json({ error: 'Unauthorized action: User ID mismatch' });
  }

  // Ensure required fields are provided
  if (!startDateTime || !endDateTime || !leaveTypeName) {
    return res.status(400).json({
      error: 'Please provide startDateTime, endDateTime, and leaveTypeName',
    });
  }

  // Fetch employee details
  const fetchEmployeeSql = `
    SELECT 
      e.employeeID, 
      e.reportToID, 
      e.firstName 
    FROM User u
    JOIN employees e ON u.employeeID = e.employeeID
    WHERE u.userID = ?
  `;

  db.query(fetchEmployeeSql, [tokenUserID], (err, employeeResults) => {
    if (err) {
      console.error('Database error when fetching employee data:', err);
      return res
        .status(500)
        .json({ error: 'Database error when fetching employee data' });
    }
    if (employeeResults.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { employeeID, reportToID, firstName } = employeeResults[0];

    // Fetch leave type ID
    const fetchLeaveTypeSql =
      'SELECT leaveTypeID FROM Leave_Type WHERE leaveTypeName = ?';
    db.query(fetchLeaveTypeSql, [leaveTypeName], (err, leaveTypeResults) => {
      if (err) {
        console.error('Database error when fetching leave type:', err);
        return res
          .status(500)
          .json({ error: 'Database error when fetching leave type' });
      }
      if (leaveTypeResults.length === 0) {
        return res.status(404).json({
          error: `Leave type '${leaveTypeName}' not found`,
        });
      }

      const leaveTypeID = leaveTypeResults[0].leaveTypeID;

      // Fetch leave balances and used leave
      const fetchLeaveBalanceSql = `
        SELECT 
          COALESCE(SUM(lb.balance), 0) AS accruedLeaveHours, -- Stored as decimal hours
          COALESCE(SUM(
            CASE 
              WHEN lr.statusLeaveID = 2 THEN TIMESTAMPDIFF(MINUTE, lr.startDateTime, lr.endDateTime) / 60.0
              ELSE 0 
            END
          ), 0) AS usedLeaveHours -- Used leave also converted to decimal hours
        FROM Leave_Balance lb
        LEFT JOIN Leave_Request lr 
          ON lr.leaveTypeID = lb.leaveTypeID 
          AND lr.employeeID = lb.employeeID
        WHERE lb.employeeID = ? 
          AND lb.leaveTypeID = ?;
      `;
      db.query(
        fetchLeaveBalanceSql,
        [employeeID, leaveTypeID],
        (err, leaveBalanceResults) => {
          if (err) {
            console.error(
              'Database error when fetching leave balance:',
              err
            );
            return res
              .status(500)
              .json({ error: 'Database error when fetching leave balance' });
          }

          const { accruedLeaveHours, usedLeaveHours } =
            leaveBalanceResults[0];
          const remainingLeaveHours = accruedLeaveHours - usedLeaveHours;

          // Convert hours to days, hours, and minutes
          const convertHoursToDaysHoursMinutes = (hoursDecimal) => {
            const totalMinutes = Math.round(hoursDecimal * 60); // Total minutes
            const days = Math.floor(totalMinutes / (24 * 60));
            const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
            const minutes = totalMinutes % 60;
            return { days, hours, minutes };
          };

          const remainingLeave = convertHoursToDaysHoursMinutes(
            remainingLeaveHours
          );

          // Calculate requested leave in minutes and convert to hours
          const start = new Date(startDateTime);
          const end = new Date(endDateTime);
          const requestedTotalMinutes = Math.floor(
            (end - start) / (1000 * 60)
          );
          const requestedTotalHours = requestedTotalMinutes / 60.0;

          // Check if the requested leave exceeds the remaining balance
          if (
            requestedTotalHours > remainingLeaveHours &&
            !allowOverBalance
          ) {
            const remainingLeaveMessage = `${remainingLeave.days} days, ${remainingLeave.hours} hr, ${remainingLeave.minutes} min remaining.`;
            return res.status(200).json({
              exceedsBalance: true,
              remainingLeave: remainingLeaveMessage,
              requestedLeave: `${Math.floor(
                requestedTotalHours / 24
              )} days, ${Math.floor(
                requestedTotalHours % 24
              )} hr, ${Math.round(
                (requestedTotalHours % 1) * 60
              )} min`,
              message: `Leave request exceeds available balance. You have ${remainingLeaveMessage}`,
            });
          }

          // Handle document attachment
          const documentAttach = req.file ? req.file.filename : null;

          // Insert leave request
          const insertLeaveRequestSql = `
            INSERT INTO Leave_Request 
              (startDateTime, endDateTime, notes, leaveTypeID, employeeID, documentAttach, statusLeaveID)
            VALUES 
              (?, ?, ?, ?, ?, ?, 
                (SELECT statusLeaveID FROM Leave_Status WHERE statusLeaveName = 'Pending')
              )
          `;
          db.query(
            insertLeaveRequestSql,
            [
              startDateTime,
              endDateTime,
              notes,
              leaveTypeID,
              employeeID,
              documentAttach,
            ],
            (err, leaveRequestResult) => {
              if (err) {
                console.error('Error submitting leave request:', err);
                return res
                  .status(500)
                  .json({ error: 'Error submitting leave request' });
              }

              const leaveRequestID = leaveRequestResult.insertId;

              // Notify relevant parties
              let notificationMessage = `${firstName} submitted a new leave request.`;
              if (requestedTotalHours > remainingLeaveHours) {
                notificationMessage +=
                  ' Note: This request exceeds the available leave balance.';
              }

              notifySupervisor(
                reportToID,
                employeeID,
                leaveRequestID,
                notificationMessage
              );
              notifyHRs(leaveRequestID, employeeID, notificationMessage);
              notifyAdmin(leaveRequestID, employeeID, notificationMessage);
              if (typeof io !== 'undefined') {
                io.emit('newLeaveRequest', {
                  leaveRequestID,
                  employeeID,
                  notificationMessage,
                });
                io.emit('updateLeaveBalance', { employeeID });
              }

              // Log leave request in history
              const insertLeaveHistorySql = `
                INSERT INTO Leave_History 
                  (actionDate, actionTaken, actionByEmployeeID, leaveRequestID)
                VALUES 
                  (NOW(), 'Pending', NULL, ?)
              `;
              db.query(
                insertLeaveHistorySql,
                [leaveRequestID],
                (err) => {
                  if (err) {
                    console.error('Error logging leave history:', err);
                    return res
                      .status(500)
                      .json({ error: 'Error logging leave history' });
                  }

                  res.status(201).json({
                    Status: 'Success',
                    leaveRequestID,
                    Message:
                      'Leave request submitted and pending supervisor approval.',
                  });
                }
              );
            }
          );
        }
      );
    });
  });
};

 



// Controller to delete a leave request
export const deleteLeaveRequest = (req, res) => {
  const { leaveRequestID } = req.params;

  if (!leaveRequestID) {
    return res.status(400).json({ error: "Please provide a leaveRequestID to delete" });
  }

  const deleteLeaveRequestSql = "DELETE FROM Leave_Request WHERE leaveRequestID = ?";
  db.query(deleteLeaveRequestSql, [leaveRequestID], (err, result) => {
    if (err) {
      console.error("Error deleting leave request:", err);
      return res.status(500).json({ error: "Failed to delete leave request", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Leave request not found or already deleted" });
    }

    res.status(200).json({ Status: "Delete Success", Message: "Leave request deleted successfully" });
  });
};

// Controller to create or update a leave history
export const createLeaveHistory = (req, res) => {
  const { historyID, actionDate, actionTaken, actionByEmployeeID, rejectReason, leaveRequestID } = req.body;

  if (!historyID && (!actionDate || !actionTaken || !actionByEmployeeID || !leaveRequestID)) {
    return res.status(400).json({ error: "Please provide actionDate, actionTaken, actionByEmployeeID, and leaveRequestID for creating a leave history entry" });
  }

  if (historyID) {
    let updateFields = [];
    let updateValues = [];

    if (actionDate) {
      updateFields.push('actionDate = ?');
      updateValues.push(actionDate);
    }
    if (actionTaken) {
      updateFields.push('actionTaken = ?');
      updateValues.push(actionTaken);
    }
    if (actionByEmployeeID) {
      updateFields.push('actionByEmployeeID = ?');
      updateValues.push(actionByEmployeeID);
    }
    if (rejectReason !== undefined) {
      updateFields.push('rejectReason = ?');
      updateValues.push(rejectReason);
    }
    if (leaveRequestID) {
      updateFields.push('leaveRequestID = ?');
      updateValues.push(leaveRequestID);
    }

    updateValues.push(historyID);

    if (updateFields.length > 0) {
      const updateLeaveHistorySql = `UPDATE Leave_History SET ${updateFields.join(', ')} WHERE historyID = ?`;

      db.query(updateLeaveHistorySql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating leave history:", err);
          return res.status(500).json({ error: "Error updating leave history data", details: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "No leave history entry found with the given ID" });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Leave history updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const insertLeaveHistorySql = `
      INSERT INTO Leave_History (actionDate, actionTaken, actionByEmployeeID, rejectReason, leaveRequestID) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [actionDate, actionTaken, actionByEmployeeID, rejectReason || null, leaveRequestID];

    db.query(insertLeaveHistorySql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(400).json({ error: "Foreign key constraint fails. Check if the referenced IDs exist." });
        }

        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create leave history entry", details: err.message });
      }

      res.status(201).json({
        Status: "Success",
        Data: { historyID: result.insertId, actionDate, actionTaken, actionByEmployeeID, rejectReason, leaveRequestID }
      });
    });
  }
};


      
const getReportToAndDepartmentIDForLeaveRequest = (leaveRequestID, callback) => {
  const sql = `
    SELECT e.reportToID, e.departmentID 
    FROM Leave_Request lr
    JOIN employees e ON lr.employeeID = e.employeeID
    WHERE lr.leaveRequestID = ?
  `;
  db.query(sql, [leaveRequestID], (err, result) => {
    if (err) {
      console.error('Error fetching reportToID and departmentID:', err);
      callback(err, null);
    } else if (result.length === 0) {
      callback(new Error('Leave request not found or employee does not have a reportToID or departmentID'), null);
    } else {
      callback(null, result[0]);
    }
  });
};

// Supervisor's Decision on Leave Request
export const supervisorDecision = (req, res) => {
  const { leaveRequestID, decision, rejectReason, userID: requestUserID } = req.body;
  const tokenUserID = req.user.userID;

  // Security check: Ensure userID in the request body matches the token's userID
  if (parseInt(requestUserID) !== parseInt(tokenUserID)) {
    return res.status(403).json({ error: "Unauthorized action: User ID mismatch" });
  }

  getEmployeeIDFromUserID(tokenUserID, (err, supervisorID) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching supervisor's employee ID" });
    }

    getReportToAndDepartmentIDForLeaveRequest(leaveRequestID, (err, { reportToID }) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching reportToID and departmentID" });
      }

      if (supervisorID !== reportToID) {
        return res.status(403).json({ error: "You are not authorized to approve or reject this leave request." });
      }

      const fetchLeaveRequestSql = `
        SELECT lr.leaveRequestID, lr.employeeID, ls.statusLeaveID, lh.leaveRequestID as leaveHistoryRequestID, lh.supervisorDecision
        FROM Leave_Request lr
        JOIN Leave_Status ls ON lr.statusLeaveID = ls.statusLeaveID
        LEFT JOIN Leave_History lh ON lr.leaveRequestID = lh.leaveRequestID
        WHERE lr.leaveRequestID = ? AND ls.statusLeaveName = 'Pending' AND (lh.supervisorDecision IS NULL)
      `;

      db.query(fetchLeaveRequestSql, [leaveRequestID], (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Error fetching leave request" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Leave request not found or already processed by supervisor" });
        }

        const { leaveHistoryRequestID, employeeID } = result[0];
        const normalizedDecision = decision.toLowerCase();
        let statusName;

        if (normalizedDecision === 'approve') {
          // Supervisor approval means leave now goes into a "Pending" status awaiting HR approval
          statusName = 'Pending';
        } else if (normalizedDecision === 'reject') {
          statusName = 'Rejected';
        } else {
          return res.status(400).json({ error: "Invalid decision value. Use 'approve' or 'reject'." });
        }

        const fetchStatusSql = `SELECT statusLeaveID FROM Leave_Status WHERE statusLeaveName = ?`;
        db.query(fetchStatusSql, [statusName], (err, statusResult) => {
          if (err) {
            return res.status(500).json({ error: `Error fetching status for ${statusName}` });
          }

          const { statusLeaveID } = statusResult[0];
          const updateLeaveStatusSql = `UPDATE Leave_Request SET statusLeaveID = ? WHERE leaveRequestID = ?`;
          db.query(updateLeaveStatusSql, [statusLeaveID, leaveRequestID], (err) => {
            if (err) {
              return res.status(500).json({ error: `Error updating leave request status to ${statusName}` });
            }

            const updateLeaveHistorySql = `
              UPDATE Leave_History 
              SET supervisorActionDate = NOW(), actionTaken = ?, supervisorDecision = ?, actionByEmployeeID = ?, supervisorRejectReason = ?
              WHERE leaveRequestID = ?
            `;
            db.query(updateLeaveHistorySql, [
              statusName,
              normalizedDecision === 'reject' ? 'Rejected' : 'Approved',
              supervisorID,
              normalizedDecision === 'reject' ? rejectReason : null,
              leaveHistoryRequestID
            ], (err) => {
              if (err) {
                return res.status(500).json({ error: "Error updating leave history" });
              }

              // Emit real-time notification for leave status update
              io.emit("leaveStatusUpdate", { leaveRequestID, status: statusName });

              let employeeNotificationMessage;
              if (statusName === 'Pending') {
                employeeNotificationMessage = `Your leave request has been approved by your supervisor and is now awaiting HR approval.`;
              } else if (statusName === 'Rejected') {
                employeeNotificationMessage = `Your leave request has been rejected by your supervisor.`;
              }

              notifyEmployee(employeeID, employeeNotificationMessage, leaveRequestID, supervisorID);

              res.status(200).json({
                Status: "Success",
                Message: normalizedDecision === 'approve'
                  ? "Leave request approved by Supervisor and pending HR approval."
                  : "Leave request rejected by Supervisor.",
              });
            });
          });
        });
      });
    });
  });
};


// HR's Decision on Leave Request
export const hrDecision = (req, res) => {
  const { leaveRequestID, decision, rejectReason, userID: requestUserID } = req.body;
  const tokenUserID = req.user.userID;

  // Security check: Ensure userID in the request body matches the token's userID
  if (parseInt(requestUserID) !== parseInt(tokenUserID)) {
    return res.status(403).json({ error: "Unauthorized action: User ID mismatch" });
  }

  getEmployeeIDFromUserID(tokenUserID, (err, hrID) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching HR's employee ID" });
    }

    const fetchLeaveRequestSql = `
      SELECT lr.leaveRequestID, lr.employeeID, ls.statusLeaveID, lh.leaveRequestID as leaveHistoryRequestID, lh.hrDecision
      FROM Leave_Request lr
      JOIN Leave_Status ls ON lr.statusLeaveID = ls.statusLeaveID
      LEFT JOIN Leave_History lh ON lr.leaveRequestID = lh.leaveRequestID
      WHERE lr.leaveRequestID = ?
        AND (ls.statusLeaveName = 'Pending' OR ls.statusLeaveName = 'Approved')
    `;

    db.query(fetchLeaveRequestSql, [leaveRequestID], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching leave request" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Leave request not found or already processed" });
      }

      const { leaveHistoryRequestID, employeeID } = result[0];
      const normalizedDecision = decision.toLowerCase();
      let statusName;

      if (normalizedDecision === 'approve') {
        statusName = 'Approved';
      } else if (normalizedDecision === 'reject') {
        statusName = 'Rejected';
      } else {
        return res.status(400).json({ error: "Invalid decision value. Use 'approve' or 'reject'." });
      }

      const fetchStatusSql = `SELECT statusLeaveID FROM Leave_Status WHERE statusLeaveName = ?`;
      db.query(fetchStatusSql, [statusName], (err, statusResult) => {
        if (err) {
          return res.status(500).json({ error: `Error fetching status for ${statusName}` });
        }

        const { statusLeaveID } = statusResult[0];
        const updateLeaveStatusSql = `UPDATE Leave_Request SET statusLeaveID = ? WHERE leaveRequestID = ?`;
        db.query(updateLeaveStatusSql, [statusLeaveID, leaveRequestID], (err) => {
          if (err) {
            return res.status(500).json({ error: `Error updating leave request status to ${statusName}` });
          }

          const updateLeaveHistorySql = `
            UPDATE Leave_History 
            SET hrActionDate = NOW(), actionTaken = ?, hrDecision = ?, actionByEmployeeID = ?, hrRejectReason = ?
            WHERE leaveRequestID = ?
          `;
          db.query(updateLeaveHistorySql, [
            statusName,
            normalizedDecision === 'reject' ? 'Rejected' : 'Approved',
            hrID,
            normalizedDecision === 'reject' ? rejectReason : null,
            leaveHistoryRequestID
          ], (err) => {
            if (err) {
              return res.status(500).json({ error: "Error updating leave history" });
            }

            // Emit real-time notification for leave status update
            io.emit("leaveStatusUpdate", { leaveRequestID, status: statusName });

            const employeeNotificationMessage = normalizedDecision === 'approve'
              ? 'Congratulations! Your leave request has been approved by HR.'
              : 'Your leave request has been rejected by HR.';

            notifyEmployee(employeeID, employeeNotificationMessage, leaveRequestID, hrID);

            res.status(200).json({
              Status: "Success",
              Message: normalizedDecision === 'approve'
                ? "Leave request approved by HR."
                : "Leave request rejected by HR.",
            });
          });
        });
      });
    });
  });
};  


 
export const getLeaveHistory = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'
  const { leaveTypeName } = req.query; // Get query parameter if provided

  // Query to find the employeeID from the token
  const fetchUserSql = `SELECT employeeID FROM User WHERE token = ?`;

  db.query(fetchUserSql, [token], (err, userResults) => {
    if (err) {
      console.error("Error fetching user by token:", err);
      return res.status(500).json({ error: "Error fetching user data", Details: err.message });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found or invalid token" });
    }

    const employeeID = userResults[0].employeeID;

    // SQL query to fetch the leave history with optional leaveTypeName filter
    let sql = `
      SELECT DISTINCT
        lh.actionDate, 
        lh.supervisorActionDate, 
        lh.hrActionDate, 
        lh.supervisorDecision, 
        lh.hrDecision,         
        lh.actionTaken, 
        lh.hrRejectReason,      
        lh.supervisorRejectReason, 
        lh.leaveRequestID, 
        lt.leaveTypeName,
        lr.notes,
        lr.startDateTime, 
        lr.endDateTime, 
        lr.documentAttach,  -- Include the document attachment field here
        CONCAT(e.firstName, ' ', e.secondName) AS employeeName,  -- Concatenate firstName and secondName for employeeName
        CONCAT(supervisor.firstName, ' ', supervisor.secondName) AS supervisor, 
        CONCAT(hr.firstName, ' ', hr.secondName) AS hr 
      FROM Leave_History lh
      JOIN Leave_Request lr ON lh.leaveRequestID = lr.leaveRequestID
      JOIN Leave_Type lt ON lr.leaveTypeID = lt.leaveTypeID
      JOIN employees e ON lr.employeeID = e.employeeID  -- Fetch employee name from firstName + secondName
      LEFT JOIN employees supervisor ON e.reportToID = supervisor.employeeID 
      LEFT JOIN (
        SELECT emp.employeeID, emp.firstName, emp.secondName
        FROM employees emp
        JOIN User u ON emp.employeeID = u.employeeID
        WHERE u.roleID = 3  -- RoleID 3 represents HR
        LIMIT 1  -- Fetch the single HR across all departments
      ) hr ON 1 = 1  -- Join HR details directly without department filtering
      WHERE lr.employeeID = ?
    `;

    const params = [employeeID];

    // If a leaveTypeName is provided, add a filter to the SQL query
    if (leaveTypeName) {
      sql += ' AND lt.leaveTypeName = ?';
      params.push(leaveTypeName);
    }

    sql += ' ORDER BY lh.actionDate DESC'; // Order by action date

    // Execute the query
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('Error fetching leave history:', err);
        return res.status(500).json({ error: "Failed to fetch leave history" });
      }

      // Return the data in the desired format
      res.status(200).json({
        Status: "Success",
        Data: results,
      });
    });
  }); 
};    

export const getAllEmployeesLeaveHistory = (req, res) => {
  // Updated SQL query to include supervisorRejectReason and hrRejectReason
  const sql = `
    SELECT 
      lr.leaveRequestID,  
      CONCAT(e.firstName, ' ', e.secondName) AS employeeName,  
      lt.leaveTypeName,  
      lr.startDateTime, 
      lr.endDateTime, 
      CONCAT(lr.startDateTime, ' - ', lr.endDateTime) AS leavePeriod,  
      lh.actionDate, 
      lh.supervisorActionDate, 
      lh.hrActionDate, 
      lh.actionTaken AS status,
      lh.supervisorDecision,   -- Include Supervisor Decision
      lh.hrDecision,           -- Include HR Decision
      lh.supervisorRejectReason, -- Include Supervisor Rejection Reason
      lh.hrRejectReason,         -- Include HR Rejection Reason
      lr.notes,                -- Include notes
      lr.documentAttach,       -- Include document attachment
      CONCAT(sup.firstName, ' ', sup.secondName) AS supervisorName,  -- Supervisor Name
      CONCAT(hr.firstName, ' ', hr.secondName) AS hrName               -- HR Name
    FROM Leave_History lh
    JOIN Leave_Request lr ON lh.leaveRequestID = lr.leaveRequestID
    JOIN Leave_Type lt ON lr.leaveTypeID = lt.leaveTypeID
    JOIN employees e ON lr.employeeID = e.employeeID  
    LEFT JOIN employees sup ON e.reportToID = sup.employeeID       -- Join to get Supervisor Name
    LEFT JOIN (
      SELECT emp.employeeID, emp.firstName, emp.secondName
      FROM employees emp
      JOIN User u ON emp.employeeID = u.employeeID
      WHERE u.roleID = 3  -- Assuming roleID 3 represents HR
      LIMIT 1            -- Fetch the single HR across all departments
    ) hr ON 1=1                                                 -- Cross join to get HR Name
    ORDER BY lh.actionDate DESC`;
  
  // Execute the updated query
  db.query(sql, [], (err, results) => {
    if (err) {
      console.error('Error fetching all employees leave history:', err);
      return res.status(500).json({ error: "Error fetching all employees leave history" });
    }

    // Return the fetched data
    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};
export const getSupervisorLeaveHistory = (req, res) => {
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

    // Updated SQL query to include supervisorRejectReason and hrRejectReason
    const sql = `
      SELECT 
        lr.leaveRequestID,  
        CONCAT(e.firstName, ' ', e.secondName) AS employeeName,  
        lt.leaveTypeName,  
        lr.startDateTime, 
        lr.endDateTime, 
        CONCAT(lr.startDateTime, ' - ', lr.endDateTime) AS leavePeriod,  
        lh.actionDate,
        lh.supervisorActionDate, 
        lh.hrActionDate,  
        lh.actionTaken AS status,
        lh.supervisorDecision,   -- Include Supervisor Decision
        lh.hrDecision,           -- Include HR Decision
        lh.supervisorRejectReason, -- Include Supervisor Rejection Reason
        lh.hrRejectReason,         -- Include HR Rejection Reason
        lr.notes,                -- Include notes
        lr.documentAttach,       -- Include document attachment
        CONCAT(sup.firstName, ' ', sup.secondName) AS supervisorName,  -- Supervisor Name
        CONCAT(hr.firstName, ' ', hr.secondName) AS hrName               -- HR Name
      FROM Leave_History lh
      JOIN Leave_Request lr ON lh.leaveRequestID = lr.leaveRequestID
      JOIN Leave_Type lt ON lr.leaveTypeID = lt.leaveTypeID
      JOIN employees e ON lr.employeeID = e.employeeID  
      LEFT JOIN employees sup ON e.reportToID = sup.employeeID       -- Join to get Supervisor Name
      LEFT JOIN (
        SELECT emp.employeeID, emp.firstName, emp.secondName
        FROM employees emp
        JOIN User u ON emp.employeeID = u.employeeID
        WHERE u.roleID = 3  -- Assuming roleID 3 represents HR
        LIMIT 1            -- Fetch the single HR across all departments
      ) hr ON 1=1                                                 -- Cross join to get HR Name
      WHERE e.reportToID = ?  
      ORDER BY lh.actionDate DESC`;

    // Execute the updated query
    db.query(sql, [supervisorID], (err, results) => {
      if (err) {
        console.error('Error fetching supervisor employees leave history:', err);
        return res.status(500).json({ error: "Error fetching supervisor employees leave history" });
      }

      // Return the fetched data
      res.status(200).json({
        Status: "Success",
        Data: results,
      });
    });
  });
};



// Define __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const viewDocument = (req, res) => {
  let documentName = req.params.documentName;
  console.log('Requested Document:', documentName);

  // If documentName does not end with .pdf, append .pdf
  if (path.extname(documentName).toLowerCase() !== '.pdf') {
    documentName += '.pdf';
  }

  // Path to the PDF file in the uploads directory
  const filePath = path.join(__dirname, '..', 'uploads', documentName);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Document not found: ${documentName}`);
    return res.status(404).json({ error: 'Document not found' });
  }

  // Set the content type for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

  // Send the PDF file to the browser
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending the file:', err);
      res.status(500).json({ error: 'Error sending the document' });
    } else {
      console.log(`File sent successfully: ${path.basename(filePath)}`);
    }
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use a timestamp with the original filename
  }
});

// Set up the upload middleware
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}); 