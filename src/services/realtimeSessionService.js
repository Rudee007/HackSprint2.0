// src/services/realtimeSessionService.js
import axios from 'axios';

class RealtimeSessionService {
  constructor() {
    this.baseURL = 'http://localhost:3003/api';
    this.cache = new Map(); // ✅ Response caching
    this.activeRequests = new Map(); // ✅ Prevent duplicate requests
    this.lastFetchTimes = new Map(); // ✅ Request throttling
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Get token from multiple possible sources
        const token = localStorage.getItem('accessToken') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // ✅ Only log unique requests to reduce console spam
        const requestKey = `${config.method?.toUpperCase()} ${config.url}`;
        if (!this.loggedRequests) this.loggedRequests = new Set();
        if (!this.loggedRequests.has(requestKey)) {
          console.log(`🔗 API Request: ${requestKey}`);
          this.loggedRequests.add(requestKey);
          // Clear logged requests every 30 seconds
          setTimeout(() => this.loggedRequests.delete(requestKey), 30000);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('❌ RealTime Session API Error:', error);
        
        // Handle auth errors
        if (error.response?.status === 401) {
          console.error('❌ Unauthorized - token may be expired');
          
          // Clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          
          // Redirect to login (only if not already on login page)
          if (window.location.pathname !== '/doctor-login') {
            window.location.href = '/doctor-login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ✅ Check if request should be throttled
  shouldThrottle(cacheKey, minInterval = 3000) {
    const lastFetch = this.lastFetchTimes.get(cacheKey);
    const now = Date.now();
    
    if (lastFetch && (now - lastFetch) < minInterval) {
      console.log(`🚫 Throttling request: ${cacheKey} (${now - lastFetch}ms ago)`);
      return true;
    }
    
    return false;
  }

  // ✅ Get cached data if available
  getCachedData(cacheKey, maxAge = 30000) {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < maxAge) {
        console.log(`📋 Using cached data: ${cacheKey} (${Math.round(age/1000)}s old)`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    return null;
  }

  // ✅ Cache response data
  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 300000);
  }

  // ✅ Make request with deduplication
  async makeRequest(url, options = {}, cacheKey = null) {
    const requestKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.params || {})}`;
    
    // Return cached data if available and not throttled
    if (cacheKey) {
      const cached = this.getCachedData(cacheKey);
      if (cached && !this.shouldThrottle(cacheKey)) {
        return { data: cached };
      }
    }

    // Check if same request is already in progress
    if (this.activeRequests.has(requestKey)) {
      console.log(`⏳ Request in progress, waiting: ${url}`);
      return this.activeRequests.get(requestKey);
    }

    // Update throttling timestamp
    if (cacheKey) {
      this.lastFetchTimes.set(cacheKey, Date.now());
    }

    // Make the actual request
    const requestPromise = this.axiosInstance.request({
      url,
      ...options
    }).then(response => {
      // Cache successful responses
      if (cacheKey && response.data) {
        this.setCachedData(cacheKey, response.data);
      }
      return response;
    }).finally(() => {
      // Clean up active request tracking
      this.activeRequests.delete(requestKey);
    });

    this.activeRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  isAuthenticated() {
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    return !!token;
  }

  // ========== SESSION MANAGEMENT ==========

  /**
   * Get real-time session details with caching and throttling
   * @param {string} sessionId - Session ID
   * @returns {Promise} Session details with real-time info
   */
  async getSessionDetails(sessionId) {
    if (!sessionId) {
      console.error('❌ Session ID is required');
      throw new Error('Session ID is required');
    }

    try {
      const cacheKey = `session_${sessionId}`;
      
      // Check throttling - only allow requests every 3 seconds
      if (this.shouldThrottle(cacheKey, 3000)) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }

      console.log(`🔍 Fetching session details: ${sessionId}`);
      const response = await this.makeRequest(`/realtime/session/${sessionId}`, {}, cacheKey);
      return response;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  /**
   * Join a session for real-time tracking
   * @param {string} sessionId - Session ID to join
   * @returns {Promise} Join confirmation
   */
  async joinSession(sessionId) {
    try {
      console.log(`👥 Joining session: ${sessionId}`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/join`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  /**
   * Update session status with real-time broadcast
   * @param {string} sessionId - Session ID
   * @param {string} status - New session status
   * @param {string} reason - Reason for status change
   * @returns {Promise} Update confirmation
   */
  async updateSessionStatus(sessionId, status, reason = '') {
    try {
      console.log(`🔄 Updating session ${sessionId} status to: ${status}`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/status`, {
        method: 'PUT',
        data: { status, reason }
      });
      
      // Invalidate cache for this session
      this.cache.delete(`session_${sessionId}`);
      
      return response;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Start session countdown
   * @param {string} sessionId - Session ID
   * @returns {Promise} Start confirmation
   */
  async startSession(sessionId) {
    try {
      console.log(`▶️ Starting session: ${sessionId}`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/start`, {
        method: 'POST'
      });
      
      // Invalidate cache
      this.cache.delete(`session_${sessionId}`);
      
      return response;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Pause session
   * @param {string} sessionId - Session ID
   * @returns {Promise} Pause confirmation
   */
  async pauseSession(sessionId) {
    try {
      console.log(`⏸️ Pausing session: ${sessionId}`);
      return await this.updateSessionStatus(sessionId, 'paused', 'Session paused by provider');
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  /**
   * Resume session
   * @param {string} sessionId - Session ID
   * @returns {Promise} Resume confirmation
   */
  async resumeSession(sessionId) {
    try {
      console.log(`▶️ Resuming session: ${sessionId}`);
      return await this.updateSessionStatus(sessionId, 'in_progress', 'Session resumed by provider');
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  /**
   * End session
   * @param {string} sessionId - Session ID
   * @returns {Promise} End confirmation
   */
  async endSession(sessionId) {
    try {
      console.log(`⏹️ Ending session: ${sessionId}`);
      return await this.updateSessionStatus(sessionId, 'completed', 'Session completed by provider');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Cancel session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Cancel confirmation
   */
  async cancelSession(sessionId, reason = 'Session cancelled by provider') {
    try {
      console.log(`❌ Cancelling session: ${sessionId}`);
      return await this.updateSessionStatus(sessionId, 'cancelled', reason);
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Extend session time
   * @param {string} sessionId - Session ID
   * @param {number} additionalMinutes - Minutes to extend
   * @returns {Promise} Extend confirmation
   */
  async extendSession(sessionId, additionalMinutes) {
    try {
      console.log(`⏰ Extending session ${sessionId} by ${additionalMinutes} minutes`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/extend`, {
        method: 'PUT',
        data: { additionalMinutes }
      });
      
      // Invalidate cache
      this.cache.delete(`session_${sessionId}`);
      
      return response;
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  }

  // ========== SESSION NOTES ==========

  /**
   * Add session note during real-time session
   * @param {string} sessionId - Session ID
   * @param {string} note - Note content
   * @param {string} type - Note type (general, progress, instruction, alert)
   * @returns {Promise} Note confirmation
   */
  async addSessionNote(sessionId, note, type = 'general') {
    try {
      console.log(`📝 Adding session note: ${sessionId}`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/notes`, {
        method: 'POST',
        data: { note, type }
      });
      return response;
    } catch (error) {
      console.error('Error adding session note:', error);
      throw error;
    }
  }

  /**
   * Get session notes with caching
   * @param {string} sessionId - Session ID
   * @returns {Promise} Session notes
   */
  async getSessionNotes(sessionId) {
    try {
      const cacheKey = `session_notes_${sessionId}`;
      console.log(`📖 Fetching session notes: ${sessionId}`);
      const response = await this.makeRequest(`/realtime/sessions/${sessionId}/notes`, {}, cacheKey);
      return response;
    } catch (error) {
      console.error('Error fetching session notes:', error);
      throw error;
    }
  }

  // ========== PROVIDER STATUS ==========

  /**
   * Update provider availability status
   * @param {string} status - Provider status (available, busy, offline)
   * @param {Date} availableUntil - Available until time
   * @returns {Promise} Status update confirmation
   */
  async updateProviderStatus(status, availableUntil = null) {
    try {
      console.log(`🔄 Updating provider status to: ${status}`);
      const response = await this.makeRequest('/realtime/provider/status', {
        method: 'PUT',
        data: { status, availableUntil }
      });
      return response;
    } catch (error) {
      console.error('Error updating provider status:', error);
      throw error;
    }
  }

  /**
   * Get provider's active sessions with caching
   * @returns {Promise} Active sessions list
   */
  async getActiveSessions() {
    try {
      const cacheKey = 'active_sessions';
      console.log('📋 Fetching active sessions');
      const response = await this.makeRequest('/realtime/provider/sessions/active', {}, cacheKey);
      return response;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  }

  /**
   * Get today's scheduled sessions with caching
   * @returns {Promise} Today's sessions
   */
  async getTodaysSessions() {
    try {
      const cacheKey = `todays_sessions_${new Date().toDateString()}`;
      console.log('📅 Fetching today\'s sessions');
      const today = new Date().toISOString().split('T')[0];
      const response = await this.makeRequest(`/realtime/provider/sessions/today`, {
        params: { date: today }
      }, cacheKey);
      return response;
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Clear all caches and active requests
   */
  clearCache() {
    console.log('🧹 Clearing service cache');
    this.cache.clear();
    this.activeRequests.clear();
    this.lastFetchTimes.clear();
    if (this.loggedRequests) {
      this.loggedRequests.clear();
    }
  }

  /**
   * Check WebSocket connection status
   * @returns {Promise} Connection status
   */
  async checkConnection() {
    try {
      const response = await this.makeRequest('/realtime/connection/status');
      return response;
    } catch (error) {
      console.error('Error checking connection:', error);
      throw error;
    }
  }

  /**
   * Get server time for synchronization
   * @returns {Promise} Server time
   */
  async getServerTime() {
    try {
      const cacheKey = 'server_time';
      const response = await this.makeRequest('/realtime/time', {}, cacheKey);
      return response;
    } catch (error) {
      console.error('Error fetching server time:', error);
      throw error;
    }
  }
}

export default new RealtimeSessionService();
