import express from 'express';
import multer from 'multer';
import {
  createLeaveType,
  deleteLeaveType,
  getLeaveTypes,
  createLeaveStatus,
  deleteLeaveStatus,
  submitLeaveRequest,
  deleteLeaveRequest,
  supervisorDecision,
  upload,
  hrDecision,
  viewDocument,
  getLeaveHistory,
  getAllEmployeesLeaveHistory,
  getSupervisorLeaveHistory
} from '../controllers/leave.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';
import { authorizeRoles } from '../middleware/authorizationMiddleware.js';

const router = express.Router();


// 1. Leave Type Routes
router.post('/create', authenticateToken, authorizeRoles('Admin'), createLeaveType);
router.delete('/delete-type/:leaveTypeID', authenticateToken, authorizeRoles('Admin'), deleteLeaveType);
router.get('/types', authenticateToken, getLeaveTypes);

// 2. Leave Status Routes
router.post('/create-status', authenticateToken, authorizeRoles('Admin'), createLeaveStatus);
router.delete('/delete-status/:statusLeaveID', authenticateToken, authorizeRoles('Admin'), deleteLeaveStatus);

// 4. Leave Request Routes
router.post(
  '/submit',
  authenticateToken,
  authorizeRoles('Admin', 'Supervisor', 'HR', 'Employee'),
  upload.single('documentAttach'),
  submitLeaveRequest
);
router.delete('/delete-request/:leaveRequestID', authenticateToken, authorizeRoles('Admin'), deleteLeaveRequest);

// 5. Supervisor and HR Decision Routes
router.post('/supervisor-decision', authenticateToken, authorizeRoles('Supervisor'), supervisorDecision);
router.post('/hr-decision', authenticateToken, authorizeRoles('HR' , 'Admin'), hrDecision);

// 6. Leave History Routes
router.get('/leave-history', authenticateToken, getLeaveHistory);
router.get('/allLeave-history', authenticateToken, authorizeRoles('Admin', 'HR'), getAllEmployeesLeaveHistory);
router.get('/supervisorLeave-history', authenticateToken, authorizeRoles('Supervisor'), getSupervisorLeaveHistory);


// 7. Document Upload and View Routes
router.post('/upload-document', upload.single('documentAttach'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ message: 'File uploaded successfully', filePath });
});

router.get('/view-document/:documentName', viewDocument);


export default router;
