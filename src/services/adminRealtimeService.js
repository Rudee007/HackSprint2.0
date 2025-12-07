// src/services/adminRealtimeService.js
import { apiService } from './apiService';

class AdminRealtimeService {
  constructor() {
    this.baseURL = 'http://localhost:3003/api/realtime';
    this.cache = new Map();
    this.lastFetchTimes = new Map();
  }

  // ========== ADMIN DASHBOARD ==========

  /**
   * Get comprehensive therapy tracking dashboard
   * @returns {Promise} Complete dashboard data
   */
  async getTrackingDashboard() {
    try {
      console.log('📊 [Admin] Fetching therapy tracking dashboard');
      const response = await apiService.get('/realtime/tracking/dashboard');
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error fetching dashboard:', error);
      throw error;
    }
  }

  /**
   * Get upcoming sessions with countdown
   * @returns {Promise} Upcoming sessions list
   */
  async getUpcomingSessions() {
    try {
      console.log('📅 [Admin] Fetching upcoming sessions');
      const response = await apiService.get('/realtime/tracking/sessions/upcoming');
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error fetching upcoming sessions:', error);
      throw error;
    }
  }

  // ========== SESSION CONTROL ==========

  /**
   * Start a session (Admin control)
   * @param {string} sessionId - Session ID
   * @returns {Promise} Start confirmation
   */
  async startSession(sessionId) {
    try {
      console.log(`▶️ [Admin] Starting session: ${sessionId}`);
      const response = await apiService.post(`/realtime/sessions/${sessionId}/start`);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error starting session:', error);
      throw error;
    }
  }

  /**
   * Update session status (Admin control)
   * @param {string} sessionId - Session ID
   * @param {object} statusData - { status, reason }
   * @returns {Promise} Update confirmation
   */
  async updateSessionStatus(sessionId, statusData) {
    try {
      console.log(`🔄 [Admin] Updating session ${sessionId} status to:`, statusData.status);
      const response = await apiService.put(`/realtime/sessions/${sessionId}/status`, statusData);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Get detailed session information
   * @param {string} sessionId - Session ID
   * @returns {Promise} Session details
   */
  async getSessionDetails(sessionId) {
    try {
      console.log(`🔍 [Admin] Fetching session details: ${sessionId}`);
      const response = await apiService.get(`/realtime/sessions/${sessionId}/details`);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error fetching session details:', error);
      throw error;
    }
  }

  /**
   * Join session room for monitoring
   * @param {string} sessionId - Session ID
   * @returns {Promise} Join confirmation
   */
  async joinSession(sessionId) {
    try {
      console.log(`👥 [Admin] Joining session: ${sessionId}`);
      const response = await apiService.post(`/realtime/sessions/${sessionId}/join`);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error joining session:', error);
      throw error;
    }
  }

  /**
   * Leave session room
   * @param {string} sessionId - Session ID
   * @returns {Promise} Leave confirmation
   */
  async leaveSession(sessionId) {
    try {
      console.log(`🚪 [Admin] Leaving session: ${sessionId}`);
      const response = await apiService.post(`/realtime/sessions/${sessionId}/leave`);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error leaving session:', error);
      throw error;
    }
  }

  // ========== PATIENT MILESTONES ==========

  /**
   * Get patient milestones
   * @param {string} patientId - Patient ID
   * @returns {Promise} Milestones data
   */
  async getPatientMilestones(patientId) {
    try {
      console.log(`🏆 [Admin] Fetching milestones for patient: ${patientId}`);
      const response = await apiService.get(`/realtime/tracking/patients/${patientId}/milestones`);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error fetching milestones:', error);
      throw error;
    }
  }

  /**
   * Add milestone for patient
   * @param {string} patientId - Patient ID
   * @param {object} milestoneData - { milestoneType, title, description }
   * @returns {Promise} Milestone creation confirmation
   */
  async addMilestone(patientId, milestoneData) {
    try {
      console.log(`🏆 [Admin] Adding milestone for patient: ${patientId}`);
      const response = await apiService.post(`/realtime/tracking/patients/${patientId}/milestones`, milestoneData);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error adding milestone:', error);
      throw error;
    }
  }

  // ========== ADMIN ACTIONS ==========

  /**
   * Emergency stop session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Emergency stop reason
   * @returns {Promise} Emergency stop confirmation
   */
  async emergencyStopSession(sessionId, reason) {
    try {
      console.log(`🚨 [Admin] Emergency stop for session: ${sessionId}`);
      const response = await apiService.put(`/realtime/sessions/${sessionId}/status`, {
        status: 'cancelled',
        reason: `EMERGENCY STOP: ${reason}`
      });
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error emergency stopping session:', error);
      throw error;
    }
  }

  /**
   * Get system-wide statistics
   * @param {string} timeRange - Time range (today, week, month)
   * @returns {Promise} System statistics
   */
  async getSystemStats(timeRange = 'today') {
    try {
      console.log(`📈 [Admin] Fetching system stats for: ${timeRange}`);
      const response = await apiService.get('/realtime/admin/stats', {
        params: { timeRange }
      });
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error fetching system stats:', error);
      // Return cached dashboard data as fallback
      return this.getTrackingDashboard();
    }
  }

  /**
   * Broadcast admin message to all connected users
   * @param {object} messageData - { message, type, targetUsers }
   * @returns {Promise} Broadcast confirmation
   */
  async broadcastMessage(messageData) {
    try {
      console.log('📢 [Admin] Broadcasting message to users');
      const response = await apiService.post('/realtime/admin/broadcast', messageData);
      return response;
    } catch (error) {
      console.error('❌ [Admin] Error broadcasting message:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Clear service cache
   */
  clearCache() {
    console.log('🧹 [Admin] Clearing service cache');
    this.cache.clear();
    this.lastFetchTimes.clear();
  }

  /**
   * Format duration for display
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  /**
   * Calculate time remaining
   * @param {Date} startTime - Session start time
   * @param {number} estimatedDuration - Estimated duration in minutes
   * @returns {object} Time remaining data
   */
  calculateTimeRemaining(startTime, estimatedDuration) {
    const elapsed = (Date.now() - new Date(startTime)) / (1000 * 60);
    const remaining = Math.max(0, estimatedDuration - elapsed);
    const progress = Math.min(100, (elapsed / estimatedDuration) * 100);

    return {
      elapsed: Math.round(elapsed),
      remaining: Math.round(remaining),
      progress: Math.round(progress * 10) / 10,
      isOvertime: elapsed > estimatedDuration
    };
  }
}

export default new AdminRealtimeService();
