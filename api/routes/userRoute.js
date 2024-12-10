// api/routes/userRoute.js
import express from 'express';
import {  createRole, createStatus,updateEmployeeStatus, deleteRole, deleteStatus , getRoleById,getAllRoles,getAllStatuses,getStatusById} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();


// Route to create a new role, only Admin can access this route
router.post('/create-role', authenticateToken, authorizeRoles('Admin'), createRole);

// Route to create a new status, only Admin can access this route
router.post('/create-status', authenticateToken, authorizeRoles('Admin'), createStatus);


// Routes to fetch all roles or a specific role by ID
router.get('/roles', authenticateToken, authorizeRoles('Admin', 'HR'), getAllRoles);
router.get('/roles/:roleID', authenticateToken, authorizeRoles('Admin', 'HR'), getRoleById);
// Routes to fetch all statuses or a specific status by ID
router.get('/statuses', authenticateToken, authorizeRoles('Admin', 'HR'), getAllStatuses);
router.get('/statuses/:statusID', authenticateToken, authorizeRoles('Admin', 'HR'), getStatusById);


router.put('/updateStatus/:employeeID',authenticateToken, authorizeRoles('Admin', 'HR'), updateEmployeeStatus);


// Route to delete a status, only Admin can access this route
router.delete('/delete-status/:statusID', authenticateToken, authorizeRoles('Admin'), deleteStatus);

// Route to delete a role, only Admin can access this route
router.delete('/delete-role/:roleID', authenticateToken, authorizeRoles('Admin'), deleteRole);



export default router; 