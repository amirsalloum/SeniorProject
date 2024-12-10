
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { getUserRole } from '../utils/getUserRole'; // Ensure role fetching is consistent

const ProtectedRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // Ensure requiredRole is an array
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Check if userRole is included in the required roles
    if (!rolesArray.includes(userRole)) {
      alert('Access denied: insufficient permissions');
      return <Navigate to="/" replace />;
    }
  }

  return <Layout>{element}</Layout>;
};

export default ProtectedRoute;

