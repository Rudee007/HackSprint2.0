// src/services/websocket.service.js (Updated)
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

class WebSocketService {
  constructor(server) {
    console.log('🔧 Initializing Enhanced WebSocket Service for Therapy Tracking...');
    
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173', 
          'http://localhost:5000'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization']
      },
      transports: ['websocket', 'polling']
    });

    // ✅ Track connected users and active sessions
    this.connectedUsers = new Map(); // userId -> socket info
    this.activeSessions = new Map(); // sessionId -> session data
    this.userSessions = new Map(); // userId -> sessionIds[]
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ Enhanced WebSocket Service initialized successfully');
  }

  setupMiddleware() {
    console.log('🔧 Setting up WebSocket authentication middleware...');
    
    this.io.use((socket, next) => {
      console.log('🔐 === THERAPY TRACKING AUTH ===');
      console.log('🔐 Socket ID:', socket.id);
      
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('❌ Authentication failed: No token provided');
        return next(new Error('Authentication error: Token missing'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        
        console.log('✅ Therapy Tracker Authentication successful:', decoded.id);
        next();
      } catch (err) {
        console.error('❌ JWT verification failed:', err.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    console.log('🔧 Setting up Enhanced WebSocket event handlers...');
    
    this.io.on('connection', (socket) => {
      console.log('✅ === THERAPY TRACKER CLIENT CONNECTED ===');
      console.log('✅ Socket ID:', socket.id);
      console.log('✅ User:', socket.user?.id);

      // ✅ Track connected user
      this.connectedUsers.set(socket.user.id, {
        socketId: socket.id,
        userId: socket.user.id,
        name: socket.user.name,
        role: socket.user.role,
        connectedAt: new Date(),
        isActive: true,
        currentActivity: null,
        currentPatient: null
      });

      // Send initial connection data
      socket.emit('therapy_tracking_connected', {
        message: 'Connected to Therapy Tracking System',
        socketId: socket.id,
        connectedUsers: Array.from(this.connectedUsers.values()),
        activeSessions: Array.from(this.activeSessions.values()),
        timestamp: new Date().toISOString()
      });

      // ✅ NEW: Subscribe to therapy tracking updates
      socket.on('subscribe_therapy_tracking', (data) => {
        console.log('📡 User subscribed to therapy tracking:', socket.user.id);
        socket.join('therapy_tracking');
        
        // Send current system state
        socket.emit('therapy_tracking_state', {
          connectedUsers: Array.from(this.connectedUsers.values()),
          activeSessions: Array.from(this.activeSessions.values()),
          upcomingSessions: [], // Will be populated from database
          milestones: {} // Will be populated from database
        });
      });

      // ✅ NEW: Join specific session room
      socket.on('join_session', (sessionId) => {
        console.log('🏠 User joined session room:', sessionId, 'User:', socket.user.id);
        socket.join(`session_${sessionId}`);
        
        // Update user's current activity
        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.currentActivity = `Monitoring session ${sessionId}`;
          this.connectedUsers.set(socket.user.id, userData);
        }
        
        // Notify others in the room
        socket.to(`session_${sessionId}`).emit('user_joined_session', {
          userId: socket.user.id,
          userName: socket.user.name,
          role: socket.user.role,
          timestamp: new Date().toISOString()
        });
        
        // Broadcast updated user list
        this.broadcastConnectedUsers();
      });

      // ✅ NEW: Leave session room
      socket.on('leave_session', (sessionId) => {
        console.log('🚪 User left session room:', sessionId, 'User:', socket.user.id);
        socket.leave(`session_${sessionId}`);
        
        // Update user activity
        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.currentActivity = null;
          userData.currentPatient = null;
          this.connectedUsers.set(socket.user.id, userData);
        }
        
        // Notify others
        socket.to(`session_${sessionId}`).emit('user_left_session', {
          userId: socket.user.id,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });
        
        this.broadcastConnectedUsers();
      });

      // ✅ NEW: Update user presence/activity
      socket.on('update_user_activity', (activityData) => {
        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.currentActivity = activityData.activity;
          userData.currentPatient = activityData.patientName;
          userData.lastSeen = new Date();
          userData.isActive = true;
          this.connectedUsers.set(socket.user.id, userData);
          
          this.broadcastConnectedUsers();
        }
      });

      // ✅ Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log('🚪 === THERAPY TRACKER CLIENT DISCONNECTED ===');
        console.log('🚪 Socket ID:', socket.id);
        console.log('🚪 User:', socket.user?.id);
        console.log('🚪 Reason:', reason);
        
        // Remove from connected users
        this.connectedUsers.delete(socket.user.id);
        
        // Broadcast updated user list
        this.broadcastConnectedUsers();
      });

      // Existing handlers...
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });

    console.log('✅ Enhanced WebSocket event handlers setup complete');
  }

  // ✅ NEW: Broadcast real-time therapy tracking updates
  emitTherapyTrackingUpdate(eventType, data) {
    console.log('📡 Broadcasting therapy tracking update:', eventType);
    this.io.to('therapy_tracking').emit('therapy_tracking_update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ NEW: Session-specific updates
  emitSessionStatusUpdate(sessionId, updateData) {
    console.log('📡 Broadcasting session status update:', sessionId);
    
    // Update active sessions cache
    if (updateData.status === 'in_progress') {
      this.activeSessions.set(sessionId, {
        id: sessionId,
        ...updateData,
        participants: updateData.participants || []
      });
    } else if (updateData.status === 'completed' || updateData.status === 'cancelled') {
      this.activeSessions.delete(sessionId);
    }

    // Broadcast to all therapy tracking subscribers
    this.io.to('therapy_tracking').emit('session_status_update', {
      sessionId,
      ...updateData,
      timestamp: new Date().toISOString()
    });

    // Broadcast to specific session room
    this.io.to(`session_${sessionId}`).emit('session_update', {
      sessionId,
      ...updateData,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ NEW: Milestone achievement broadcast
  emitMilestoneAchieved(patientId, milestoneData) {
    console.log('🏆 Broadcasting milestone achieved:', patientId);
    this.io.to('therapy_tracking').emit('milestone_achieved', {
      patientId,
      milestone: milestoneData,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ NEW: Connected users broadcast
  broadcastConnectedUsers() {
    const connectedUsersArray = Array.from(this.connectedUsers.values());
    this.io.to('therapy_tracking').emit('connected_users_update', {
      users: connectedUsersArray,
      totalCount: connectedUsersArray.length,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ NEW: Get current system state
  getSystemState() {
    return {
      connectedUsers: Array.from(this.connectedUsers.values()),
      activeSessions: Array.from(this.activeSessions.values()),
      totalConnections: this.connectedUsers.size
    };
  }
}

module.exports = WebSocketService;
