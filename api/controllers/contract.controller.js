// api/controllers/contract.controller.js
import db from '../db.js';  // Ensure the database connection is correct


export const createContractType = (req, res) => {
  const { fullName, contractTypeName, startDate, endDate, totalWorkingHours } = req.body;

  // Validate input
  if (!fullName || !contractTypeName || !startDate || !endDate || !totalWorkingHours) {
    return res.status(400).json({ error: "Please provide fullName, contractTypeName, startDate, endDate, and totalWorkingHours" });
  }

  // Split fullName into firstName and secondName
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0];
  const secondName = nameParts.slice(1).join(" ");

  // Step 1: Get employeeID by fullName
  const getEmployeeIDSql = `
    SELECT e.employeeID 
    FROM employees e 
    WHERE e.firstName = ? AND e.secondName = ?
  `;

  db.query(getEmployeeIDSql, [firstName, secondName], (err, result) => {
    if (err) {
      console.error('Database query error (finding employeeID):', err);
      return res.status(500).json({ error: "Failed to find employee by name" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `Employee '${fullName}' not found` });
    }

    const employeeID = result[0].employeeID;

    // Step 2: Check if the employee already has a contract type assigned
    const checkExistingContractSql = `
      SELECT * FROM Contract_Type 
      WHERE employeeID = ?
    `;

    db.query(checkExistingContractSql, [employeeID], (err, existingContractResults) => {
      if (err) {
        console.error('Database query error (checking existing contract type):', err);
        return res.status(500).json({ error: "Error checking existing contract type" });
      }

      if (existingContractResults.length > 0) {
        return res.status(400).json({ error: `Employee '${fullName}' already has a contract type assigned.` });
      }

      // Step 3: Get the contractTypeMasterID based on contractTypeName
      const getContractTypeMasterIDSql = `
        SELECT contractTypeMasterID 
        FROM Contract_Type_Master 
        WHERE contractTypeName = ?
      `;

      db.query(getContractTypeMasterIDSql, [contractTypeName], (err, contractTypeMasterResults) => {
        if (err) {
          console.error('Database query error (finding contract type):', err);
          return res.status(500).json({ error: "Failed to find contract type" });
        }

        if (contractTypeMasterResults.length === 0) {
          return res.status(404).json({ error: `Contract Type '${contractTypeName}' not found` });
        }

        const contractTypeMasterID = contractTypeMasterResults[0].contractTypeMasterID;

        // Step 4: Insert the contract type with requiredWorkingHours
        const insertContractTypeSql = `
          INSERT INTO Contract_Type (employeeID, contractTypeMasterID, startDate, endDate, requiredWorkingHours)
          VALUES (?, ?, ?, ?, ?)
        `;

        const values = [employeeID, contractTypeMasterID, startDate, endDate, totalWorkingHours];

        db.beginTransaction((err) => {
          if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: "Transaction error" });
          }

          db.query(insertContractTypeSql, values, (err, contractResult) => {
            if (err) {
              return db.rollback(() => {
                console.error('Database query error (inserting contract type):', err);
                res.status(500).json({ error: "Failed to create contract type" });
              });
            }

            // Commit the transaction
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Transaction commit error:', err);
                  res.status(500).json({ error: "Failed to commit transaction" });
                });
              }

              res.status(201).json({
                Status: "Success",
                Data: {
                  contractTypeID: contractResult.insertId,
                  employeeID,
                  contractTypeName,
                  startDate,
                  endDate,
                  requiredWorkingHours: totalWorkingHours
                }
              });
            });
          });
        });
      });
    });
  });
};



// ContractTypeController.js (Assuming you have a separate controller file for contract types)
export const getContractTypes = (req, res) => {
  const getContractTypesSql = `
    SELECT contractTypeMasterID, contractTypeName 
    FROM Contract_Type_Master
  `;

  db.query(getContractTypesSql, (err, results) => {
    if (err) {
      console.error('Database query error (fetching contract types):', err);
      return res.status(500).json({ error: "Failed to fetch contract types" });
    }

    res.status(200).json({ Status: "Success", Data: results });
  });
};

// Controller to delete a contract type by contractTypeID
export const deleteContractType = (req, res) => {
  const { contractTypeID } = req.params;

  // Check if contractTypeID is provided
  if (!contractTypeID) {
    return res.status(400).json({ error: "Please provide a contractTypeID to delete" });
  }

  // Begin a transaction to handle the deletion
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Transaction error", details: err.message });
    }

    // Step 1: Update or remove related references in Leave_Balance referencing the contract type
    const updateLeaveBalanceSql = `
      UPDATE Leave_Balance 
      SET contractTypeID = NULL 
      WHERE contractTypeID = ?;
    `;
    db.query(updateLeaveBalanceSql, [contractTypeID], (err) => {
      if (err) {
        console.error("Error updating related leave balance records:", err);
        return db.rollback(() => {
          res.status(500).json({ error: "Error updating related leave balance records", details: err.message });
        });
      }

      // Step 2: Delete the contract type record itself
      const deleteContractTypeSql = "DELETE FROM Contract_Type WHERE contractTypeID = ?";
      db.query(deleteContractTypeSql, [contractTypeID], (err, result) => {
        if (err) {
          console.error("Error deleting contract type:", err);
          return db.rollback(() => {
            res.status(500).json({ error: "Error deleting contract type", details: err.message });
          });
        }

        // Check if the contract type was actually deleted
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: "Contract type not found or already deleted" });
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
          return res.status(200).json({ Status: "Delete Success", Message: "Contract type deleted successfully" });
        });
      });
    });
  });
};  