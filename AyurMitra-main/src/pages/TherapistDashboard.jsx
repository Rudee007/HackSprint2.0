// src/pages/TherapistDashboard.jsx - COMPLETE REWRITE (schema- and service-aligned)
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  User,
  MessageCircle,
  Calendar,
  Settings,
  Plus,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Loader2,
  LogOut,
  Eye,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  Award,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Zap,
  WifiOff,
  Bell,
  Circle,
  Monitor,
  BarChart3,
  Stethoscope,
  Activity,
  PhoneCall,
  Video,
  FileText
} from "lucide-react";

import therapistApiService from "../services/therapistApiService";
import TherapistProfileSettings from "../components/TherapistProfileSettings";
import MyPatients from "../components/MyPatients";
import FeedbackAnalyticsDashboard from "../components/FeedbackAnalyticsDashboard";
import FeedbackList from "../components/FeedbackList";
import RealtimeSessionAnalytics from "../components/RealtimeSessionAnalytics";
import RealtimeSessionList from "../components/RealtimeSessionList";
import { toast, Toaster } from "react-hot-toast";

// Optional stub for live tracking panel if you have a dedicated component
const LiveTrackingPanel = ({ session, onUpdate }) => null;

// ═══════════════════════════════════════════════════════════
// 🎨 HELPER FUNCTIONS (STYLES)
// ═══════════════════════════════════════════════════════════

const getActiveNavStyles = (color) => {
  const colorMap = {
    emerald:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
    rose: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
    purple:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
    amber:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg",
    teal: "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg"
  };
  return colorMap[color] || colorMap.emerald;
};

const getInactiveNavStyles = (color) => {
  const colorMap = {
    emerald:
      "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
    rose: "text-slate-600 hover:bg-rose-50 hover:text-rose-700",
    blue: "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
    purple:
      "text-slate-600 hover:bg-purple-50 hover:text-purple-700",
    amber: "text-slate-600 hover:bg-amber-50 hover:text-amber-700",
    teal: "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
  };
  return colorMap[color] || colorMap.emerald;
};

const getActiveDesktopNavStyles = (color) => {
  const colorMap = {
    emerald:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl scale-105",
    rose: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xl scale-105",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105",
    purple:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl scale-105",
    amber:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl scale-105",
    teal: "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl scale-105"
  };
  return colorMap[color] || colorMap.emerald;
};

const getInactiveDesktopNavStyles = (color) => {
  const colorMap = {
    emerald:
      "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-102",
    rose: "text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:scale-102",
    blue: "text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:scale-102",
    purple:
      "text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:scale-102",
    amber: "text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:scale-102",
    teal: "text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:scale-102"
  };
  return colorMap[color] || colorMap.emerald;
};

const getStatBgGradient = (color) => {
  const colorMap = {
    emerald:
      "bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-50",
    rose: "bg-gradient-to-br from-rose-50 via-rose-100 to-pink-50",
    blue: "bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50",
    purple:
      "bg-gradient-to-br from-purple-50 via-purple-100 to-violet-50",
    amber: "bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-50",
    teal: "bg-gradient-to-br from-teal-50 via-teal-100 to-cyan-50"
  };
  return colorMap[color] || colorMap.emerald;
};

const getStatTextColor = (color) => {
  const colorMap = {
    emerald: "text-emerald-700",
    rose: "text-rose-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
    teal: "text-teal-700"
  };
  return colorMap[color] || colorMap.emerald;
};

const getStatValueColor = (color) => {
  const colorMap = {
    emerald: "text-emerald-900",
    rose: "text-rose-900",
    blue: "text-blue-900",
    purple: "text-purple-900",
    amber: "text-amber-900",
    teal: "text-teal-900"
  };
  return colorMap[color] || colorMap.emerald;
};

const getStatIconBg = (color) => {
  const colorMap = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    teal: "bg-teal-500"
  };
  return colorMap[color] || colorMap.emerald;
};

// ═══════════════════════════════════════════════════════════
// 🔥 FEEDBACK ANALYTICS HELPER
// ═══════════════════════════════════════════════════════════

const buildFeedbackAnalytics = (feedback, averageRatings, pagination) => {
  const items = feedback || [];

  const ratings = items
    .map((fb) => fb?.ratings?.overallSatisfaction)
    .filter((r) => typeof r === "number");

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

  const ratingDistribution = {
    5: ratings.filter((r) => r === 5).length,
    4: ratings.filter((r) => r === 4).length,
    3: ratings.filter((r) => r === 3).length,
    2: ratings.filter((r) => r === 2).length,
    1: ratings.filter((r) => r === 1).length
  };

  const totalFeedback =
    pagination?.totalFeedback || items.length || 0;

  const positivePercentage =
    totalFeedback > 0
      ? (ratings.filter((r) => r >= 4).length / totalFeedback) * 100
      : 0;

  return {
    feedback: items,
    averageRatings:
      averageRatings || {
        avgOverall: averageRating,
        avgEffectiveness: 0,
        avgCare: 0
      },
    pagination:
      pagination || {
        currentPage: 1,
        totalPages: 1,
        totalFeedback,
        hasNextPage: false,
        hasPrevPage: false
      },
    analytics: {
      totalFeedback,
      averageRating,
      positivePercentage,
      ratingDistribution
    }
  };
};

