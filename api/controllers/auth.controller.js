import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import mysql from "mysql2";
import db from "../db.js";
import { io } from '../app.js';
import { transporter,  generateOTP }from '../config/emailConfig.js'; // Ensure correct path

const saltRounds = 8;

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'jwt-secret-key'; // Use environment variables for security

// Main combined function to handle registration, contract, and work schedule
export const registerAndManage = async (req, res) => {
  const {
    reportToID, salary, phoneNumber, gender, firstName, secondName, email, startDate, dob,
    positionID, salaryTypeID, workStatusID, departmentID, brancheID, username, statusID, roleID, addBy,
    profilePicture, contractTypeName, contractStartDate, contractEndDate, workSchedule, requiredWorkingHours
  } = req.body;

  // Check for missing required fields
  if (!reportToID || !salary || !phoneNumber || !gender || !firstName || !secondName || !email || !startDate || !dob ||
    !positionID || !salaryTypeID || !departmentID || !brancheID || !username || !statusID || !roleID ||
    !contractStartDate || !contractEndDate || !workSchedule || !requiredWorkingHours) {
    return res.status(400).json({ error: "Please provide all required fields." });
  }

    // **NEW VALIDATION FOR startDate**
    if (startDate) {
      const currentDate = new Date();
      const parsedStartDate = new Date(startDate);
      if (parsedStartDate < currentDate.setHours(0, 0, 0, 0)) { // Compare date parts only
        return res.status(400).json({ error: "StartDate cannot be in the past. Please choose today or a future date." });
      }
    }
  // Validate that requiredWorkingHours is valid
  if (isNaN(requiredWorkingHours) || requiredWorkingHours <= 0) {
    return res.status(400).json({ error: "Invalid value for requiredWorkingHours." });
  }

  // Validate that workSchedule is an array
  if (!Array.isArray(workSchedule) || workSchedule.length === 0) {
    return res.status(400).json({ error: "A valid workSchedule is required." });
  }

  // Validate workSchedule for contract type
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  if (contractTypeName === 'Full-Time') {
    // Check that all five weekdays are included
    const daysInSchedule = workSchedule.map(schedule => schedule.day);
    const missingDays = weekdays.filter(day => !daysInSchedule.includes(day));
    if (missingDays.length > 0) {
      return res.status(400).json({ error: `For Full-Time contracts, work schedule must include all five weekdays (Monday to Friday). Missing days: ${missingDays.join(', ')}` });
    }

    // Ensure all entries have both startTime and endTime
    const incompleteDays = workSchedule.filter(schedule => weekdays.includes(schedule.day) && (!schedule.startTime || !schedule.endTime));
    if (incompleteDays.length > 0) {
      return res.status(400).json({ error: `For Full-Time contracts, all five weekdays must have both start and end times. Incomplete days: ${incompleteDays.map(s => s.day).join(', ')}` });
    }
  } else if (contractTypeName === 'Part-Time') {
    // Ensure that no day has only startTime or endTime
    const incompleteDays = workSchedule.filter(schedule => (!schedule.startTime && schedule.endTime) || (schedule.startTime && !schedule.endTime));
    if (incompleteDays.length > 0) {
      return res.status(400).json({ error: `Each scheduled day must have both startTime and endTime. Incomplete days: ${incompleteDays.map(s => s.day).join(', ')}` });
    }
  } else {
    return res.status(400).json({ error: "Invalid contract type. Only 'Full-Time' and 'Part-Time' are allowed." });
  }

  try {
    // Check for duplicates (username, email, phone number)
    const checkDuplicateSql = `
      SELECT * FROM User u
      LEFT JOIN employees e ON u.employeeID = e.employeeID
      WHERE u.username = ? OR e.email = ? OR e.phoneNumber = ?
    `;
    const [duplicateCheckResult] = await db.promise().query(checkDuplicateSql, [username, email, phoneNumber]);

    if (duplicateCheckResult.length > 0) {
      return res.status(400).json({ error: "Username, email, or phone number already exists. Please use different values." });
    }

    // Hash password for the new user
    const generateRandomPassword = () => crypto.randomBytes(4).toString('hex'); // Generate a random password (8 characters)
    const generatedPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    // Start the transaction
    await db.promise().beginTransaction();

    // Step 1: Insert the employee into the `employees` table
    const insertEmployeeSql = `
      INSERT INTO employees (
        reportToID, salary, phoneNumber, gender, firstName, secondName, email, StartDate, renewalDate,
        DOB, positionID, salaryTypeID, workStatusID, addAt, addBy, departmentID, brancheID, profilePicture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `;
    const renewalDate = new Date(startDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const employeeValues = [
      reportToID || null,
      salary || null,
      phoneNumber || null,
      gender || null,
      firstName || null,
      secondName || null,
      email || null,
      startDate || null,
      renewalDate || null,
      dob || null,
      positionID || null,
      salaryTypeID || null,
      workStatusID || null,
      addBy || null,
      departmentID || null,
      brancheID || null,
      profilePicture || null
    ];

    const [employeeResult] = await db.promise().query(insertEmployeeSql, employeeValues);
    const employeeID = employeeResult.insertId;

    // Step 2: Insert the user into the `User` table
    const insertUserSql = `
      INSERT INTO User (username, password, employeeID, isFirstLogin, createdOn, updatedOn, statusID, roleID)
      VALUES (?, ?, ?, true, NOW(), NOW(), ?, ?)
    `;
    const userValues = [username, hashedPassword, employeeID, statusID, roleID];
    await db.promise().query(insertUserSql, userValues);

    // Step 3: Create contract type for the employee
    const getContractTypeMasterIDSql = `
      SELECT contractTypeMasterID FROM Contract_Type_Master WHERE contractTypeName = ?
    `;
    const [contractTypeResult] = await db.promise().query(getContractTypeMasterIDSql, [contractTypeName]);
    const contractTypeMasterID = contractTypeResult[0].contractTypeMasterID;

    const insertContractTypeSql = `
      INSERT INTO Contract_Type (employeeID, contractTypeMasterID, startDate, endDate, requiredWorkingHours)
      VALUES (?, ?, ?, ?, ?)
    `;
    const contractValues = [employeeID, contractTypeMasterID, contractStartDate, contractEndDate, requiredWorkingHours];
    await db.promise().query(insertContractTypeSql, contractValues);

    // Step 4: Insert work schedule
    const workScheduleValues = workSchedule.map(schedule => [employeeID, schedule.startTime, schedule.endTime, schedule.day]);
    await db.promise().query(`
      INSERT INTO Work_Schedules (employeeID, startTime, endTime, day) VALUES ?
    `, [workScheduleValues]);

    // Commit the transaction after all inserts are successful
    await db.promise().commit();

    // Send the success response immediately
    res.status(201).json({ message: "Registration successful",generatedPassword: generatedPassword });

    
    // Send email with generated password
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Gold Tiger - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.google.com/imgres?q=gold%20tiger%20logo%20logistics%20company&imgurl=https%3A%2F%2Fmedia.licdn.com%2Fdms%2Fimage%2Fv2%2FC560BAQE6NjUdJ67PjQ%2F
            company-logo_200_200%2Fcompany-logo_200_200%2F0%2F1631421099990%2Fgold_tiger_logsitics_solutions_logo%3Fe%3D2147483647%26v%3Dbeta%26t%3Dl_n0_NQWyZ8csSIZOKHI1OiHCX3ux
            1J7p31vRDTTk4A&imgrefurl=https%3A%2F%2Fau.linkedin.com%2Fcompany%2Fgold-tiger-logistics-solutions&docid=DIFhfk9WUvhxUM&tbnid=VtWbvAg5-uQ-tM&vet=12ahUKEwjsm4jd6piKAxVd
            1QIHHYWiAJ0QM3oECBwQAA..i&w=200&h=200&hcb=2&ved=2ahUKEwjsm4jd6piKAxVd1QIHHYWiAJ0QM3oECBwQAA" alt="Gold Tiger Logo" style="max-width: 150px;"/>
          </div>
          <h2 style="color: #dabf14; text-align: center;">Welcome to Gold Tiger</h2>
          <p>Dear <strong>${firstName} ${secondName}</strong>,</p>
          <p>We are delighted to welcome you to Gold Tiger! Your account has been successfully created, and we are excited to have you onboard.</p>
          <h3>Your Account Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Password:</strong> ${generatedPassword}</li>
          </ul>
          <p style="color: #e74c3c;"><em>Please change your password after your first login for security purposes.</em></p>
          <p>You can log in to your account using the following link:</p>
          <div style="text-align: center; margin: 20px;">
            <a href="http://localhost:5173/login" style="background-color:   #dabf14 ; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">Login to Your Account</a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team at <a href="mailto:support@goldtiger.com" style="color:  #dabf14 ;">support@goldtiger.com</a>.</p>
          <p>Best regards,</p>
          <p><strong>Gold Tiger</strong></p>
          <hr style="border: 0; border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; text-align: center; color: #777;">This email was sent from an unmonitored address. Please do not reply directly to this email.</p>
        </div>
      `
    };
    

    transporter.sendMail(mailOptions).catch((emailError) => {
      // Log the error for debugging
      console.error("Failed to send email:", emailError);
      // Optionally, you could log this to a file or monitoring service
    });

  } catch (error) {
    // Rollback the transaction in case of any errors
    await db.promise().rollback();
    console.error("Error during registration:", error);
    res.status(500).json({ error: "An error occurred during registration", details: error.message });
  }
};




// Function to handle updates to existing employee info (Admin/HR only)
export const updateRegister = async (req, res) => {
  const {
    employeeID, reportToID, salary, phoneNumber, gender, firstName, secondName, email, startDate, totalLeave, dob,
    positionID, salaryTypeID, workStatusID, departmentID, brancheID, username, statusID, roleID, 
    profilePicture, contractTypeName, contractStartDate, contractEndDate, workSchedule, requiredWorkingHours
  } = req.body;

  // Ensure employeeID is provided
  if (!employeeID) {
    return res.status(400).json({ error: "Employee ID is required for update." });
  }

  // Validate requiredWorkingHours if provided
  if (requiredWorkingHours && (isNaN(requiredWorkingHours) || requiredWorkingHours <= 0)) {
    return res.status(400).json({ error: "Invalid value for requiredWorkingHours. It must be a positive number." });
  }


  // Validate workSchedule
  if (workSchedule) {
    // Ensure workSchedule is an array
    if (!Array.isArray(workSchedule)) {
      return res.status(400).json({ error: "WorkSchedule must be a valid array." });
    }

    // Universal validation for each day in workSchedule
    const incompleteDays = workSchedule.filter(schedule => !schedule.startTime || !schedule.endTime);
    if (incompleteDays.length > 0) {
      const days = incompleteDays.map(schedule => schedule.day).join(', ');
      return res.status(400).json({ error: `Each scheduled day must have both startTime and endTime. Incomplete days: ${days}` });
    }

    // Additional validation for Full-Time contracts
    if (contractTypeName === 'Full-Time') {
      const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

      // Check that all five weekdays are included in workSchedule
      const daysInSchedule = workSchedule.map(schedule => schedule.day);
      const missingDays = weekdays.filter(day => !daysInSchedule.includes(day));

      if (missingDays.length > 0) {
        return res.status(400).json({ error: `For Full-Time contracts, work schedule must include all five weekdays (Monday to Friday). Missing days: ${missingDays.join(', ')}` });
      }
    }
  }

  try {
    // Check for duplicates (username, email, phone number) excluding the current employee
    const checkDuplicateSql = `
      SELECT * FROM User u
      LEFT JOIN employees e ON u.employeeID = e.employeeID
      WHERE (u.username = ? OR e.email = ? OR e.phoneNumber = ?) AND e.employeeID != ?
    `;
    const [duplicateCheckResult] = await db.promise().query(checkDuplicateSql, [username, email, phoneNumber, employeeID]);

    if (duplicateCheckResult.length > 0) {
      return res.status(400).json({ error: "Username, email, or phone number already exists for another employee. Please use different values." });
    }

    // Start transaction
    await db.promise().beginTransaction();

    // Step 1: Update the employee information if provided
    const employeeFields = [];
    const employeeValues = [];

    if (reportToID) employeeFields.push('reportToID = ?'), employeeValues.push(reportToID);
    if (salary) employeeFields.push('salary = ?'), employeeValues.push(salary);
    if (phoneNumber) employeeFields.push('phoneNumber = ?'), employeeValues.push(phoneNumber);
    if (gender) employeeFields.push('gender = ?'), employeeValues.push(gender);
    if (firstName) employeeFields.push('firstName = ?'), employeeValues.push(firstName);
    if (secondName) employeeFields.push('secondName = ?'), employeeValues.push(secondName);
    if (email) employeeFields.push('email = ?'), employeeValues.push(email);
    if (startDate) {
      employeeFields.push('StartDate = ?'), employeeValues.push(startDate);

      // **UPDATE renewalDate based on new startDate**
      const renewalDate = new Date(startDate);
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      employeeFields.push('renewalDate = ?'), employeeValues.push(renewalDate);
    }
    if (totalLeave) employeeFields.push('totalLeave = ?'), employeeValues.push(totalLeave);
    if (dob) employeeFields.push('DOB = ?'), employeeValues.push(dob);
    if (positionID) employeeFields.push('positionID = ?'), employeeValues.push(positionID);
    if (salaryTypeID) employeeFields.push('salaryTypeID = ?'), employeeValues.push(salaryTypeID);
    if (workStatusID) employeeFields.push('workStatusID = ?'), employeeValues.push(workStatusID);
    if (departmentID) employeeFields.push('departmentID = ?'), employeeValues.push(departmentID);
    if (brancheID) employeeFields.push('brancheID = ?'), employeeValues.push(brancheID);
    if (profilePicture) employeeFields.push('profilePicture = ?'), employeeValues.push(profilePicture);

    if (employeeFields.length > 0) {
      employeeFields.push('updatedAt = NOW()');
      employeeValues.push(employeeID); // Add employeeID to values for WHERE clause

      const updateEmployeeSql = `UPDATE employees SET ${employeeFields.join(', ')} WHERE employeeID = ?`;
      await db.promise().query(updateEmployeeSql, employeeValues);
    }

    // Step 2: Update the user information (username, status, role) if provided
    const userFields = [];
    const userValues = [];

    if (username) userFields.push('username = ?'), userValues.push(username);
    if (statusID) userFields.push('statusID = ?'), userValues.push(statusID);
    if (roleID) userFields.push('roleID = ?'), userValues.push(roleID);

    if (userFields.length > 0) {
      userFields.push('updatedOn = NOW()');
      userValues.push(employeeID); // Add employeeID to values for WHERE clause

      const updateUserSql = `UPDATE User SET ${userFields.join(', ')} WHERE employeeID = ?`;
      await db.promise().query(updateUserSql, userValues);
    }

    // Step 3: Update contract type if provided
    if (contractTypeName && contractStartDate && contractEndDate) {
      const getContractTypeMasterIDSql = `
        SELECT contractTypeMasterID FROM Contract_Type_Master WHERE contractTypeName = ?
      `;
      const [contractTypeResult] = await db.promise().query(getContractTypeMasterIDSql, [contractTypeName]);
      const contractTypeMasterID = contractTypeResult[0].contractTypeMasterID;

      const updateContractTypeSql = `
        UPDATE Contract_Type 
        SET contractTypeMasterID = ?, startDate = ?, endDate = ?, requiredWorkingHours = ?
        WHERE employeeID = ?
      `;
      await db.promise().query(updateContractTypeSql, [contractTypeMasterID, contractStartDate, contractEndDate, requiredWorkingHours || null, employeeID]);
    }

    // Step 4: Update work schedules if provided
    if (workSchedule && workSchedule.length > 0) {
      await db.promise().query(`DELETE FROM Work_Schedules WHERE employeeID = ?`, [employeeID]);
      const workScheduleValues = workSchedule.map(schedule => [employeeID, schedule.startTime, schedule.endTime, schedule.day]);
      await db.promise().query(`INSERT INTO Work_Schedules (employeeID, startTime, endTime, day) VALUES ?`, [workScheduleValues]);
    }

    // Commit the transaction if all steps succeed
    await db.promise().commit();

    // Emit the event to notify clients about the update
    io.emit('employeeUpdated', { employeeID });

    res.status(200).json({ message: "Employee updated successfully" });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.promise().rollback();
    console.error("Transaction rollback due to error:", error);
    res.status(500).json({ error: "An error occurred during the update process", details: error.message });
  }
};



            
// Function to delete an employee and associated user data
export const deleteEmployee = async (req, res) => {
  const { employeeID } = req.params;

  if (!employeeID) {
    return res.status(400).json({ error: "Please provide an employeeID to delete" });
  }

  const connection = db.promise();
  try {
    await connection.beginTransaction();

    // Step 1: Delete records in Work_Schedules referencing the employee
    await connection.query("DELETE FROM Work_Schedules WHERE employeeID = ?", [employeeID]);

    // Step 2: Delete records in Leave_History referencing the employee's leave requests or actions
    await connection.query(`
      DELETE lh FROM Leave_History lh
      LEFT JOIN Leave_Request lr ON lh.leaveRequestID = lr.leaveRequestID
      WHERE lr.employeeID = ? OR lh.actionByEmployeeID = ?
    `, [employeeID, employeeID]);

    // Step 3: Delete records in Leave_Request referencing the employee
    await connection.query("DELETE FROM Leave_Request WHERE employeeID = ?", [employeeID]);

    // Step 4: Delete records in Payroll_Record referencing the employee
    await connection.query("DELETE FROM Payroll_Record WHERE employeeID = ?", [employeeID]);

    // Step 5: Delete records in Finger_Print referencing the employee
    await connection.query("DELETE FROM Finger_Print WHERE employeeID = ?", [employeeID]);

    // Step 6: Delete records in Leave_Balance referencing the employee
    await connection.query("DELETE FROM Leave_Balance WHERE employeeID = ?", [employeeID]);

    // Step 7: Delete records in Leave_Balance referencing contract_type records
    // (Optional, since we deleted by employeeID, but included for completeness)
    await connection.query(`
      DELETE lb FROM Leave_Balance lb
      JOIN Contract_Type ct ON lb.contractTypeID = ct.contractTypeID
      WHERE ct.employeeID = ?
    `, [employeeID]);

    // Step 8: Delete records in Contract_Type referencing the employee
    await connection.query("DELETE FROM Contract_Type WHERE employeeID = ?", [employeeID]);

    // Step 9: Delete OTP entries associated with the user's account
    await connection.query(`
      DELETE o FROM OTP o
      JOIN User u ON o.userID = u.userID
      WHERE u.employeeID = ?
    `, [employeeID]);

    // Step 10: Delete Notifications associated with the user
    await connection.query(`
      DELETE n FROM Notifications n
      WHERE n.userID IN (SELECT userID FROM User WHERE employeeID = ?) 
        OR n.submittedByUserID IN (SELECT userID FROM User WHERE employeeID = ?)
    `, [employeeID, employeeID]);

    // Step 11: Delete the User associated with the employeeID
    await connection.query("DELETE FROM User WHERE employeeID = ?", [employeeID]);

    // Step 12: Delete the employee record
    await connection.query("DELETE FROM employees WHERE employeeID = ?", [employeeID]);

    // Commit the transaction if all deletions are successful
    await connection.commit();
    return res.status(200).json({
      Status: "Delete Success",
      Message: "Employee and all associated data deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error during employee deletion:", error);
    return res.status(500).json({
      error: "Error deleting employee data",
      details: error.message,
    });
  }
};

 

export const login = (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT u.username, u.password, u.userID, u.isFirstLogin, u.tokenVersion, e.employeeID, e.positionID, r.roleName, u.statusID
    FROM user u
    JOIN employees e ON u.employeeID = e.employeeID
    JOIN role r ON u.roleID = r.roleID
    WHERE u.username = ?
  `;

  // Execute the query to fetch the user data
  db.query(sql, [username], (err, data) => {
    if (err) {
      console.error('Login Error:', err);
      return res.status(500).json({ Error: 'Server Error', Details: err.message });
    }

    // Check if any data was retrieved
    if (data.length === 0) {
      return res.status(404).json({ Error: 'Username does not exist' });
    }

    const user = data[0];

    // Check if user is active
    if (user.statusID !== 1) {
      return res.status(403).json({ Error: 'Account is inactive. Please contact support.' });
    }
    
    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Password compare error:', err);
        return res.status(500).json({ Error: 'Password compare error', Details: err.message });
      }

      // If the password matches
      if (isMatch) {
        const { userID, roleName, isFirstLogin, tokenVersion } = user;
        const newTokenVersion = tokenVersion + 1;

        // Create a new JWT token including the incremented token version
        const token = jwt.sign(
          { username: user.username, userID, role: roleName, tokenVersion: newTokenVersion },
          JWT_SECRET_KEY,
          { expiresIn: '1d' }
        );

        // Calculate the token expiration time (1 day from now)
        const tokenExpiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Save the generated token, its expiration, and the incremented token version in the user table
        const updateTokenSql = `
          UPDATE user SET token = ?, tokenExpiresOn = ?, tokenVersion = ? WHERE userID = ?
        `;

        // Execute the query to update the token, expiration time, and version
        db.query(updateTokenSql, [token, tokenExpiresOn, newTokenVersion, userID], (err) => {
          if (err) {
            console.error('Error saving token and expiration time:', err);
            return res.status(500).json({ Error: 'Failed to save token and expiration time', Details: err.message });
          }

          // Respond with the token and login details
          res.status(200).json({
            Status: 'Success',
            token,
            isFirstLogin: isFirstLogin === 1,  // Check if it's the first login
            user: {
              username: user.username,
              userID,
              role: roleName,
            },
          });
        });
      } else {
        // Respond with an error if the password does not match
        return res.status(401).json({ Error: 'Invalid password' });
      }
    });
  });
};

  

