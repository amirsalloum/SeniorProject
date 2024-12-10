// api/routes/employeeRoute.js
import express from 'express';
import {
  createBranch,
  deleteBranch,
  createDepartment,
  deleteDepartment,
  createPosition,
  deletePosition,
  createSalaryType,
  deleteSalaryType,
  createWorkStatus,
  deleteWorkStatus,
  getAllEmployees,
  getSupervisorEmployees,
  getAllBranches,
  getBranchById ,
  getAllDepartments,
  getDepartmentById,
  getAllPositions,
  getPositionById,
  getAllSalaryTypes,
  getSalaryTypeById,
  getAllWorkStatuses,
  getWorkStatusById,
  getEmployeeById,
  createHoliday,
  getHolidays,
  getHolidayById,
  deleteHoliday


 }
  from '../controllers/employee.controller.js';  // Ensure the path matches your project structure
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Import the authentication middleware
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();

// Routes to create entities, only Admin can access
router.post('/createBranch', authenticateToken, authorizeRoles('Admin'), createBranch);
router.post('/createDepartment', authenticateToken, authorizeRoles('Admin'), createDepartment);
router.post('/createPosition', authenticateToken, authorizeRoles('Admin'), createPosition);
router.post('/createSalaryType', authenticateToken, authorizeRoles('Admin'), createSalaryType);
router.post('/createWorkStatus', authenticateToken, authorizeRoles('Admin'), createWorkStatus);
// 8. Holiday Routes
router.post('/create-holiday', authenticateToken, authorizeRoles('Admin'), createHoliday);


// Routes to fetch all branches or a specific branch by ID
router.get('/branches', authenticateToken, authorizeRoles('Admin', 'HR'), getAllBranches);
router.get('/branches/:brancheID', authenticateToken, authorizeRoles('Admin', 'HR'), getBranchById);
// Routes to fetch all departments or a specific department by ID
router.get('/departments', authenticateToken, authorizeRoles('Admin', 'HR'), getAllDepartments);
router.get('/departments/:departmentID', authenticateToken, authorizeRoles('Admin', 'HR'), getDepartmentById);
// Routes to fetch all positions or a specific position by ID
router.get('/positions', authenticateToken, authorizeRoles('Admin', 'HR'), getAllPositions);
router.get('/positions/:positionID', authenticateToken, authorizeRoles('Admin', 'HR'), getPositionById);
// Routes to fetch all salary types or a specific salary type by ID
router.get('/salary-types', authenticateToken, authorizeRoles('Admin', 'HR'), getAllSalaryTypes);
router.get('/salary-types/:salaryTypeID', authenticateToken, authorizeRoles('Admin', 'HR'), getSalaryTypeById);
// Routes to fetch all work statuses or a specific work status by ID
router.get('/work-statuses', authenticateToken, authorizeRoles('Admin', 'HR'), getAllWorkStatuses);
router.get('/work-statuses/:workStatusID', authenticateToken, authorizeRoles('Admin', 'HR'), getWorkStatusById);
// Get a specific holiday by ID
router.get('/holidays', authenticateToken, authorizeRoles('Admin', 'HR'), getHolidays);
router.get('/holidays/:holidayID', authenticateToken, authorizeRoles('Admin', 'HR'), getHolidayById);


// Routes to delete entities, only Admin can access
router.delete('/deleteBranch/:brancheID', authenticateToken, authorizeRoles('Admin'), deleteBranch);
router.delete('/deleteDepartment/:departmentID', authenticateToken, authorizeRoles('Admin'), deleteDepartment);
router.delete('/deletePosition/:positionID', authenticateToken, authorizeRoles('Admin'), deletePosition);
router.delete('/deleteSalaryType/:salaryTypeID', authenticateToken, authorizeRoles('Admin'), deleteSalaryType);
router.delete('/deleteWorkStatus/:workStatusID', authenticateToken, authorizeRoles('Admin'), deleteWorkStatus);
router.delete('/deleteholiday/:holidayID', authenticateToken, authorizeRoles('Admin'), deleteHoliday);

//Routes to fetch all employees in the system 
router.get('/all-employees', authenticateToken, authorizeRoles('Admin' , 'HR') , getAllEmployees);
router.get('/supervisor-employees', authenticateToken, authorizeRoles('Supervisor') , getSupervisorEmployees);
router.get('/employees/:employeeID', authenticateToken, authorizeRoles('Admin', 'HR'), getEmployeeById);


export default router;