// ═══════════════════════════════════════════════════════════
// 🔥 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const TherapistDashboard = () => {
  const navigate = useNavigate();

  // Refs
  const dataLoadedOnce = useRef(false);
  const websocketInitialized = useRef(false);

  // UI State
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data State
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    activeSessions: 0,
    scheduledSessions: 0,
    averageRating: 0,
    totalFeedback: 0
  });

  const [feedbackState, setFeedbackState] = useState({
    feedback: [],
    averageRatings: {
      avgOverall: 0,
      avgEffectiveness: 0,
      avgCare: 0
    },
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalFeedback: 0,
      hasNextPage: false,
      hasPrevPage: false
    },
    analytics: {
      totalFeedback: 0,
      averageRating: 0,
      positivePercentage: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  });

  // ═══════════════════════════════════════════════════════════
  // 🔥 AUTH CHECK
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        toast.error("Please login first");
        setTimeout(() => navigate("/therapist-login"), 1500);
        return false;
      }

      return true;
    };

    checkAuth();
  }, [navigate]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 WEBSOCKET INIT
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    const initWebSocket = async () => {
      if (websocketInitialized.current) return;

      try {
        websocketInitialized.current = true;
        const success =
          await therapistApiService.initializeWebSocket();
        setIsConnected(success);

        if (success) {
          toast.success("🔴 LIVE - Real-time connected!");
        }
      } catch (err) {
        console.error("WebSocket init failed:", err);
        setIsConnected(false);
      }
    };

    initWebSocket();

    return () => {
      therapistApiService.disconnectWebSocket();
      websocketInitialized.current = false;
    };
  }, []);

  // Keep activeSession in sync with dashboardData
  useEffect(() => {
    const active = dashboardData?.activeSessions?.[0];
    setActiveSession(active || null);
  }, [dashboardData]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOAD DASHBOARD DATA (PROFILE + METRICS + FEEDBACK)
// ═══════════════════════════════════════════════════════════

  useEffect(() => {
    const loadDashboardData = async () => {
      if (dataLoadedOnce.current) return;

      try {
        setLoading(true);
        setError(null);

        // Profile (Therapist + populated userId)
        const profileRes =
          await therapistApiService.getTherapistProfile();
        if (!profileRes.success || !profileRes.data) {
          throw new Error("Failed to load profile");
        }
        setTherapistProfile(profileRes.data);

        // Dashboard overview
        const dashboardRes =
          await therapistApiService.getDashboardOverview();
        if (dashboardRes.success) {
          setDashboardData(dashboardRes.data);
          setTodaysSessions(
            dashboardRes.data?.todaysSessions || []
          );
        }

        // Assigned patients
        const patientsRes =
          await therapistApiService.getAssignedPatients();
        if (patientsRes.success) {
          setAssignedPatients(
            patientsRes.data?.patients || []
          );
        }

        // Stats
        const statsRes =
          await therapistApiService.getTherapistStats("30d");
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        // Feedback (provider-scoped)
        const feedbackRes =
          await therapistApiService.getTherapistFeedback({
            page: 1,
            limit: 10,
            timeRange: "3months"
          });

        if (feedbackRes.success && feedbackRes.data) {
          const {
            feedback,
            averageRatings,
            pagination
          } = feedbackRes.data;
          const built = buildFeedbackAnalytics(
            feedback,
            averageRatings,
            pagination
          );
          setFeedbackState(built);
        } else {
          setFeedbackState(
            buildFeedbackAnalytics([], null, {
              currentPage: 1,
              totalPages: 0,
              totalFeedback: 0
            })
          );
        }

        dataLoadedOnce.current = true;
        toast.success("Dashboard loaded successfully!");
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard");
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔥 REFRESH HELPERS
  // ═══════════════════════════════════════════════════════════

  const handleRefreshSessions = useCallback(async () => {
    try {
      const res =
        await therapistApiService.getDashboardOverview();
      if (res.success) {
        setDashboardData(res.data);
        setTodaysSessions(res.data?.todaysSessions || []);
        const active = res.data?.activeSessions?.[0];
        setActiveSession(active || null);
        toast.success("Sessions refreshed");
      } else {
        toast.error("Failed to refresh sessions");
      }
    } catch (err) {
      console.error("Refresh sessions error:", err);
      toast.error("Failed to refresh sessions");
    }
  }, []);

  const refreshFeedback = useCallback(async () => {
    try {
      const res =
        await therapistApiService.getTherapistFeedback({
          page: feedbackState.pagination.currentPage || 1,
          limit: 10,
          timeRange: "3months"
        });

      if (res.success && res.data) {
        const {
          feedback,
          averageRatings,
          pagination
        } = res.data;
        const built = buildFeedbackAnalytics(
          feedback,
          averageRatings,
          pagination
        );
        setFeedbackState(built);
        toast.success("Feedback refreshed");
      } else {
        toast.error(
          res.error || "Failed to refresh feedback"
        );
      }
    } catch (err) {
      console.error("Refresh feedback error:", err);
      toast.error("Failed to refresh feedback");
    }
  }, [feedbackState.pagination.currentPage]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleNavClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
  }, []);

  const handleTrackLive = useCallback(
    (sessionId) => {
      if (!sessionId) {
        toast.error("Invalid session ID");
        return;
      }
      toast("🔴 Opening live tracking...", {
        icon: "🔴",
        duration: 1500
      });
      navigate(`/therapist/track-live/${sessionId}`);
    },
    [navigate]
  );

  const handleStartSession = async (sessionId) => {
    try {
      const res = await therapistApiService.startSession(
        sessionId,
        "Session started"
      );
      if (res.success) {
        toast.success("🔴 LIVE - Session started");
        const sessionsRes =
          await therapistApiService.getTodaySessions();
        if (sessionsRes.success) {
          setTodaysSessions(
            sessionsRes.data?.sessions || []
          );
        }
      } else {
        toast.error(
          res.error || "Failed to start session"
        );
      }
    } catch (err) {
      console.error("Start session error:", err);
      toast.error("Failed to start session");
    }
  };

  const handleCompleteSession = async (
    sessionId,
    sessionData
  ) => {
    try {
      const res =
        await therapistApiService.completeSession(
          sessionId,
          sessionData
        );
      if (res.success) {
        toast.success("Session completed");
        const [sessionsRes, statsRes] =
          await Promise.all([
            therapistApiService.getTodaySessions(),
            therapistApiService.getTherapistStats("30d")
          ]);
        if (sessionsRes.success) {
          setTodaysSessions(
            sessionsRes.data?.sessions || []
          );
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } else {
        toast.error(
          res.error || "Failed to complete session"
        );
      }
    } catch (err) {
      console.error("Complete session error:", err);
      toast.error("Failed to complete session");
    }
  };

  // Profile update (non-availability)
  const handleUpdateProfile = async (formData) => {
    try {
      const therapistId = therapistProfile?._id;
      if (!therapistId) {
        return {
          success: false,
          error: "Therapist ID not found"
        };
      }

      const res =
        await therapistApiService.updateTherapistProfile(
          therapistId,
          formData
        );

      if (res.success) {
        const profileRes =
          await therapistApiService.getTherapistProfile();
        if (profileRes.success && profileRes.data) {
          setTherapistProfile(profileRes.data);
        }
        toast.success("Profile updated");
        return { success: true };
      }

      toast.error(
        res.error || "Failed to update profile"
      );
      return {
        success: false,
        error: res.error
      };
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error("Failed to update profile");
      return {
        success: false,
        error: err.message
      };
    }
  };

  // TherapistDashboard.jsx
const handleUpdateAvailability = async (availabilityPayload) => {
  try {
    const therapistId = therapistProfile?._id;
    if (!therapistId) {
      return { success: false, error: 'Therapist ID not found' };
    }

    const res = await therapistApiService.updateAvailability(
      therapistId,
      availabilityPayload
    );

    if (res.success) {
      const profileRes = await therapistApiService.getTherapistProfile();
      if (profileRes.success && profileRes.data) {
        setTherapistProfile(profileRes.data);
      }
      toast.success('Availability updated');
      return { success: true };
    }

    toast.error(res.error || 'Failed to update availability');
    return { success: false, error: res.error };
  } catch (err) {
    console.error('Update availability error:', err);
    toast.error('Failed to update availability');
    return { success: false, error: err.message };
  }
};

  const handleLogout = useCallback(() => {
    dataLoadedOnce.current = false;
    websocketInitialized.current = false;
    therapistApiService.disconnectWebSocket();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    setTimeout(
      () => navigate("/therapist-login"),
      1000
    );
  }, [navigate]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const displayName = useMemo(() => {
    return (
      therapistProfile?.userId?.name ||
      therapistProfile?.name ||
      "Therapist"
    );
  }, [therapistProfile]);

  const navigationItems = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        icon: BarChart3,
        description: "Dashboard overview",
        color: "emerald"
      },
      {
        id: "patients",
        label: "My Patients",
        icon: Heart,
        description: "Patient management",
        color: "rose",
        badge: assignedPatients.length
      },
      {
        id: "sessions",
        label: "Today's Sessions",
        icon: Calendar,
        description: "Session management",
        color: "blue",
        badge: todaysSessions.length
      },
      {
        id: "feedback",
        label: "Feedback",
        icon: MessageCircle,
        description: "Patient reviews",
        color: "purple",
        badge:
          feedbackState.analytics?.totalFeedback || 0
      },
      {
        id: "profile",
        label: "Profile",
        icon: User,
        description: "Therapist profile",
        color: "teal"
      }
    ],
    [
      assignedPatients.length,
      todaysSessions.length,
      feedbackState.analytics?.totalFeedback
    ]
  );

  const titleMap = useMemo(
    () => ({
      overview: `🙏 Welcome, ${displayName}`,
      patients: "🌿 My Assigned Patients",
      sessions: "📅 Today's Sessions",
      feedback: "⭐ Patient Feedback",
      profile: "👤 Therapist Profile"
    }),
    [displayName]
  );

  const subTitleMap = {
    overview:
      "Manage your therapeutic practice with ancient wisdom and modern efficiency",
    patients:
      "Monitor and care for your assigned patients with personalized attention",
    sessions:
      "View and manage your therapy sessions effectively",
    feedback: "Patient reviews and ratings",
    profile:
      "Customize your therapist profile and professional information"
  };

  const statsCards = useMemo(
    () => [
      {
        label: "Total Sessions",
        value: String(stats.totalSessions),
        icon: Users,
        color: "emerald"
      },
      {
        label: "Active Today",
        value: String(
          todaysSessions.filter(
            (s) => s.status === "in_progress"
          ).length
        ),
        icon: Activity,
        color: "blue",
        realTime: true
      },
      {
        label: "Completed",
        value: String(stats.completedSessions),
        icon: CheckCircle,
        color: "purple"
      },
      {
        label: "Average Rating",
        value:
          stats.averageRating?.toFixed(1) || "0.0",
        icon: Star,
        color: "amber",
        realTime: true
      }
    ],
    [stats, todaysSessions]
  );

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return assignedPatients;
    return assignedPatients.filter((patient) => {
      const name =
        patient.userId?.name?.toLowerCase() || "";
      const email =
        patient.userId?.email?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return (
        name.includes(term) || email.includes(term)
      );
    });
  }, [assignedPatients, searchTerm]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOADING / ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Loading Therapy Portal
          </h2>
          <p className="text-slate-600">
            Preparing your healing workspace...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Therapy Portal Error
          </h2>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      <Toaster position="top-right" />

      {/* Mobile Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="text-white font-bold text-sm" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">
                TherapyHub
              </h1>
              <p className="text-xs text-emerald-600">
                {displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isConnected ? (
                <>
                  <Zap className="w-3 h-3 animate-pulse" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-emerald-100 shadow-xl z-50"
              >
                <div className="p-4 space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleNavClick(item.id)
                      }
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeSection === item.id
                          ? getActiveNavStyles(item.color)
                          : getInactiveNavStyles(
                              item.color
                            )
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.label}
                        </div>
                        <div
                          className={`text-xs ${
                            activeSection === item.id
                              ? "text-white/80"
                              : "text-slate-500"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-emerald-100/50 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            {/* Brand */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-3 mb-8 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-xl"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="text-white font-bold text-lg" />
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  TherapyHub Portal
                </h1>
                <p className="text-sm text-emerald-100">
                  Therapist Dashboard
                </p>
              </div>
            </motion.div>

            {/* Connection Status */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border border-slate-200/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">
                  System Status
                </span>
                <motion.div
                  key={isConnected}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Zap className="w-3 h-3 animate-pulse" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Offline</span>
                    </>
                  )}
                </motion.div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  Therapist Status
                </span>
                <div className="flex items-center space-x-2">
                  <Circle
                    className={`w-3 h-3 fill-current ${
                      isConnected
                        ? "text-emerald-500 animate-pulse"
                        : "text-slate-400"
                    }`}
                  />
                  <span className="text-xs capitalize font-medium text-slate-700">
                    {isConnected
                      ? "available"
                      : "offline"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map(
                (item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{
                      x: -20,
                      opacity: 0
                    }}
                    animate={{
                      x: 0,
                      opacity: 1
                    }}
                    transition={{
                      delay: index * 0.1
                    }}
                    onClick={() =>
                      handleNavClick(item.id)
                    }
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 group ${
                      activeSection === item.id
                        ? getActiveDesktopNavStyles(
                            item.color
                          )
                        : getInactiveDesktopNavStyles(
                            item.color
                          )
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        activeSection === item.id
                          ? "bg-white/20 shadow-lg"
                          : `bg-${item.color}-100`
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {item.label}
                      </div>
                      <div
                        className={`text-xs ${
                          activeSection === item.id
                            ? "text-white/80"
                            : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                    {item.badge > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                      >
                        {item.badge}
                      </motion.div>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 transition-all ${
                        activeSection === item.id
                          ? "rotate-90 text-white"
                          : "text-slate-400"
                      }`}
                    />
                  </motion.button>
                )
              )}

              {/* Logout */}
              <motion.button
                initial={{
                  x: -20,
                  opacity: 0
                }}
                animate={{
                  x: 0,
                  opacity: 1
                }}
                transition={{ delay: 0.6 }}
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all text-red-600 hover:bg-red-50 mt-8 border-t border-slate-200 pt-6"
              >
                <div className="p-2 rounded-xl bg-red-100">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    Logout
                  </div>
                  <div className="text-xs text-red-500">
                    Sign out securely
                  </div>
                </div>
              </motion.button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Header (Desktop) */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-emerald-100/50 px-8 py-6 shadow-sm sticky top-0 z-30">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between space-y-4 xl:space-y-0">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={`title-${activeSection}`}
                    initial={{
                      y: 20,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    exit={{
                      y: -20,
                      opacity: 0
                    }}
                    className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent"
                  >
                    {titleMap[activeSection]}
                  </motion.h1>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`subtitle-${activeSection}`}
                    initial={{
                      y: 20,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    exit={{
                      y: -20,
                      opacity: 0
                    }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-600 mt-2 text-lg"
                  >
                    {subTitleMap[activeSection]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`profile-${activeSection}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center space-x-4"
                >
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-800">
                      {displayName}
                    </p>
                    <p className="text-sm text-emerald-600 font-medium">
                      {therapistProfile?.specialization?.[0] ||
                        "Ayurvedic Therapist"}
                    </p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConnected
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-red-400"
                        }`}
                      />
                      <span className="text-xs text-slate-500">
                        {isConnected ? "Live" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {displayName
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    {isConnected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Content sections */}
          <div className="p-4 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
              {/* Overview */}
              {activeSection === "overview" && (
                <motion.div
                  key="overview"
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -20
                  }}
                  className="space-y-8"
                >
                  {/* Stats cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map(
                      (stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{
                            scale: 0.8,
                            opacity: 0
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1
                          }}
                          transition={{
                            delay: index * 0.1
                          }}
                          className={`${getStatBgGradient(
                            stat.color
                          )} rounded-2xl p-6 border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden`}
                        >
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`${getStatIconBg(
                                  stat.color
                                )} p-3 rounded-xl shadow-md`}
                              >
                                <stat.icon className="w-6 h-6 text-white" />
                              </div>
                              {stat.realTime && (
                                <motion.div
                                  animate={{
                                    scale: [1, 1.2, 1]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity
                                  }}
                                  className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-full"
                                >
                                  <Circle className="w-2 h-2 fill-current text-red-500" />
                                  <span className="text-xs font-semibold text-red-600">
                                    LIVE
                                  </span>
                                </motion.div>
                              )}
                            </div>
                            <p
                              className={`text-sm font-medium ${getStatTextColor(
                                stat.color
                              )} mb-2`}
                            >
                              {stat.label}
                            </p>
                            <p
                              className={`text-4xl font-bold ${getStatValueColor(
                                stat.color
                              )}`}
                            >
                              {stat.value}
                            </p>
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>

                  {/* Today's sessions (quick view) */}
                  <motion.div
                    initial={{
                      y: 20,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                        Today's Sessions
                      </h2>
                      <button
                        onClick={() =>
                          handleNavClick("sessions")
                        }
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                      >
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                    {todaysSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">
                          No sessions scheduled for today
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          Your schedule is clear - enjoy some
                          rest!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todaysSessions
                          .slice(0, 3)
                          .map((session, index) => (
                            <motion.div
                              key={session._id}
                              initial={{
                                x: -20,
                                opacity: 0
                              }}
                              animate={{
                                x: 0,
                                opacity: 1
                              }}
                              transition={{
                                delay: index * 0.1
                              }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                                  {session
                                    .patientId
                                    ?.userId
                                    ?.name?.charAt(
                                      0
                                    )
                                    .toUpperCase() ||
                                    "P"}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {session
                                      .patientId
                                      ?.userId
                                      ?.name ||
                                      "Patient"}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(
                                      session.scheduledDate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    session.status ===
                                    "scheduled"
                                      ? "bg-amber-100 text-amber-700"
                                      : session.status ===
                                        "in_progress"
                                      ? "bg-green-100 text-green-700"
                                      : session.status ===
                                        "completed"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {session.status}
                                </span>
                                {session.status ===
                                  "scheduled" && (
                                  <button
                                    onClick={() =>
                                      handleStartSession(
                                        session._id
                                      )
                                    }
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                  >
                                    Start
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Quick actions */}
                  <motion.div
                    initial={{
                      y: 20,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <button
                      onClick={() =>
                        handleNavClick("patients")
                      }
                      className="p-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white"
                    >
                      <Heart className="w-8 h-8 mb-3" />
                      <h3 className="font-bold text-lg mb-1">
                        My Patients
                      </h3>
                      <p className="text-sm text-white/80">
                        View {assignedPatients.length} assigned
                        patients
                      </p>
                    </button>
                    <button
                      onClick={() =>
                        handleNavClick("sessions")
                      }
                      className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white"
                    >
                      <Calendar className="w-8 h-8 mb-3" />
                      <h3 className="font-bold text-lg mb-1">
                        Sessions
                      </h3>
                      <p className="text-sm text-white/80">
                        {todaysSessions.length} sessions today
                      </p>
                    </button>
                    <button
                      onClick={() =>
                        handleNavClick("feedback")
                      }
                      className="p-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white"
                    >
                      <Star className="w-8 h-8 mb-3" />
                      <h3 className="font-bold text-lg mb-1">
                        Feedback
                      </h3>
                      <p className="text-sm text-white/80">
                        {feedbackState.analytics?.totalFeedback ||
                          0}{" "}
                        reviews
                      </p>
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* Patients */}
              {activeSection === "patients" && (
                <motion.div
                  key="patients"
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -20
                  }}
                >
                  <MyPatients />
                </motion.div>
              )}

              {/* Sessions */}
              {activeSection === "sessions" && (
                <motion.div
                  key="sessions"
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -20
                  }}
                  className="space-y-6"
                >
                  {activeSession && (
                    <LiveTrackingPanel
                      session={activeSession}
                      onUpdate={handleRefreshSessions}
                    />
                  )}
                  <RealtimeSessionAnalytics />
                  <RealtimeSessionList
                    onTrackLive={handleTrackLive}
                    onSessionUpdate={
                      handleRefreshSessions
                    }
                  />
                </motion.div>
              )}

              {/* Feedback */}
              {activeSection === "feedback" && (
                <motion.div
                  key="feedback"
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -20
                  }}
                  className="space-y-8"
                >
                  <FeedbackAnalyticsDashboard
                    feedbackData={feedbackState.feedback}
                    averageRatings={
                      feedbackState.averageRatings
                    }
                    analytics={feedbackState.analytics}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                        <Star className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Overall Rating
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {feedbackState.analytics.averageRating.toFixed(
                            1
                          )}{" "}
                          / 5.0
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={refreshFeedback}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all shadow-lg"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Refresh Feedback</span>
                      </button>
                    </div>
                  </div>

                  <FeedbackList
                    feedbackData={feedbackState.feedback}
                    pagination={feedbackState.pagination}
                    onRefresh={refreshFeedback}
                    onLoadMore={null}
                    hasMore={
                      feedbackState.pagination?.hasNextPage
                    }
                  />
                </motion.div>
              )}

              {/* Profile */}
              {activeSection === "profile" && (
                <motion.div
                  key="profile"
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -20
                  }}
                >
                  <TherapistProfileSettings
                    therapistProfile={therapistProfile}
                    displayName={displayName}
                    onUpdateProfile={handleUpdateProfile}
                    onUpdateAvailability={handleUpdateAvailability}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TherapistDashboard;
