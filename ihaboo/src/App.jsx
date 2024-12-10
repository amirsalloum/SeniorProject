
import { AuthProvider } from './Authentication/AuthContext';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import Attendance from './pages/Attendance/Attendance';
import LeaveRequest from './pages/LeaveRequest/LeaveRequest';
import LoginPage from './pages/LoginPage/LoginPage';
import LeaveHistory from './pages/LeaveHistory/LeaveHistory';
import AdminDashboard from './pages/AdminDashboard/Dashboard/AdminDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard/SupervisorDashboard';
import Employees from './pages/AdminDashboard/Employees/Employees';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import LeaveRequestSuccess from './components/LeaveRequestSuccess/LeaveRequestSuccess';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPasswordWithOTP from './pages/ForgotPassword/ResetPasswordWithOTP';
import Payroll from './pages/Payroll/Payroll';
import VerificationCode from './pages/ForgotPassword/verificationCode';
import HrDashboard  from './pages/HrDashboard/HrDashboard';
import AdminLeaveHistory from './pages/AdminDashboard/LeaveHistory/LeaveHistory';
import AdminAttendance from './pages/AdminDashboard/Attendance/Attendance';
import AddEmployee from './pages/AdminDashboard/AddEmployee/AddEmployee';
import EditEmployee from './pages/AdminDashboard/EditEmployee/EditEmployee';
import AdminSetting from './pages/AdminDashboard/AdminSetting/AdminSetting';
import LoadingPage from './component/LoadingPage';

function App() {
  console.log("1234");
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route for Login Page */}
          <Route path="/login" element={<LoginPage />} />
          

          {/* Routes for Reset Password */}
          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/VerificationCode" element={<VerificationCode />} />
          <Route path="/resetPasswordWithOTP" element={<ResetPasswordWithOTP />} />


          {/* Protected routes for normal employees */}
          <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/:employeeId" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/attendance" element={<ProtectedRoute element={<Attendance />} />} />
          <Route path="/leaveRequest" element={<ProtectedRoute element={<LeaveRequest />} />} />
          <Route path="/leaveSuccess" element={<LeaveRequestSuccess />} />
          <Route path="/leaveHistory" element={<ProtectedRoute element={<LeaveHistory />} />} />
          <Route path="/payRoll" element={<ProtectedRoute element={<Payroll />} />} />
          <Route path="/loading" element={<ProtectedRoute element={<LoadingPage />} />} />

          {/* Admin-specific routes */}
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute element={<AdminDashboard />} requiredRole="Admin" />}
          />
          <Route
            path="/adminLeaveHistory"
            element={<ProtectedRoute element={<AdminLeaveHistory />} requiredRole="Admin" />}
          />
            <Route
            path="/admin-attendance"
            element={<ProtectedRoute element={<AdminAttendance />} requiredRole="Admin" />}
          />
          <Route
            path="/employees"
            element={<ProtectedRoute element={<Employees />} requiredRole={['Admin', 'HR', 'Supervisor']} />}
          />
          <Route
            path="/add-employee"
            element={<ProtectedRoute element={<AddEmployee />} requiredRole="Admin" />}
          />
          <Route
            path="/edit-employee/:id"
            element={<ProtectedRoute element={<EditEmployee />} requiredRole="Admin" />}
          />
          <Route
            path="/admin-setting"
            element={<ProtectedRoute element={<AdminSetting />} requiredRole="Admin" />}
          />



          {/* Supervisor-specific routes */}
          <Route
            path="/supervisor-dashboard"
            element={<ProtectedRoute element={<SupervisorDashboard />} requiredRole="Supervisor" />}
          />
          <Route
            path="/supervisorLeaveHistory"
            element={<ProtectedRoute element={<AdminLeaveHistory />} requiredRole="Supervisor" />}
          />
          <Route
            path="/supervisorattendance"
            element={<ProtectedRoute element={<AdminAttendance />} requiredRole="Supervisor" />}
          />
          <Route
            path="/Supemployees"
            element={<ProtectedRoute element={<Employees />} requiredRole="Supervisor" />}
          />
          

          {/* HR-specific routes */}
          <Route
            path="/hr-dashboard"
            element={<ProtectedRoute element={<HrDashboard />} requiredRole="HR" />}
          />
          <Route
            path="/HRLeaveHistory"
            element={<ProtectedRoute element={<AdminLeaveHistory />} requiredRole="HR" />}
          />
              <Route
            path="/hr-attendance"
            element={<ProtectedRoute element={<AdminAttendance />} requiredRole="HR" />}
          />
          <Route
            path="/Hremployees"
            element={<ProtectedRoute element={<Employees />} requiredRole="HR"/>}
          />


        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;