// src/pages/AdminDashboard/AdminDashboard.jsx
import React from 'react';
import './AdminDashboard.scss'; // Create a corresponding SCSS file for styles

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-content">
        <section className="overview">
          <h2>Overview</h2>
          <p>Welcome to the admin dashboard. Use the navigation to manage users, view reports, and control settings.</p>
        </section>

        <section className="stats">
          <h2>Statistics</h2>
          {/* Add statistics or charts here */}
          <div className="stat-box">
            <h3>Total Users</h3>
            <p>123</p>
          </div>
          <div className="stat-box">
            <h3>Active Employees</h3>
            <p>98</p>
          </div>
        </section>

        <section className="management">
          <h2>Management Actions</h2>
          <ul>
            <li><button onClick={() => alert('Manage Users')}>Manage Users</button></li>
            <li><button onClick={() => alert('View Reports')}>View Reports</button></li>
            <li><button onClick={() => alert('Settings')}>Settings</button></li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
