// src/services/adminService.js
import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const authHeader = await getAuthHeader();
  if (authHeader) {
    config.headers.Authorization = authHeader;
  }
  return config;
});

const adminService = {
  // ============ USER MANAGEMENT SECTION ============
  
  /**
   * Get users with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.role - Filter by role
   * @param {boolean|string} params.isActive - Filter by active status
   * @param {string} params.search - Search term
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction ('asc' or 'desc')
   * @returns {Promise<Object>} Users data with pagination
   */
  getUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get user statistics for dashboard
   * @returns {Promise<Object>} User statistics
   */
  getUserStats: async () => {
    try {
      const response = await apiClient.get('/admin/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user data
   */
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Toggle user active status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data
   */
  toggleUserStatus: async (userId) => {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user data
   */
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // ============ APPOINTMENT MANAGEMENT SECTION ============
  
  /**
   * Get appointments with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.providerId - Filter by provider ID
   * @param {string} params.patientId - Filter by patient ID
   * @param {string} params.startDate - Filter by start date
   * @param {string} params.endDate - Filter by end date
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction ('asc' or 'desc')
   * @returns {Promise<Object>} Appointments data with pagination
   */
  getAppointments: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/appointments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Reschedule appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} data - Reschedule data
   * @param {string} data.newDateTime - New date and time
   * @param {string} data.reason - Reason for rescheduling
   * @returns {Promise<Object>} Updated appointment data
   */
  rescheduleAppointment: async (appointmentId, data) => {
    try {
      const response = await apiClient.put(`/admin/appointments/${appointmentId}/reschedule`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Cancel appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} data - Cancel data
   * @param {string} data.reason - Reason for cancellation
   * @returns {Promise<Object>} Updated appointment data
   */
  cancelAppointment: async (appointmentId, data = {}) => {
    try {
      const response = await apiClient.patch(`/admin/appointments/${appointmentId}/cancel`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // ============ DASHBOARD & ANALYTICS SECTION ============
  
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get system metrics
   * @returns {Promise<Object>} System metrics
   */
  getSystemMetrics: async () => {
    try {
      const response = await apiClient.get('/admin/system/metrics');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // ============ FEEDBACK MANAGEMENT SECTION ============
  
  /**
   * Get all feedback
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction ('asc' or 'desc')
   * @returns {Promise<Object>} Feedback data with pagination
   */
  getFeedback: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/feedback', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get feedback by ID
   * @param {string} feedbackId - Feedback ID
   * @returns {Promise<Object>} Feedback data
   */
  getFeedbackById: async (feedbackId) => {
    try {
      const response = await apiClient.get(`/admin/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Update feedback status
   * @param {string} feedbackId - Feedback ID
   * @param {Object} data - Update data
   * @param {string} data.status - New status
   * @param {string} data.adminResponse - Admin response
   * @returns {Promise<Object>} Updated feedback data
   */
  updateFeedbackStatus: async (feedbackId, data) => {
    try {
      const response = await apiClient.patch(`/admin/feedback/${feedbackId}/status`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  /**
   * Delete feedback
   * @param {string} feedbackId - Feedback ID
   * @returns {Promise<Object>} Result of deletion
   */
  deleteFeedback: async (feedbackId) => {
    try {
      const response = await apiClient.delete(`/admin/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminService;