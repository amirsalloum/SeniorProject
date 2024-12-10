import express from "express";
import { login, logout, registerAndManage,updateRegister, deleteEmployee, resetPassword, forgotPassword, resetPasswordWithOTP,validateOTP } from "../controllers/auth.controller.js";  // Ensure paths are correct
import { authenticateToken } from "../middleware/authenticationMiddleware.js";
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();

// User authentication routes
router.post("/register", registerAndManage);
router.post("/login", login);
router.post("/logout", logout);
router.post('/resetPassword', authenticateToken, resetPassword);
router.post('/forgotPassword', forgotPassword); // Forgot password route
router.post('/validateOTP', validateOTP); //validte otp
router.post('/resetPasswordWithOTP', resetPasswordWithOTP); // Validate OTP and reset password


//route to update 
router.put("/updateregister", updateRegister);


// Route to delete an employee, only Admin can access this route
router.delete(
    '/deleteEmployee/:employeeID',
    authenticateToken,
    authorizeRoles('Admin'), 
    deleteEmployee
  );
  

// Fetch employee details based on the token, not employeeID from the URL
 

export default router;
    