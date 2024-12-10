

import express from 'express';
import {  uploadProfilePicture, uploadMiddleware,getWorkSchedules ,EmploymentDetails ,getEmployeeInfo,getLeaveBalance, updateEmployeeInfo} from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware

const router = express.Router();

// Logged-in user's data
router.get('/workSchedule', authenticateToken, getWorkSchedules);
router.get('/employmentDetails', authenticateToken,EmploymentDetails);
router.get('/fullemployee', authenticateToken, getEmployeeInfo);
router.get('/leavebalance', authenticateToken,getLeaveBalance );

// For admin to view data of a specific user by employeeId
router.get('/workSchedule/:employeeId', authenticateToken, authorizeRoles('Admin', 'HR','Supervisor'), getWorkSchedules);
router.get('/employmentDetails/:employeeId', authenticateToken, authorizeRoles('Admin', 'HR','Supervisor'), EmploymentDetails);
router.get('/fullemployee/:employeeId', authenticateToken, authorizeRoles('Admin', 'HR','Supervisor'), getEmployeeInfo);
router.get('/leavebalance/:employeeId', authenticateToken, authorizeRoles('Admin', 'HR','Supervisor'), getLeaveBalance);


// Route to upload a profile picture, accessible by Admin, HR, Employee, and Supervisor
router.post(
    '/uploadProfile',
    authenticateToken,
    authorizeRoles('Admin', 'HR', 'Employee', 'Supervisor'),
    uploadMiddleware, 
    uploadProfilePicture
  );
  router.put('/updateemployee', authenticateToken, updateEmployeeInfo);


export default router;    

