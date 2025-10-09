// src/pages/TherapistDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, User, MessageCircle, Calendar, Settings, Plus, Search, Filter,
  Clock, TrendingUp, Users, CheckCircle, AlertCircle, Send, Paperclip,
  Mic, MicOff, Loader2, LogOut, Eye, Menu, X, ChevronDown, ChevronRight,
  Star, Award, MapPin, Phone, Mail, Sparkles, Zap, WifiOff, Bell, Circle,
  Monitor, BarChart3, Stethoscope, Activity, PhoneCall, Video, FileText
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useRealTime } from "../context/RealTimeContext";
import { therapistAuthService } from "../services/therapistAuthService";
import { treatmentService } from "../services/treatmentService";
import websocketService from "../services/websocketService";

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected, connectionStatus, notifications, unreadNotifications, providerStatus, activeSessions, forceRefresh } = useRealTime();

  // Refs for data management
  const dataLoadedOnce = useRef(false);
  const websocketConnected = useRef(false);
  const patientIds = useRef(new Set());

  // UI state
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Core data state
  const [therapistInfo, setTherapistInfo] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Progress tracking state
  const [progressUpdate, setProgressUpdate] = useState({
    patientId: '',
    status: '',
    notes: '',
    milestones: [],
    nextSession: ''
  });

  // Messaging state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Schedule state
  const [dailySchedule, setDailySchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Real-time therapy stats
  const [therapyStats, setTherapyStats] = useState({
    totalPatients: 0,
    activeToday: 0,
    completed: 0,
    improved: 0
  });

  // Initialize WebSocket connection (following DoctorDashboard pattern)
  useEffect(() => {
    const initializeWebSocket = async () => {
      const token = localStorage.getItem("accessToken");
      if (isAuthenticated && token && !websocketConnected.current && !isConnected) {
        try {
          websocketConnected.current = true;
          await websocketService.connect(token);
          forceRefresh?.();
        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          websocketConnected.current = false;
        }
      }
    };
    initializeWebSocket();
  }, [isAuthenticated, isConnected, forceRefresh]);

  // Load dashboard data ONCE (following DoctorDashboard pattern)
  useEffect(() => {
    const loadDashboardData = async () => {
      if (dataLoadedOnce.current) return;

      try {
        setLoading(true);
        setError(null);

        const currentTherapist = therapistAuthService.getCurrentTherapist();
        if (!currentTherapist) {
          navigate("/therapist-login");
          return;
        }

        setTherapistInfo(currentTherapist);

        // Load patients and prevent duplicates
        const therapistIdentifier = currentTherapist.name || currentTherapist.id || 'Unknown';
        const patients = treatmentService.getTreatmentPlansForTherapist(therapistIdentifier);
        
        const filteredPatients = patients.filter(patient => {
          if (!patientIds.current.has(patient.id)) {
            patientIds.current.add(patient.id);
            return true;
          }
          return false;
        });

        setAssignedPatients(filteredPatients);

        // Load other data
        await Promise.all([
          loadDailySchedule(),
          loadMessages(),
          loadTherapyStats(filteredPatients)
        ]);

        dataLoadedOnce.current = true;
      } catch (e) {
        console.error('Dashboard loading error:', e);
        setError("Failed to load therapy dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  // Load additional data functions
  const loadDailySchedule = async () => {
    setDailySchedule([
      { id: 1, time: '09:00', patient: 'Patient A', type: 'Abhyanga Massage', duration: 60, status: 'scheduled' },
      { id: 2, time: '10:30', patient: 'Patient B', type: 'Panchakarma', duration: 90, status: 'in_progress' },
      { id: 3, time: '14:00', patient: 'Patient C', type: 'Marma Therapy', duration: 45, status: 'scheduled' },
      { id: 4, time: '15:30', patient: 'Patient D', type: 'Consultation', duration: 30, status: 'scheduled' }
    ]);
  };

  const loadMessages = async () => {
    setMessages([
      { id: 1, from: 'Dr. Sharma', message: 'Patient progress looks excellent', timestamp: new Date(), type: 'text', read: false },
      { id: 2, from: 'Dr. Patel', message: 'Please update therapy notes for Patient B', timestamp: new Date(), type: 'text', read: false },
      { id: 3, from: 'Dr. Kumar', message: 'Good work on the Panchakarma session', timestamp: new Date(), type: 'text', read: true }
    ]);
  };

  const loadTherapyStats = async (patients) => {
    setTherapyStats({
      totalPatients: patients.length,
      activeToday: patients.filter(p => p.progressStatus === 'Active' || !p.progressStatus).length,
      completed: patients.filter(p => p.progressStatus === 'Completed').length,
      improved: patients.filter(p => p.progressStatus === 'Excellent Progress' || p.progressStatus === 'Good Progress').length
    });
  };

  // Display name (following DoctorDashboard pattern)
  const displayName = useMemo(
    () => therapistInfo?.name || user?.name || "Therapist",
    [therapistInfo, user]
  );

  // Navigation items (following DoctorDashboard structure)
  const navigationItems = useMemo(() => ([
    { id: "overview", label: "Overview", icon: BarChart3, description: "Dashboard overview", color: "emerald" },
    { id: "patients", label: "My Patients", icon: Heart, description: "Patient management", color: "rose", badge: assignedPatients.length },
    { id: "progress", label: "Progress Updates", icon: TrendingUp, description: "Track patient progress", color: "blue", badge: therapyStats.activeToday },
    { id: "messages", label: "Messages", icon: MessageCircle, description: "Doctor communications", color: "purple", badge: messages.filter(m => !m.read).length },
    { id: "schedule", label: "Schedule", icon: Calendar, description: "Daily appointments", color: "amber", badge: dailySchedule.length },
    { id: "profile", label: "Profile", icon: User, description: "Therapist profile", color: "teal" }
  ]), [assignedPatients.length, therapyStats.activeToday, messages.length, dailySchedule.length]);

  // Title and subtitle maps (following DoctorDashboard pattern)
  const titleMap = useMemo(() => ({
    overview: `🙏 Welcome, ${displayName}`,
    patients: "🌿 My Assigned Patients",
    progress: "📈 Progress Tracking",
    messages: "💬 Doctor Communications",
    schedule: "📅 Today's Schedule",
    profile: "👤 Therapist Profile"
  }), [displayName]);

  const subTitleMap = {
    overview: "Manage your therapeutic practice with ancient wisdom and modern efficiency",
    patients: "Monitor and care for your assigned patients with personalized attention",
    progress: "Update patient progress and track therapeutic milestones effectively",
    messages: "Collaborate with doctors through real-time messaging and updates",
    schedule: "View and manage your daily therapeutic appointments and sessions",
    profile: "Customize your therapist profile and professional information"
  };

  // Stats calculation (following DoctorDashboard pattern)
  const stats = useMemo(() => {
    return [
      { label: "Total Patients", value: String(therapyStats.totalPatients), icon: Users, color: "emerald", bgGradient: "from-emerald-50 via-emerald-100 to-green-50" },
      { label: "Active Today", value: String(therapyStats.activeToday), icon: Activity, color: "blue", bgGradient: "from-blue-50 via-blue-100 to-cyan-50", realTime: true },
      { label: "Completed", value: String(therapyStats.completed), icon: CheckCircle, color: "purple", bgGradient: "from-purple-50 via-purple-100 to-violet-50" },
      { label: "Improved", value: String(therapyStats.improved), icon: TrendingUp, color: "amber", bgGradient: "from-amber-50 via-amber-100 to-yellow-50", realTime: true }
    ];
  }, [therapyStats]);

  // Handlers (following DoctorDashboard pattern)
  const handleNavClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    setMobileNavOpen(false);
  }, []);

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressUpdate.patientId || !progressUpdate.status) return;

    const result = treatmentService.updateTreatmentProgress(progressUpdate.patientId, {
      progressStatus: progressUpdate.status,
      progressNotes: progressUpdate.notes,
      lastUpdatedBy: therapistInfo.name
    });

    if (result.success) {
      setProgressUpdate({ patientId: '', status: '', notes: '', milestones: [], nextSession: '' });
      const updatedPatients = treatmentService.getTreatmentPlansForTherapist(therapistInfo.name);
      setAssignedPatients(updatedPatients);
      loadTherapyStats(updatedPatients);
    }
  };

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      from: displayName,
      message: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  }, [newMessage, displayName]);

  const handleLogout = useCallback(() => {
    dataLoadedOnce.current = false;
    patientIds.current.clear();
    websocketConnected.current = false;
    therapistAuthService.logout();
    logout();
    localStorage.removeItem("accessToken");
    navigate("/therapist-login");
  }, [logout, navigate]);

  // Loading state (following DoctorDashboard pattern)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Therapy Portal</h2>
          <p className="text-slate-600">Preparing your healing workspace...</p>
        </motion.div>
      </div>
    );
  }

  // Error state (following DoctorDashboard pattern)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Therapy Portal Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      {/* Mobile Header (following DoctorDashboard pattern) */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="text-white font-bold text-sm" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">TherapyHub</h1>
              <p className="text-xs text-emerald-600">{displayName}</p>
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
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar (following DoctorDashboard pattern) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-emerald-100/50 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            {/* Brand */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center space-x-3 mb-8 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-xl">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="text-white font-bold text-lg" />
              </div>
              <div>
                <h1 className="font-bold text-lg">TherapyHub Portal</h1>
                <p className="text-sm text-emerald-100">Therapist Dashboard</p>
              </div>
            </motion.div>

            {/* Connection Status (following DoctorDashboard pattern) */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">System Status</span>
                <motion.div key={isConnected} initial={{ scale: 0 }} animate={{ scale: 1 }} className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {isConnected ? (<><Zap className="w-3 h-3 animate-pulse" /><span>Online</span></>) : (<><WifiOff className="w-3 h-3" /><span>Offline</span></>)}
                </motion.div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Therapist Status</span>
                <div className="flex items-center space-x-2">
                  <Circle className={`w-3 h-3 fill-current ${
                    providerStatus === "available" ? "text-emerald-500 animate-pulse" :
                    providerStatus === "busy" ? "text-amber-500" :
                    "text-slate-400"
                  }`} />
                  <span className="text-xs capitalize font-medium text-slate-700">{providerStatus || "available"}</span>
                </div>
              </div>
              {unreadNotifications && unreadNotifications.length > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-3 flex items-center space-x-2 text-xs bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <Bell className="w-3 h-3 text-amber-600 animate-bounce" />
                  <span className="text-amber-800 font-medium">{unreadNotifications.length} new alerts</span>
                </motion.div>
              )}
            </motion.div>

            {/* Navigation (following DoctorDashboard pattern) */}
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                    activeSection === item.id
                      ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-xl scale-105`
                      : `text-slate-600 hover:bg-${item.color}-50 hover:text-${item.color}-700 hover:scale-102`
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${activeSection === item.id ? "bg-white/20 shadow-lg" : `bg-${item.color}-100 group-hover:bg-${item.color}-200`}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${activeSection === item.id ? "text-white/80" : "text-slate-500 group-hover:text-slate-600"}`}>{item.description}</div>
                  </div>
                  {item.badge > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                      {item.badge}
                    </motion.div>
                  )}
                  {item.realTime && <Sparkles className={`w-4 h-4 ${activeSection === item.id ? "text-white" : "text-emerald-500"}`} />}
                  <ChevronRight className={`w-4 h-4 transition-all ${activeSection === item.id ? "rotate-90 text-white" : "group-hover:translate-x-1 text-slate-400"}`} />
                </motion.button>
              ))}

              {/* Logout (following DoctorDashboard pattern) */}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:scale-102 mt-8 border-t border-slate-200 pt-6"
              >
                <div className="p-2 rounded-xl bg-red-100">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-red-500">Sign out securely</div>
                </div>
              </motion.button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Header (following DoctorDashboard pattern) */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-emerald-100/50 px-8 py-6 shadow-sm sticky top-0 z-30">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between space-y-4 xl:space-y-0">
              <div className="flex-1">
                <motion.h1 key={activeSection} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                  {titleMap[activeSection]}
                </motion.h1>
                <motion.p key={activeSection} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-slate-600 mt-2 text-lg">
                  {subTitleMap[activeSection]}
                </motion.p>
              </div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-800">{displayName}</p>
                  <p className="text-sm text-emerald-600 font-medium">{therapistInfo?.specialization || "Ayurvedic Therapist"}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-xs text-slate-500">{isConnected ? "Live Connected" : "Offline"}</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  {isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
              {activeSection === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 lg:space-y-8">
                  {/* Stats Cards (following DoctorDashboard pattern) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    {stats.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer ${stat.realTime ? "ring-2 ring-emerald-200 ring-opacity-50" : ""}`}
                      >
                        {stat.realTime && (
                          <div className="absolute top-2 right-2">
                            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                          </div>
                        )}
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

                  {/* Main Grid (following DoctorDashboard pattern) */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Recent Patients */}
                    <div className="xl:col-span-2">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
                        <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                              <Heart className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg lg:text-2xl font-bold text-slate-800">My Patients</h3>
                              <p className="text-slate-600 text-xs lg:text-sm">Your assigned therapeutic cases</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 lg:p-8 max-h-80 lg:max-h-96 overflow-y-auto">
                          {assignedPatients.length > 0 ? (
                            <div className="space-y-3 lg:space-y-4">
                              {assignedPatients.slice(0, 5).map((patient, i) => (
                                <motion.div key={patient.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 border border-slate-200/50 rounded-xl lg:rounded-2xl hover:bg-slate-50/50 transition-all duration-200 hover:shadow-md group cursor-pointer">
                                  <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                    <span className="text-white font-bold text-sm lg:text-base">{patient.patientName.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate text-sm lg:text-base">{patient.patientName}</p>
                                    <p className="text-xs lg:text-sm text-slate-600 truncate">
                                      {patient.treatmentType} • By Dr. {patient.doctorName}
                                    </p>
                                    <p className="text-xs text-purple-600">Next: {patient.appointmentDate}</p>
                                  </div>
                                  <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${
                                    patient.progressStatus === 'Active' || !patient.progressStatus ? 'bg-green-100 text-green-800 border-green-200' :
                                    patient.progressStatus === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}>
                                    {patient.progressStatus || "Active"}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 lg:py-12 text-slate-500">
                              <div className="w-12 lg:w-16 h-12 lg:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-6 lg:w-8 h-6 lg:h-8 text-slate-400" />
                              </div>
                              <p className="text-base lg:text-lg font-medium">No patients assigned yet</p>
                              <p className="text-xs lg:text-sm">Patients will appear here when doctors assign treatments</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="xl:col-span-1 space-y-4 lg:space-y-6">
                      {/* Quick Stats */}
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100/50 shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Activity className="w-5 h-5 text-emerald-600 mr-2" />
                          Today's Activity
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Sessions Completed</span>
                            <span className="font-bold text-emerald-600">{therapyStats.completed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Patients Improved</span>
                            <span className="font-bold text-blue-600">{therapyStats.improved}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Scheduled Today</span>
                            <span className="font-bold text-amber-600">{dailySchedule.length}</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Recent Messages */}
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100/50 shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <MessageCircle className="w-5 h-5 text-purple-600 mr-2" />
                          Recent Messages
                          {messages.filter(m => !m.read).length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                              {messages.filter(m => !m.read).length}
                            </span>
                          )}
                        </h3>
                        <div className="space-y-3">
                          {messages.slice(0, 3).map(message => (
                            <div key={message.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-sm font-medium text-purple-800">{message.from}</p>
                              <p className="text-xs text-purple-600 truncate">{message.message}</p>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleNavClick('messages')}
                          className="w-full mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                        >
                          View All Messages
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Other sections remain the same as in the original TherapistDashboard but with improved responsive classes... */}
              {activeSection === "patients" && (
                <motion.div key="patients" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  {/* Patient Cards */}
                  <div className="grid gap-4 sm:gap-6">
                    {assignedPatients
                      .filter(patient => 
                        patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        patient.treatmentType.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((patient, index) => (
                        <motion.div
                          key={patient.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 p-4 sm:p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                                {patient.patientName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-800 text-base sm:text-lg truncate">{patient.patientName}</h3>
                                <p className="text-sm text-slate-600 truncate">{patient.treatmentType}</p>
                                <p className="text-xs text-purple-600 truncate">Assigned by Dr. {patient.doctorName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                patient.progressStatus === 'Active' || !patient.progressStatus ? 'bg-green-100 text-green-800' :
                                patient.progressStatus === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {patient.progressStatus || 'Active'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-slate-500">Next Session:</span>
                              <p className="font-medium text-slate-800">{patient.appointmentDate}</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Time:</span>
                              <p className="font-medium text-slate-800">{patient.appointmentTime}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-medium text-slate-800 mb-2">Treatment Protocol:</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{patient.detailedProtocol}</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setActiveSection('progress');
                              }}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium"
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span>Update Progress</span>
                            </button>
                            
                            <button
                              onClick={() => handleNavClick('messages')}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Message Doctor</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}

                    {assignedPatients.length === 0 && (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-600 mb-2">No patients assigned</p>
                        <p className="text-slate-500">Patients will appear here when doctors assign treatments</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Progress Section */}
              {activeSection === "progress" && (
                <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-3" />
                      Update Patient Progress
                    </h2>

                    {selectedPatient && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 mb-6 border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-3">Selected Patient</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium">Patient:</span> {selectedPatient.patientName}</div>
                          <div><span className="font-medium">Treatment:</span> {selectedPatient.treatmentType}</div>
                          <div><span className="font-medium">Doctor:</span> {selectedPatient.doctorName}</div>
                          <div><span className="font-medium">Next Session:</span> {selectedPatient.appointmentDate}</div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleProgressSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
                          <select
                            value={progressUpdate.patientId}
                            onChange={(e) => {
                              const patient = assignedPatients.find(p => p.id === e.target.value);
                              setSelectedPatient(patient);
                              setProgressUpdate({ ...progressUpdate, patientId: e.target.value });
                            }}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                            required
                          >
                            <option value="">Choose a patient...</option>
                            {assignedPatients.map(patient => (
                              <option key={patient.id} value={patient.id}>
                                {patient.patientName} - {patient.treatmentType}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Progress Status</label>
                          <select
                            value={progressUpdate.status}
                            onChange={(e) => setProgressUpdate({ ...progressUpdate, status: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                            required
                          >
                            <option value="">Select progress status...</option>
                            <option value="Excellent Progress">🌟 Excellent Progress</option>
                            <option value="Good Progress">✅ Good Progress</option>
                            <option value="Moderate Progress">⚡ Moderate Progress</option>
                            <option value="Slow Progress">⏳ Slow Progress</option>
                            <option value="No Change">⏸️ No Change</option>
                            <option value="Completed">🎉 Treatment Completed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Progress Notes</label>
                        <textarea
                          rows={6}
                          value={progressUpdate.notes}
                          onChange={(e) => setProgressUpdate({ ...progressUpdate, notes: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base"
                          placeholder="Detailed progress notes, observations, recommendations, and next steps..."
                          required
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-700 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Update Progress</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setProgressUpdate({ patientId: '', status: '', notes: '', milestones: [], nextSession: '' });
                            setSelectedPatient(null);
                          }}
                          className="sm:flex-none px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                        >
                          Clear Form
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Messages Section */}
              {activeSection === "messages" && (
                <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[500px] sm:h-[600px] flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-3" />
                        Doctor Communications
                      </h2>
                      <p className="text-sm text-slate-600">Real-time messaging with treating physicians</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.from === displayName ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                            message.from === displayName
                              ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {message.from !== displayName && (
                              <p className="text-xs font-medium text-purple-600 mb-1">{message.from}</p>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.from === displayName ? 'text-purple-100' : 'text-slate-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border border-slate-300 rounded-2xl px-4 py-2 sm:py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        />
                        
                        <button
                          type="button"
                          onClick={() => setIsRecording(!isRecording)}
                          className={`p-2 rounded-xl transition-colors ${
                            isRecording ? 'text-red-600 bg-red-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-2 sm:p-3 rounded-2xl hover:from-purple-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Schedule Section */}
              {activeSection === "schedule" && (
                <motion.div key="schedule" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mr-3" />
                        Daily Schedule
                      </h2>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="date"
                          value={selectedDate.toISOString().split('T')[0]}
                          onChange={(e) => setSelectedDate(new Date(e.target.value))}
                          className="border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                        />
                        
                        <button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 font-medium flex items-center justify-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Add Session</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {dailySchedule.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:shadow-md transition-shadow"
                        >
                          <div className="text-center sm:text-left sm:w-20">
                            <p className="text-lg font-bold text-amber-800">{item.time}</p>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 truncate">{item.patient}</h3>
                            <p className="text-sm text-slate-600 truncate">{item.type}</p>
                          </div>
                          
                          <div className="text-center sm:text-right">
                            <p className="text-sm font-medium text-amber-700">{item.duration} min</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              item.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                              item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex justify-center sm:justify-end space-x-2">
                            <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white transition-all">
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white transition-all">
                              <Video className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {dailySchedule.length === 0 && (
                        <div className="text-center py-12">
                          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-slate-600 mb-2">No appointments today</p>
                          <p className="text-slate-500">Your daily schedule will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Profile Section */}
              {activeSection === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">{displayName}</h2>
                      <p className="text-slate-600 text-lg">{therapistInfo?.specialization || 'Ayurvedic Therapist'}</p>
                      
                      <div className="flex justify-center items-center space-x-4 mt-4">
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                          <span className="ml-2 text-sm text-slate-600">4.9 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                            <Award className="w-5 h-5 text-green-600 mr-2" />
                            Professional Information
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                              <label className="text-sm font-medium text-slate-600">Specialization</label>
                              <p className="text-slate-800 font-medium">{therapistInfo?.specialization || 'Panchakarma Therapy'}</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4">
                              <label className="text-sm font-medium text-slate-600">Experience</label>
                              <p className="text-slate-800 font-medium">8+ years in Ayurvedic therapy</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4">
                              <label className="text-sm font-medium text-slate-600">Certifications</label>
                              <div className="space-y-2 mt-2">
                                <p className="text-sm text-slate-700 flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                  Certified Ayurvedic Therapist
                                </p>
                                <p className="text-sm text-slate-700 flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                  Panchakarma Specialist
                                </p>
                                <p className="text-sm text-slate-700 flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                  Marma Therapy Certified
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                            Contact Information
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-3">
                              <Phone className="w-5 h-5 text-slate-500" />
                              <div>
                                <label className="text-sm font-medium text-slate-600">Phone</label>
                                <p className="text-slate-800 font-medium">+91 9876543210</p>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-3">
                              <Mail className="w-5 h-5 text-slate-500" />
                              <div>
                                <label className="text-sm font-medium text-slate-600">Email</label>
                                <p className="text-slate-800 font-medium">therapist@ayurmitra.com</p>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-3">
                              <MapPin className="w-5 h-5 text-slate-500" />
                              <div>
                                <label className="text-sm font-medium text-slate-600">Location</label>
                                <p className="text-slate-800 font-medium">AyurMitra Wellness Center</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">About Me</h3>
                        <div className="bg-slate-50 rounded-xl p-6">
                          <p className="text-slate-600 leading-relaxed">
                            {therapistInfo?.description || 
                            'Dedicated Ayurvedic therapist with extensive experience in traditional healing methods. Specialized in Panchakarma treatments, Marma therapy, and holistic wellness approaches. Committed to providing personalized care for optimal health and wellbeing. My approach combines ancient Ayurvedic wisdom with modern therapeutic techniques to ensure the best possible outcomes for my patients.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-200">
                        <button
                          onClick={handleLogout}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Sign Out Securely</span>
                        </button>
                      </div>
                    </div>
                  </div>
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
