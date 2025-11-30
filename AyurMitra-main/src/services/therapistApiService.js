// services/therapistApiService.js - 🔥 COMPLETE PRODUCTION WITH CONSULTATIONS 🔥
import { apiService } from './apiService';
import webSocketService from './websocketService';

class TherapistApiService {
  constructor() {
    console.log('🔥 [INIT] TherapistApiService constructor called');
    this.wsInitialized = false;
    this.baseURL = 'http://localhost:3003/api';
    this.autoSaveTimeout = null;
    console.log('✅ [INIT] TherapistApiService initialized with baseURL:', this.baseURL);
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 GET THERAPIST ID (FOR CONSULTATIONS)
  // ═══════════════════════════════════════════════════════════

  getTherapistId() {
    console.log('🔥 [GET_THERAPIST_ID] Retrieving therapist ID...');
    
    try {
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        console.error('❌ [GET_THERAPIST_ID] No user data in localStorage');
        return null;
      }
      
      const user = JSON.parse(userStr);
      console.log('📊 [GET_THERAPIST_ID] Parsed user data:', user);
      
      // Extract ID from user.id (based on your screenshot)
      const therapistId = user.id || user._id || user.therapistId || user.providerId;
      
      if (!therapistId) {
        console.error('❌ [GET_THERAPIST_ID] No therapist ID found');
        return null;
      }
      
      console.log('✅ [GET_THERAPIST_ID] Found therapist ID:', therapistId);
      return therapistId;
      
    } catch (error) {
      console.error('❌ [GET_THERAPIST_ID] Error:', error);
      return null;
    }
  }

  
  // ═══════════════════════════════════════════════════════════
  // 🔥🔥🔥 CONSULTATION METHODS (NEW) 🔥🔥🔥
  // ═══════════════════════════════════════════════════════════

  async getTherapistConsultations(options = {}) {
    console.log('🔥 [API] getTherapistConsultations called');
    console.log('📦 [API] Options:', options);
    
    try {
      const therapistId = this.getTherapistId();
      
      if (!therapistId) {
        throw new Error('Therapist ID not found. Please login again.');
      }

      console.log('📡 [API] GET request to:', `/consultations/provider/${therapistId}`);
      
      const response = await apiService.get(`/consultations/provider/${therapistId}`, {
        params: options
      });
      
      console.log('✅ [API] Consultations response:', response);
      
      const consultations = response.data?.consultations || 
                           response.data?.data || 
                           response.data || 
                           [];
      
      console.log('📊 [API] Consultations count:', consultations.length);
      
      return {
        success: true,
        data: consultations,
        message: `Found ${consultations.length} consultations`
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching consultations:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch consultations',
        data: []
      };
    }
  }

  async getUpcomingConsultations() {
    console.log('🔥 [API] getUpcomingConsultations called');
    
    try {
      const therapistId = this.getTherapistId();
      
      if (!therapistId) {
        throw new Error('Therapist ID not found. Please login again.');
      }

      console.log('📡 [API] GET request to:', `/consultations/provider/${therapistId}/upcoming`);
      
      const response = await apiService.get(`/consultations/provider/${therapistId}/upcoming`);
      
      console.log('✅ [API] Upcoming consultations response:', response);
      
      const consultations = response.data?.consultations || 
                           response.data?.data || 
                           response.data || 
                           [];
      
      console.log('📊 [API] Upcoming consultations count:', consultations.length);
      
      return {
        success: true,
        data: consultations,
        message: `Found ${consultations.length} upcoming consultations`
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching upcoming consultations:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch upcoming consultations',
        data: []
      };
    }
  }