export const logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ Status: "Success", Message: "Logged out successfully" });
};
export const resetPassword = (req, res) => {
  const { oldPassword, newPassword } = req.body; // Receiving both old and new passwords
  const userID = req.user?.userID; // Ensure req.user is correctly set from the authentication middleware

  if (!userID) {
    return res.status(400).json({ Error: 'User ID not found in the request.' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ Error: 'Old password and new password are required.' });
  }

  // Query to fetch the current password hash for validation
  const getPasswordSql = `SELECT password FROM user WHERE userID = ?`;
  db.query(getPasswordSql, [userID], (err, results) => {
    if (err) {
      console.error('Error fetching current password:', err);
      return res.status(500).json({ Error: 'Error fetching current password.', Details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ Error: 'User not found.' });
    }

    const currentHashedPassword = results[0].password;

    // Compare the old password with the current hashed password
    bcrypt.compare(oldPassword, currentHashedPassword, (err, isMatch) => {
      if (err) {
        console.error('Error comparing old password:', err);
        return res.status(500).json({ Error: 'Error comparing old password.', Details: err.message });
      }

      // If the old password does not match
      if (!isMatch) {
        return res.status(401).json({ Error: 'Old password is incorrect.' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing new password:', err);
          return res.status(500).json({ Error: 'Error hashing new password.', Details: err.message });
        }

        // Update the password and set isFirstLogin to 0 (false)
        const updatePasswordSql = `UPDATE user SET password = ?, isFirstLogin = 0 WHERE userID = ?`;
        db.query(updatePasswordSql, [hashedPassword, userID], (err) => {
          if (err) {
            console.error('Error updating password in the database:', err);
            return res.status(500).json({ Error: 'Failed to update password.', Details: err.message });
          }

          // Respond with success message
          res.status(200).json({ Status: 'Success', Message: 'Password reset successfully.' });
        });
      });
    });
  });
}; 

