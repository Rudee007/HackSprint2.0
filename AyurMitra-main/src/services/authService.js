// src/services/authService.js

/**
 * Get the authentication header with the JWT token
 * @returns {Promise<string>} Authentication header with Bearer token
 */
export const getAuthHeader = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return null;
      }
      
      return `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting auth header:', error);
      return null;
    }
  };
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return !!token; // Convert to boolean
  };
  
  /**
   * Check if the user has admin role
   * @returns {boolean} True if admin, false otherwise
   */
  export const isAdmin = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return userInfo && userInfo.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };
  
  /**
   * Check if the user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if has permission, false otherwise
   */
  export const hasPermission = (permission) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      return userInfo && userInfo.permissions && userInfo.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };
  
  /**
   * Login user and store token and user info
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  export const login = async (email, password) => {
    // This would normally be an API call to your backend
    // For now, we'll just simulate it
    
    // In a real implementation, this would be:
    // const response = await axios.post('/api/auth/login', { email, password });
    // localStorage.setItem('authToken', response.data.token);
    // localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    // return response.data.user;
    
    // Simulated implementation for frontend development
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        // Mock admin credentials check
        if (email === 'admin@example.com' && password === 'password') {
          const mockUser = {
            _id: 'admin123',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['user_management', 'appointment_management', 'system_analytics'],
            isActive: true
          };
          
          const mockToken = 'mock-jwt-token-for-admin-user';
          
          localStorage.setItem('authToken', mockToken);
          localStorage.setItem('userInfo', JSON.stringify(mockUser));
          
          resolve(mockUser);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  };
  
  /**
   * Logout user and remove token and user info
   */
  export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redirect to login page or home page
    window.location.href = '/login';
  };
  
  const authService = {
    getAuthHeader,
    isAuthenticated,
    isAdmin,
    hasPermission,
    login,
    logout
  };
  
  export default authService;