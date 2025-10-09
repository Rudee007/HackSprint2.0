// src/pages/DoctorDashboard.jsx (Updated with Therapy Tracking)
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, Activity, TrendingUp, DollarSign, LogOut,
  Loader2, WifiOff, Bell, Circle, Monitor, Eye, Menu, ChevronRight, Sparkles, Zap, AlertCircle,
  BarChart3, Stethoscope, Settings, Target, Timer, Heart // ✅ New icons for therapy tracking
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useRealTime } from "../context/RealTimeContext";
import doctorApiService from "../services/doctorApiService";
import websocketService from "../services/websocketService";

// ✅ Existing real-time components
import RealTimeSessionDashboard from "../components/realtime/RealTimeSessionDashboard";
import ProviderStatusWidget from "../components/realtime/ProviderStatusWidget";
import SessionNotifications from "../components/realtime/SessionNotifications";

// ✅ NEW: Panchakarma Therapy Tracking Components
import RealTimeTherapyTracker from "../components/realtime/RealTimeTherapyTracker";
import LiveProgressMonitor from "../components/realtime/LiveProgressMonitor";
import SessionMilestones from "../components/realtime/SessionMilestones";
import UpcomingSessionsDashboard from "../components/realtime/UpcomingSessionsDashboard";
import MultiUserSyncStatus from "../components/realtime/MultiUserSyncStatus";