export const forgotPassword = (req, res) => {
  const { email } = req.body;

  // Step 1: Retrieve the user based on email
  const findUserSql = `
    SELECT U.userID, U.isFirstLogin, E.email 
    FROM User U
    JOIN employees E ON U.employeeID = E.employeeID
    WHERE E.email = ?
  `;

  db.query(findUserSql, [email], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const user = userResult[0];

    // Step 2: Check if the user is logging in for the first time
    if (user.isFirstLogin) {
      return res.status(400).json({ message: 'Cannot send OTP. Please change your password on first login.' });
    }

    // Step 3: Check if the user requested OTP recently
    const findOtpSql = `
      SELECT otpRequestTime 
      FROM otp 
      WHERE userID = ? 
      ORDER BY otpRequestTime DESC 
      LIMIT 1
    `;

    db.query(findOtpSql, [user.userID], (err, otpResult) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving OTP history.' });
      }

      const currentTime = new Date();
      const otpRequestTime = otpResult.length > 0 ? new Date(otpResult[0].otpRequestTime) : null;
      const timeDiffInMinutes = otpRequestTime ? (currentTime - otpRequestTime) / 1000 / 60 : 3;

      // Step 4: If the user has requested an OTP within the last 2 minutes, block the request
      if (timeDiffInMinutes < 2) {
        return res.status(429).json({ message: 'Please wait 2 minutes before requesting a new OTP.' });
      }

      
// Step 5: Mark all previous OTPs as used to ensure only the new OTP is valid
const markOldOtpsAsUsedSql = `
UPDATE otp
SET otpUsed = 1
WHERE userID = ? AND otpUsed = 0
`;

db.query(markOldOtpsAsUsedSql, [user.userID], (err) => {
if (err) {
  return res.status(500).json({ message: 'Error invalidating previous OTPs.' });
}

// Step 6: Generate a new OTP and set the expiry time
const otp = generateOTP();
const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

// Step 7: Insert the new OTP into the otp table
const saveOtpSql = `
  INSERT INTO otp (userID, otp, otpExpiry, otpRequestTime, otpUsed) 
  VALUES (?, ?, ?, ?, 0)
`;

db.query(saveOtpSql, [user.userID, otp, expiryTime, currentTime], (err) => {
  if (err) {
    return res.status(500).json({ message: 'Error saving OTP.' });
  }

  // Step 8: Send OTP via email
  const mailOptions = {
    to: user.email,
    subject: 'Your Password Reset OTP',
    html: `<p>Your OTP for resetting your password is: <b>${otp}</b></p>
           <p>This OTP is valid for 10 minutes.</p>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
      return res.status(500).json({ message: 'Error sending OTP.' });
    }
    res.json({ message: 'OTP sent successfully to your email.' });
  });
});
});
});
});
};

export const validateOTP = (req, res) => {
  const { email, otp } = req.body;

  // Step 1: Retrieve the user based on email
  const findUserSql = `
    SELECT U.userID, E.email 
    FROM User U
    JOIN employees E ON U.employeeID = E.employeeID
    WHERE LOWER(E.email) = LOWER(?)
  `;

  db.query(findUserSql, [email], (err, userResult) => {
    if (err) {
      console.error("Error querying the database:", err);
      return res.status(500).json({ message: 'Database query error.' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const user = userResult[0];

    // Step 2: Validate OTP
    const findOtpSql = `
      SELECT * FROM otp 
      WHERE userID = ? 
      AND otp = ? 
      AND otpExpiry > NOW() 
      AND otpUsed = 0
      ORDER BY otpRequestTime DESC 
      LIMIT 1
    `;

    db.query(findOtpSql, [user.userID, otp], (err, otpResult) => {
      if (err) {
        console.error("Error querying the OTP database:", err);
        return res.status(500).json({ message: 'Database query error.' });
      }

      if (otpResult.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or OTP expired.' });
      }

      // OTP is valid
      res.json({ message: 'OTP validated successfully. You can now reset your password.' });
    });
  });
}; 

// OTP Validation and Password Reset
export const resetPasswordWithOTP = (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Step 1: Retrieve the user based on email
  const findUserSql = `
    SELECT U.userID, E.email 
    FROM User U
    JOIN employees E ON U.employeeID = E.employeeID
    WHERE LOWER(E.email) = LOWER(?)
  `;

  db.query(findUserSql, [email], (err, userResult) => {
    if (err) {
      console.error("Error querying the database:", err);
      return res.status(500).json({ message: 'Database query error.' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    const user = userResult[0];

    // Step 2: Validate OTP (again, in case user tries skipping validation)
    const findOtpSql = `
    SELECT * FROM otp 
    WHERE userID = ? 
    AND otp = ? 
    AND otpExpiry > NOW() 
    AND otpUsed = 0
    ORDER BY otpRequestTime DESC 
    LIMIT 1
  `;

    db.query(findOtpSql, [user.userID, otp], (err, otpResult) => {
      if (err) {
        console.error("Error querying the OTP database:", err);
        return res.status(500).json({ message: 'Database query error.' });
      }

      if (otpResult.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or OTP expired.' });
      }

      // Step 3: Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ message: 'Error hashing password.' });
        }

        // Step 4: Update the password, mark OTP as used
        const updatePasswordSql = `
          UPDATE User 
          SET password = ? 
          WHERE userID = ?
        `;

        db.query(updatePasswordSql, [hashedPassword, user.userID], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating password.' });
          }

          const updateOtpSql = `
            UPDATE otp 
            SET otpUsed = 1 
            WHERE otpID = ?
          `;

          db.query(updateOtpSql, [otpResult[0].otpID], (err) => {
            if (err) {
              return res.status(500).json({ message: 'Error marking OTP as used.' });
            }

            res.json({ message: 'Password reset successfully.' });
          });
        });
      });
    });
  });
};      