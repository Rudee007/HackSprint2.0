// services/therapistApiService.js
import { apiService } from './apiService';

class TherapistApiService {
  
  // Authentication & Profile Management
  async getTherapistProfile() {
    try {
      const response = await apiService.get('/therapists/profile');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async updateTherapistProfile(profileData) {
    try {
      const response = await apiService.put('/therapists/profile', profileData);
      return {
        success: true,
        data: response,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating therapist profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Treatment Plans Management
  async getAssignedTreatmentPlans(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/therapists/treatment-plans${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiService.get(endpoint);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching assigned treatment plans:', error);
      return {
        success: false,
        error: error.message,
        data: { treatmentPlans: [] }
      };
    }
  }

  async updateTreatmentProgress(treatmentId, progressData) {
    try {
      const response = await apiService.put(`/treatment-plans/${treatmentId}/progress`, progressData);
      return {
        success: true,
        data: response,
        message: 'Progress updated successfully'
      };
    } catch (error) {
      console.error('Error updating treatment progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Statistics & Analytics
  async getTherapistStats(period = '30d') {
    try {
      const response = await apiService.get(`/therapists/stats?period=${period}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching therapist stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalTreatmentPlans: 0,
          completedTreatments: 0,
          activeTreatments: 0,
          averageRating: 0,
          totalSessions: 0,
          completionRate: 0
        }
      };
    }
  }

  // Search & Filtering
  async searchTreatmentPlans(searchTerm, filters = {}) {
    try {
      const params = {
        ...filters,
        search: searchTerm
      };
      
      const queryParams = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      ).toString();
      
      const endpoint = `/therapists/treatment-plans/search${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiService.get(endpoint);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error searching treatment plans:', error);
      return {
        success: false,
        error: error.message,
        data: { treatmentPlans: [] }
      };
    }
  }

  // Patient Management
  async getPatientDetails(patientId) {
    try {
      const response = await apiService.get(`/patients/${patientId}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPatientTreatmentHistory(patientId) {
    try {
      const response = await apiService.get(`/patients/${patientId}/treatment-history`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching patient treatment history:', error);
      return {
        success: false,
        error: error.message,
        data: { treatments: [] }
      };
    }
  }

  // Availability Management
  async updateAvailability(availabilityData) {
    try {
      const therapist = JSON.parse(localStorage.getItem('loggedInTherapist'));
      const therapistId = therapist._id || therapist.id;
      
      const response = await apiService.put(`/therapists/${therapistId}/availability`, availabilityData);
      return {
        success: true,
        data: response,
        message: 'Availability updated successfully'
      };
    } catch (error) {
      console.error('Error updating availability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Notifications
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/therapists/notifications${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await apiService.get(endpoint);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.message,
        data: { notifications: [] }
      };
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await apiService.put(`/notifications/${notificationId}/read`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Progress Tracking & History
  async getProgressHistory(treatmentPlanId) {
    try {
      const response = await apiService.get(`/treatment-plans/${treatmentPlanId}/progress-history`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching progress history:', error);
      return {
        success: false,
        error: error.message,
        data: { progressHistory: [] }
      };
    }
  }

  async addProgressNote(treatmentPlanId, noteData) {
    try {
      const response = await apiService.post(`/treatment-plans/${treatmentPlanId}/notes`, noteData);
      return {
        success: true,
        data: response,
        message: 'Progress note added successfully'
      };
    } catch (error) {
      console.error('Error adding progress note:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // File & Media Management
  async uploadProgressImage(treatmentPlanId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('treatmentPlanId', treatmentPlanId);

      const response = await fetch(`${apiService.baseURL}/treatment-plans/${treatmentPlanId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getAuthToken()}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return {
        success: true,
        data: data,
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading progress image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility Functions
  async refreshData() {
    try {
      const [profileResponse, treatmentPlansResponse, statsResponse] = await Promise.all([
        this.getTherapistProfile(),
        this.getAssignedTreatmentPlans({ limit: 50 }),
        this.getTherapistStats('30d')
      ]);

      return {
        success: true,
        data: {
          profile: profileResponse.data,
          treatmentPlans: treatmentPlansResponse.data,
          stats: statsResponse.data
        }
      };
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Debug & Development Functions (for development only)
  async fixMissingTherapistAssignments() {
    try {
      const response = await apiService.post('/treatment-plans/fix-missing-assignments');
      return {
        success: true,
        data: response,
        message: response.message || 'Fixed missing assignments'
      };
    } catch (error) {
      console.error('Error fixing missing assignments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analytics & Reporting
  async getTreatmentAnalytics(period = '30d') {
    try {
      const response = await apiService.get(`/therapists/analytics?period=${period}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching treatment analytics:', error);
      return {
        success: false,
        error: error.message,
        data: {
          treatmentTypes: [],
          successRates: [],
          patientSatisfaction: 0
        }
      };
    }
  }

  async exportTreatmentReport(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/therapists/export/treatment-report${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(`${apiService.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiService.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `treatment-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Report exported successfully'
      };
    } catch (error) {
      console.error('Error exporting treatment report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TherapistApiService();
