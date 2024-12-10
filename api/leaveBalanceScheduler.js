// leaveBalanceScheduler.js
import db from './db.js'; // Adjust the path as needed

export const updateWeeklyLeaveBalances = async () => {
  try {
    // Step 1: Fetch all active employees and their contract details
    const fetchEmployeesSql = `
      SELECT e.employeeID, e.StartDate, e.WorkingHours AS workingHoursPerWeek, ct.totalWorkingHours
      FROM employees e
      JOIN Contract_Type ct ON e.employeeID = ct.employeeID
    `;

    const [employees] = await db.promise().query(fetchEmployeesSql);

    // Step 2: Iterate over each employee to calculate and update their leave balances
    for (const employee of employees) {
      const { employeeID, StartDate, totalWorkingHours, workingHoursPerWeek } = employee;

      // Handle cases where totalWorkingHours or workingHoursPerWeek might be zero or null
      if (!totalWorkingHours || !workingHoursPerWeek) {
        console.warn(`Skipping employeeID ${employeeID} due to missing working hours data.`);
        continue;
      }

      // Calculate the accrued leave for this week only
      const annualLeavePerWeek = (workingHoursPerWeek / totalWorkingHours) * 2.923;
      const personalLeavePerWeek = (workingHoursPerWeek / totalWorkingHours) * 1.462;

      const annualLeaveMinutes = Math.floor(annualLeavePerWeek * 60); // Convert hours to minutes
      const personalLeaveMinutes = Math.floor(personalLeavePerWeek * 60);

      // Step 3: Update the Leave_Balance table
      // Start a transaction
      await db.promise().beginTransaction();

      try {
        // Update Annual Leave
        const updateAnnualLeaveSql = `
          UPDATE Leave_Balance
          SET balance = balance + ?
          WHERE employeeID = ? AND leaveTypeID = (
            SELECT leaveTypeID FROM Leave_Type WHERE leaveTypeName = 'Annual Leave'
          )
        `;
        await db.promise().query(updateAnnualLeaveSql, [annualLeaveMinutes, employeeID]);

        // Update Personal Leave
        const updatePersonalLeaveSql = `
          UPDATE Leave_Balance
          SET balance = balance + ?
          WHERE employeeID = ? AND leaveTypeID = (
            SELECT leaveTypeID FROM Leave_Type WHERE leaveTypeName = 'Personal Leave'
          )
        `;
        await db.promise().query(updatePersonalLeaveSql, [personalLeaveMinutes, employeeID]);

        // Commit the transaction
        await db.promise().commit();
      } catch (error) {
        // Rollback in case of error
        await db.promise().rollback();
        console.error(`Error updating leave balance for employeeID ${employeeID}:`, error);
      }
    }

    console.log('Weekly leave balances updated successfully.');
  } catch (error) {
    console.error('Error updating weekly leave balances:', error);
  }
};
