import db from '../db.js';  

export const calculateAccruedLeave = async (employeeID, startDate) => {
  try {
    // Standard full-time working hours per week
    const standardFullTimeHoursPerWeek = 38; // Adjust as necessary

    // Leave amounts per week for full-time hours
    const annualLeaveAmount = 2.923;   // Annual leave amount per week
    const personalLeaveAmount = 1.462; // Personal leave amount per week

    // Fetch all weekly working hours since startDate
    const fetchWeeklyHoursSql = `
      SELECT weekStartDate, totalWorkingHours
      FROM Weekly_Working_Hours
      WHERE employeeID = ? AND weekStartDate >= ?
      ORDER BY weekStartDate ASC
    `;

    const [weeklyHoursResults] = await db.execute(fetchWeeklyHoursSql, [employeeID, startDate]);

    let totalAccruedAnnualLeave = 0;
    let totalAccruedPersonalLeave = 0;

    for (const week of weeklyHoursResults) {
      const weekWorkingHours = parseFloat(week.totalWorkingHours);

      // Calculate leave accrued this week based on actual working hours
      const annualLeaveThisWeek = (weekWorkingHours / standardFullTimeHoursPerWeek) * annualLeaveAmount;
      const personalLeaveThisWeek = (weekWorkingHours / standardFullTimeHoursPerWeek) * personalLeaveAmount;

      totalAccruedAnnualLeave += annualLeaveThisWeek;
      totalAccruedPersonalLeave += personalLeaveThisWeek;
    }

    return {
      annualLeaveMinutes: Math.floor(totalAccruedAnnualLeave * 60),   // Convert hours to minutes
      personalLeaveMinutes: Math.floor(totalAccruedPersonalLeave * 60),
    };
  } catch (error) {
    console.error("Error in calculateAccruedLeave:", error);
    throw error;
  }
};