  async getConsultationStats(startDate = null, endDate = null) {
    console.log('🔥 [API] getConsultationStats called');
    console.log('📅 [API] Date range:', { startDate, endDate });
    
    try {
      const therapistId = this.getTherapistId();
      
      if (!therapistId) {
        throw new Error('Therapist ID not found. Please login again.');
      }

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      console.log('📡 [API] GET request to:', `/consultations/provider/${therapistId}/stats`);
      
      const response = await apiService.get(`/consultations/provider/${therapistId}/stats`, {
        params
      });
      
      console.log('✅ [API] Consultation stats response:', response);
      
      const stats = response.data?.stats || 
                   response.data?.data || 
                   response.data || 
                   {};
      
      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching consultation stats:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch stats',
        data: {
          total: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0,
          averageRating: 0
        }
      };
    }
  }

  async getTodaysConsultations() {
    console.log('🔥 [API] getTodaysConsultations called');
    
    try {
      const result = await this.getUpcomingConsultations();
      
      if (!result.success) {
        return result;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysConsultations = (result.data || []).filter(consultation => {
        const consultationDate = new Date(consultation.scheduledAt);
        return consultationDate >= today && consultationDate < tomorrow;
      });
      
      console.log('📊 [API] Today\'s consultations count:', todaysConsultations.length);
      
      return {
        success: true,
        data: todaysConsultations,
        message: `Found ${todaysConsultations.length} consultations for today`
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching today\'s consultations:', error);
      
      return {
        success: false,
        error: 'Failed to fetch today\'s consultations',
        data: []
      };
    }
  }

  async getConsultationById(consultationId) {
    console.log('🔥 [API] getConsultationById called');
    console.log('🆔 [API] Consultation ID:', consultationId);
    
    try {
      console.log('📡 [API] GET request to:', `/consultations/${consultationId}`);
      
      const response = await apiService.get(`/consultations/${consultationId}`);
      
      console.log('✅ [API] Consultation response:', response);
      
      const consultation = response.data?.consultation || 
                          response.data?.data || 
                          response.data;
      
      return {
        success: true,
        data: consultation,
        message: 'Consultation retrieved successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching consultation:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch consultation',
        data: null
      };
    }
  }

  async startConsultation(consultationId, notes = '') {
    console.log('🔥 [API] startConsultation called');
    console.log('🆔 [API] Consultation ID:', consultationId);
    
    try {
      const response = await apiService.patch(`/consultations/${consultationId}/start`, {
        notes
      });
      
      console.log('✅ [API] Consultation started:', response);
      
      if (webSocketService.isSocketConnected()) {
        webSocketService.socket.emit('therapist:consultation:start', {
          consultationId,
          timestamp: new Date()
        });
      }
      
      return {
        success: true,
        data: response.data?.consultation || response.data?.data || response.data,
        message: 'Consultation started successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error starting consultation:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to start consultation'
      };
    }
  }

  async completeConsultation(consultationId, consultationData) {
    console.log('🔥 [API] completeConsultation called');
    console.log('🆔 [API] Consultation ID:', consultationId);
    
    try {
      const response = await apiService.patch(`/consultations/${consultationId}/complete`, consultationData);
      
      console.log('✅ [API] Consultation completed:', response);
      
      if (webSocketService.isSocketConnected()) {
        webSocketService.socket.emit('therapist:consultation:complete', {
          consultationId,
          timestamp: new Date()
        });
      }
      
      return {
        success: true,
        data: response.data?.consultation || response.data?.data || response.data,
        message: 'Consultation completed successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error completing consultation:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to complete consultation'
      };
    }
  }

  async cancelConsultation(consultationId, reason = '') {
    console.log('🔥 [API] cancelConsultation called');
    console.log('🆔 [API] Consultation ID:', consultationId);
    
    try {
      const response = await apiService.patch(`/consultations/${consultationId}/cancel`, {
        reason
      });
      
      console.log('✅ [API] Consultation cancelled:', response);
      
      return {
        success: true,
        data: response.data?.consultation || response.data?.data || response.data,
        message: 'Consultation cancelled successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error cancelling consultation:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to cancel consultation'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 WEBSOCKET INITIALIZATION & MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async initializeWebSocket() {
    console.log('🔥 [WS] initializeWebSocket called');
    
    if (this.wsInitialized) {
      console.log('✅ [WS] WebSocket already initialized');
      return true;
    }

    try {
      console.log('🔍 [WS] Looking for auth token...');
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        console.error('❌ [WS] No token found for WebSocket connection');
        return false;
      }

      console.log('✅ [WS] Token found:', token.substring(0, 20) + '...');
      console.log('🔌 [WS] Initializing therapist WebSocket connection...');
      
      await webSocketService.connect(token);
      console.log('✅ [WS] WebSocket connected successfully');
      
      console.log('📡 [WS] Setting up therapist event listeners...');
      this.setupTherapistEventListeners();
      
      this.wsInitialized = true;
      console.log('✅ [WS] Therapist WebSocket initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [WS] WebSocket initialization failed:', error);
      console.error('❌ [WS] Error stack:', error.stack);
      this.wsInitialized = false;
      return false;
    }
  }

  setupTherapistEventListeners() {
    console.log('🔥 [WS] setupTherapistEventListeners called');
    
    // Session events
    webSocketService.addEventListener('session:started', (data) => {
      console.log('🟢 [WS EVENT] Session started:', data);
      this.handleSessionStarted(data);
    });

    webSocketService.addEventListener('session:completed', (data) => {
      console.log('✅ [WS EVENT] Session completed:', data);
      this.handleSessionCompleted(data);
    });

    webSocketService.addEventListener('session:vitals', (data) => {
      console.log('💓 [WS EVENT] Vitals updated:', data);
      this.handleVitalsUpdate(data);
    });

    webSocketService.addEventListener('session:observation', (data) => {
      console.log('📝 [WS EVENT] Observation added:', data);
      this.handleObservationAdded(data);
    });

    // Consultation events
    webSocketService.addEventListener('consultation:updated', (data) => {
      console.log('📋 [WS EVENT] Consultation updated:', data);
      window.dispatchEvent(new CustomEvent('therapist:consultation:updated', { detail: data }));
    });

    // Patient events
    webSocketService.addEventListener('patient_assigned', (data) => {
      console.log('👤 [WS EVENT] New patient assigned:', data);
      this.handlePatientAssigned(data);
    });

    // Feedback events
    webSocketService.addEventListener('feedback_submitted', (data) => {
      console.log('⭐ [WS EVENT] New feedback received:', data);
      this.handleFeedbackReceived(data);
    });

    // System events
    webSocketService.addEventListener('system_alert', (data) => {
      console.log('🚨 [WS EVENT] System alert:', data);
      this.handleSystemAlert(data);
    });

    // Connection status
    webSocketService.addEventListener('connection_status', (status) => {
      console.log('🔌 [WS EVENT] Connection status:', status);
      this.handleConnectionStatus(status);
    });
    
    console.log('✅ [WS] All event listeners setup complete');
  }

  // Event handlers
  handleSessionStarted(data) {
    console.log('🔥 [HANDLER] handleSessionStarted:', data);
    window.dispatchEvent(new CustomEvent('therapist:session:started', { detail: data }));
  }

  handleSessionCompleted(data) {
    console.log('🔥 [HANDLER] handleSessionCompleted:', data);
    window.dispatchEvent(new CustomEvent('therapist:session:completed', { detail: data }));
  }

  handleVitalsUpdate(data) {
    console.log('🔥 [HANDLER] handleVitalsUpdate:', data);
    window.dispatchEvent(new CustomEvent('therapist:vitals:updated', { detail: data }));
  }

  handleObservationAdded(data) {
    console.log('🔥 [HANDLER] handleObservationAdded:', data);
    window.dispatchEvent(new CustomEvent('therapist:observation:added', { detail: data }));
  }

  handlePatientAssigned(data) {
    console.log('🔥 [HANDLER] handlePatientAssigned:', data);
    window.dispatchEvent(new CustomEvent('therapist:patient:assigned', { detail: data }));
  }

  handleFeedbackReceived(data) {
    console.log('🔥 [HANDLER] handleFeedbackReceived:', data);
    window.dispatchEvent(new CustomEvent('therapist:feedback:received', { detail: data }));
  }

  handleSystemAlert(data) {
    console.log('🔥 [HANDLER] handleSystemAlert:', data);
    window.dispatchEvent(new CustomEvent('therapist:system:alert', { detail: data }));
  }

  handleConnectionStatus(status) {
    console.log('🔥 [HANDLER] handleConnectionStatus:', status);
    window.dispatchEvent(new CustomEvent('therapist:connection:status', { detail: status }));
  }

  disconnectWebSocket() {
    console.log('🔥 [WS] disconnectWebSocket called');
    webSocketService.disconnect();
    this.wsInitialized = false;
    console.log('✅ [WS] Therapist WebSocket disconnected');
  }

  getWebSocketStatus() {
    console.log('🔥 [WS] getWebSocketStatus called');
    const status = {
      initialized: this.wsInitialized,
      connected: webSocketService.isSocketConnected(),
      status: webSocketService.getConnectionStatus()
    };
    console.log('📊 [WS] Current status:', status);
    return status;
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 DASHBOARD & ANALYTICS METHODS
  // ═══════════════════════════════════════════════════════════

  async getDashboardOverview() {
    console.log('🔥 [API] getDashboardOverview called');
    
    try {
      console.log('📡 [API] Making request to /therapists/dashboard/overview');
      const response = await apiService.get('/therapists/dashboard/overview');
      
      console.log('✅ [API] Dashboard overview response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching dashboard overview:', error);
      console.error('❌ [API] Error details:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async updateSessionProgress(sessionId, progressData) {
    console.log('🔥 [API] updateSessionProgress called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('📦 [API] Progress Data:', JSON.stringify(progressData, null, 2));
    
    try {
      console.log('💾 [API] Saving session progress...');
      console.log('📡 [API] PATCH request to:', `/therapists/sessions/${sessionId}/progress`);
      
      const response = await apiService.patch(
        `/therapists/sessions/${sessionId}/progress`,
        progressData
      );

      console.log('✅ [API] Progress update response:', response);

      if (webSocketService.isSocketConnected()) {
        console.log('📡 [WS] Emitting progress update event...');
        webSocketService.socket.emit('therapist:session:progress', {
          sessionId,
          progressData,
          timestamp: new Date()
        });
        console.log('✅ [WS] Progress event emitted');
      } else {
        console.log('⚠️ [WS] WebSocket not connected, skipping event emit');
      }

      return {
        success: true,
        data: response.data || response,
        message: 'Progress saved successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating session progress:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      console.error('❌ [API] Error stack:', error.stack);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateVitals(sessionId, vitals) {
    console.log('🔥 [API] updateVitals called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('💓 [API] Vitals:', JSON.stringify(vitals, null, 2));
    
    try {
      console.log('📡 [API] PATCH request to:', `/therapists/sessions/${sessionId}/vitals`);
      
      const response = await apiService.patch(
        `/therapists/sessions/${sessionId}/vitals`,
        { vitals }
      );

      console.log('✅ [API] Vitals update response:', response);

      return {
        success: true,
        data: response.data || response,
        message: 'Vitals updated successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating vitals:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateObservations(sessionId, observations) {
    console.log('🔥 [API] updateObservations called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('📝 [API] Observations:', JSON.stringify(observations, null, 2));
    
    try {
      console.log('📡 [API] PATCH request to:', `/therapists/sessions/${sessionId}/observations`);
      
      const response = await apiService.patch(
        `/therapists/sessions/${sessionId}/observations`,
        { observations }
      );

      console.log('✅ [API] Observations update response:', response);

      return {
        success: true,
        data: response.data || response,
        message: 'Observations updated successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating observations:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addAdverseEffect(sessionId, adverseEffect) {
    console.log('🔥 [API] addAdverseEffect called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('⚠️ [API] Adverse Effect:', JSON.stringify(adverseEffect, null, 2));
    
    try {
      console.log('📡 [API] POST request to:', `/therapists/sessions/${sessionId}/adverse-effects`);
      
      const response = await apiService.post(
        `/therapists/sessions/${sessionId}/adverse-effects`,
        adverseEffect
      );

      console.log('✅ [API] Adverse effect added:', response);

      return {
        success: true,
        data: response.data || response,
        message: 'Adverse effect added successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error adding adverse effect:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addMaterialUsed(sessionId, material) {
    console.log('🔥 [API] addMaterialUsed called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('📦 [API] Material:', JSON.stringify(material, null, 2));
    
    try {
      console.log('📡 [API] POST request to:', `/therapists/sessions/${sessionId}/materials`);
      
      const response = await apiService.post(
        `/therapists/sessions/${sessionId}/materials`,
        material
      );

      console.log('✅ [API] Material added:', response);

      return {
        success: true,
        data: response.data || response,
        message: 'Material added successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error adding material:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  scheduleAutoSave(sessionId, progressData) {
    console.log('🔥 [AUTOSAVE] scheduleAutoSave called');
    console.log('🆔 [AUTOSAVE] Session ID:', sessionId);
    console.log('📦 [AUTOSAVE] Progress Data:', JSON.stringify(progressData, null, 2));
    
    if (this.autoSaveTimeout) {
      console.log('⏱️ [AUTOSAVE] Clearing existing timeout');
      clearTimeout(this.autoSaveTimeout);
    }

    console.log('⏱️ [AUTOSAVE] Scheduling auto-save in 2 seconds...');
    
    this.autoSaveTimeout = setTimeout(() => {
      console.log('💾 [AUTOSAVE] Executing auto-save now...');
      
      this.updateSessionProgress(sessionId, progressData)
        .then(result => {
          if (result.success) {
            console.log('✅ [AUTOSAVE] Auto-save successful');
            window.dispatchEvent(new CustomEvent('therapist:autosave:success', {
              detail: { sessionId, timestamp: new Date() }
            }));
          } else {
            console.error('❌ [AUTOSAVE] Auto-save failed:', result.error);
            window.dispatchEvent(new CustomEvent('therapist:autosave:failed', {
              detail: { sessionId, error: result.error }
            }));
          }
        })
        .catch(error => {
          console.error('❌ [AUTOSAVE] Auto-save error:', error);
          window.dispatchEvent(new CustomEvent('therapist:autosave:failed', {
            detail: { sessionId, error }
          }));
        });
    }, 2000);
  }

  async forceSave(sessionId, progressData) {
    console.log('🔥 [FORCE-SAVE] forceSave called');
    console.log('🆔 [FORCE-SAVE] Session ID:', sessionId);
    console.log('📦 [FORCE-SAVE] Progress Data:', JSON.stringify(progressData, null, 2));
    
    if (this.autoSaveTimeout) {
      console.log('⏱️ [FORCE-SAVE] Clearing pending auto-save timeout');
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }

    console.log('💾 [FORCE-SAVE] Executing force save immediately...');
    
    const result = await this.updateSessionProgress(sessionId, progressData);
    
    console.log('✅ [FORCE-SAVE] Force save result:', result);
    
    return result;
  }

  async getTherapistStats(period = '30d') {
    console.log('🔥 [API] getTherapistStats called');
    console.log('📊 [API] Period:', period);
    
    try {
      console.log('📡 [API] GET request to:', `/therapists/stats?period=${period}`);
      
      const response = await apiService.get(`/therapists/stats?period=${period}`);
      
      console.log('✅ [API] Stats response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching therapist stats:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: {
          totalSessions: 0,
          completedSessions: 0,
          activeSessions: 0,
          scheduledSessions: 0,
          cancelledSessions: 0,
          completionRate: 0,
          averageRating: 0,
          totalFeedback: 0
        }
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 SESSION MANAGEMENT METHODS
  // ═══════════════════════════════════════════════════════════

  async getTodaySessions() {
    console.log('🔥 [API] getTodaySessions called');
    
    try {
      console.log('📡 [API] GET request to: /therapists/sessions/today');
      
      const response = await apiService.get('/therapists/sessions/today');
      
      console.log('✅ [API] Today sessions response:', response);
      console.log('📊 [API] Sessions count:', response.data?.sessions?.length || 0);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching today sessions:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: { sessions: [] }
      };
    }
  }

  async getPatientSessions(patientId) {
    console.log('🔥 [API] getPatientSessions called');
    console.log('🆔 [API] Patient ID:', patientId);
    
    try {
      console.log('📡 [API] GET request to:', `/therapists/sessions/patient/${patientId}`);
      
      const response = await apiService.get(`/therapists/sessions/patient/${patientId}`);
      
      console.log('✅ [API] Patient sessions response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching patient sessions:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: { sessions: [] }
      };
    }
  }

  async startSession(sessionId, startNotes = '') {
    console.log('🔥 [API] startSession called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('📝 [API] Start Notes:', startNotes);
    
    try {
      console.log('📡 [API] POST request to:', `/therapists/sessions/${sessionId}/start`);
      
      const response = await apiService.post(`/therapists/sessions/${sessionId}/start`, {
        startNotes
      });

      console.log('✅ [API] Session started response:', response);

      if (webSocketService.isSocketConnected()) {
        console.log('📡 [WS] Emitting session start event...');
        webSocketService.socket.emit('therapist:session:start', {
          sessionId,
          timestamp: new Date()
        });
        console.log('✅ [WS] Session start event emitted');
      }

      return {
        success: true,
        data: response.data || response,
        message: 'Session started successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error starting session:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async completeSession(sessionId, sessionData) {
    console.log('🔥 [API] completeSession called');
    console.log('🆔 [API] Session ID:', sessionId);
    console.log('📦 [API] Session Data:', JSON.stringify(sessionData, null, 2));
    
    try {
      console.log('📡 [API] POST request to:', `/therapists/sessions/${sessionId}/complete`);
      
      const response = await apiService.post(`/therapists/sessions/${sessionId}/complete`, sessionData);

      console.log('✅ [API] Session completed response:', response);

      if (webSocketService.isSocketConnected()) {
        console.log('📡 [WS] Emitting session complete event...');
        webSocketService.socket.emit('therapist:session:complete', {
          sessionId,
          vitals: sessionData.vitals,
          timestamp: new Date()
        });
        console.log('✅ [WS] Session complete event emitted');
      }

      return {
        success: true,
        data: response.data || response,
        message: 'Session completed successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error completing session:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 PATIENT MANAGEMENT METHODS
  // ═══════════════════════════════════════════════════════════

  async getAssignedPatients() {
    console.log('🔥 [API] getAssignedPatients called');
    
    try {
      console.log('📡 [API] GET request to: /therapists/patients/assigned');
      
      const response = await apiService.get('/therapists/patients/assigned');
      
      console.log('✅ [API] Assigned patients response:', response);
      console.log('📊 [API] Patients count:', response.data?.patients?.length || 0);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching assigned patients:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: { patients: [] }
      };
    }
  }

  async getPatientDetails(patientId) {
    console.log('🔥 [API] getPatientDetails called');
    console.log('🆔 [API] Patient ID:', patientId);
    
    try {
      console.log('📡 [API] GET request to:', `/patients/${patientId}`);
      
      const response = await apiService.get(`/patients/${patientId}`);
      
      console.log('✅ [API] Patient details response:', response);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching patient details:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 PROFILE MANAGEMENT METHODS
  // ═══════════════════════════════════════════════════════════

  async getTherapistProfile() {
    console.log('🔥 [API] getTherapistProfile called');
    
    try {
      console.log('📡 [API] GET request to: /therapists/profile');
      
      const response = await apiService.get('/therapists/profile');
      
      console.log('✅ [API] Profile response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching therapist profile:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async updateTherapistProfile(therapistId, profileData) {
    console.log('🔥 [API] updateTherapistProfile called');
    console.log('🆔 [API] Therapist ID:', therapistId);
    console.log('📦 [API] Profile Data:', JSON.stringify(profileData, null, 2));
    
    try {
      // ✅ SANITIZE PAYLOAD
      const sanitizedData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio || '',
        specialization: Array.isArray(profileData.specialization) 
          ? profileData.specialization 
          : [],
        experienceYears: parseInt(profileData.experienceYears) || 0,
        availability: {
          workingHours: {
            start: profileData.availability?.workingHours?.start || '09:00',
            end: profileData.availability?.workingHours?.end || '17:00'
          },
          workingDays: Array.isArray(profileData.availability?.workingDays) 
            ? profileData.availability.workingDays 
            : [],
          sessionDuration: parseInt(profileData.availability?.sessionDuration) || 60,
          maxPatientsPerDay: parseInt(profileData.availability?.maxPatientsPerDay) || 8
        }
      };
      
      console.log('📡 [API] PUT request to:', `/therapists/${therapistId}`);
      console.log('✅ [API] Sanitized payload:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await apiService.put(`/therapists/${therapistId}`, sanitizedData);
      
      console.log('✅ [API] Profile update response:', response);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Profile updated successfully'
      };
      
    } catch (error) {
      console.error('❌ [API] Error updating therapist profile:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async updateAvailability(therapistId, availabilityData) {
    console.log('🔥 [API] updateAvailability called');
    console.log('🆔 [API] Therapist ID:', therapistId);
    console.log('📦 [API] Availability Data:', JSON.stringify(availabilityData, null, 2));
    
    try {
      console.log('📡 [API] PUT request to:', `/therapists/${therapistId}/availability`);
      
      const response = await apiService.put(`/therapists/${therapistId}/availability`, availabilityData);
      
      console.log('✅ [API] Availability update response:', response);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Availability updated successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating availability:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 TREATMENT PLAN METHODS
  // ═══════════════════════════════════════════════════════════

  async getAssignedTreatmentPlans(params = {}) {
    console.log('🔥 [API] getAssignedTreatmentPlans called');
    console.log('📦 [API] Params:', params);
    
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/therapists/treatment-plans${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('📡 [API] GET request to:', endpoint);
      
      const response = await apiService.get(endpoint);
      
      console.log('✅ [API] Treatment plans response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching assigned treatment plans:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: { treatmentPlans: [] }
      };
    }
  }

  async createTreatmentPlan(planData) {
    console.log('🔥 [API] createTreatmentPlan called');
    console.log('📦 [API] Plan Data:', JSON.stringify(planData, null, 2));
    
    try {
      console.log('📡 [API] POST request to: /therapists/treatment-plans');
      
      const response = await apiService.post('/therapists/treatment-plans', planData);
      
      console.log('✅ [API] Treatment plan created:', response);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Treatment plan created successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error creating treatment plan:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateTreatmentProgress(treatmentId, progressData) {
    console.log('🔥 [API] updateTreatmentProgress called');
    console.log('🆔 [API] Treatment ID:', treatmentId);
    console.log('📦 [API] Progress Data:', JSON.stringify(progressData, null, 2));
    
    try {
      console.log('📡 [API] PUT request to:', `/treatment-plans/${treatmentId}/progress`);
      
      const response = await apiService.put(`/treatment-plans/${treatmentId}/progress`, progressData);
      
      console.log('✅ [API] Treatment progress updated:', response);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Progress updated successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating treatment progress:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 FEEDBACK METHODS
  // ═══════════════════════════════════════════════════════════

  async getTherapistFeedback() {
    console.log('🔥 [API] getTherapistFeedback called');
    
    try {
      console.log('📡 [API] GET request to: /therapists/feedback');
      
      const response = await apiService.get('/therapists/feedback');
      
      console.log('✅ [API] Feedback response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error fetching feedback:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: {
          feedbacks: [],
          analytics: {
            totalFeedback: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            positiveRate: 0
          }
        }
      };
    }
  }


  async getTherapistFeedback(options = {}) {
    console.log('🔥 [API] getTherapistFeedback called');
    console.log('📊 [API] Options:', options);
    
    try {
      const { page = 1, limit = 10, timeRange = '3months' } = options;
      
      const params = { 
        page, 
        limit, 
        timeRange 
        // ❌ NO providerId - backend gets it from JWT token automatically
      };
      
      console.log('📡 [API] GET request to: /feedback/provider/my-feedback');
      console.log('📊 [API] Query params:', params);
      
      const response = await apiService.get('/feedback/provider/my-feedback', { params });
      
      console.log('✅ [API] Feedback response:', response);
      
      // Extract data from response
      const responseData = response.data?.data || response.data || response;
      
      return {
        success: true,
        data: {
          feedback: responseData.feedback || [],
          averageRatings: responseData.averageRatings || {
            avgOverall: 0,
            avgEffectiveness: 0,
            avgCare: 0
          },
          pagination: responseData.pagination || {
            currentPage: page,
            totalPages: 0,
            totalFeedback: 0
          }
        }
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching therapist feedback:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch feedback',
        data: {
          feedback: [],
          averageRatings: {
            avgOverall: 0,
            avgEffectiveness: 0,
            avgCare: 0
          },
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalFeedback: 0
          }
        }
      };
    }
  }

  /**
   * Get therapist's performance analytics
   * Backend automatically gets providerId from JWT token (req.user._id)
   * @param {string} timeRange - Time range for analytics (default: '6months')
   * @returns {Promise<Object>} Detailed analytics including trends, metrics, and insights
   */
  async getTherapistAnalytics(timeRange = '6months') {
    console.log('🔥 [API] getTherapistAnalytics called');
    console.log('📊 [API] Time range:', timeRange);
    
    try {
      const params = { 
        timeRange 
        // ❌ NO providerId - backend gets it from JWT token automatically
      };
      
      console.log('📡 [API] GET request to: /feedback/provider/analytics');
      console.log('📊 [API] Query params:', params);
      
      const response = await apiService.get('/feedback/provider/analytics', { params });
      
      console.log('✅ [API] Analytics response:', response);
      
      const analyticsData = response.data?.data || response.data || response;
      
      return {
        success: true,
        data: {
          // Overall performance metrics
          overview: analyticsData.overview || {
            totalFeedback: 0,
            averageRating: 0,
            totalSessions: 0,
            satisfactionRate: 0
          },
          
          // Rating trends over time
          ratingTrends: analyticsData.ratingTrends || {
            overall: [],
            effectiveness: [],
            care: []
          },
          
          // Performance breakdown
          performanceMetrics: analyticsData.performanceMetrics || {
            treatmentEffectiveness: 0,
            patientCare: 0,
            professionalBehavior: 0,
            communicationSkills: 0
          },
          
          // Rating distribution
          ratingDistribution: analyticsData.ratingDistribution || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          },
          
          // Patient improvement tracking
          patientImprovements: analyticsData.patientImprovements || {
            averageImprovement: 0,
            improvingPatients: 0,
            stablePatients: 0,
            decliningPatients: 0
          },
          
          // Therapy type breakdown
          therapyTypeBreakdown: analyticsData.therapyTypeBreakdown || [],
          
          // Top strengths and areas for improvement
          insights: analyticsData.insights || {
            strengths: [],
            areasForImprovement: [],
            recommendations: []
          },
          
          // Recent feedback highlights
          recentHighlights: analyticsData.recentHighlights || {
            positiveComments: [],
            concernsRaised: []
          },
          
          // Comparison with peers (if available)
          benchmarking: analyticsData.benchmarking || {
            yourRating: 0,
            averageRating: 0,
            percentile: 0
          },
          
          // Time-based analytics
          timeAnalytics: analyticsData.timeAnalytics || {
            trend: 'stable', // 'improving', 'declining', 'stable'
            recentPerformance: 0,
            previousPerformance: 0,
            changePercentage: 0
          },
          
          generatedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching therapist analytics:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch analytics',
        data: {
          overview: {
            totalFeedback: 0,
            averageRating: 0,
            totalSessions: 0,
            satisfactionRate: 0
          },
          ratingTrends: { overall: [], effectiveness: [], care: [] },
          performanceMetrics: {
            treatmentEffectiveness: 0,
            patientCare: 0,
            professionalBehavior: 0,
            communicationSkills: 0
          },
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          patientImprovements: {
            averageImprovement: 0,
            improvingPatients: 0,
            stablePatients: 0,
            decliningPatients: 0
          },
          therapyTypeBreakdown: [],
          insights: {
            strengths: [],
            areasForImprovement: [],
            recommendations: []
          },
          recentHighlights: {
            positiveComments: [],
            concernsRaised: []
          },
          benchmarking: {
            yourRating: 0,
            averageRating: 0,
            percentile: 0
          },
          timeAnalytics: {
            trend: 'stable',
            recentPerformance: 0,
            previousPerformance: 0,
            changePercentage: 0
          },
          generatedAt: new Date()
        }
      };
    }
  }
  // ═══════════════════════════════════════════════════════════
  // 🔥 UTILITY METHODS
  // ═══════════════════════════════════════════════════════════

  async refreshData() {
    console.log('🔥 [API] refreshData called');
    
    try {
      console.log('📡 [API] Fetching profile, sessions, and stats in parallel...');
      
      const [profileResponse, sessionsResponse, statsResponse] = await Promise.all([
        this.getTherapistProfile(),
        this.getTodaySessions(),
        this.getTherapistStats('30d')
      ]);

      console.log('✅ [API] All data refreshed');

      return {
        success: true,
        data: {
          profile: profileResponse.data,
          sessions: sessionsResponse.data,
          stats: statsResponse.data
        }
      };
    } catch (error) {
      console.error('❌ [API] Error refreshing dashboard data:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  // Add to your existing therapistApiService.js

// ═══════════════════════════════════════════════════════════
// 🔥 TREATMENT PLAN METHODS (NEW)
// ═══════════════════════════════════════════════════════════

/**
 * Get all treatment plans for a patient
 */
async getPatientTreatmentPlans(patientId) {
  console.log('🔥 [API] getPatientTreatmentPlans called');
  console.log('🆔 [API] Patient ID:', patientId);
  
  try {
    console.log('📡 [API] GET request to:', `/therapists/patients/${patientId}/treatment-plans`);
    
    const response = await apiService.get(`/therapists/patients/${patientId}/treatment-plans`);
    
    console.log('✅ [API] Treatment plans response:', response);
    
    const treatmentPlans = response.data?.data || response.data || [];
    
    return {
      success: true,
      data: treatmentPlans,
      message: `Found ${treatmentPlans.length} treatment plans`
    };
    
  } catch (error) {
    console.error('❌ [API] Error fetching treatment plans:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch treatment plans',
      data: []
    };
  }
}

/**
 * Get treatment plan details
 */
async getTreatmentPlanDetails(treatmentPlanId, patientId = null) {
  console.log('🔥 [API] getTreatmentPlanDetails called');
  console.log('🆔 [API] Treatment Plan ID:', treatmentPlanId);
  
  try {
    const params = patientId ? { patientId } : {};
    
    console.log('📡 [API] GET request to:', `/therapists/treatment-plans/${treatmentPlanId}`);
    
    const response = await apiService.get(`/therapists/treatment-plans/${treatmentPlanId}`, {
      params
    });
    
    console.log('✅ [API] Treatment plan details response:', response);
    
    return {
      success: true,
      data: response.data?.data || response.data,
      message: 'Treatment plan retrieved successfully'
    };
    
  } catch (error) {
    console.error('❌ [API] Error fetching treatment plan details:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch treatment plan',
      data: null
    };
  }
}

/**
 * Update treatment plan progress
 */
async updateTreatmentPlanProgress(treatmentPlanId, progressData) {
  console.log('🔥 [API] updateTreatmentPlanProgress called');
  console.log('🆔 [API] Treatment Plan ID:', treatmentPlanId);
  console.log('📦 [API] Progress Data:', progressData);
  
  try {
    console.log('📡 [API] PATCH request to:', `/therapists/treatment-plans/${treatmentPlanId}/progress`);
    
    const response = await apiService.patch(`/therapists/treatment-plans/${treatmentPlanId}/progress`, progressData);
    
    console.log('✅ [API] Progress update response:', response);
    
    return {
      success: true,
      data: response.data?.data || response.data,
      message: 'Progress updated successfully'
    };
    
  } catch (error) {
    console.error('❌ [API] Error updating progress:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update progress'
    };
  }
}

  // ═══════════════════════════════════════════════════════════
  // 🔥🔥🔥 REAL-TIME SESSION TRACKING (NEW) 🔥🔥🔥
  // ═══════════════════════════════════════════════════════════

  /**
   * Get real-time tracking dashboard
   * Fetches all active, upcoming, completed, and paused sessions
   */
  async getRealtimeTrackingDashboard() {
    console.log('🔥 [REALTIME] getRealtimeTrackingDashboard called');
    
    try {
      console.log('📡 [REALTIME] GET request to: /realtime/tracking/dashboard');
      
      const response = await apiService.get('/realtime/tracking/dashboard');
      
      console.log('✅ [REALTIME] Dashboard response:', response);
      
      const data = response.data?.data || response.data || {};
      
      return {
        success: true,
        data: {
          activeSessions: data.activeSessions || [],
          upcomingSessions: data.upcomingSessions || [],
          completedSessions: data.completedSessions || [],
          pausedSessions: data.pausedSessions || [],
          connectedUsers: data.connectedUsers || [],
          stats: data.stats || {
            active: 0,
            upcoming: 0,
            completed: 0,
            paused: 0,
            total: 0,
            connectedUsers: 0
          }
        }
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error fetching dashboard:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard',
        data: {
          activeSessions: [],
          upcomingSessions: [],
          completedSessions: [],
          pausedSessions: [],
          connectedUsers: [],
          stats: { active: 0, upcoming: 0, completed: 0, paused: 0, total: 0 }
        }
      };
    }
  }

  /**
   * Get upcoming sessions with countdown
   */
  async getUpcomingSessionsRealtime() {
    console.log('🔥 [REALTIME] getUpcomingSessionsRealtime called');
    
    try {
      console.log('📡 [REALTIME] GET request to: /realtime/tracking/sessions/upcoming');
      
      const response = await apiService.get('/realtime/tracking/sessions/upcoming');
      
      console.log('✅ [REALTIME] Upcoming sessions:', response);
      
      const sessions = response.data?.data?.sessions || response.data?.sessions || [];
      
      return {
        success: true,
        data: sessions,
        count: sessions.length
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error fetching upcoming sessions:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: []
      };
    }
  }

  /**
   * Start a therapy session with real-time broadcast
   */
// Add this method to therapistApiService.js

async startRealtimeSession(sessionId) {
  console.log('🔥 [REALTIME] startRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/start`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/start`);
    
    console.log('✅ [REALTIME] Session started:', response);
    
    return {
      success: true,
      data: response.data?.data || response.data,
      message: 'Session started successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error starting session:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to start session'
    };
  }
}

  /**
   * Update session status in real-time
   */
  async updateSessionStatusRealtime(sessionId, status, reason = '') {
    console.log('🔥 [REALTIME] updateSessionStatusRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    console.log('📊 [REALTIME] New Status:', status);
    
    try {
      console.log('📡 [REALTIME] PUT request to:', `/realtime/sessions/${sessionId}/status`);
      
      const response = await apiService.put(`/realtime/sessions/${sessionId}/status`, {
        status,
        reason
      });
      
      console.log('✅ [REALTIME] Status updated:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Status updated successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error updating status:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update status'
      };
    }
  }

  /**
   * Pause session
   */
  async pauseRealtimeSession(sessionId, reason = '') {
    console.log('🔥 [REALTIME] pauseRealtimeSession called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/pause`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/pause`, {
        reason
      });
      
      console.log('✅ [REALTIME] Session paused:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Session paused successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error pausing session:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to pause session'
      };
    }
  }

  /**
   * Resume session
   */
  async resumeRealtimeSession(sessionId) {
    console.log('🔥 [REALTIME] resumeRealtimeSession called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/resume`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/resume`);
      
      console.log('✅ [REALTIME] Session resumed:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Session resumed successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error resuming session:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to resume session'
      };
    }
  }

  /**
   * Complete session
   */
  async completeRealtimeSession(sessionId, summary = '', notes = '') {
    console.log('🔥 [REALTIME] completeRealtimeSession called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/complete`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/complete`, {
        summary,
        notes
      });
      
      console.log('✅ [REALTIME] Session completed:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Session completed successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error completing session:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to complete session'
      };
    }
  }

  /**
   * Join session room (for real-time updates)
   */
  async joinRealtimeSession(sessionId) {
    console.log('🔥 [REALTIME] joinRealtimeSession called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/join`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/join`);
      
      console.log('✅ [REALTIME] Joined session:', response);
      
      // Join WebSocket room
      if (webSocketService.isSocketConnected()) {
        webSocketService.socket.emit('join:session', { sessionId });
      }
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error joining session:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Leave session room
   */
  async leaveRealtimeSession(sessionId) {
    console.log('🔥 [REALTIME] leaveRealtimeSession called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/leave`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/leave`);
      
      console.log('✅ [REALTIME] Left session:', response);
      
      // Leave WebSocket room
      if (webSocketService.isSocketConnected()) {
        webSocketService.socket.emit('leave:session', { sessionId });
      }
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error leaving session:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get session details with real-time timing
   */
  async getRealtimeSessionDetails(sessionId) {
    console.log('🔥 [REALTIME] getRealtimeSessionDetails called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] GET request to:', `/realtime/sessions/${sessionId}/details`);
      
      const response = await apiService.get(`/realtime/sessions/${sessionId}/details`);
      
      console.log('✅ [REALTIME] Session details:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error fetching session details:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update vitals in real-time
   */
  async updateVitalsRealtime(sessionId, vitals) {
    console.log('🔥 [REALTIME] updateVitalsRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    console.log('💓 [REALTIME] Vitals:', vitals);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/vitals`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/vitals`, {
        vitals
      });
      
      console.log('✅ [REALTIME] Vitals updated:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Vitals updated successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error updating vitals:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update vitals'
      };
    }
  }

  /**
   * Update therapy progress in real-time
   */
  async updateProgressRealtime(sessionId, stage, notes = '', percentage = 0) {
    console.log('🔥 [REALTIME] updateProgressRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    console.log('📊 [REALTIME] Stage:', stage, 'Percentage:', percentage);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/progress`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/progress`, {
        stage,
        notes,
        percentage
      });
      
      console.log('✅ [REALTIME] Progress updated:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Progress updated successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error updating progress:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update progress'
      };
    }
  }

  /**
   * Report adverse effect
   */
  async reportAdverseEffectRealtime(sessionId, effect, severity, description = '', actionTaken = '') {
    console.log('🔥 [REALTIME] reportAdverseEffectRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    console.log('⚠️ [REALTIME] Effect:', effect, 'Severity:', severity);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/adverse-effect`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/adverse-effect`, {
        effect,
        severity,
        description,
        actionTaken
      });
      
      console.log('✅ [REALTIME] Adverse effect reported:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Adverse effect reported successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error reporting adverse effect:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to report adverse effect'
      };
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlertRealtime(sessionId, message, severity = 'high') {
    console.log('🔥 [REALTIME] sendEmergencyAlertRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    console.log('🚨 [REALTIME] Message:', message, 'Severity:', severity);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/emergency`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/emergency`, {
        message,
        severity
      });
      
      console.log('✅ [REALTIME] Emergency alert sent:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Emergency alert sent successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error sending emergency alert:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send emergency alert'
      };
    }
  }

  /**
   * Add session note in real-time
   */
  async addSessionNoteRealtime(sessionId, note, type = 'general') {
    console.log('🔥 [REALTIME] addSessionNoteRealtime called');
    console.log('🆔 [REALTIME] Session ID:', sessionId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/notes`);
      
      const response = await apiService.post(`/realtime/sessions/${sessionId}/notes`, {
        note,
        type
      });
      
      console.log('✅ [REALTIME] Note added:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Note added successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error adding note:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to add note'
      };
    }
  }

  /**
   * Get patient milestones
   */
  async getPatientMilestonesRealtime(patientId) {
    console.log('🔥 [REALTIME] getPatientMilestonesRealtime called');
    console.log('🆔 [REALTIME] Patient ID:', patientId);
    
    try {
      console.log('📡 [REALTIME] GET request to:', `/realtime/tracking/patients/${patientId}/milestones`);
      
      const response = await apiService.get(`/realtime/tracking/patients/${patientId}/milestones`);
      
      console.log('✅ [REALTIME] Milestones:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error fetching milestones:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update patient milestone
   */
  async updateMilestoneRealtime(patientId, milestoneType, title, description = '') {
    console.log('🔥 [REALTIME] updateMilestoneRealtime called');
    console.log('🆔 [REALTIME] Patient ID:', patientId);
    
    try {
      console.log('📡 [REALTIME] POST request to:', `/realtime/tracking/patients/${patientId}/milestones`);
      
      const response = await apiService.post(`/realtime/tracking/patients/${patientId}/milestones`, {
        milestoneType,
        title,
        description
      });
      
      console.log('✅ [REALTIME] Milestone updated:', response);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: 'Milestone updated successfully'
      };
      
    } catch (error) {
      console.error('❌ [REALTIME] Error updating milestone:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }


  async searchTherapists(filters = {}) {
    console.log('🔥 [API] searchTherapists called');
    console.log('🔍 [API] Filters:', filters);
    
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/therapists/search${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('📡 [API] GET request to:', endpoint);
      
      const response = await apiService.get(endpoint);
      
      console.log('✅ [API] Search response:', response);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('❌ [API] Error searching therapists:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

console.log('✅ [MODULE] TherapistApiService class defined');
const instance = new TherapistApiService();
console.log('✅ [MODULE] TherapistApiService instance created');

export default instance;
