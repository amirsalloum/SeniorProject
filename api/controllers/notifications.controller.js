import db from "../db.js";
import { io } from "../app.js";

// Fetch notifications for a specific user
export const getNotifications = (req, res) => {
  const userID = req.user.userID;

  const fetchNotificationsSql = `
    SELECT n.*, u.username AS submittedByUserName 
    FROM Notifications n
    LEFT JOIN User u ON n.submittedByUserID = u.userID
    WHERE n.userID = ? 
    ORDER BY n.createdAt DESC
  `;

  db.query(fetchNotificationsSql, [userID], (err, results) => {
    if (err) {
      console.error("Error fetching notifications:", err);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results,
    });
  });
};
// Mark a specific notification as read and emit an update event
export const markNotificationAsRead = (req, res) => {
  const { notificationID } = req.body; // Get notificationID from the request body
  const userID = req.user.userID; // Get userID from the authenticated token

  const updateNotificationSql = `
    UPDATE Notifications
    SET isRead = 1
    WHERE notificationID = ? AND userID = ?
  `;

  db.query(updateNotificationSql, [notificationID, userID], (err, result) => {
    if (err) {
      console.error("Error marking notification as read:", err);
      return res.status(500).json({ error: "Failed to mark notification as read." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found or not authorized." });
    }

    io.to(userID).emit("notification-updated", { notificationID, isRead: 1 });

    res.status(200).json({ Status: "Success", Message: "Notification marked as read." });
  });
};

// Fetch notifications specifically for employees
export const getEmployeeNotifications = (req, res) => {
  const userID = req.user.userID; // Extract userID from the authenticated token

  const checkRoleSql = `
    SELECT roleID FROM User WHERE userID = ?;
  `;

  db.query(checkRoleSql, [userID], (err, roleResult) => {
    if (err) {
      console.error("Error fetching user role:", err);
      return res.status(500).json({ error: "Failed to check user role" });
    }

    if (roleResult.length === 0 || roleResult[0].roleID !== 4) {
      return res.status(403).json({ error: "Unauthorized: Only employees can access these notifications" });
    }

    const fetchEmployeeNotificationsSql = `
      SELECT n.*, u.username AS submittedByUserName, lr.leaveRequestID 
      FROM Notifications n
      LEFT JOIN User u ON n.submittedByUserID = u.userID
      LEFT JOIN Leave_Request lr ON n.leaveRequestID = lr.leaveRequestID
      WHERE n.userID = ? 
      ORDER BY n.createdAt DESC;
    `;

    db.query(fetchEmployeeNotificationsSql, [userID], (err, results) => {
      if (err) {
        console.error('Error fetching employee notifications:', err);
        return res.status(500).json({ error: 'Failed to fetch employee notifications' });
      }

      res.status(200).json({
        Status: 'Success',
        Data: results,
      });
    });
  });
};

// Mark an employee's notification as read and emit an update event
export const markEmployeeNotificationAsRead = (req, res) => {
  const { notificationID } = req.body; // Get notificationID from the request body
  const userID = req.user.userID; // Get userID from the authenticated token

  const updateEmployeeNotificationSql = `
    UPDATE Notifications
    SET isRead = 1
    WHERE notificationID = ? AND userID = ?;
  `;

  db.query(updateEmployeeNotificationSql, [notificationID, userID], (err, result) => {
    if (err) {
      console.error("Error marking employee notification as read:", err);
      return res.status(500).json({ error: "Failed to mark employee notification as read." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found or not authorized." });
    }

    io.to(userID).emit("notification-updated", { notificationID, isRead: 1 });

    res.status(200).json({ Status: "Success", Message: "Employee notification marked as read." });
  });
};

export const deleteNotification = (req, res) => {
  const { notificationID } = req.body;
  const userID = req.user.userID;

  const deleteNotificationSql = `
    DELETE FROM Notifications 
    WHERE notificationID = ? AND userID = ?;
  `;

  db.query(deleteNotificationSql, [notificationID, userID], (err, result) => {
    if (err) {
      console.error("Error deleting notification:", err);
      return res.status(500).json({ error: "Failed to delete notification." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found or not authorized." });
    }

    // Emit event after successful deletion
    io.to(userID.toString()).emit("notification-deleted", { notificationID });
    
    res.status(200).json({ Status: "Success", Message: "Notification deleted successfully." });
  });
};
// Emit unique notification to the specific user only
const emitNotification = (userID, notification) => {
  io.to(userID.toString()).emit("notification-received", notification);
};

// Call this function within your other notification handlers when needed
export const addNotification = (notification) => {
  emitNotification(notification.userID, notification);
};





export const deleteAllNotifications = (req, res) => {
  const userID = req.user.userID; // Get userID from the authenticated token

  // Debugging output
  console.log('Deleting all notifications for userID:', userID);

  const deleteAllNotificationsSql = `
    DELETE FROM Notifications 
    WHERE userID = ?;
  `;

  db.query(deleteAllNotificationsSql, [userID], (err, result) => {
    if (err) {
      console.error("Error deleting notifications:", err);
      return res.status(500).json({ error: "Failed to delete notifications." });
    }

    console.log('All notifications deleted successfully for userID:', userID);
    res.status(200).json({ Status: "Success", Message: "All notifications deleted successfully." });
  });
};



