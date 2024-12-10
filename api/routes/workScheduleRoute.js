// api/routes/workScheduleRoute.js
import express from 'express';
import { createWorkSchedule, deleteWorkSchedule } from '../controllers/workSchedule.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();

// Route to create or update a work schedule, only Admin can access this route
router.post('/create', authenticateToken, authorizeRoles('Admin'), createWorkSchedule);

// Route to delete a work schedule, only Admin can access this route
router.delete('/delete/:scheduleID', authenticateToken, authorizeRoles('Admin'), deleteWorkSchedule);


export default router; 