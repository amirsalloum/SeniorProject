// api/routes/payrollRoute.js
import express from 'express';
import { createPayrollStatus,getAllEmployeesPayrollRecords, getAllPayrollRecords ,calculateWeeklyPayroll, deletePayrollStatus, deletePayrollRecord } from '../controllers/payroll.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();

// Route to create a payroll status, only Admin can access this route
router.post('/create-status', authenticateToken, authorizeRoles('Admin'), createPayrollStatus);

// Route to create a payroll record, only Admin can access this route
router.get('/getPayrollRecords', authenticateToken, getAllPayrollRecords);

router.get('/getAllEmployeesPayrollRecords', authenticateToken, authorizeRoles('Admin'), getAllEmployeesPayrollRecords);
router.post('/generatePayroll', authenticateToken, authorizeRoles('Admin'), calculateWeeklyPayroll);

// Route to delete a payroll status, only Admin can access this route
router.delete('/delete-status/:statusPayrollID', authenticateToken, authorizeRoles('Admin'), deletePayrollStatus);

// Route to delete a payroll record, only Admin can access this route
router.delete('/delete-record/:payrollID', authenticateToken, authorizeRoles('Admin'), deletePayrollRecord);


export default router;