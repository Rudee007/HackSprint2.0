import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionStatus = { connected: false };
    this.currentToken = null;
  }

  // ✅ Connect with token from localStorage
  // Add this at the top of the connect method
  
  connect(token = null) {
    // ✅ Enhanced debugging
    const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    console.log('🔧 === WEBSOCKET CONNECTION DEBUG ===');
    console.log('🔧 URL:','http://localhost:3003');
    console.log('🔧 Token exists:', !!authToken);
    console.log('🔧 Token length:', authToken?.length);
    console.log('🔧 Token starts with:', authToken?.substring(0, 10) + '...');
    console.log('🔧 Current time:', new Date().toISOString());

    if (!authToken) {
      console.error('❌ No authentication token available');
      return Promise.reject(new Error('No authentication token'));
    }

    this.currentToken = authToken;

    if (this.socket?.connected) {
      console.log('✅ Already connected to WebSocket');
      return Promise.resolve();
    }

    console.log('🔄 Creating new Socket.IO connection...');

    return new Promise((resolve, reject) => {
      const socketUrl =  'http://localhost:3003';
      
      this.socket = io(socketUrl, {
        auth: {
          token: authToken // ✅ This is critical
        },
        transports: ['websocket', 'polling'], // ✅ Allow both
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: this.maxReconnectAttempts
      });

      // ✅ Enhanced event logging
      this.socket.on('connect', () => {
        console.log('✅ === WEBSOCKET CONNECTED SUCCESSFULLY ===');
        console.log('✅ Socket ID:', this.socket.id);
        console.log('✅ Transport:', this.socket.io.engine.transport.name);
        console.log('✅ Connected at:', new Date().toISOString());
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionStatus = { connected: true };
        this.emitToListeners('connection_status', this.connectionStatus);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ === WEBSOCKET CONNECTION FAILED ===');
        console.error('❌ Error:', error.message);
        console.error('❌ Description:', error.description);
        console.error('❌ Context:', error.context);
        console.error('❌ Type:', error.type);
        console.error('❌ Full error object:', error);
        
        this.isConnected = false;
        this.connectionStatus = { connected: false, error: error.message };
        this.emitToListeners('connection_status', this.connectionStatus);
        reject(error);
      });

      this.socket.on('disconnect', (reason, details) => {
        console.log('🚪 === WEBSOCKET DISCONNECTED ===');
        console.log('🚪 Reason:', reason);
        console.log('🚪 Details:', details);
        console.log('🚪 Time:', new Date().toISOString());
        
        this.isConnected = false;
        this.connectionStatus = { connected: false, reason };
        this.emitToListeners('connection_status', this.connectionStatus);
      });

      // ✅ Additional debug events
      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      this.socket.io.on('error', (error) => {
        console.error('❌ IO error:', error);
      });

      this.socket.io.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      });

      this.socket.io.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      this.socket.io.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
      });

      this.socket.io.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed after maximum attempts');
      });
    });
  }  

  // ✅ Handle authentication errors
  handleAuthError() {
    this.isConnected = false;
    this.connectionStatus = { connected: false, error: 'Authentication failed' };
    this.emitToListeners('connection_status', this.connectionStatus);
    this.emitToListeners('auth_error', { message: 'Session expired, please login again' });
    
    // Clear stored tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    
    // Redirect to login if needed
    if (window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.href = '/doctor-login';
      }, 2000);
    }
  }

  // ✅ Refresh connection with new token
  refreshConnection() {
    const newToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (newToken && newToken !== this.currentToken) {
      console.log('🔄 Refreshing WebSocket connection with new token');
      this.disconnect();
      return this.connect(newToken);
    }
    
    return Promise.resolve();
  }

  // Rest of your existing methods...
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('🚪 Disconnected from WebSocket:', reason);
      this.isConnected = false;
      this.connectionStatus = { connected: false, reason };
      this.emitToListeners('connection_status', this.connectionStatus);
    });

    // Session events
    this.socket.on('session_status_update', (data) => {
      console.log('📡 Session status update:', data);
      this.emitToListeners('session_status_update', data);
    });

    this.socket.on('user_joined_session', (data) => {
      console.log('👥 User joined session:', data);
      this.emitToListeners('user_joined_session', data);
    });

    this.socket.on('user_left_session', (data) => {
      console.log('👋 User left session:', data);
      this.emitToListeners('user_left_session', data);
    });

    // Provider events
    this.socket.on('provider_status_updated', (data) => {
      console.log('🔄 Provider status updated:', data);
      this.emitToListeners('provider_status_updated', data);
    });

    this.socket.on('provider_availability_update', (data) => {
      console.log('📅 Provider availability updated:', data);
      this.emitToListeners('provider_availability_update', data);
    });

    // System events
    this.socket.on('system_alert', (data) => {
      console.log('🚨 System alert:', data);
      this.emitToListeners('system_alert', data);
    });

    this.socket.on('appointment_update', (data) => {
      console.log('📋 Appointment update:', data);
      this.emitToListeners('appointment_update', data);
    });

    // Feedback events
    this.socket.on('feedback_submitted', (data) => {
      console.log('📝 Feedback submitted:', data);
      this.emitToListeners('feedback_submitted', data);
    });

    this.socket.on('critical_feedback_alert', (data) => {
      console.log('🚨 Critical feedback alert:', data);
      this.emitToListeners('critical_feedback_alert', data);
    });
  }

  // Rest of existing methods remain the same...
  joinSession(sessionId) {
    if (this.socket?.connected) {
      console.log(`👥 Joining session: ${sessionId}`);
      this.socket.emit('join_session', sessionId);
      return true;
    }
    console.warn('Cannot join session: WebSocket not connected');
    return false;
  }

  leaveSession(sessionId) {
    if (this.socket?.connected) {
      console.log(`👋 Leaving session: ${sessionId}`);
      this.socket.emit('leave_session', sessionId);
      return true;
    }
    return false;
  }

  updateProviderStatus(status, availableUntil = null) {
    if (this.socket?.connected) {
      console.log(`🔄 Updating provider status: ${status}`);
      this.socket.emit('update_provider_status', { status, availableUntil });
      return true;
    }
    return false;
  }

  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    console.log(`📡 Added listener for: ${eventType}`);
  }

  removeEventListener(eventType, callback) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
      console.log(`🗑️ Removed listener for: ${eventType}`);
    }
  }

  emitToListeners(eventType, data) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🚪 Disconnecting from WebSocket server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatus = { connected: false };
      this.listeners.clear();
      this.currentToken = null;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket?.connected || false,
      status: this.connectionStatus,
      hasToken: !!this.currentToken
    };
  }

  isSocketConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id;
  }

  on(eventType, callback) {
    // Use existing socket listener if available
    if (this.socket && this.socket.connected) {
      this.socket.on(eventType, callback);
      console.log(`📡 Registered socket listener for: ${eventType}`);
    }
    
    // Also add to internal listeners for persistence
    this.addEventListener(eventType, callback);
  }

  /**
   * Alias for removeEventListener (Socket.IO style)
   */
  off(eventType, callback) {
    // Remove from socket if available
    if (this.socket) {
      this.socket.off(eventType, callback);
      console.log(`🔕 Removed socket listener for: ${eventType}`);
    }
    
    // Also remove from internal listeners
    this.removeEventListener(eventType, callback);
  }

  /**
   * Emit event directly to socket
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      console.log(`📤 Emitted socket event: ${event}`, data);
      return true;
    }
    console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    return false;
  }
}

export default new WebSocketService();
