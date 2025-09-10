// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication from localStorage
  const checkAuthStatus = () => {
    try {
      // Check for id, session, or accessToken in localStorage
      const id = localStorage.getItem('id');
      const session = localStorage.getItem('session');
      const accessToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (id || session || accessToken) {
        setIsAuthenticated(true);
        
        // Parse user data if available
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser({
            id: parsedUser.id || parsedUser._id || id,
            name: parsedUser.name || parsedUser.fullName || parsedUser.email || 'User',
            email: parsedUser.email || '',
            role: parsedUser.role || 'patient',
            initial: (parsedUser.name || parsedUser.fullName || parsedUser.email || 'U').charAt(0).toUpperCase()
          });
        } else {
          // Fallback user object
          setUser({
            id: id,
            name: 'User',
            email: '',
            role: 'patient',
            initial: 'U'
          });
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setLoading(false);
  };

  // Initial check on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'user' || event.key === 'accessToken' || 
          event.key === 'id' || event.key === 'session') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('id');
    localStorage.removeItem('session');
    localStorage.removeItem('patientProfile');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Login function (call this after successful login)
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.id || userData._id) {
        localStorage.setItem('id', userData.id || userData._id);
      }
    }
    checkAuthStatus(); // This will update the state
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus // Expose for manual refresh if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
