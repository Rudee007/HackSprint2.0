// src/services/websocket.service.js (PRODUCTION-READY)
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

class WebSocketService {
  constructor(server) {
    console.log(
      "🔧 Initializing Enhanced WebSocket Service for Therapy Tracking..."
    );

    this.io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:3003",
          "http://localhost:5173",
          "http://localhost:5000",
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // ✅ Enhanced tracking with Maps
    this.connectedUsers = new Map(); // userId -> socket info
    this.activeSessions = new Map(); // sessionId -> session data
    this.sessionCountdowns = new Map(); // sessionId -> interval ID
    this.userSessions = new Map(); // userId -> sessionIds[]
    this.heartbeatIntervals = new Map(); // userId -> interval ID

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeatMonitor();

    console.log("✅ Enhanced WebSocket Service initialized successfully");
  }

  setupMiddleware() {
    console.log("🔧 Setting up WebSocket authentication middleware...");

    this.io.use((socket, next) => {
      console.log("🔐 === THERAPY TRACKING AUTH ===");
      console.log("🔐 Socket ID:", socket.id);

      const token = socket.handshake.auth.token;

      if (!token) {
        console.error("❌ Authentication failed: No token provided");
        return next(new Error("Authentication error: Token missing"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;

        console.log(
          "✅ Therapy Tracker Authentication successful:",
          decoded.id
        );
        next();
      } catch (err) {
        console.error("❌ JWT verification failed:", err.message);
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  setupEventHandlers() {
    console.log("🔧 Setting up Enhanced WebSocket event handlers...");

    this.io.on("connection", (socket) => {
      console.log("✅ === THERAPY TRACKER CLIENT CONNECTED ===");
      console.log("✅ Socket ID:", socket.id);
      console.log("✅ User:", socket.user?.id, socket.user?.name);

      // ✅ Track connected user with socket reference
      this.connectedUsers.set(socket.user.id, {
        socketId: socket.id,
        socket: socket, // Store socket reference
        userId: socket.user.id,
        name: socket.user.name,
        role: socket.user.role,
        connectedAt: new Date(),
        isActive: true,
        currentActivity: null,
        currentPatient: null,
        lastSeen: new Date(),
      });

      // Send initial connection data
      socket.emit("therapy_tracking_connected", {
        message: "Connected to Therapy Tracking System",
        socketId: socket.id,
        userId: socket.user.id,
        connectedUsers: Array.from(this.connectedUsers.values()).map((u) => ({
          userId: u.userId,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          currentActivity: u.currentActivity,
        })),
        activeSessions: Array.from(this.activeSessions.values()),
        timestamp: new Date().toISOString(),
      });

      // ✅ Subscribe to therapy tracking
      socket.on("subscribe_therapy_tracking", (data) => {
        console.log("📡 User subscribed to therapy tracking:", socket.user.id);
        socket.join("therapy_tracking");

        socket.emit("therapy_tracking_state", {
          connectedUsers: Array.from(this.connectedUsers.values()).map((u) => ({
            userId: u.userId,
            name: u.name,
            role: u.role,
            currentActivity: u.currentActivity,
            isActive: u.isActive,
          })),
          activeSessions: Array.from(this.activeSessions.values()),
          activeCountdowns: this.sessionCountdowns.size,
        });
      });

      // ✅ Join session room
      socket.on("join_session", (sessionId) => {
        console.log("🏠 User joined session:", sessionId);
        socket.join(`session_${sessionId}`);

        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.currentActivity = `Monitoring session ${sessionId}`;
          userData.lastSeen = new Date();
          this.connectedUsers.set(socket.user.id, userData);
        }

        // Track user's sessions
        if (!this.userSessions.has(socket.user.id)) {
          this.userSessions.set(socket.user.id, new Set());
        }
        this.userSessions.get(socket.user.id).add(sessionId);

        this.broadcastConnectedUsers();

        socket.to(`session_${sessionId}`).emit("user_joined_session", {
          userId: socket.user.id,
          userName: socket.user.name,
          role: socket.user.role,
          timestamp: new Date().toISOString(),
        });
      });

      // ✅ Leave session room
      socket.on("leave_session", (sessionId) => {
        console.log("🚪 User left session:", sessionId);
        socket.leave(`session_${sessionId}`);

        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.currentActivity = null;
          userData.currentPatient = null;
          this.connectedUsers.set(socket.user.id, userData);
        }

        // Remove from user's sessions
        if (this.userSessions.has(socket.user.id)) {
          this.userSessions.get(socket.user.id).delete(sessionId);
        }

        this.broadcastConnectedUsers();

        socket.to(`session_${sessionId}`).emit("user_left_session", {
          userId: socket.user.id,
          userName: socket.user.name,
          timestamp: new Date().toISOString(),
        });
      });

      // ✅ Update user activity
      socket.on("update_user_activity", (activityData) => {
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

      // ✅ Heartbeat/ping
      socket.on("ping", () => {
        const userData = this.connectedUsers.get(socket.user.id);
        if (userData) {
          userData.lastSeen = new Date();
          userData.isActive = true;
          this.connectedUsers.set(socket.user.id, userData);
        }
        socket.emit("pong", {
          timestamp: new Date().toISOString(),
          userId: socket.user.id,
        });
      });

      // ✅ Disconnect handling
      socket.on("disconnect", (reason) => {
        console.log("🚪 === CLIENT DISCONNECTED ===");
        console.log("🚪 Socket ID:", socket.id);
        console.log("🚪 User:", socket.user?.id);
        console.log("🚪 Reason:", reason);

        // Clean up user sessions
        if (this.userSessions.has(socket.user.id)) {
          const userSessionIds = this.userSessions.get(socket.user.id);
          userSessionIds.forEach((sessionId) => {
            socket.to(`session_${sessionId}`).emit("user_left_session", {
              userId: socket.user.id,
              userName: socket.user.name,
              reason: "disconnect",
              timestamp: new Date().toISOString(),
            });
          });
          this.userSessions.delete(socket.user.id);
        }

        // Remove from connected users
        this.connectedUsers.delete(socket.user.id);

        // Broadcast updated user list
        this.broadcastConnectedUsers();
      });
    });

    console.log("✅ Enhanced WebSocket event handlers setup complete");
  }

  // ✅ Start session countdown (NEW METHOD)
  startSessionCountdown(sessionId, durationMinutes) {
    // Clear existing countdown if any
    this.stopSessionCountdown(sessionId);

    let remainingSeconds = durationMinutes * 60;
    console.log(
      `⏰ Starting countdown for session ${sessionId}: ${durationMinutes} minutes (${remainingSeconds}s)`
    );

    const countdownInterval = setInterval(() => {
      remainingSeconds--;

      // Broadcast every 30 seconds or in last minute
      if (remainingSeconds % 30 === 0 || remainingSeconds <= 60) {
        this.io.to(`session_${sessionId}`).emit("countdown_update", {
          sessionId,
          remainingSeconds,
          remainingMinutes: Math.ceil(remainingSeconds / 60),
          timestamp: new Date().toISOString(),
        });

        console.log(`⏰ Session ${sessionId}: ${remainingSeconds}s remaining`);
      }

      // Session time ended
      if (remainingSeconds <= 0) {
        console.log(`⏰ Session ${sessionId} time ended`);
        this.stopSessionCountdown(sessionId);

        this.io.to(`session_${sessionId}`).emit("session_time_ended", {
          sessionId,
          message: "Estimated session time has ended",
          timestamp: new Date().toISOString(),
        });

        this.io.to("therapy_tracking").emit("session_time_alert", {
          sessionId,
          message: `Session ${sessionId} has exceeded estimated duration`,
          timestamp: new Date().toISOString(),
        });
      }
    }, 1000);

    // Store interval
    this.sessionCountdowns.set(sessionId, countdownInterval);

    // Also broadcast to therapy tracking
    this.io.to("therapy_tracking").emit("countdown_started", {
      sessionId,
      durationMinutes,
      remainingSeconds,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ Stop session countdown (NEW METHOD)
  stopSessionCountdown(sessionId) {
    const interval = this.sessionCountdowns.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.sessionCountdowns.delete(sessionId);
      console.log(`⏰ Stopped countdown for session ${sessionId}`);

      // Notify subscribers
      this.io.to(`session_${sessionId}`).emit("countdown_stopped", {
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ✅ Session status update
  emitSessionStatusUpdate(sessionId, updateData) {
    console.log(
      "📡 Broadcasting session update:",
      sessionId,
      updateData.status || updateData.type
    );

    // Update cache
    if (updateData.status === "in_progress") {
      this.activeSessions.set(sessionId, {
        id: sessionId,
        ...updateData,
        lastUpdate: new Date(),
      });
    } else if (["completed", "cancelled"].includes(updateData.status)) {
      this.activeSessions.delete(sessionId);
    }

    // Broadcast to therapy tracking subscribers
    this.io.to("therapy_tracking").emit("session_status_update", {
      sessionId,
      ...updateData,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to specific session room
    this.io.to(`session_${sessionId}`).emit("session_update", {
      sessionId,
      ...updateData,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ Milestone achievement
  emitMilestoneAchieved(patientId, milestoneData) {
    console.log("🏆 Broadcasting milestone:", patientId);
    this.io.to("therapy_tracking").emit("milestone_achieved", {
      patientId,
      milestone: milestoneData,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ Therapy tracking update
  emitTherapyTrackingUpdate(eventType, data) {
    console.log("📡 Broadcasting therapy update:", eventType);
    this.io.to("therapy_tracking").emit("therapy_tracking_update", {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // backend/services/websocket/websocketService.js

  // Emit to all admins
  emitToAdmins(event, data) {
    this.io.to("admin-room").emit(event, data);
    console.log(`📡 Emitted ${event} to all admins`);
  }

  // New patient registered
  notifyNewPatient(patientData) {
    this.emitToAdmins("new_patient_registered", {
      patientId: patientData._id,
      patientName: patientData.name,
      registeredAt: new Date(),
      totalPatients: patientData.totalPatients,
    });
  }

  // New appointment booked
  notifyNewAppointment(appointmentData) {
    this.emitToAdmins("new_appointment_booked", {
      appointmentId: appointmentData._id,
      patientName: appointmentData.patientName,
      therapyType: appointmentData.therapyType,
      scheduledAt: appointmentData.scheduledAt,
      fee: appointmentData.fee,
    });
  }

  // Session status changed
  notifySessionStatus(sessionData) {
    this.emitToAdmins("session_status_update", {
      sessionId: sessionData._id,
      status: sessionData.status,
      patientName: sessionData.patientName,
      therapyType: sessionData.therapyType,
    });
  }

  // ✅ Connected users broadcast
  broadcastConnectedUsers() {
    const users = Array.from(this.connectedUsers.values()).map((u) => ({
      userId: u.userId,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      currentActivity: u.currentActivity,
      lastSeen: u.lastSeen,
    }));

    this.io.to("therapy_tracking").emit("connected_users_update", {
      users,
      totalCount: users.length,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ Heartbeat monitor for connection health
  startHeartbeatMonitor() {
    console.log("💓 Starting heartbeat monitor...");

    setInterval(() => {
      const now = new Date();
      const timeout = 2 * 60 * 1000; // 2 minutes

      this.connectedUsers.forEach((userData, userId) => {
        const timeSinceLastSeen = now - userData.lastSeen;

        if (timeSinceLastSeen > timeout && userData.isActive) {
          console.log(
            `⚠️ User ${userId} appears inactive (${Math.round(
              timeSinceLastSeen / 1000
            )}s)`
          );
          userData.isActive = false;
          this.connectedUsers.set(userId, userData);
          this.broadcastConnectedUsers();
        }
      });
    }, 30000); // Check every 30 seconds
  }

  // ✅ System state
  getSystemState() {
    return {
      connectedUsers: Array.from(this.connectedUsers.values()).map((u) => ({
        userId: u.userId,
        name: u.name,
        role: u.role,
        currentActivity: u.currentActivity,
        isActive: u.isActive,
        lastSeen: u.lastSeen,
      })),
      activeSessions: Array.from(this.activeSessions.values()),
      totalConnections: this.connectedUsers.size,
      activeCountdowns: this.sessionCountdowns.size,
      userSessions: this.userSessions.size,
    };
  }

  // ✅ Cleanup on shutdown
  cleanup() {
    console.log("🧹 Cleaning up WebSocket service...");

    // Clear all countdowns
    this.sessionCountdowns.forEach((interval, sessionId) => {
      clearInterval(interval);
      console.log(`⏰ Cleared countdown for session ${sessionId}`);
    });

    // Notify all connected users
    this.io.emit("server_shutdown", {
      message: "Server is shutting down",
      timestamp: new Date().toISOString(),
    });

    // Clear all maps
    this.sessionCountdowns.clear();
    this.activeSessions.clear();
    this.connectedUsers.clear();
    this.userSessions.clear();
    this.heartbeatIntervals.clear();

    console.log("✅ WebSocket cleanup complete");
  }


  emitVitalsUpdate(sessionId, data) {
    console.log('💓 [WS] Broadcasting vitals update for session:', sessionId);
    
    const payload = {
      sessionId,
      vitals: data.vitals || data,
      updatedBy: data.updatedBy || 'Therapist',
      timestamp: new Date().toISOString()
    };
    
    // Emit to session-specific room
    this.io.to(`session_${sessionId}`).emit('vitals_update', payload);
    
    // Emit to therapy tracking room
    this.io.to('therapy_tracking').emit('vitals_update', payload);
    
    console.log('✅ [WS] Vitals update sent to rooms');
  }

  /**
   * Emit progress update for a session
   * @param {string} sessionId - The session ID
   * @param {object} data - Progress data including stage, percentage, notes
   */
  emitProgressUpdate(sessionId, data) {
    console.log('📈 [WS] Broadcasting progress update for session:', sessionId);
    
    const payload = {
      sessionId,
      progress: {
        stage: data.stage,
        percentage: data.percentage || 0,
        notes: data.notes || ''
      },
      updatedBy: data.updatedBy || 'Therapist',
      timestamp: new Date().toISOString()
    };
    
    // Emit to session-specific room
    this.io.to(`session_${sessionId}`).emit('progress_update', payload);
    
    // Emit to therapy tracking room
    this.io.to('therapy_tracking').emit('progress_update', payload);
    
    console.log('✅ [WS] Progress update sent to rooms');
  }

  /**
   * Emit note added to session
   * @param {string} sessionId - The session ID
   * @param {object} data - Note data
   */
  emitNoteAdded(sessionId, data) {
    console.log('📝 [WS] Broadcasting note added for session:', sessionId);
    
    const payload = {
      sessionId,
      note: {
        content: data.note || data.content,
        category: data.category || 'general',
        addedBy: data.addedByName || data.addedBy || 'Therapist'
      },
      timestamp: new Date().toISOString()
    };
    
    // Emit to session-specific room
    this.io.to(`session_${sessionId}`).emit('note_added', payload);
    
    // Emit to therapy tracking room
    this.io.to('therapy_tracking').emit('note_added', payload);
    
    console.log('✅ [WS] Note added sent to rooms');
  }

  /**
   * Emit adverse effect reported
   * @param {string} sessionId - The session ID
   * @param {object} data - Adverse effect data
   */
  emitAdverseEffectReported(sessionId, data) {
    console.log('⚠️ [WS] Broadcasting adverse effect for session:', sessionId);
    
    const payload = {
      sessionId,
      adverseEffect: {
        effect: data.effect,
        severity: data.severity,
        description: data.description || '',
        actionTaken: data.actionTaken || '',
        reportedBy: data.reportedByName || data.reportedBy || 'Therapist'
      },
      priority: data.severity === 'critical' || data.severity === 'severe' ? 'high' : 'normal',
      timestamp: new Date().toISOString()
    };
    
    // Emit to session-specific room
    this.io.to(`session_${sessionId}`).emit('adverse_effect_reported', payload);
    
    // Emit HIGH PRIORITY alert to therapy tracking
    this.io.to('therapy_tracking').emit('adverse_effect_alert', {
      ...payload,
      requiresAttention: ['critical', 'severe', 'high'].includes(data.severity)
    });
    
    console.log(`✅ [WS] Adverse effect alert sent (Priority: ${payload.priority})`);
  }

  emitSessionNote(sessionId, data) {
    console.log('📝 [WS] emitSessionNote (alias) called for session:', sessionId);
    // Just call the main method
    return this.emitNoteAdded(sessionId, data);
  }
}

module.exports = WebSocketService;
