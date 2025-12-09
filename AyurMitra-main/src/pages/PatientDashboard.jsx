// src/pages/PatientDashboard.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Activity,
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Pill,
  Menu,
  BarChart3,
  LogOut,
  Star,
  ArrowRight,
  Bot,
  Sparkles,
  Heart,
} from "lucide-react";
import axios from "axios";

// Chart.js for Therapy Progress
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Recharts for Wellness Tracking
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

// Component imports
import ConsultationHistory from "../components/ConsultationHistory";
import PatientPrescriptions from "../components/PatientPrescriptions";
import PatientProfileForm from "../components/PatientProfileForm";
import AppointmentBooking from "../components/AppointmentBooking";
import PatientFeedbackForm from "../components/PatientFeedbackForm";
import NotificationCenter from "../components/NotificationCenter";
import AyurBotModal from "../components/AyurBotModal";

// register chart.js parts
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

// API Setup
const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PatientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State Management
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // AyurBot State
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Feedback
  const [selectedSessionForFeedback, setSelectedSessionForFeedback] =
    useState(null);

  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    upcomingConsultations: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0,
    wellnessScore: 82,
  });

  // Therapy Progress state
  const [therapyData, setTherapyData] = useState({
    totalTreatmentDays: 21,
    purvaDaysCompleted: 7,
    pradhanaDaysCompleted: 5,
    paschatDaysCompleted: 2,
  });

  // Wellness tracking (static for now; you can wire API later)
  const wellnessData = [
    { date: "Week 1", score: 65 },
    { date: "Week 2", score: 70 },
    { date: "Week 3", score: 75 },
    { date: "Week 4", score: 78 },
    { date: "Week 5", score: 82 },
    { date: "Week 6", score: 85 },
  ];

  // Sidebar Configuration (BOOK APPOINTMENT REMOVED)
  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview of your wellness journey",
    },
    {
      id: "consultations",
      label: "My Consultations",
      icon: Activity,
      description: "View consultation history",
    },
    {
      id: "prescriptions",
      label: "My Prescriptions",
      icon: Pill,
      description: "Manage your prescriptions",
    },
    {
      id: "feedback",
      label: "Give Feedback",
      icon: MessageSquare,
      description: "Share your experience",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      description: "Update your information",
    },
  ];

  // Sync with URL hash
  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (hash && sidebarItems.some((s) => s.id === hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  // Initialize Dashboard
  useEffect(() => {
    initializeDashboard();
  }, []);

  // Keyboard Shortcut for AyurBot (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setChatbotOpen(true);
      }
      if (e.key === "Escape" && chatbotOpen) {
        setChatbotOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [chatbotOpen]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const profileResp = await api.get("/auth/profile");

      if (profileResp.data?.success) {
        const u = profileResp.data.data.user;
        setUser(u);

        await Promise.all([
          fetchConsultations(u.id || u._id),
          fetchPrescriptions(u.id || u._id),
          fetchPatientProfile(u.id || u._id),
          fetchTherapyData(u.id || u._id),
        ]);
      } else {
        setError("Authentication failed. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Dashboard init error:", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async (userId) => {
    try {
      const res = await api.get(`/consultations/patient/${userId}`);
      if (res.data?.success) {
        const arr = res.data.data || [];
        setConsultations(arr);
        setStats((prev) => ({
          ...prev,
          totalConsultations: arr.length,
          completedConsultations: arr.filter(
            (c) => c.status === "completed"
          ).length,
          upcomingConsultations: arr.filter(
            (c) =>
              c.status === "scheduled" &&
              new Date(c.scheduledAt) > new Date()
          ).length,
        }));
      }
    } catch (err) {
      console.error("Fetch consultations error:", err);
      setConsultations([]);
    }
  };

  const fetchPrescriptions = async (userId) => {
    try {
      const res = await api.get(`/prescriptions/patient/${userId}`);
      if (res.data?.success) {
        const pres = res.data.data?.prescriptions || res.data.data || [];
        setPrescriptions(pres);
        setStats((prev) => ({
          ...prev,
          totalPrescriptions: pres.length,
          activePrescriptions: pres.filter(
            (p) => p.status === "active"
          ).length,
        }));
      }
    } catch (err) {
      console.error("Fetch prescriptions error:", err);
      setPrescriptions([]);
    }
  };

  const fetchPatientProfile = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/profile`);
      if (res.data?.success) {
        setProfile(res.data.data.profile);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  // Therapy plan from backend (if available)
  const fetchTherapyData = async (userId) => {
    try {
      const res = await api.get("/patient/treatmentplan");
      if (res.data?.success && res.data.data) {
        const plan = res.data.data;
        setTherapyData({
          totalTreatmentDays: plan.totalTreatmentDays || 21,
          purvaDaysCompleted: plan.purvaDaysCompleted || 7,
          pradhanaDaysCompleted: plan.pradhanaDaysCompleted || 5,
          paschatDaysCompleted: plan.paschatDaysCompleted || 2,
        });
      }
    } catch (err) {
      console.error("fetchTherapyData error:", err);
    }
  };

  const handleBookingComplete = async (bookingData) => {
    try {
      const res = await api.post("/bookings", {
        patientId: user.id || user._id,
        ...bookingData,
      });
      if (res.data?.success) {
        setSuccess("🎉 Appointment booked successfully!");
        await fetchConsultations(user.id || user._id);
        setTimeout(() => {
          setActiveSection("consultations");
          setSuccess("");
        }, 2000);
      } else {
        setError("Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      const res = await api.put(
        `/patients/${user.id || user._id}/profile`,
        updatedProfile
      );
      if (res.data?.success) {
        setProfile(res.data.data.profile);
        setSuccess("✅ Profile updated successfully!");
      } else {
        setProfile(updatedProfile);
        setSuccess("Profile updated locally.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      localStorage.setItem("patientProfile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setSuccess("Profile saved locally.");
    } finally {
      setActiveSection("dashboard");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle feedback navigation from consultation
  const handleGiveFeedback = (consultation) => {
    setSelectedSessionForFeedback({
      sessionId: consultation._id,
      providerId: consultation.providerId?._id || consultation.providerId,
      therapyType: consultation.therapyData?.therapyType || "panchakarma",
      sessionType: consultation.sessionType || "therapy_session",
    });
    setActiveSection("feedback");
    window.location.hash = "feedback";
  };

  const handleFeedbackSuccess = () => {
    setSuccess("🙏 Thank you for your valuable feedback!");
    setSelectedSessionForFeedback(null);
    setTimeout(() => {
      setSuccess("");
      setActiveSection("dashboard");
      window.location.hash = "dashboard";
    }, 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getDisplayName = () =>
    user?.name || user?.firstName || profile?.name || "Patient";
  const getPatientId = () => user?.id || user?._id || null;

  // Chart helpers
  const createDoughnutData = (completed, total, color = "#10b981") => {
    const cap = Math.min(completed, total || 0);
    const remaining = Math.max((total || 0) - cap, 0);
    return {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [cap, remaining],
          backgroundColor: [color, "#e5e7eb"],
          borderWidth: 0,
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: "70%",
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-600">Preparing your wellness journey...</p>
        </motion.div>
      </div>
    );
  }

  // Render Content Based on Active Section
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardContent
            stats={stats}
            therapyData={therapyData}
            wellnessData={wellnessData}
            getDisplayName={getDisplayName}
            consultations={consultations}
            prescriptions={prescriptions}
            setActiveSection={setActiveSection}
            onGiveFeedback={handleGiveFeedback}
            onOpenChatbot={() => setChatbotOpen(true)}
            createDoughnutData={createDoughnutData}
            doughnutOptions={doughnutOptions}
          />
        );

      case "book-appointment":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AppointmentBooking
              user={user}
              onBookingComplete={handleBookingComplete}
            />
          </motion.div>
        );

      case "consultations":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConsultationHistory
              patientId={getPatientId()}
              onBookFirst={() => setActiveSection("book-appointment")}
              onBack={() => setActiveSection("dashboard")}
              onFeedbackClick={handleGiveFeedback}
            />
          </motion.div>
        );

      case "prescriptions":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PatientPrescriptions
              prescriptions={prescriptions}
              patientId={getPatientId()}
            />
          </motion.div>
        );

      case "feedback":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PatientFeedbackForm
              sessionId={selectedSessionForFeedback?.sessionId || null}
              providerId={selectedSessionForFeedback?.providerId || null}
              therapyType={
                selectedSessionForFeedback?.therapyType || "panchakarma"
              }
              sessionType={
                selectedSessionForFeedback?.sessionType || "therapy_session"
              }
              onSuccess={handleFeedbackSuccess}
            />
          </motion.div>
        );

      case "profile":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PatientProfileForm
              profile={profile}
              onComplete={handleProfileUpdate}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const sectionTitle =
    sidebarItems.find((s) => s.id === activeSection)?.label || "Dashboard";
  const sectionDescription =
    sidebarItems.find((s) => s.id === activeSection)?.description || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50">
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out shadow-xl
            lg:translate-x-0 lg:static lg:z-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AyurMitra
              </h2>
              <p className="text-xs text-gray-600">Wellness Journey</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="h-[calc(100vh-5rem)] overflow-y-auto p-4">
            {/* User Profile Card */}
            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl font-bold">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {getDisplayName()}
                  </h3>
                  <p className="text-xs text-emerald-50 truncate">
                    {user?.email || "patient@ayurmitra.com"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                <span className="text-emerald-50">Total Sessions</span>
                <span className="font-bold">{stats.totalConsultations}</span>
              </div>
            </div>

            {/* AyurBot Quick Access Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setChatbotOpen(true)}
              className="w-full mb-4 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold flex items-center gap-2">
                    Smart Appointment Booking
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-xs text-blue-100">
                    AI-powered guidance
                  </div>
                </div>
              </div>
              <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" />
            </motion.button>

            {/* Navigation Items */}
            <nav className="space-y-2">
              {sidebarItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                    window.location.hash = item.id;
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    font-medium transition-all duration-200 group
                    ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <div
                    className={`
                    w-10 h-10 rounded-lg flex items-center justify-center transition-all
                    ${
                      activeSection === item.id
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }
                  `}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-all">
                  <LogOut className="w-5 h-5" />
                </div>
                <span>Logout</span>
              </button> */}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {sectionTitle}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {sectionDescription}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* AyurBot Quick Button (Desktop) */}
              <button
                onClick={() => setChatbotOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 active:scale-95 font-medium"
                title="Press Ctrl+K to open"
              >
                <Bot className="w-5 h-5" />
                <span className="hidden lg:inline">AyurBot</span>
              </button>

              <NotificationCenter userId={getPatientId()} />

              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {getDisplayName()}
                  </div>
                  <div className="text-xs text-gray-600">Patient</div>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              {/* Alert Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 shadow-sm"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 flex-1">{error}</span>
                    <button
                      onClick={() => setError("")}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-center gap-3 shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-800 flex-1">{success}</span>
                    <button
                      onClick={() => setSuccess("")}
                      className="p-1 hover:bg-emerald-100 rounded"
                    >
                      <X className="w-4 h-4 text-emerald-600" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Buttons (dashboard only) */}
      {activeSection === "dashboard" && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
          {/* Book Appointment */}
          {/* <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection("book-appointment")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline font-medium">Book Now</span>
          </motion.button> */}

          {/* AyurBot */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatbotOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all relative group"
          >
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline font-medium">AyurBot</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </motion.button>
        </div>
      )}

      {/* AyurBot Modal */}
      <AyurBotModal open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
};

/* DASHBOARD CONTENT WITH THERAPY PROGRESS + WELLNESS TRACKING */
const DashboardContent = ({
  stats,
  therapyData,
  wellnessData,
  getDisplayName,
  consultations,
  prescriptions,
  setActiveSection,
  onGiveFeedback,
  onOpenChatbot,
  createDoughnutData,
  doughnutOptions,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {getDisplayName()}! 🌿
              </h1>
              <p className="text-emerald-50 text-lg">
                Continue your Ayurvedic wellness journey
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="text-right">
                <div className="text-sm text-emerald-50 mb-1">
                  Wellness Score
                </div>
                <div className="text-4xl font-extrabold flex items-center justify-end gap-2">
                  {stats.wellnessScore}
                  <Heart className="w-5 h-5 text-emerald-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              {
                label: "Sessions",
                value: stats.completedConsultations,
                icon: CheckCircle,
              },
              {
                label: "Upcoming",
                value: stats.upcomingConsultations,
                icon: Calendar,
              },
              {
                label: "Prescriptions",
                value: stats.activePrescriptions,
                icon: Pill,
              },
              {
                label: "Total Visits",
                value: stats.totalConsultations,
                icon: Activity,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="text-sm text-emerald-50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Therapy Progress + Wellness Tracking */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Therapy Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Therapy Progress
          </h2>
          {(() => {
            const data =
              therapyData && therapyData.totalTreatmentDays
                ? therapyData
                : {
                    totalTreatmentDays: 21,
                    purvaDaysCompleted: 7,
                    pradhanaDaysCompleted: 5,
                    paschatDaysCompleted: 2,
                  };

            const phases = [
              {
                name: "Purva Karma",
                completed: data.purvaDaysCompleted,
                total: data.totalTreatmentDays,
                color: "#10b981",
              },
              {
                name: "Pradhana Karma",
                completed: data.pradhanaDaysCompleted,
                total: data.totalTreatmentDays,
                color: "#f59e0b",
              },
              {
                name: "Paschat Karma",
                completed: data.paschatDaysCompleted,
                total: data.totalTreatmentDays,
                color: "#6366f1",
              },
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {phases.map((phase) => (
                  <div key={phase.name} className="text-center">
                    <div className="relative h-40 mb-3">
                      <Doughnut
                        data={createDoughnutData(
                          phase.completed,
                          phase.total,
                          phase.color
                        )}
                        options={doughnutOptions}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl font-bold text-gray-900">
                          {Math.round(
                            (Math.min(phase.completed, phase.total) /
                              phase.total) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          {phase.name}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {Math.min(phase.completed, phase.total)}/
                          {phase.total} days
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Wellness Tracking */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Wellness Tracking
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={wellnessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSection("book-appointment")}
          className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            Book Appointment
          </h3>
          <p className="text-sm text-gray-600">Schedule your next session</p>
        </motion.button> */}

        {/* AyurBot Quick Action Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenChatbot}
          className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              Ask AyurBot
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </h3>
            <p className="text-sm text-gray-600">AI-powered health guidance</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSection("prescriptions")}
          className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Prescriptions</h3>
          <p className="text-sm text-gray-600">View your medications</p>
        </motion.button>
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Consultations
          </h2>
          <button
            onClick={() => setActiveSection("consultations")}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {consultations?.length > 0 ? (
          <div className="space-y-3">
            {consultations.slice(0, 5).map((consultation) => (
              <motion.div
                key={consultation._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {consultation.therapyData?.therapyName || "Consultation"}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>
                      {new Date(
                        consultation.scheduledAt
                      ).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(
                        consultation.scheduledAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {consultation.status === "completed" && (
                    <button
                      onClick={() => onGiveFeedback(consultation)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1"
                    >
                      <Star className="w-4 h-4" />
                      Feedback
                    </button>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      consultation.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : consultation.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {consultation.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Consultations Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your wellness journey by booking your first session
            </p>
            <button
              onClick={() => setActiveSection("book-appointment")}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Your First Session
            </button>
          </div>
        )}
      </div>

      {/* Active Prescriptions */}
      {prescriptions?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Active Prescriptions
            </h2>
            <button
              onClick={() => setActiveSection("prescriptions")}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {prescriptions.slice(0, 4).map((prescription) => (
              <div
                key={prescription._id}
                className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">
                    {prescription.medications?.[0]?.medicineName ||
                      "Prescription"}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {prescription.medications?.length || 0} medication(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
