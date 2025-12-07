// services/therapistAuthService.js
import { apiService } from './apiService';

export const therapistAuthService = {
  // Login therapist using backend API
  async loginTherapist(emailOrPhone, password) {
    try {
      // First, authenticate with the user endpoint
      const loginData = await apiService.post('/auth/login', {
        emailOrPhone,
        password,
        role: 'therapist'
      }, { auth: false });

      if (!loginData.success) {
        return { success: false, error: loginData.message };
      }

      // Store the JWT token
      localStorage.setItem('authToken', loginData.data.token);
      localStorage.setItem('refreshToken', loginData.data.refreshToken || '');

      // Get therapist profile data
      try {
        const profileData = await apiService.get('/therapists/profile');
        
        if (profileData.success) {
          const therapistInfo = {
            ...loginData.data.user,
            ...profileData.data,
            token: loginData.data.token
          };

          // Store therapist info
          localStorage.setItem('loggedInTherapist', JSON.stringify(therapistInfo));
          
          return { success: true, therapist: therapistInfo };
        } else {
          // User exists but no therapist profile
          return { 
            success: false, 
            error: 'Therapist profile not found. Please contact administrator.' 
          };
        }
      } catch (profileError) {
        // Clear stored token if profile fetch fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        return { 
          success: false, 
          error: 'Unable to load therapist profile. Please try again.' 
        };
      }

    } catch (error) {
      console.error('Therapist login error:', error);
      
      // Handle specific error messages
      if (error.message.includes('Invalid credentials')) {
        return { success: false, error: 'Invalid email/phone or password' };
      } else if (error.message.includes('Account is locked')) {
        return { success: false, error: 'Account is temporarily locked. Please try again later.' };
      } else if (error.message.includes('not verified')) {
        return { success: false, error: 'Please verify your email/phone before logging in' };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // Register new therapist
  async registerTherapist(userData, therapistData) {
    try {
      // First register as user
      const userResult = await apiService.post('/auth/register', {
        ...userData,
        role: 'therapist'
      }, { auth: false });

      if (!userResult.success) {
        return { success: false, error: userResult.message };
      }

      // Login to get token
      const loginResult = await this.loginTherapist(userData.email || userData.phone, userData.password);
      
      if (!loginResult.success) {
        return { success: false, error: 'Registration successful but login failed' };
      }

      // Create therapist profile
      const profileResult = await apiService.post('/therapists/register', {
        ...therapistData,
        userId: userResult.data.user._id
      });

      if (profileResult.success) {
        return { success: true, message: 'Therapist registration successful' };
      } else {
        return { success: false, error: profileResult.message };
      }

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  },

  // Get current logged-in therapist
  getCurrentTherapist() {
    // Fix: Use correct localStorage keys from your data structure
    const therapistData = localStorage.getItem('user');  // Not 'user[0]'
    const token = localStorage.getItem('accessToken');   // Not 'accesstoken' (case sensitive)
    
    if (!therapistData || !token) {
      return null;
    }
  
    try {
      // Clean and validate the data before parsing
      const cleanedData = therapistData.trim();
      
      // Check if it's already an object (sometimes localStorage returns parsed data)
      if (typeof therapistData === 'object') {
        return therapistData;
      }
      
      // Ensure it looks like valid JSON before parsing
      if (cleanedData.startsWith('{') && cleanedData.endsWith('}')) {
        const parsedData = JSON.parse(cleanedData);
        
        // Validate the structure has required fields
        if (parsedData && (parsedData.name || parsedData.id)) {
          return parsedData;
        }
      }
      
      // If data doesn't look like valid JSON, try to extract JSON substring
      const jsonStart = cleanedData.indexOf('{');
      const jsonEnd = cleanedData.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanedData.substring(jsonStart, jsonEnd + 1);
        const parsedData = JSON.parse(jsonString);
        
        if (parsedData && (parsedData.name || parsedData.id)) {
          return parsedData;
        }
      }
      
      // If all parsing attempts fail
      console.warn('Unable to parse therapist data, clearing localStorage');
      this.logout();
      return null;
      
    } catch (error) {
      console.error('Error parsing therapist data:', error);
      console.error('Raw data:', therapistData);
      
      // Clear corrupted data
      this.logout();
      return null;
    }
  },
  
  // Also update the logout method to clear the correct keys
  logout() {
    localStorage.removeItem('user');        // Match the correct key
    localStorage.removeItem('accessToken'); // Match the correct key
    window.location.href = '/therapist-login';
  }
  ,

  // Update therapist profile
  async updateProfile(profileData) {
    try {
      const currentTherapist = this.getCurrentTherapist();
      if (!currentTherapist) {
        throw new Error('No therapist logged in');
      }

      const result = await apiService.put(`/therapists/${currentTherapist._id}`, profileData);
      
      if (result.success) {
        // Update stored therapist data
        const updatedTherapist = { ...currentTherapist, ...result.data };
        localStorage.setItem('loggedInTherapist', JSON.stringify(updatedTherapist));
        return { success: true, data: updatedTherapist };
      }
      
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Refresh authentication token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await apiService.post('/auth/refresh', {
        refreshToken
      }, { auth: false });

      if (result.success) {
        localStorage.setItem('authToken', result.data.token);
        return { success: true };
      }

      throw new Error(result.message);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return { success: false };
    }
  },

  // Logout therapist
  async logout() {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Notify backend about logout (optional)
        await apiService.post('/auth/logout').catch(() => {
          // Ignore logout API errors
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem('loggedInTherapist');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Check if therapist is logged in
  isLoggedIn() {
    const token = localStorage.getItem('accessToken');
    const therapist = localStorage.getItem('loggedInTherapist');
    return !!(token && therapist);
  },

  // Check if token is expired (basic check)
  isTokenExpired() {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  }
};
