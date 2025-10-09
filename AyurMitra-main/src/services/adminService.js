// src/services/adminService.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

class AdminService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.isLoggingOut = false;
    this.setupInterceptors();
  }

  setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !this.isLoggingOut) {
          const currentPath = window.location.pathname;
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          const isOnLoginPage = currentPath.includes('/admin-login');
          
          console.log('❌ 401 Error:', {
            url: error.config?.url,
            isLoginRequest,
            isOnLoginPage,
            currentPath
          });
          
          if (!isLoginRequest && !isOnLoginPage) {
            this.isLoggingOut = true;
            
            console.log('🚪 Session expired - logging out');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            toast.error('Session expired. Please login again.');
            
            setTimeout(() => {
              window.location.href = '/admin-login';
              this.isLoggingOut = false;
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============ AUTHENTICATION ============
  async login(email, password) {
    try {
      console.log('🔐 Attempting login to:', `${this.baseURL}/admin/auth/login`);
      
      const response = await this.axiosInstance.post('/admin/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, admin } = response.data.data;
        
        console.log('✅ Login successful, storing credentials...');
        console.log('Token:', token.substring(0, 30) + '...');
        console.log('Admin:', admin);
        
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(admin));
        
        const storedToken = localStorage.getItem('adminToken');
        const storedData = localStorage.getItem('adminData');
        console.log('✅ Verification - Token stored:', !!storedToken);
        console.log('✅ Verification - Data stored:', !!storedData);
        
        return {
          success: true,
          data: response.data.data
        };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyToken() {
    try {
      const response = await this.axiosInstance.post('/admin/auth/verify-token');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false };
    }
  }

  async logout() {
    console.log('👋 Manual logout initiated');
    this.isLoggingOut = true;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setTimeout(() => {
      window.location.href = '/admin-login';
      this.isLoggingOut = false;
    }, 100);
  }

  // ============ DASHBOARD & ANALYTICS ============
  async getDashboardStats() {
    try {
      console.log('📊 Fetching dashboard stats...');
      const response = await this.axiosInstance.get('/admin/dashboard/stats');
      console.log('✅ Dashboard stats response:', response.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('❌ Dashboard stats error:', error.response?.status, error.message);
      
      return {
        success: false,
        data: {
          overview: {
            totalUsers: 0,
            activeUsers: 0,
            newUsersThisWeek: 0,
            totalAppointments: 0,
            todaysAppointments: 0,
            thisWeeksAppointments: 0
          }
        }
      };
    }
  }

  // ============ USER MANAGEMENT ============
  async getUsers(params = {}) {
    try {
      const response = await this.axiosInstance.get('/admin/users', { params });
      return { 
        success: true, 
        data: response.data.data.users, 
        pagination: response.data.data.pagination 
      };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, data: [], pagination: {} };
    }
  }

  async getUserStats() {
    try {
      const response = await this.axiosInstance.get('/admin/users/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { success: false, data: {} };
    }
  }

  async getUserById(userId) {
    try {
      const response = await this.axiosInstance.get(`/admin/users/${userId}`);
      return { success: true, data: response.data.data.user };
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await this.axiosInstance.post('/admin/users', userData);
      toast.success('User created successfully');
      return { success: true, data: response.data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await this.axiosInstance.put(`/admin/users/${userId}`, userData);
      toast.success('User updated successfully');
      return { success: true, data: response.data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
      throw error;
    }
  }

  async toggleUserStatus(userId) {
    try {
      const response = await this.axiosInstance.patch(`/admin/users/${userId}/toggle-status`);
      toast.success(response.data.message);
      return { success: true, data: response.data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle user status');
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await this.axiosInstance.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      return { success: true, data: response.data.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
      throw error;
    }
  }

  // ============ APPOINTMENT MANAGEMENT ============
  async getAppointments(params = {}) {
    try {
      const response = await this.axiosInstance.get('/admin/appointments', { params });
      return { 
        success: true, 
        data: response.data.data.appointments, 
        pagination: response.data.data.pagination 
      };
    } catch (error) {
      console.error('Get appointments error:', error);
      return { success: false, data: [], pagination: {} };
    }
  }

  async rescheduleAppointment(appointmentId, newDateTime, reason) {
    try {
      const response = await this.axiosInstance.put(`/admin/appointments/${appointmentId}/reschedule`, { 
        newDateTime, 
        reason 
      });
      toast.success('Appointment rescheduled');
      return { success: true, data: response.data.data.appointment };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
      throw error;
    }
  }

  async cancelAppointment(appointmentId, reason) {
    try {
      const response = await this.axiosInstance.patch(`/admin/appointments/${appointmentId}/cancel`, { reason });
      toast.success('Appointment cancelled');
      return { success: true, data: response.data.data.appointment };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      throw error;
    }
  }

  async getSystemMetrics() {
    try {
      const response = await this.axiosInstance.get('/admin/system/metrics');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get system metrics error:', error);
      return { success: false, data: {} };
    }
  }

  // ============ FEEDBACK MANAGEMENT ============
  async getAllFeedback(params = {}) {
    try {
      const response = await this.axiosInstance.get('/admin/feedback/all', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get feedback error:', error);
      return { success: false, data: [] };
    }
  }

  async getFeedbackStats() {
    try {
      const response = await this.axiosInstance.get('/admin/feedback/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get feedback stats error:', error);
      return { success: false, data: {} };
    }
  }

  async getAttentionRequiredFeedback() {
    try {
      const response = await this.axiosInstance.get('/admin/feedback/attention-required');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get attention required feedback error:', error);
      return { success: false, data: [] };
    }
  }

  async respondToFeedback(feedbackId, responseText) {
    try {
      const response = await this.axiosInstance.post(`/admin/feedback/${feedbackId}/respond`, { 
        response: responseText 
      });
      toast.success('Response sent');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send response');
      throw error;
    }
  }

  async flagFeedback(feedbackId, reason) {
    try {
      const response = await this.axiosInstance.patch(`/admin/feedback/${feedbackId}/flag`, { reason });
      toast.success('Feedback flagged');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to flag feedback');
      throw error;
    }
  }

  // ============ DOCTOR/THERAPIST VERIFICATION ============
  async getPendingVerifications() {
    try {
      const response = await this.axiosInstance.get('/doctors/pending-verification');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get pending verifications error:', error);
      return { success: false, data: [] };
    }
  }

  async updateDoctorVerification(doctorId, status, notes) {
    try {
      const response = await this.axiosInstance.put(`/doctors/${doctorId}/verification`, { 
        status, 
        notes 
      });
      toast.success('Verification status updated');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update verification');
      throw error;
    }
  }

  // ============ REAL-TIME MONITORING ============
  async getTrackingDashboard() {
    try {
      const response = await this.axiosInstance.get('/realtime/therapy-tracking/dashboard');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get tracking dashboard error:', error);
      return { success: false, data: {} };
    }
  }

  async getUpcomingSessions() {
    try {
      const response = await this.axiosInstance.get('/realtime/therapy-tracking/upcoming');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Get upcoming sessions error:', error);
      return { success: false, data: [] };
    }
  }

  // ============ NOTIFICATIONS ============
  async sendBulkReminders() {
    try {
      const response = await this.axiosInstance.post('/notifications/bulk/reminders');
      toast.success('Reminders sent');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reminders');
      throw error;
    }
  }

  async sendBulkHealthTips(message) {
    try {
      const response = await this.axiosInstance.post('/notifications/bulk/health-tips', { message });
      toast.success('Health tips sent');
      return { success: true, data: response.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send health tips');
      throw error;
    }
  }

  // ============ EXPORT UTILITIES ============
  
  // Generic export method (kept for backward compatibility)
  async exportData(endpoint, filename, filters = {}) {
    try {
      const response = await this.axiosInstance.post(endpoint, filters, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed');
      return { success: true };
    } catch (error) {
      toast.error('Export failed');
      return { success: false };
    }
  }

  // ✅ Export all users (CSV or Excel)
  async exportUsers(format = 'csv', filters = {}) {
    try {
      console.log('📥 Exporting users:', { format, filters });
      
      const params = new URLSearchParams(filters).toString();
      const endpoint = format === 'excel' ? 'excel' : 'csv';
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      const filename = `users_export_${Date.now()}.${extension}`;
      
      const response = await this.axiosInstance.get(`/admin/export/users/${endpoint}?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Users exported successfully (${format.toUpperCase()})`);
      console.log('✅ Export completed:', filename);
      return { success: true };
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error(error.response?.data?.message || 'Export failed');
      return { success: false };
    }
  }

  // ✅ Export patients only
  async exportPatients(filters = {}) {
    try {
      console.log('📥 Exporting patients:', filters);
      
      const params = new URLSearchParams(filters).toString();
      const filename = `patients_export_${Date.now()}.csv`;
      
      const response = await this.axiosInstance.get(`/admin/export/patients/csv?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Patients exported successfully');
      console.log('✅ Export completed:', filename);
      return { success: true };
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error(error.response?.data?.message || 'Export failed');
      return { success: false };
    }
  }

  // ✅ Export doctors/therapists only
  async exportDoctors(filters = {}) {
    try {
      console.log('📥 Exporting doctors:', filters);
      
      const params = new URLSearchParams(filters).toString();
      const filename = `doctors_export_${Date.now()}.csv`;
      
      const response = await this.axiosInstance.get(`/admin/export/doctors/csv?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Doctors exported successfully');
      console.log('✅ Export completed:', filename);
      return { success: true };
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error(error.response?.data?.message || 'Export failed');
      return { success: false };
    }
  }

  // ✅ Export appointments
  async exportAppointments(filters = {}) {
    try {
      console.log('📥 Exporting appointments:', filters);
      
      const params = new URLSearchParams(filters).toString();
      const filename = `appointments_export_${Date.now()}.csv`;
      
      const response = await this.axiosInstance.get(`/admin/export/appointments/csv?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Appointments exported successfully');
      console.log('✅ Export completed:', filename);
      return { success: true };
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error(error.response?.data?.message || 'Export failed');
      return { success: false };
    }
  }
}

export default new AdminService();
