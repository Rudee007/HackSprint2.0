// src/services/websocket.service.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }
  emitFeedbackUpdate(sessionId, feedbackData) {
    this.io.to(`session_${sessionId}`).emit('feedback_submitted', {
      sessionId,
      patientProgress: feedbackData.analytics,
      timestamp: new Date()
    });
  }


emitCriticalFeedback(feedbackData) {
    this.io.to('admin_room').emit('critical_feedback_alert', {
      feedbackId: feedbackData._id,
      patientId: feedbackData.patientId,
      severity: 'high',
      message: 'Critical feedback requires immediate attention'
    });
  }
  

  // ✅ Authentication middleware for Socket.IO
  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to socket
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;
        
        console.log(`✅ User authenticated: ${socket.userEmail} (${socket.userRole})`);
        next();
        
      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  // ✅ Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.userEmail}`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // If admin, join admin room for system-wide updates
      if (socket.userRole === 'admin') {
        socket.join('admin_room');
      }

      // ============ SESSION MANAGEMENT ============
      
      // Join specific session room
      socket.on('join_session', (sessionId) => {
        socket.join(`session_${sessionId}`);
        console.log(`👥 User ${socket.userEmail} joined session ${sessionId}`);
        
        // Notify others in the session
        socket.to(`session_${sessionId}`).emit('user_joined_session', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          userRole: socket.userRole,
          timestamp: new Date()
        });
      });

      // Leave session room
      socket.on('leave_session', (sessionId) => {
        socket.leave(`session_${sessionId}`);
        console.log(`👋 User ${socket.userEmail} left session ${sessionId}`);
        
        // Notify others in the session
        socket.to(`session_${sessionId}`).emit('user_left_session', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          timestamp: new Date()
        });
      });

      // ============ PROVIDER AVAILABILITY ============
      
      // Provider updates their status
      socket.on('update_provider_status', (data) => {
        const { status, availableUntil } = data;
        
        // Broadcast to admin and relevant users
        this.io.to('admin_room').emit('provider_status_updated', {
          providerId: socket.userId,
          status,
          availableUntil,
          timestamp: new Date()
        });
        
        console.log(`🔄 Provider ${socket.userEmail} status: ${status}`);
      });

      // ============ DISCONNECTION ============
      
      socket.on('disconnect', () => {
        console.log(`🚪 Client disconnected: ${socket.userEmail}`);
      });
    });
  }

  // ============ BROADCAST METHODS ============

  // Broadcast session status update
  emitSessionStatusUpdate(sessionId, statusData) {
    console.log(`📡 Broadcasting session ${sessionId} status: ${statusData.status}`);
    
    this.io.to(`session_${sessionId}`).emit('session_status_update', {
      sessionId,
      ...statusData,
      timestamp: new Date()
    });

    // Also notify admins
    this.io.to('admin_room').emit('session_status_update', {
      sessionId,
      ...statusData,
      timestamp: new Date()
    });
  }

  // Broadcast appointment updates
  emitAppointmentUpdate(patientId, providerId, appointmentData) {
    // Notify patient
    this.io.to(`user_${patientId}`).emit('appointment_update', appointmentData);
    
    // Notify provider
    this.io.to(`user_${providerId}`).emit('appointment_update', appointmentData);
    
    // Notify admins
    this.io.to('admin_room').emit('appointment_update', appointmentData);
  }

  // Broadcast provider availability
  emitProviderAvailability(providerId, availabilityData) {
    this.io.emit('provider_availability_update', {
      providerId,
      ...availabilityData,
      timestamp: new Date()
    });
  }

  // Emergency broadcast to all users
  emitSystemAlert(message, type = 'info') {
    this.io.emit('system_alert', {
      message,
      type,
      timestamp: new Date()
    });
  }
}


module.exports = WebSocketService;
