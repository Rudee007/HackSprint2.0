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
      console.log(therapistId);
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
      const payload = response.data || response;

      console.log('✅ [API] Profile response:', payload);
      
      return {
        success: true,
        data: payload.data || payload      // backend sends { success, data }
      };
    } catch (error) {
      console.error('❌ [API] Error fetching therapist profile:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: null
      };
    }
  }

  async updateTherapistProfile(therapistId, profileData) {
    console.log('🔥 [API] updateTherapistProfile called');
    console.log('🆔 [API] Therapist ID:', therapistId);
    console.log('📦 [API] Raw Profile Data:', JSON.stringify(profileData, null, 2));
    
    try {
      // ✅ SANITIZE PAYLOAD TO MATCH BACKEND CONTROLLER
      const sanitizedData = {};

      // User fields (updated in User model by controller)
      if (profileData.name) sanitizedData.name = profileData.name;
      if (profileData.email) sanitizedData.email = profileData.email;
      if (profileData.phone) sanitizedData.phone = profileData.phone;

      // Therapist fields
      if (typeof profileData.bio === 'string') {
        sanitizedData.bio = profileData.bio;
      }

      if (Array.isArray(profileData.specialization)) {
        sanitizedData.specialization = profileData.specialization;
      }

      if (profileData.experienceYears !== undefined) {
        const exp = parseInt(profileData.experienceYears, 10);
        if (!Number.isNaN(exp)) {
          sanitizedData.experienceYears = exp;
        }
      }

      // Certifications (optional)
      if (Array.isArray(profileData.certifications)) {
        sanitizedData.certifications = profileData.certifications.map(cert => ({
          therapy: cert.therapy,
          level: cert.level,
          experienceYears: Number(cert.experienceYears) || 0,
          certificateUrl: cert.certificateUrl
        }));
      }

      // Optional status flags
      if (typeof profileData.isActive === 'boolean') {
        sanitizedData.isActive = profileData.isActive;
      }
      if (typeof profileData.verificationStatus === 'string') {
        sanitizedData.verificationStatus = profileData.verificationStatus;
      }

      console.log('📡 [API] PUT request to:', `/therapists/${therapistId}`);
      console.log('✅ [API] Sanitized payload:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await apiService.put(`/therapists/${therapistId}`, sanitizedData);
      const payload = response.data || response;

      console.log('✅ [API] Profile update response:', payload);
      
      return {
        success: payload.success !== false,
        data: payload.data || payload,
        message: payload.message || 'Profile updated successfully'
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
    console.log('📦 [API] Availability Data (raw):', JSON.stringify(availabilityData, null, 2));
    
    try {
      // Optional: minimal normalization of numeric fields / legacy fields
      const normalized = { ...availabilityData };

      if (normalized.maxPatientsPerDay !== undefined) {
        normalized.maxPatientsPerDay = parseInt(normalized.maxPatientsPerDay, 10) || 8;
      }
      if (normalized.sessionDuration !== undefined) {
        normalized.sessionDuration = parseInt(normalized.sessionDuration, 10) || 60;
      }

      console.log('📡 [API] PUT request to:', `/therapists/${therapistId}/availability`);
      console.log('✅ [API] Normalized availability payload:', JSON.stringify(normalized, null, 2));
      
      const response = await apiService.put(`/therapists/${therapistId}/availability`, normalized);
      const payload = response.data || response;

      console.log('✅ [API] Availability update response:', payload);
      
      return {
        success: payload.success !== false,
        data: payload.data || payload,
        message: payload.message || 'Availability updated successfully'
      };
    } catch (error) {
      console.error('❌ [API] Error updating availability:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
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


/**startRealtimeSession
 * Get treatment plan details
 */
// services/therapistApiService.js
async getTreatmentPlanDetails(treatmentPlanId, patientId = null) {
  console.log('🔥 [API] getTreatmentPlanDetails called');
  console.log('🆔 [API] Treatment Plan ID:', treatmentPlanId);
  console.log('👤 [API] Patient ID (optional):', patientId);
  
  try {
    // 🔥 Construct query params for ownership verification
    const params = patientId ? { patientId } : {};
    
    console.log('📡 [API] GET request to:', `/therapists/treatment-plans/${treatmentPlanId}`);
    console.log('🔍 [API] Query params:', params);
    
    const response = await apiService.get(`/therapists/treatment-plans/${treatmentPlanId}`, {
      params
    });
    
    console.log('✅ [API] Raw response structure:', {
      success: response.data?.success,
      hasPhases: response.data?.data?.phases?.length > 0,
      totalSessions: response.data?.data?.totalSessionsPlanned,
      progress: response.data?.data?.progress,
      nextSession: !!response.data?.data?.nextSession,
      generatedSessionsCount: response.data?.data?.generatedSessions?.length || 0
    });

    // 🔥 ENHANCE RESPONSE with frontend-friendly structure
    const rawData = response.data?.data || response.data;
    
    const enhancedData = {
      ...rawData,
      
      // 🔥 Frontend-friendly session stats
      sessionStats: {
        total: rawData.totalSessionsPlanned || 0,
        completed: rawData.completedSessions || 0,
        scheduled: rawData.generatedSessions?.filter(s => s.status === 'scheduled').length || 0,
        today: rawData.generatedSessions?.filter(s => {
          const sessionDate = new Date(s.scheduledDate);
          const today = new Date();
          return sessionDate.toDateString() === today.toDateString() && s.status === 'scheduled';
        }).length || 0,
        upcoming: rawData.nextSession ? 1 : 0
      },
      
      // 🔥 Current phase info
      currentPhase: rawData.phases?.[rawData.currentPhaseIndex || 0] || null,
      
      // 🔥 Formatted dates
      formattedStartDate: rawData.schedulingPreferences?.startDate 
        ? new Date(rawData.schedulingPreferences.startDate).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
          })
        : 'Not scheduled',
      
      estimatedCompletion: rawData.estimatedCompletionDate 
        ? new Date(rawData.estimatedCompletionDate).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
          })
        : 'TBD',
      
      // 🔥 Progress breakdown by phase
      phaseProgress: rawData.phases?.map((phase, index) => ({
        phaseName: phase.phaseName.toUpperCase(),
        totalDays: phase.totalDays,
        completedDays: Math.floor((rawData.progress || 0) / 100 * rawData.totalDays),
        progressPercentage: Math.min(100, ((index + 1) / rawData.phases.length) * (rawData.progress || 0)),
        therapySessionsCount: phase.therapySessions?.length || 0
      })) || [],
      
      // 🔥 Today's sessions (prioritized for therapist dashboard)
      todaySessions: rawData.generatedSessions?.filter(s => {
        const sessionDate = new Date(s.scheduledDate);
        return sessionDate.toDateString() === new Date().toDateString() && 
               ['scheduled', 'confirmed'].includes(s.status);
      }).sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime)) || [],
      
      // 🔥 Next 5 upcoming sessions
      upcomingSessions: rawData.nextSession ? [rawData.nextSession] : [],
      
      // 🔥 Safety & instruction flags
      hasPreInstructions: !!rawData.prePanchakarmaInstructions,
      hasPostInstructions: !!rawData.postPanchakarmaInstructions,
      hasSafetyNotes: !!rawData.safetyNotes,
      
      // 🔥 Scheduling status
      isReadyForScheduling: rawData.isReadyForScheduling || false,
      schedulingStatus: rawData.schedulingStatus || 'pending'
    };

    console.log('✨ [API] Enhanced data prepared:', {
      phaseCount: enhancedData.phases?.length || 0,
      todaySessions: enhancedData.todaySessions.length,
      progress: rawData.progress || 0
    });

    return {
      success: true,
      data: enhancedData,
      message: 'Treatment plan retrieved successfully',
      metadata: {
        fetchedAt: new Date().toISOString(),
        schemaVersion: '2.0',
        totalPhases: enhancedData.phases?.length || 0,
        totalSessions: enhancedData.sessionStats.total
      }
    };
    
  } catch (error) {
    console.error('❌ [API] Error fetching treatment plan details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch treatment plan details',
      data: null,
      statusCode: error.response?.status || 500
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
 // services/therapistApiService.js
async getRealtimeTrackingDashboard() {
  console.log('🔥 [REALTIME] getRealtimeTrackingDashboard called');
  
  try {
    console.log('📡 [REALTIME] GET request to: /realtime/tracking/dashboard');
    
    const response = await apiService.get('/realtime/tracking/dashboard');
    
    console.log('✅ [REALTIME] Raw dashboard response:', {
      activeCount: response.data?.data?.activeSessions?.length || 0,
      upcomingCount: response.data?.data?.upcomingSessions?.length || 0,
      hasTimingData: !!(response.data?.data?.activeSessions?.[0]?.timing),
      hasTherapyData: !!(response.data?.data?.activeSessions?.[0]?.therapyType),
      wsConnections: response.data?.data?.stats?.connectedUsers || 0
    });
    
    const rawData = response.data?.data || response.data || {};
    
    // 🔥 ENHANCE: Schema-aware data processing
    const enhancedData = {
      activeSessions: (rawData.activeSessions || []).map(enhanceSessionData),
      upcomingSessions: (rawData.upcomingSessions || []).map(enhanceSessionData),
      completedSessions: (rawData.completedSessions || []).map(enhanceSessionData),
      pausedSessions: (rawData.pausedSessions || []).map(enhanceSessionData),
      connectedUsers: rawData.connectedUsers || [],
      
      // 🔥 ENHANCED STATS with therapy-specific metrics
      stats: {
        ...rawData.stats,
        therapySessions: {
          activeTherapy: rawData.activeSessions?.filter(s => s.sessionType === 'therapy').length || 0,
          upcomingTherapy: rawData.upcomingSessions?.filter(s => s.sessionType === 'therapy').length || 0,
          completedTherapy: rawData.completedSessions?.filter(s => s.sessionType === 'therapy').length || 0
        },
        vitalsCount: rawData.activeSessions?.filter(s => s.therapyData?.vitals).length || 0,
        adverseEffects: rawData.activeSessions?.reduce((sum, s) => sum + (s.therapyData?.adverseEffects?.length || 0), 0) || 0,
        avgProgress: Math.round(
          rawData.activeSessions?.reduce((sum, s) => sum + (s.timing?.progressPercentage || 0), 0) / 
          Math.max(1, rawData.activeSessions?.length || 1)
        ) || 0
      },
      
      // 🔥 FRONTEND-READY METADATA
      metadata: {
        fetchedAt: new Date().toISOString(),
        dateRange: rawData.dateRange || {
          from: new Date().setHours(0, 0, 0, 0),
          to: new Date().setHours(23, 59, 59, 999)
        },
        serverTimestamp: response.data?.timestamp || new Date().toISOString(),
        schemaVersion: '2.0'
      }
    };
    
    console.log('✨ [REALTIME] Enhanced dashboard ready:', {
      totalSessions: enhancedData.activeSessions.length + enhancedData.upcomingSessions.length,
      therapyActive: enhancedData.stats.therapySessions.activeTherapy,
      avgProgress: enhancedData.stats.avgProgress
    });
    
    return {
      success: true,
      data: enhancedData,
      message: 'Realtime dashboard data loaded successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error fetching dashboard:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch realtime dashboard',
      data: {
        activeSessions: [],
        upcomingSessions: [],
        completedSessions: [],
        pausedSessions: [],
        connectedUsers: [],
        stats: { 
          active: 0, 
          upcoming: 0, 
          completed: 0, 
          paused: 0, 
          total: 0, 
          connectedUsers: 0,
          therapySessions: { activeTherapy: 0, upcomingTherapy: 0, completedTherapy: 0 },
          vitalsCount: 0,
          adverseEffects: 0,
          avgProgress: 0
        },
        metadata: { fetchedAt: new Date().toISOString() }
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
// services/therapistApiService.js - REALTIME SESSION METHODS (UPDATED)

/**
 * Start real-time session with countdown
 */
async startRealtimeSession(sessionId) {
  console.log('🔥 [REALTIME] startRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/start`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/start`);
    
    console.log('✅ [REALTIME] Session started:', {
      status: response.data?.data?.consultation?.sessionStatus,
      countdownStarted: response.data?.data?.countdownStarted,
      estimatedEndTime: response.data?.data?.estimatedEndTime
    });
    
    return {
      success: true,
      data: {
        consultation: response.data?.data?.consultation,
        countdownStarted: response.data?.data?.countdownStarted || true,
        estimatedEndTime: response.data?.data?.estimatedEndTime,
        isTherapySession: response.data?.data?.isTherapySession || false
      },
      message: response.data?.message || 'Session started successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error starting session:', {
      status: error.response?.status,
      message: error.response?.data?.message
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to start session'
    };
  }
}

/**
 * Pause session with reason
 */
async pauseRealtimeSession(sessionId, reason = '') {
  console.log('🔥 [REALTIME] pauseRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  console.log('📝 [REALTIME] Reason:', reason);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/pause`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/pause`, {
      reason: reason || 'Session paused by user'
    });
    
    console.log('✅ [REALTIME] Session paused:', {
      status: response.data?.data?.consultation?.sessionStatus,
      totalPauses: response.data?.data?.consultation?.sessionMetadata?.totalPauses
    });
    
    return {
      success: true,
      data: {
        consultation: response.data?.data?.consultation,
        totalPauses: response.data?.data?.consultation?.sessionMetadata?.totalPauses || 0
      },
      message: response.data?.message || 'Session paused successfully'
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
 * Resume paused session
 */
async resumeRealtimeSession(sessionId) {
  console.log('🔥 [REALTIME] resumeRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/resume`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/resume`);
    
    console.log('✅ [REALTIME] Session resumed:', {
      status: response.data?.data?.consultation?.sessionStatus
    });
    
    return {
      success: true,
      data: {
        consultation: response.data?.data?.consultation
      },
      message: response.data?.message || 'Session resumed successfully'
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
 * Complete session with summary, notes, rating, and feedback
 */
async completeRealtimeSession(sessionId, summary = '', notes = '', rating = null, feedback = '') {
  console.log('🔥 [REALTIME] completeRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  console.log('⭐ [REALTIME] Rating:', rating);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/complete`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/complete`, {
      summary,
      notes,
      rating: rating ? Number(rating) : undefined,
      feedback
    });
    
    console.log('✅ [REALTIME] Session completed:', {
      status: response.data?.data?.consultation?.sessionStatus,
      actualDuration: response.data?.data?.consultation?.actualDuration,
      rating: response.data?.data?.consultation?.rating
    });
    
    return {
      success: true,
      data: {
        consultation: response.data?.data?.consultation,
        actualDuration: response.data?.data?.consultation?.actualDuration,
        rating: response.data?.data?.consultation?.rating
      },
      message: response.data?.message || 'Session completed successfully'
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
 * Update session status (generic)
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
    
    console.log('✅ [REALTIME] Status updated:', {
      newStatus: response.data?.data?.consultation?.sessionStatus
    });
    
    return {
      success: true,
      data: {
        consultation: response.data?.data?.consultation
      },
      message: response.data?.message || 'Status updated successfully'
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
 * Join session room for real-time updates
 */
async joinRealtimeSession(sessionId) {
  console.log('🔥 [REALTIME] joinRealtimeSession called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/join`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/join`);
    
    console.log('✅ [REALTIME] Joined session:', {
      participantCount: response.data?.data?.participantCount
    });
    
    // Join WebSocket room
    if (webSocketService.isSocketConnected()) {
      webSocketService.socket.emit('join:session', { sessionId });
      console.log('📡 [WEBSOCKET] Joined room:', sessionId);
    }
    
    return {
      success: true,
      data: {
        sessionId: response.data?.data?.sessionId,
        role: response.data?.data?.role,
        participantCount: response.data?.data?.participantCount
      },
      message: 'Joined session successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error joining session:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to join session'
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
    
    console.log('✅ [REALTIME] Left session');
    
    // Leave WebSocket room
    if (webSocketService.isSocketConnected()) {
      webSocketService.socket.emit('leave:session', { sessionId });
      console.log('📡 [WEBSOCKET] Left room:', sessionId);
    }
    
    return {
      success: true,
      message: 'Left session successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error leaving session:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to leave session'
    };
  }
}

/**
 * Get real-time session details with timing and therapy info
 */
async getRealtimeSessionDetails(sessionId) {
  console.log('🔥 [REALTIME] getRealtimeSessionDetails called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  
  try {
    console.log('📡 [REALTIME] GET request to:', `/realtime/sessions/${sessionId}/details`);
    
    const response = await apiService.get(`/realtime/sessions/${sessionId}/details`);
    
    const data = response.data?.data || {};
    
    console.log('✅ [REALTIME] Session details loaded:', {
      status: data.consultation?.sessionStatus,
      isTherapy: data.consultation?.sessionType === 'therapy',
      hasVitals: data.therapyInfo?.hasVitals,
      emergencyReported: data.therapyInfo?.emergencyReported
    });
    
    return {
      success: true,
      data: {
        consultation: data.consultation,
        timing: data.timing || {
          elapsedTime: null,
          remainingTime: null,
          estimatedDuration: 60,
          progressPercentage: 0
        },
        therapyInfo: data.therapyInfo || null,
        isActive: data.isActive || false,
        participantCount: data.participantCount || 0
      }
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error fetching session details:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch session details'
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 🔥 THERAPY-SPECIFIC METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Update therapy vitals in real-time
 * @param {string} sessionId - Session ID
 * @param {Object} vitals - Vitals object with bloodPressure, pulse, temperature, etc.
 */
async updateVitalsRealtime(sessionId, vitals) {
  console.log('🔥 [REALTIME] updateVitalsRealtime called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  console.log('💓 [REALTIME] Vitals:', vitals);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/vitals`);
    
    // ✅ SCHEMA-ALIGNED: Send vitals as separate fields
    const payload = {
      bloodPressure: vitals.bloodPressure ? {
        systolic: Number(vitals.bloodPressure.systolic),
        diastolic: Number(vitals.bloodPressure.diastolic)
      } : undefined,
      pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
      temperature: vitals.temperature ? Number(vitals.temperature) : undefined,
      weight: vitals.weight ? Number(vitals.weight) : undefined,
      respiratoryRate: vitals.respiratoryRate ? Number(vitals.respiratoryRate) : undefined,
      oxygenSaturation: vitals.oxygenSaturation ? Number(vitals.oxygenSaturation) : undefined
    };
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/vitals`, payload);
    
    console.log('✅ [REALTIME] Vitals updated:', response.data?.data?.vitals);
    
    return {
      success: true,
      data: {
        vitals: response.data?.data?.vitals
      },
      message: response.data?.message || 'Vitals updated successfully'
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
 * Update therapy observations in real-time
 */
async updateObservationsRealtime(sessionId, observations) {
  console.log('🔥 [REALTIME] updateObservationsRealtime called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  console.log('👁️ [REALTIME] Observations:', observations);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/observations`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/observations`, {
      sweatingQuality: observations.sweatingQuality,
      skinTexture: observations.skinTexture,
      skinColor: observations.skinColor,
      patientComfort: observations.patientComfort,
      responseToTreatment: observations.responseToTreatment
    });
    
    console.log('✅ [REALTIME] Observations updated');
    
    return {
      success: true,
      data: {
        observations: response.data?.data?.observations
      },
      message: response.data?.message || 'Observations updated successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error updating observations:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update observations'
    };
  }
}

/**
 * Update therapy progress stage
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
      percentage: Number(percentage)
    });
    
    console.log('✅ [REALTIME] Progress updated:', {
      currentStage: response.data?.data?.currentStage,
      percentage: response.data?.data?.percentage
    });
    
    return {
      success: true,
      data: {
        currentStage: response.data?.data?.currentStage,
        percentage: response.data?.data?.percentage,
        progressUpdates: response.data?.data?.progressUpdates
      },
      message: response.data?.message || 'Progress updated successfully'
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
 * Report adverse effect (with auto-escalation for severe/critical)
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
    
    console.log('✅ [REALTIME] Adverse effect reported:', {
      emergencyReported: response.data?.data?.emergencyReported,
      adverseEffectsCount: response.data?.data?.adverseEffects?.length
    });
    
    return {
      success: true,
      data: {
        effect: response.data?.data?.effect,
        severity: response.data?.data?.severity,
        emergencyReported: response.data?.data?.emergencyReported,
        adverseEffects: response.data?.data?.adverseEffects
      },
      message: response.data?.message || 'Adverse effect reported successfully'
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
 * Add therapy materials used
 */
async addTherapyMaterialsRealtime(sessionId, materials) {
  console.log('🔥 [REALTIME] addTherapyMaterialsRealtime called');
  console.log('🆔 [REALTIME] Session ID:', sessionId);
  console.log('📦 [REALTIME] Materials:', materials);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/materials`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/materials`, {
      materials: Array.isArray(materials) ? materials : [materials]
    });
    
    console.log('✅ [REALTIME] Materials added');
    
    return {
      success: true,
      data: {
        materialsUsed: response.data?.data?.materialsUsed
      },
      message: response.data?.message || 'Materials recorded successfully'
    };
    
  } catch (error) {
    console.error('❌ [REALTIME] Error adding materials:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to add materials'
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
    
    console.log('✅ [REALTIME] Emergency alert sent');
    
    return {
      success: true,
      data: {
        sessionId: response.data?.data?.sessionId,
        severity: response.data?.data?.severity,
        emergencyReported: response.data?.data?.emergencyReported
      },
      message: response.data?.message || 'Emergency alert sent successfully'
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
  console.log('📝 [REALTIME] Note type:', type);
  
  try {
    console.log('📡 [REALTIME] POST request to:', `/realtime/sessions/${sessionId}/notes`);
    
    const response = await apiService.post(`/realtime/sessions/${sessionId}/notes`, {
      note,
      type
    });
    
    console.log('✅ [REALTIME] Note added');
    
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message || 'Note added successfully'
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
// 🔥 HELPER: Schema-aware session enhancement
function enhanceSessionData(session) {
  if (!session) return session;
  
  const now = Date.now();
  const isTherapy = session.sessionType === 'therapy';
  
  return {
    ...session,
    
    // 🔥 FORMATTED TIMING (real-time)
    formattedScheduledTime: session.scheduledTime || 
      (session.scheduledAt ? new Date(session.scheduledAt).toLocaleTimeString('en-IN', { 
        hour: '2-digit', minute: '2-digit' 
      }) : 'N/A'),
    
    formattedScheduledDate: session.scheduledDate || 
      (session.scheduledAt ? formatDateIndian(session.scheduledAt) : 'Today'),
    
    // 🔥 ENHANCED TIMING for active sessions
    timing: session.timing ? {
      ...session.timing,
      elapsedTimeFormatted: formatDurationMs(session.timing.elapsedTimeMs || 0),
      remainingTimeFormatted: formatDurationMs(session.timing.remainingTimeMs || 0),
      isOverdue: session.timing.remainingTimeMs < 0
    } : null,
    
    // 🔥 THERAPY-SPECIFIC ENHANCEMENTS
    therapyData: isTherapy ? {
      ...(session.therapyData || {}),
      hasVitals: !!session.therapyData?.vitals,
      hasAdverseEffects: (session.therapyData?.adverseEffects || []).length > 0,
      hasProgressUpdates: (session.therapyData?.progressUpdates || []).length > 0,
      currentStage: session.therapyData?.progressUpdates?.slice(-1)[0]?.stage || 'preparation',
      latestVitals: session.therapyData?.vitals || null,
      criticalAlerts: (session.therapyData?.adverseEffects || [])
        .filter(effect => ['severe', 'critical'].includes(effect.severity))
        .length
    } : null,
    
    // 🔥 PROVIDER INFO
    providerName: session.providerName || session.providerId?.name || 'Unassigned',
    
    // 🔥 PATIENT AVATAR READY
    patientInitials: getPatientInitials(session.patientName),
    
    // 🔥 STATUS INDICATORS
    isActive: ['in_progress', 'patient_arrived', 'therapist_ready'].includes(session.sessionStatus),
    isCritical: isTherapy && session.therapyData?.emergencyReported,
    hasSafetyIssues: isTherapy && (session.therapyData?.adverseEffects?.length || 0) > 0
  };
}

// 🔥 UTILITY FUNCTIONS
function formatDateIndian(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

function formatDurationMs(ms) {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getPatientInitials(name) {
  if (!name) return 'UP';
  const names = name.trim().split(' ');
  return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
}

console.log('✅ [MODULE] TherapistApiService class defined');
const instance = new TherapistApiService();
console.log('✅ [MODULE] TherapistApiService instance created');

export default instance;
