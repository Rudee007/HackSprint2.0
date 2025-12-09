// context/AuthContext.jsx (FIXED - SUPPORTS ADMIN)
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ✅ ADD: token state
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Check authentication from localStorage (including admin)
  const checkAuthStatus = () => {
    try {
      console.log('🔍 Checking auth status...');
      
      // ✅ Check for tokens (including adminToken)
      const accessToken = localStorage.getItem('accessToken');
      const adminToken = localStorage.getItem('adminToken');
      const authToken = accessToken || adminToken;
      
      // ✅ Check for user data (including adminData)
      const userData = localStorage.getItem('user');
      const adminData = localStorage.getItem('adminData');
      const userDataStr = userData || adminData;
      
      // ✅ Check for legacy authentication
      const id = localStorage.getItem('id');
      const session = localStorage.getItem('session');

      console.log('🔍 Found tokens:', {
        accessToken: !!accessToken,
        adminToken: !!adminToken,
        userData: !!userData,
        adminData: !!adminData,
        id: !!id,
        session: !!session
      });

      if (authToken || id || session) {
        setIsAuthenticated(true);
        setToken(authToken); // ✅ Store token in state
        
        // Parse user data if available
        if (userDataStr) {
          try {
            const parsedUser = JSON.parse(userDataStr);
            console.log('✅ Parsed user data:', parsedUser);
            
            setUser({
              id: parsedUser.id || parsedUser._id || id,
              name: parsedUser.name || parsedUser.fullName || parsedUser.email || 'User',
              email: parsedUser.email || '',
              role: parsedUser.role || 'patient',
              permissions: parsedUser.permissions || [],
              initial: (parsedUser.name || parsedUser.fullName || parsedUser.email || 'U').charAt(0).toUpperCase(),
              token: authToken // ✅ Include token in user object
            });
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setUser({
              id: id,
              name: 'User',
              email: '',
              role: 'patient',
              initial: 'U',
              token: authToken
            });
          }
        } else {
          // Fallback user object
          setUser({
            id: id,
            name: 'User',
            email: '',
            role: 'patient',
            initial: 'U',
            token: authToken
          });
        }
        
        console.log('✅ Authentication successful');
      } else {
        console.log('❌ No authentication found');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    }
    
    setLoading(false);
  };

  // Initial check on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      const authKeys = ['user', 'adminData', 'accessToken', 'adminToken', 'id', 'session'];
      if (authKeys.includes(event.key)) {
        console.log('🔄 Storage changed:', event.key);
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Logout function
  const logout = () => {
    console.log('🚪 Logging out...');
    
    // Clear all auth-related data
    const keysToRemove = [
      'user', 'adminData',
      'accessToken', 'adminToken',
      'id', 'session',
      'patientProfile',
      'loggedInAdmin',
      'loggedInDoctor',
      'loggedInTherapist'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const login = (userData, authToken) => {
    console.log('👤 Logging in...', { userData, hasToken: !!authToken });
    
    if (authToken) {
      if (userData.role === 'super_admin' || userData.role === 'admin') {
        localStorage.setItem('adminToken', authToken);
        localStorage.setItem('adminData', JSON.stringify(userData));
      } else {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
    
    if (userData && (userData.id || userData._id)) {
      localStorage.setItem('id', userData.id || userData._id);
    }
    
    checkAuthStatus();
  };

  const value = {
    isAuthenticated,
    user,
    token, 
    loading,
    login,
    logout,
    checkAuthStatus
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
