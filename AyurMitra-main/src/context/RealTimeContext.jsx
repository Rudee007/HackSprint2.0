// context/RealTimeContext.jsx (FIXED)
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import websocketService from "../services/websocketService";
import { useAuth } from "./AuthContext";

const RealTimeContext = createContext();

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error("useRealTime must be used within a RealTimeProvider");
  }
  return context;
};

export const RealTimeProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
  });
  const [notifications, setNotifications] = useState([]);
  const [activeSessions, setActiveSessions] = useState(new Map());
  const [providerStatus, setProviderStatus] = useState("offline");
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionParticipants, setSessionParticipants] = useState([]);
  const [sessionCountdown, setSessionCountdown] = useState(null);

  const { user, isAuthenticated, token } = useAuth();

  // ✅ FIXED: Get token with admin support
  const getAuthToken = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    const adminToken = localStorage.getItem('adminToken');
    const authToken = accessToken || adminToken || token;
    
    console.log('🔍 Getting auth token:', {
      accessToken: !!accessToken,
      adminToken: !!adminToken,
      contextToken: !!token,
      final: !!authToken
    });
    
    return authToken;
  }, [token]);

  // ✅ Check WebSocket status immediately on mount
  useEffect(() => {
    const checkInitialConnection = () => {
      const currentStatus = websocketService.getConnectionStatus();
      const authToken = getAuthToken();
      
      console.log("🔍 Initial WebSocket status check:", {
        ...currentStatus,
        hasToken: !!authToken,
        isAuthenticated
      });

      if (currentStatus.connected) {
        console.log("✅ WebSocket already connected, updating UI");
        setConnectionStatus({ connected: true });
      }
    };

    checkInitialConnection();

    // Check periodically
    const interval = setInterval(checkInitialConnection, 10000);

    return () => clearInterval(interval);
  }, [getAuthToken, isAuthenticated]);

  // ✅ FIXED: Auto-connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !connectionStatus.connected) {
      const authToken = getAuthToken();
      
      console.log('🔄 Auto-connect check:', {
        isAuthenticated,
        hasToken: !!authToken,
        connected: connectionStatus.connected
      });
      
      if (authToken) {
        console.log("🔄 Initializing WebSocket from useEffect...");
        initializeWebSocket(authToken);
      } else {
        console.warn('⚠️ User authenticated but no token found');
      }
    }

    return () => {
      if (connectionStatus.connected) {
        console.log('🧹 Cleaning up WebSocket connection');
        websocketService.disconnect();
      }
    };
  }, [isAuthenticated, connectionStatus.connected, getAuthToken]);

  // ✅ Handle token refresh
  useEffect(() => {
    if (isAuthenticated && token && connectionStatus.connected) {
      console.log('🔄 Token changed, refreshing WebSocket connection');
      websocketService.refreshConnection?.();
    }
  }, [token, isAuthenticated, connectionStatus.connected]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async (authToken) => {
    try {
      console.log("🔄 RealTimeContext: Initializing WebSocket...");
      console.log("🔑 Using token:", authToken ? `${authToken.substring(0, 20)}...` : 'NONE');
      
      await websocketService.connect(authToken);
      setupEventHandlers();

      // ✅ FORCE UI UPDATE after connection
      setTimeout(() => {
        const status = websocketService.getConnectionStatus();
        console.log("🔄 Force updating connection status:", status);
        setConnectionStatus({ connected: status.connected });
      }, 1000);
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket:", error);
      addNotification("Failed to connect to real-time services", "error");
    }
  }, []);

  // Setup event handlers
  const setupEventHandlers = useCallback(() => {
    console.log("🔧 RealTimeContext: Setting up event handlers...");

    // Listen for connection status updates
    websocketService.addEventListener("connection_status", (status) => {
      console.log("📡 RealTimeContext: Connection status event received:", status);
      setConnectionStatus(status);
    });

    // Listen to native Socket.IO events
    const socket = websocketService.socket;
    if (socket) {
      socket.on("connect", () => {
        console.log("✅ RealTimeContext: Socket connected event");
        setConnectionStatus({ connected: true });
        addNotification("Connected to real-time services", "success");
      });

      socket.on("disconnect", (reason) => {
        console.log("🚪 RealTimeContext: Socket disconnected event:", reason);
        setConnectionStatus({ connected: false, reason });
        addNotification("Disconnected from real-time services", "warning");
      });

      socket.on("connect_error", (error) => {
        console.error("❌ RealTimeContext: Socket connection error:", error);
        setConnectionStatus({ connected: false, error: error.message });
        addNotification("Connection error: " + error.message, "error");
      });
    }

    // Auth error handler
    websocketService.addEventListener("auth_error", handleAuthError);

    // Session event handlers
    websocketService.addEventListener("session_status_update", handleSessionUpdate);
    websocketService.addEventListener("user_joined_session", handleUserJoined);
    websocketService.addEventListener("user_left_session", handleUserLeft);

    // Provider event handlers
    websocketService.addEventListener("provider_status_updated", handleProviderStatusUpdate);
    websocketService.addEventListener("provider_availability_update", handleProviderAvailability);

    // System event handlers
    websocketService.addEventListener("system_alert", handleSystemAlert);
    websocketService.addEventListener("appointment_update", handleAppointmentUpdate);
    websocketService.addEventListener("feedback_submitted", handleFeedbackUpdate);
    websocketService.addEventListener("critical_feedback_alert", handleCriticalFeedback);

    console.log("✅ RealTimeContext: Event handlers setup complete");
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback((error) => {
    console.log("🔐 Authentication error:", error);
    addNotification("Session expired. Please login again.", "error");
    websocketService.disconnect();
    setConnectionStatus({ connected: false, error: "Authentication failed" });
  }, []);

  const handleSessionUpdate = useCallback((data) => {
    console.log("📡 Session update received:", data);
    setActiveSessions((prev) => {
      const updated = new Map(prev);
      updated.set(data.sessionId, { ...updated.get(data.sessionId), ...data });
      return updated;
    });

    if (data.type === "countdown_update") {
      setSessionCountdown({
        sessionId: data.sessionId,
        remainingSeconds: data.remainingSeconds,
        remainingMinutes: data.remainingMinutes,
      });
    }

    if (data.type === "session_time_ended") {
      addNotification(`Session ${data.sessionId} time has ended`, "warning");
      setSessionCountdown(null);
    }

    if (data.type === "participant_joined" && data.participant) {
      addNotification(`${data.participant.name} joined the session`, "info");
    }
  }, []);

  const handleUserJoined = useCallback((data) => {
    console.log("👥 User joined session:", data);
    setSessionParticipants((prev) => {
      const exists = prev.some((p) => p.userId === data.userId);
      if (!exists) {
        return [...prev, data];
      }
      return prev;
    });
    addNotification(`${data.userEmail} joined the session`, "info");
  }, []);

  const handleUserLeft = useCallback((data) => {
    console.log("👋 User left session:", data);
    setSessionParticipants((prev) =>
      prev.filter((p) => p.userId !== data.userId)
    );
    addNotification(`${data.userEmail} left the session`, "info");
  }, []);

  const handleProviderStatusUpdate = useCallback(
    (data) => {
      console.log("🔄 Provider status updated:", data);
      if (data.providerId === user?.id) {
        setProviderStatus(data.status);
      }
      addNotification(`Provider status updated to ${data.status}`, "info");
    },
    [user?.id]
  );

  const handleProviderAvailability = useCallback((data) => {
    console.log("📅 Provider availability updated:", data);
    addNotification("Provider availability updated", "info");
  }, []);

  const handleSystemAlert = useCallback((alert) => {
    console.log("🚨 System alert:", alert);
    addNotification(alert.message, alert.type || "info");
  }, []);

  const handleAppointmentUpdate = useCallback((data) => {
    console.log("📋 Appointment update:", data);
    addNotification("Appointment updated", "info");
  }, []);

  const handleFeedbackUpdate = useCallback((data) => {
    console.log("📝 Feedback submitted:", data);
    addNotification("Patient feedback received", "info");
  }, []);

  const handleCriticalFeedback = useCallback((data) => {
    console.log("🚨 Critical feedback alert:", data);
    addNotification("Critical patient feedback requires attention!", "error");
  }, []);

  // Utility functions
  const addNotification = useCallback((message, type = "info") => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev.slice(0, 19)]);

    if (type !== "error") {
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 10000);
    }
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Session management functions
  const joinSession = useCallback((sessionId) => {
    if (websocketService.joinSession(sessionId)) {
      setCurrentSession(sessionId);
      return true;
    }
    return false;
  }, []);

  const leaveSession = useCallback(
    (sessionId) => {
      if (websocketService.leaveSession(sessionId)) {
        if (currentSession === sessionId) {
          setCurrentSession(null);
          setSessionParticipants([]);
          setSessionCountdown(null);
        }
        return true;
      }
      return false;
    },
    [currentSession]
  );

  const updateProviderStatusHandler = useCallback(
    (status, availableUntil = null) => {
      if (websocketService.updateProviderStatus(status, availableUntil)) {
        setProviderStatus(status);
        return true;
      }
      return false;
    },
    []
  );

  // Context value
  const contextValue = {
    // Connection status
    connectionStatus,
    isConnected: connectionStatus.connected,

    // User information
    currentUser: user,
    isAuthenticated,
    token: getAuthToken(), // ✅ Use function to get latest token

    // Notifications
    notifications,
    unreadNotifications: notifications.filter((n) => !n.read),
    addNotification,
    removeNotification,
    markNotificationAsRead,
    clearAllNotifications,

    // Session management
    activeSessions,
    currentSession,
    sessionParticipants,
    sessionCountdown,
    joinSession,
    leaveSession,

    // Provider status
    providerStatus,
    updateProviderStatus: updateProviderStatusHandler,

    // WebSocket service reference
    websocketService,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};
