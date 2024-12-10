import express from 'express';
import { createAction,updateFingerprint, recordFingerprint ,getWeeklyWorkingHours,calculateWeeklyWorkingHours_LeaveBalance,deleteAction,deleteFingerprintRecord, getEmployeeAttendanceRecords ,getAllAttendanceRecords,getSupervisorAttendanceRecords,getEmployeeActionsByDate} from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();


router.post(
  '/calculate-weekly-working-hours',
  authenticateToken,
  authorizeRoles('Admin'),
  calculateWeeklyWorkingHours_LeaveBalance
);

router.get("/getWeeklyWorkingHours" , authenticateToken , getWeeklyWorkingHours)


// Route to create or update an action, only Admin can access this route
router.post(
    '/create-action',
    authenticateToken,
    authorizeRoles('Admin'), 
    createAction
  );
  
  // Route to delete an action, only Admin can access this route
  router.delete(
    '/delete-action/:actionID',
    authenticateToken,
    authorizeRoles('Admin'), 
    deleteAction
  );
  
// Route to create or update a fingerprint record, only Admin can access this route
router.post(
    '/record-fingerprint',
    authenticateToken,
    authorizeRoles('Admin'), 
    recordFingerprint
  );
  router.put(
    '/update-fingerprint',
    authenticateToken,
    authorizeRoles('Admin'), 
    updateFingerprint
  );
  // Route to delete a fingerprint record, only Admin can access this route
  router.delete(
    '/delete-fingerprint/:fingerPrintID',
    authenticateToken,
    authorizeRoles('Admin'), 
    deleteFingerprintRecord
  );
  


router.get("/getAttendanceRecord" , authenticateToken , getEmployeeAttendanceRecords)

router.get('/getsupervisorattendance', authenticateToken, authorizeRoles('Supervisor'), getSupervisorAttendanceRecords);
router.get("/getallAttendance", authenticateToken, authorizeRoles('Admin', 'HR') , getAllAttendanceRecords);



router.get(
  '/getEmployeeActionsByDate/:employeeID/:date',
  authenticateToken,
  getEmployeeActionsByDate
);


export default router;