// ✅ Existing components
import PatientManagement from "../components/PatientManagement";
import TreatmentPlanning from "../components/TreatmentPlanning";
import ProfileSettings from "../components/ProfileSettings";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const {
    isConnected,
    connectionStatus,
    notifications,
    unreadNotifications,
    providerStatus,
    activeSessions,
    forceRefresh
  } = useRealTime();

  // Refs to avoid duplicates/double init
  const consultationIds = useRef(new Set());
  const dataLoadedOnce = useRef(false);
  const websocketConnected = useRef(false);

  // UI state
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);

  // ✅ NEW: Therapy tracking state
  const [therapyTrackingData, setTherapyTrackingData] = useState({
    activeSessions: [],
    upcomingSessions: [],
    completedToday: [],
    milestones: {},
    connectedUsers: []
  });

  // Treatment state (used by children)
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [treatmentForm, setTreatmentForm] = useState({
    patientName: "",
    treatmentType: "",
    treatmentPlan: "",
    appointmentDate: "",
    appointmentTime: "",
    detailedProtocol: ""
  });

  // Connect WebSocket once after login
  useEffect(() => {
    const connect = async () => {
      const token = localStorage.getItem("accessToken");
      if (isAuthenticated && token && !websocketConnected.current && !isConnected) {
        try {
          websocketConnected.current = true;
          await websocketService.connect(token);
          forceRefresh?.();
        } catch {
          websocketConnected.current = false;
        }
      }
    };
    connect();
  }, [isAuthenticated, isConnected, forceRefresh]);

  // Load initial dashboard data exactly once
  useEffect(() => {
    const load = async () => {
      if (dataLoadedOnce.current) return;

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please log in to continue");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profileRes, consultRes, statsRes] = await Promise.all([
          doctorApiService.getDoctorProfile(),
          doctorApiService.getDoctorConsultations({ page: 1, limit: 10 }),
          doctorApiService.getDoctorStats("30d"),
        ]);

        const consults = consultRes.data.data?.consultations || [];
        const unique = consults.filter(c => {
          if (!consultationIds.current.has(c._id)) {
            consultationIds.current.add(c._id);
            return true;
          }
          return false;
        });

        setDoctorInfo(profileRes.data.data.doctor);
        setRecentConsultations(unique);
        setAllConsultations(unique);
        setDashboardStats(statsRes.data.data);

        dataLoadedOnce.current = true;
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

 // In DoctorDashboard.jsx
const loadTherapyTrackingData = async () => {
  if (!isConnected) return;

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // ✅ Use full URL and proper headers
    const response = await fetch('http://localhost:3003/api/realtime/therapy-tracking/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // ✅ Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Expected JSON but got:', textResponse.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      setTherapyTrackingData(data.data);
    } else {
      console.error('API returned error:', data.message);
    }
  } catch (error) {
    console.error('Failed to load therapy tracking data:', error);
    // ✅ Set fallback data
    setTherapyTrackingData({
      activeSessions: [],
      upcomingSessions: [],
      completedToday: [],
      connectedUsers: []
    });
  }
};
 // Display name
  const displayName = useMemo(
    () => doctorInfo?.userId?.name || doctorInfo?.name || user?.name || "Doctor",
    [doctorInfo, user]
  );

  // ✅ UPDATED: Navigation items with Therapy Tracking
  const navigationItems = useMemo(() => ([
    { id: "overview", label: "Overview", icon: BarChart3, description: "Dashboard overview", color: "emerald" },
    { id: "realtime", label: "Live Sessions", icon: Activity, description: "Real-time monitoring", color: "blue", badge: activeSessions?.size || 0, realTime: true },
    { id: "therapy-tracking", label: "Therapy Tracker", icon: Heart, description: "Panchakarma progress tracking", color: "rose", badge: therapyTrackingData.activeSessions?.length || 0, realTime: true }, // ✅ NEW
    { id: "patients", label: "Patients", icon: Users, description: "Patient management", color: "purple" },
    { id: "treatment", label: "Treatments", icon: Stethoscope, description: "Treatment planning", color: "teal" },
    { id: "settings", label: "Settings", icon: Settings, description: "Profile settings", color: "slate" },
  ]), [activeSessions?.size, therapyTrackingData.activeSessions?.length]);

  // ✅ UPDATED: Title and subtitle maps
  const titleMap = useMemo(() => ({
    overview: `🙏 Welcome, Dr. ${displayName}`,
    realtime: "🔄 Real-Time Sessions",
    "therapy-tracking": "🌿 Panchakarma Therapy Tracker", // ✅ NEW
    patients: "👥 Patient Management",
    treatment: "🌿 Treatment Planning",
    settings: "⚙️ Profile Settings",
  }), [displayName]);

  const subTitleMap = {
    overview: "Manage your Ayurvedic practice with ancient wisdom and modern efficiency",
    realtime: "Monitor live sessions, track participants, and manage real-time consultations",
    "therapy-tracking": "Real-time Panchakarma therapy progress, milestones, and session monitoring", // ✅ NEW
    patients: "Comprehensive patient care and consultation management",
    treatment: "Create personalized healing journeys with Ayurvedic protocols",
    settings: "Customize your profile and practice preferences",
  };

  // ✅ UPDATED: Stats with therapy tracking data
  const stats = useMemo(() => {
    if (!dashboardStats) {
      return [
        { label: "Today's Patients", value: "0", icon: Users, color: "emerald", bgGradient: "from-emerald-50 via-emerald-100 to-green-50" },
        { label: "Active Sessions", value: String(activeSessions?.size || 0), icon: Activity, color: "blue", bgGradient: "from-blue-50 via-blue-100 to-cyan-50", realTime: true },
        { label: "Active Therapies", value: String(therapyTrackingData.activeSessions?.length || 0), icon: Heart, color: "rose", bgGradient: "from-rose-50 via-rose-100 to-pink-50", realTime: true }, // ✅ NEW
        { label: "Success Rate", value: "0%", icon: TrendingUp, color: "purple", bgGradient: "from-purple-50 via-purple-100 to-violet-50" },
        { label: "Revenue (30d)", value: "₹0", icon: DollarSign, color: "amber", bgGradient: "from-amber-50 via-amber-100 to-yellow-50" },
      ];
    }
    const completionRate = dashboardStats.completionRate || 0;
    const totalRevenue = dashboardStats.totalRevenue || 0;
    return [
      { label: "Today's Patients", value: String(dashboardStats.totalConsultations || 0), icon: Users, color: "emerald", bgGradient: "from-emerald-50 via-emerald-100 to-green-50" },
      { label: "Active Sessions", value: String(activeSessions?.size || 0), icon: Activity, color: "blue", bgGradient: "from-blue-50 via-blue-100 to-cyan-50", realTime: true },
      { label: "Active Therapies", value: String(therapyTrackingData.activeSessions?.length || 0), icon: Heart, color: "rose", bgGradient: "from-rose-50 via-rose-100 to-pink-50", realTime: true }, // ✅ NEW
      { label: "Success Rate", value: `${completionRate}%`, icon: TrendingUp, color: "purple", bgGradient: "from-purple-50 via-purple-100 to-violet-50" },
      { label: "Revenue (30d)", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "amber", bgGradient: "from-amber-50 via-amber-100 to-yellow-50" },
    ];
  }, [dashboardStats, activeSessions, therapyTrackingData]);

  // Handlers
  const handleNavClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    setMobileNavOpen(false);
  }, []);

  const handleRealTimeDashboard = useCallback(() => {
    navigate("/doctor/realtime");
  }, [navigate]);

  // ✅ NEW: Handler for therapy tracking page
  const handleTherapyTracking = useCallback(() => {
    navigate("/doctor/therapy-tracking");
  }, [navigate]);

  const loadAllConsultations = useCallback(async (filters = {}) => {
    try {
      const res = await doctorApiService.getDoctorConsultations({ page: 1, limit: 50, ...filters });
      const incoming = res.data.data.consultations || [];
      const fresh = incoming.filter(c => {
        if (!consultationIds.current.has(c._id)) {
          consultationIds.current.add(c._id);
          return true;
        }
        return false;
      });
      setAllConsultations(prev => [...prev, ...fresh]);
      return res.data.data;
    } catch {
      return { consultations: [] };
    }
  }, []);

  const updateConsultationStatus = useCallback(async (id, status) => {
    try {
      await doctorApiService.updateConsultationStatus(id, status);
      setAllConsultations(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      setRecentConsultations(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch {}
  }, []);

  const handleLogout = useCallback(() => {
    dataLoadedOnce.current = false;
    consultationIds.current.clear();
    websocketConnected.current = false;
    logout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/doctor-login");
  }, [logout, navigate]);

  // Helpers
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Loading & Error states remain the same...
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Preparing your Ayurvedic practice portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Dashboard Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      {/* Mobile Header - Same as before but updated navigation items */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🩺</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">AyurMitra</h1>
              <p className="text-xs text-emerald-600">Dr. {displayName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {isConnected ? (<><Zap className="w-3 h-3 animate-pulse" /><span>Live</span></>) : (<><WifiOff className="w-3 h-3" /><span>Offline</span></>)}
            </div>
            <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileNavOpen(false)} />
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-emerald-100 shadow-xl z-50">
                <div className="p-4 space-y-2">
                  {navigationItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeSection === item.id
                          ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg`
                          : `text-slate-600 hover:bg-${item.color}-50 hover:text-${item.color}-700`
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className={`text-xs ${activeSection === item.id ? "text-white/80" : "text-slate-500"}`}>{item.description}</div>
                      </div>
                      {item.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
                      {item.realTime && <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-emerald-100/50 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            {/* Brand */}
            <div className="flex items-center space-x-3 mb-8 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-xl">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">🩺</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">AyurMitra Portal</h1>
                <p className="text-sm text-emerald-100">Doctor Dashboard</p>
              </div>
            </div>

            {/* Connection status */}
            <div className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">System Status</span>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {isConnected ? (<><Zap className="w-3 h-3 animate-pulse" /><span>Online</span></>) : (<><WifiOff className="w-3 h-3" /><span>Offline</span></>)}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Provider Status</span>
                <div className="flex items-center space-x-2">
                  <Circle className={`w-3 h-3 fill-current ${
                    providerStatus === "available" ? "text-emerald-500 animate-pulse" :
                    providerStatus === "busy" ? "text-amber-500" :
                    "text-slate-400"
                  }`} />
                  <span className="text-xs capitalize font-medium text-slate-700">{providerStatus}</span>
                </div>
              </div>
              {unreadNotifications.length > 0 && (
                <div className="mt-3 flex items-center space-x-2 text-xs bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <Bell className="w-3 h-3 text-amber-600 animate-bounce" />
                  <span className="text-amber-800 font-medium">{unreadNotifications.length} new alerts</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                    activeSection === item.id
                      ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-xl scale-105`
                      : `text-slate-600 hover:bg-${item.color}-50 hover:text-${item.color}-700 hover:scale-102`
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeSection === item.id ? "bg-white/20 shadow-lg" : `bg-${item.color}-100 group-hover:bg-${item.color}-200`}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${activeSection === item.id ? "text-white/80" : "text-slate-500 group-hover:text-slate-600"}`}>{item.description}</div>
                  </div>
                  {item.badge > 0 && <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">{item.badge}</div>}
                  {item.realTime && <Sparkles className={`w-4 h-4 ${activeSection === item.id ? "text-white" : "text-emerald-500"}`} />}
                  <ChevronRight className={`w-4 h-4 ${activeSection === item.id ? "rotate-90 text-white" : "group-hover:translate-x-1 text-slate-400"}`} />
                </button>
              ))}

              {/* Quick links */}
              {/* <button
                onClick={handleRealTimeDashboard}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 text-emerald-600 hover:bg-emerald-50 mt-6 border-2 border-dashed border-emerald-200"
              >
                <div className="p-2 rounded-xl bg-emerald-100"><Monitor className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="font-semibold">Advanced View</div>
                  <div className="text-xs text-emerald-600">Full monitoring</div>
                </div>
                <Eye className="w-4 h-4" />
              </button> */}

              {/* ✅ NEW: Therapy Tracking Quick Link */}
              {/* <button
                onClick={handleTherapyTracking}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 text-rose-600 hover:bg-rose-50 border-2 border-dashed border-rose-200"
              >
                <div className="p-2 rounded-xl bg-rose-100"><Timer className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="font-semibold">Therapy Tracker</div>
                  <div className="text-xs text-rose-600">Full panchakarma view</div>
                </div>
                <Target className="w-4 h-4" />
              </button> */}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 text-red-600 hover:bg-red-50 mt-8 border-t border-slate-200 pt-6"
              >
                <div className="p-2 rounded-xl bg-red-100"><LogOut className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-red-500">Sign out securely</div>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-emerald-100/50 px-8 py-6 sticky top-0 z-30">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between space-y-4 xl:space-y-0">
              <div className="flex-1">
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                  {titleMap[activeSection]}
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-slate-600 mt-2 text-lg">
                  {subTitleMap[activeSection]}
                </motion.p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-800">Dr. {displayName}</p>
                  <p className="text-sm text-emerald-600 font-medium">{doctorInfo?.specializations?.[0] || "Ayurvedic Specialist"}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-xs text-slate-500">{isConnected ? "Live Connected" : "Offline"}</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section content */}
          <div className="p-4 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
              {activeSection === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 lg:space-y-8">
                  {/* ✅ UPDATED: Stats cards now include therapy tracking */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
                    {stats.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer ${stat.realTime ? "ring-2 ring-emerald-200 ring-opacity-50" : ""}`}
                      >
                        {stat.realTime && <div className="absolute top-2 right-2"><Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /></div>}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs lg:text-sm font-semibold text-${stat.color}-700 mb-2 flex items-center space-x-2`}>
                              <span className="truncate">{stat.label}</span>
                              {stat.realTime && <Circle className="w-2 h-2 text-emerald-500 fill-current animate-pulse flex-shrink-0" />}
                            </p>
                            <p className={`text-xl lg:text-3xl font-bold text-${stat.color}-900 mb-1`}>{stat.value}</p>
                          </div>
                          <div className={`w-10 h-10 lg:w-14 lg:h-14 bg-${stat.color}-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0 ml-2`}>
                            <stat.icon className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute -right-4 -top-4 w-16 lg:w-24 h-16 lg:h-24 rounded-full bg-white" />
                          <div className="absolute -left-2 -bottom-2 w-10 lg:w-16 h-10 lg:h-16 rounded-full bg-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Main grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Recent consultations */}
                    <div className="xl:col-span-2">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
                        <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                              <Calendar className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg lg:text-2xl font-bold text-slate-800">Recent Consultations</h3>
                              <p className="text-slate-600 text-xs lg:text-sm">Your latest patient interactions</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 lg:p-8 max-h-80 lg:max-h-96 overflow-y-auto">
                          {recentConsultations.length > 0 ? (
                            <div className="space-y-3 lg:space-y-4">
                              {recentConsultations.slice(0, 5).map((c, i) => (
                                <div key={c._id} className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 border border-slate-200/50 rounded-xl lg:rounded-2xl hover:bg-slate-50/50 transition-all duration-200 hover:shadow-md group">
                                  <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Users className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate text-sm lg:text-base">{c.patientId?.name || `Patient ${i + 1}`}</p>
                                    <p className="text-xs lg:text-sm text-slate-600 truncate">
                                      {c.type || "General"} • {c.scheduledFor ? new Date(c.scheduledFor).toLocaleDateString() : "Recent"}
                                    </p>
                                  </div>
                                  <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(c.status)} flex-shrink-0`}>
                                    {c.status || "scheduled"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 lg:py-12 text-slate-500">
                              <div className="w-12 lg:w-16 h-12 lg:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-6 lg:w-8 h-6 lg:h-8 text-slate-400" />
                              </div>
                              <p className="text-base lg:text-lg font-medium">No recent consultations</p>
                              <p className="text-xs lg:text-sm">Your consultations will appear here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ✅ UPDATED: Real-time sidebar with therapy preview */}
                    <div className="xl:col-span-1 space-y-4 lg:space-y-6">
                      <ProviderStatusWidget />
                      <SessionNotifications compact />
                      
                      {/* ✅ NEW: Therapy Tracking Preview */}
                      {therapyTrackingData.activeSessions?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200/50 p-4 lg:p-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Heart className="w-5 h-5 text-rose-600" />
                              <h4 className="font-semibold text-rose-800">Active Therapies</h4>
                            </div>
                            <span className="text-sm font-bold text-rose-600">
                              {therapyTrackingData.activeSessions.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {therapyTrackingData.activeSessions.slice(0, 3).map((session, i) => (
                              <div key={session.id || i} className="text-sm text-rose-700">
                                • {session.patientName || `Patient ${i + 1}`} - {session.therapyType || 'Panchakarma'}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleNavClick('therapy-tracking')}
                            className="w-full mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
                          >
                            View All Therapies
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "realtime" && (
                <motion.div key="realtime" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <RealTimeSessionDashboard />
                </motion.div>
              )}

              {/* ✅ NEW: Therapy Tracking Section */}
              {activeSection === "therapy-tracking" && (
                <motion.div key="therapy-tracking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <RealTimeTherapyTracker />
                </motion.div>
              )}

              {activeSection === "patients" && (
                <motion.div key="patients" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <PatientManagement
                    doctorInfo={doctorInfo}
                    appointments={allConsultations}
                    treatmentPlans={treatmentPlans}
                    onLoadConsultations={loadAllConsultations}
                    onUpdateStatus={updateConsultationStatus}
                  />
                </motion.div>
              )}

              {activeSection === "treatment" && (
                <motion.div key="treatment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <TreatmentPlanning
                    doctorInfo={doctorInfo}
                    appointments={allConsultations}
                    treatmentPlans={treatmentPlans}
                    treatmentForm={treatmentForm}
                    setTreatmentForm={setTreatmentForm}
                  />
                </motion.div>
              )}

              {activeSection === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <ProfileSettings
                    doctorInfo={doctorInfo}
                    user={user}
                    displayName={displayName}
                    onUpdateProfile={async (profile) => {
                      try {
                        const res = await doctorApiService.updateDoctorProfile(profile);
                        setDoctorInfo(res.data.data.doctor);
                        return { success: true };
                      } catch (e) {
                        return { success: false, error: e.message };
                      }
                    }}
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

export default DoctorDashboard;
