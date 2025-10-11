// src/components/ProtectedRoute.jsx (NEW)
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const getAuthData = () => {
    try {
      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('token');
      
      if (!token) return null;

      // Get user data
      const userKeys = ['loggedInUser', 'loggedInAdmin', 'loggedInDoctor', 'loggedInTherapist'];
      
      for (const key of userKeys) {
        const userStr = localStorage.getItem(key);
        if (userStr) {
          const user = JSON.parse(userStr);
          return {
            token,
            user,
            role: user.role || user.userType || 'user'
          };
        }
      }
      
      return { token, user: null, role: null };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  };

  const getLoginRoute = (role) => {
    const loginRoutes = {
      'admin': '/admin-login',
      'doctor': '/doctor-login',
      'therapist': '/therapist-login',
      'patient': '/patient-login'
    };
    return loginRoutes[role] || '/login';
  };

  const authData = getAuthData();

  // Not authenticated - redirect to appropriate login
  if (!authData || !authData.token) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && authData.role) {
    if (!allowedRoles.includes(authData.role)) {
      console.log(`❌ Access denied for role: ${authData.role}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Authenticated and authorized
  return children;
};

export default ProtectedRoute;
//protected route is cahnged