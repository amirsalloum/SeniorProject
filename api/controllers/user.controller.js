import db from '../db.js'; // Ensure the database connection is correct


// Controller to create or update a role
export const createRole = (req, res) => {
  const { roleID, roleName, permissionsName } = req.body;

  if (!roleID && (!roleName || !permissionsName)) {
    return res.status(400).json({ error: "Please provide roleName and permissionsName for creating a role" });
  }

  if (roleID) {
    let updateFields = [];
    let updateValues = [];

    if (roleName) {
      updateFields.push('roleName = ?');
      updateValues.push(roleName);
    }
    if (permissionsName) {
      updateFields.push('permissionsID = (SELECT permissionsID FROM permissions WHERE permissionsName = ?)');
      updateValues.push(permissionsName);
    }

    updateValues.push(roleID);

    if (updateFields.length > 0) {
      const updateRoleSql = `UPDATE Role SET ${updateFields.join(', ')} WHERE roleID = ?`;
      db.query(updateRoleSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating role:", err);
          return res.status(500).json({ error: "Error updating role data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Role updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const getPermissionsIDSql = "SELECT permissionsID FROM permissions WHERE permissionsName = ?";
    db.query(getPermissionsIDSql, [permissionsName], (err, permissionsResult) => {
      if (err) {
        console.error('Database query error (finding permissionsID):', err);
        return res.status(500).json({ error: "Failed to find permissions by name" });
      }

      if (permissionsResult.length === 0) {
        return res.status(404).json({ error: `Permissions '${permissionsName}' not found` });
      }

      const permissionsID = permissionsResult[0].permissionsID;

      const insertRoleSql = "INSERT INTO Role (roleName, permissionsID) VALUES (?, ?)";
      const roleValues = [roleName, permissionsID];
      db.query(insertRoleSql, roleValues, (err, result) => {
        if (err) {
          console.error('Database query error (inserting role):', err);
          return res.status(500).json({ error: "Failed to create role" });
        }

        res.status(201).json({
          Status: "Success",
          Data: { roleID: result.insertId, roleName, permissionsID }
        });
      });
    });
  }
};

// Fetch All Roles
export const getAllRoles = (req, res) => {
  const sql = `
    SELECT 
      roleID, 
      roleName
    FROM Role`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching roles:", err);
      return res.status(500).json({ error: "Failed to fetch roles" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};


// Fetch Specific Role by ID
export const getRoleById = (req, res) => {
  const { roleID } = req.params;

  if (!roleID) {
    return res.status(400).json({ error: "Please provide a roleID" });
  }

  const sql = `
    SELECT 
      roleID, 
      roleName
    FROM Role
    WHERE roleID = ?`;

  db.query(sql, [roleID], (err, result) => {
    if (err) {
      console.error("Error fetching role:", err);
      return res.status(500).json({ error: "Failed to fetch role details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};


// Controller to delete a role
export const deleteRole = (req, res) => {
  const { roleID } = req.params;

  if (!roleID) {
    return res.status(400).json({ error: "Please provide a roleID to delete" });
  }

  // Check if any users are assigned to this role before deletion
  const checkUsersSql = "SELECT userID FROM User WHERE roleID = ?";
  db.query(checkUsersSql, [roleID], (err, usersResult) => {
    if (err) {
      console.error("Error checking related users:", err);
      return res.status(500).json({ error: "Failed to check related users", details: err.message });
    }

    if (usersResult.length > 0) {
      return res.status(400).json({ error: "Cannot delete role because it is assigned to users" });
    }

    // Delete the role
    const deleteRoleSql = "DELETE FROM Role WHERE roleID = ?";
    db.query(deleteRoleSql, [roleID], (err, result) => {
      if (err) {
        console.error("Error deleting role:", err);
        return res.status(500).json({ error: "Failed to delete role", details: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Role not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Role deleted successfully" });
    });
  });
};

// Controller to create or update a status
export const createStatus = (req, res) => {
  const { statusID, statusName } = req.body;

  if (!statusID && !statusName) {
    return res.status(400).json({ error: "Please provide a statusName for creating a status" });
  }

  if (statusID) {
    let updateFields = [];
    let updateValues = [];

    if (statusName) {
      updateFields.push('status = ?');
      updateValues.push(statusName);
    }

    updateValues.push(statusID);

    if (updateFields.length > 0) {
      const updateStatusSql = `UPDATE Status SET ${updateFields.join(', ')} WHERE statusID = ?`;
      db.query(updateStatusSql, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating status:", err);
          return res.status(500).json({ error: "Error updating status data", details: err.message });
        }

        return res.status(200).json({ Status: "Update Success", Message: "Status updated successfully" });
      });
    } else {
      return res.status(400).json({ error: "No fields provided to update" });
    }
  } else {
    const sql = "INSERT INTO Status (status) VALUES (?)";
    const values = [statusName];
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: "Failed to create status" });
      }

      res.status(201).json({
        Status: "Success",
        Data: { statusID: result.insertId, statusName }
      });
    });
  }
};

export const updateEmployeeStatus = async (req, res) => {
  const { employeeID } = req.params; // Assuming employeeID is passed as a URL parameter
  const { statusID } = req.body; // New statusID to update

  // Validate required fields
  if (!employeeID) {
    return res.status(400).json({ error: "Missing employeeID parameter" });
  }

  if (!statusID) {
    return res.status(400).json({ error: "Please provide a valid statusID to update" });
  }

  try {
    // Check if the employee exists
    const [user] = await db.promise().query(
      "SELECT userID FROM User WHERE employeeID = ?",
      [employeeID]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: "No user found for the given employeeID" });
    }

    // Update the user's statusID
    const [result] = await db.promise().query(
      "UPDATE User SET statusID = ?, updatedOn = NOW() WHERE employeeID = ?",
      [statusID, employeeID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No user found with the given employeeID" });
    }

    return res.status(200).json({ Status: "Update Success", Message: "Employee status updated successfully" });
  } catch (err) {
    console.error("Error updating employee status:", err);
    return res.status(500).json({ error: "Error updating employee status data", details: err.message });
  }
};




// Fetch All Statuses
export const getAllStatuses = (req, res) => {
  const sql = "SELECT * FROM Status";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching statuses:", err);
      return res.status(500).json({ error: "Failed to fetch statuses" });
    }

    res.status(200).json({
      Status: "Success",
      Data: results
    });
  });
};

// Fetch Specific Status by ID
export const getStatusById = (req, res) => {
  const { statusID } = req.params;

  if (!statusID) {
    return res.status(400).json({ error: "Please provide a statusID" });
  }

  const sql = "SELECT * FROM Status WHERE statusID = ?";

  db.query(sql, [statusID], (err, result) => {
    if (err) {
      console.error("Error fetching status:", err);
      return res.status(500).json({ error: "Failed to fetch status details" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Status not found" });
    }

    res.status(200).json({
      Status: "Success",
      Data: result[0]
    });
  });
};

// Controller to delete a status
export const deleteStatus = (req, res) => {
  const { statusID } = req.params;

  if (!statusID) {
    return res.status(400).json({ error: "Please provide a statusID to delete" });
  }

  // Step 1: Update users that reference this status to set statusID to NULL or a default statusID
  const updateUsersSql = "UPDATE User SET statusID = NULL WHERE statusID = ?";
  db.query(updateUsersSql, [statusID], (err, updateResult) => {
    if (err) {
      console.error("Error updating users to remove status reference:", err);
      return res.status(500).json({ error: "Failed to update users", details: err.message });
    }

    // Step 2: Delete the status after updating users
    const deleteStatusSql = "DELETE FROM Status WHERE statusID = ?";
    db.query(deleteStatusSql, [statusID], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting status:", err);
        return res.status(500).json({ error: "Failed to delete status", details: err.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Status not found or already deleted" });
      }

      res.status(200).json({ Status: "Delete Success", Message: "Status and associated references deleted successfully" });
    });
  });
};