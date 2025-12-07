import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Activity,
  MessageSquare,
  User,
  Heart,
  ArrowRight,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bell,
  TrendingUp,
  Shield,
  Plus,
  X,
  Pill,
  Settings,
  LogOut,
  Menu,
  Home,
  FileText,
  BarChart3,
  Sparkles,
  Zap
} from "lucide-react";
import axios from "axios";
import ConsultationHistory from "../components/ConsultationHistory";
import PatientPrescriptions from "../components/PatientPrescriptions";

// Components
import PatientProfileForm from "../components/PatientProfileForm";
import AppointmentBooking from "../components/AppointmentBooking";
import Feedback from "../components/Feedback";
import Footer from "../components/Footer";

// API Configuration
const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

// Auto-add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State for Feedback
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Data States
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    wellnessScore: 0,
    upcomingConsultations: 0,
    pendingFeedback: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0
  });

  // Modern Sidebar Navigation
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, gradient: "from-emerald-500 to-teal-600" },
    { id: "book-appointment", label: "Book Appointment", icon: Calendar, gradient: "from-blue-500 to-indigo-600" },
    { id: "consultations", label: "My Consultations", icon: Activity, gradient: "from-purple-500 to-pink-600" },
    { id: "prescriptions", label: "Prescriptions", icon: Pill, gradient: "from-orange-500 to-red-600" },
    { id: "profile", label: "Profile Settings", icon: User, gradient: "from-cyan-500 to-blue-600" },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize Dashboard with Proper APIs
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // Get user profile from auth
      const profileResponse = await api.get("/auth/profile");
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data.user;
        setUser(userData);

        // Fetch patient data using correct backend endpoints
        await Promise.all([
          fetchConsultations(userData.id || userData._id),
          fetchFeedback(userData.id || userData._id),
          fetchPatientProfile(userData.id || userData._id),
          fetchPrescriptions(userData.id || userData._id)
        ]);
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setError("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Consultations using correct endpoint
  const fetchConsultations = async (userId) => {
    try {
      console.log('🔄 Fetching consultations for patient:', userId);
      
      const response = await api.get(`/consultations/patient/${userId}?page=1&limit=50`);
      
      if (response.data.success) {
        const consultationsData = response.data.data || [];
        setConsultations(consultationsData);
        
        const totalConsultations = consultationsData.length;
        const completedConsultations = consultationsData.filter(c => c.status === 'completed').length;
        const upcomingConsultations = consultationsData.filter(c => 
          c.status === 'scheduled' && new Date(c.scheduledAt) > new Date()
        ).length;

        setStats(prev => ({
          ...prev,
          totalConsultations,
          completedConsultations,
          upcomingConsultations
        }));

        console.log('✅ Consultations loaded:', consultationsData.length);
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
      if (err.response?.status === 404) {
        console.log('No consultations found for this patient');
        setConsultations([]);
      }
    }
  };

  // Fetch Patient Prescriptions
  const fetchPrescriptions = async (userId) => {
    try {
      console.log('🔄 Fetching prescriptions for patient:', userId);
      
      const response = await api.get(`/prescriptions/patient/${userId}?page=1&limit=50`);
      
      if (response.data.success) {
        const prescriptionsData = response.data.data.prescriptions || [];
        setPrescriptions(prescriptionsData);
        
        const totalPrescriptions = prescriptionsData.length;
        const activePrescriptions = prescriptionsData.filter(p => p.status === 'active').length;

        setStats(prev => ({
          ...prev,
          totalPrescriptions,
          activePrescriptions
        }));

        console.log('✅ Prescriptions loaded:', prescriptionsData.length);
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    }
  };

  // Fetch Patient Feedback
  const fetchFeedback = async (userId) => {
    try {
      console.log('🔄 Fetching feedback for patient:', userId);
      
      const response = await api.get('/feedback/me?page=1&limit=20');
      
      if (response.data.success) {
        const feedbackData = response.data.data || [];
        setFeedback(feedbackData);
        
        const pendingFeedback = consultations.filter(consultation => 
          consultation.status === 'completed' && 
          !feedbackData.some(fb => fb.sessionId === consultation._id)
        ).length;

        setStats(prev => ({
          ...prev,
          pendingFeedback
        }));

        console.log('✅ Feedback loaded:', feedbackData.length);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  // Fetch Patient Profile from Backend
  const fetchPatientProfile = async (userId) => {
    try {
      const response = await api.get(`http://localhost:3003/api/users/${userId}/profile`);
      
      if (response.data.success) {
        setProfile(response.data.data.profile);
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
      const savedProfile = localStorage.getItem('user');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
  };

  // Handle Profile Update with Backend
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      const response = await api.put(`http://localhost:3003/patients/${user.id}/profile`, updatedProfile);
      
      if (response.data.success) {
        setProfile(response.data.data.profile);
        setSuccess("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      localStorage.setItem('patientProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setSuccess("Profile updated locally!");
    }
    
    setActiveSection("dashboard");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      
      if (response.data.success) {
        setSuccess("Feedback submitted successfully!");
        setIsFeedbackModalOpen(false);
        
        await fetchFeedback(user.id);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  // Book New Consultation
  const handleBookingComplete = async (bookingData) => {
    try {
      const response = await api.post('/bookings', {
        patientId: user.id,
        ...bookingData
      });
      
      if (response.data.success) {
        setSuccess("Appointment booked successfully!");
        
        await fetchConsultations(user.id);
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      
      if (err.response?.status === 409 && err.response?.data?.conflictInfo) {
        const conflictData = err.response.data;
        setError(`Time slot conflicts. ${conflictData.message || 'Please choose a different time.'}`);  
      } else {
        setError("Failed to book appointment. Please try again.");
      }
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Calculate Wellness Score
  const calculateWellnessScore = () => {
    if (stats.totalConsultations === 0) return 0;
    const completionRate = (stats.completedConsultations / stats.totalConsultations) * 100;
    return Math.min(Math.round(completionRate), 100);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Render Dashboard Content
  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <PatientProfileForm
            profile={profile}
            onUpdate={handleProfileUpdate}
            onCancel={() => setActiveSection("dashboard")}
          />
        );
      case "book-appointment":
        return (
          <AppointmentBooking
            patientId={user?.id}
            onBookingComplete={handleBookingComplete}
            onCancel={() => setActiveSection("dashboard")}
          />
        );
      case "consultations":
        return (
          <ConsultationHistory
            consultations={consultations}
            onFeedbackClick={() => setIsFeedbackModalOpen(true)}
          />
        );
      case "prescriptions":
        return (
          <PatientPrescriptions
            prescriptions={prescriptions}
            patientId={user?.id}
          />
        );
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name || profile?.name || "Patient"}! 👋
                  </h1>
                  <p className="text-emerald-100 text-lg">
                    Your health journey continues here
                  </p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{calculateWellnessScore()}%</div>
                    <div className="text-emerald-200 text-sm">Wellness Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Consultations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalConsultations}</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Activity className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcomingConsultations}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Prescriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activePrescriptions}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Pill className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Wellness Score</p>
                    <p className="text-2xl font-bold text-gray-900">{calculateWellnessScore()}%</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveSection("book-appointment")}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Book New Appointment</h3>
                    <p className="text-blue-100">Schedule your next consultation</p>
                  </div>
                  <Calendar className="w-8 h-8" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsFeedbackModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Share Feedback</h3>
                    <p className="text-purple-100">Help us improve our services</p>
                  </div>
                  <MessageSquare className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                {consultations.length > 0 ? (
                  <div className="space-y-4">
                    {consultations.slice(0, 3).map((consultation) => (
                      <div key={consultation._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Consultation with Dr. {consultation.doctorId?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(consultation.scheduledAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No consultations yet</p>
                    <button
                      onClick={() => setActiveSection("book-appointment")}
                      className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-lg"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              AyurMitra
            </h2>
            <p className="text-sm text-gray-600 mt-1">Patient Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {user?.name || profile?.name || "Patient"}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {user?.email || "patient@ayurmitra.com"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="p-4 lg:p-8">
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
                <button
                  onClick={() => setError("")}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{success}</span>
                <button
                  onClick={() => setSuccess("")}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Content */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <Feedback
                consultations={consultations.filter(c => c.status === 'completed')}
                onSubmit={handleFeedbackSubmit}
                onClose={() => setIsFeedbackModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default PatientDashboard;Data.alternativeMessage}`);
      } else {
        setError("Failed to book appointment. Please try again.");
      }
    }
  };

  // Modal Handlers
  const openFeedbackModal = () => {
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
  };

  // Get Display Name
  const getDisplayName = () => {
    return user?.name || user?.firstName || profile?.name || "Patient";
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Preparing Your Wellness Hub
          </h2>
          <p className="text-gray-600">
            Setting up your personalized Ayurvedic journey...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 bg-white border-l-4 border-emerald-500 text-emerald-700 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-sm"
          >
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-medium">{success}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 bg-white border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-sm"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 lg:translate-x-0 lg:static lg:w-72 border-r border-white/20"
      >
        <div className="p-6">
          {/* Logo & User Info */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">AyurMitra</h2>
              <p className="text-sm text-gray-600">Wellness Hub</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 truncate">{getDisplayName()}</h3>
                <p className="text-sm text-gray-600">Patient ID: #{user?.id?.slice(-6) || 'XXXXXX'}</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeSection === item.id
                    ? 'bg-white/20'
                    : 'bg-gray-100'
                }`}>
                  <item.icon className={`w-4 h-4 ${
                    activeSection === item.id ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings className="w-4 h-4" />
              <span className="font-medium">Settings</span>
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/patient-login');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-bold text-gray-800">AyurMitra</h1>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
              {getDisplayName().charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeSection === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Welcome Header */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2"
                      >
                        Welcome back, {getDisplayName()}! 👋
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 text-lg"
                      >
                        Your wellness journey continues today
                      </motion.p>
                    </div>
                    <div className="hidden lg:flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Today's Date</p>
                        <p className="font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modern Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                  {[
                    {
                      label: "Total Consultations",
                      value: stats.totalConsultations,
                      icon: Calendar,
                      gradient: "from-blue-500 to-indigo-600",
                      bgGradient: "from-blue-50 to-indigo-50",
                    },
                    {
                      label: "Completed Sessions",
                      value: stats.completedConsultations,
                      icon: CheckCircle,
                      gradient: "from-emerald-500 to-teal-600",
                      bgGradient: "from-emerald-50 to-teal-50",
                    },
                    {
                      label: "My Prescriptions",
                      value: stats.totalPrescriptions,
                      icon: Pill,
                      gradient: "from-purple-500 to-pink-600",
                      bgGradient: "from-purple-50 to-pink-50",
                    },
                    {
                      label: "Pending Feedback",
                      value: stats.pendingFeedback,
                      icon: MessageSquare,
                      gradient: "from-orange-500 to-red-600",
                      bgGradient: "from-orange-50 to-red-50",
                    },
                    {
                      label: "Wellness Score",
                      value: `${stats.wellnessScore || 8.5}/10`,
                      icon: TrendingUp,
                      gradient: "from-amber-500 to-yellow-600",
                      bgGradient: "from-amber-50 to-yellow-50",
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -8, scale: 1.05 }}
                      className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      id: "appointments",
                      title: "Book Appointment",
                      description: "Schedule consultation with our Ayurvedic specialists",
                      icon: Calendar,
                      gradient: "from-emerald-500 to-teal-600",
                      bgGradient: "from-emerald-50 to-teal-50",
                      action: () => setActiveSection("book-appointment"),
                    },
                    {
                      id: "consultations",
                      title: "My Consultations",
                      description: "View consultation history and upcoming appointments",
                      icon: Activity,
                      gradient: "from-blue-500 to-indigo-600",
                      bgGradient: "from-blue-50 to-indigo-50",
                      action: () => setActiveSection("consultations"),
                    },
                    {
                      id: "prescriptions",
                      title: "My Prescriptions",
                      description: "View and download your medication prescriptions",
                      icon: Pill,
                      gradient: "from-purple-500 to-pink-600",
                      bgGradient: "from-purple-50 to-pink-50",
                      action: () => setActiveSection("prescriptions"),
                    },
                    {
                      id: "profile",
                      title: "Update Profile",
                      description: "Manage your health information and preferences",
                      icon: User,
                      gradient: "from-orange-500 to-red-600",
                      bgGradient: "from-orange-50 to-red-50",
                      action: () => setActiveSection("profile"),
                    },
                    {
                      id: "feedback",
                      title: "Give Feedback",
                      description: "Share your experience and help us improve",
                      icon: MessageSquare,
                      gradient: "from-indigo-500 to-purple-600",
                      bgGradient: "from-indigo-50 to-purple-50",
                      action: openFeedbackModal,
                    },
                    {
                      id: "wellness",
                      title: "Wellness Tracker",
                      description: "Monitor symptoms and wellness metrics",
                      icon: Heart,
                      gradient: "from-pink-500 to-rose-600",
                      bgGradient: "from-pink-50 to-rose-50",
                      action: () => setActiveSection("wellness"),
                    },
                  ].map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={card.action}
                      className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-xl hover:shadow-2xl cursor-pointer group transition-all duration-300`}
                    >
                      <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <card.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-700">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{card.description}</p>
                      <div className="flex items-center text-gray-700 group-hover:text-gray-800 group-hover:translate-x-2 transition-all duration-300">
                        <span className="font-semibold">Get started</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Consultations */}
                {consultations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            Recent Consultations
                          </h2>
                          <p className="text-gray-600">Your latest healthcare interactions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection("consultations")}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {consultations
                        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                        .slice(0, 3)
                        .map((consultation, index) => (
                          <motion.div
                            key={consultation._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Calendar className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-lg mb-1">
                                {consultation.type === 'video' ? 'Video Consultation' : 
                                 consultation.type === 'audio' ? 'Audio Consultation' : 
                                 'In-Person Consultation'}
                              </div>
                              <div className="text-gray-600 mb-2">
                                {new Date(consultation.scheduledAt).toLocaleDateString()} at{' '}
                                {new Date(consultation.scheduledAt).toLocaleTimeString()}
                              </div>
                              <div className="text-gray-700 font-medium">
                                Dr. {consultation.providerId?.name || 'Provider'}
                              </div>
                            </div>
                            <div
                              className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                                consultation.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : consultation.status === "scheduled"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : consultation.status === "cancelled"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Profile Section */}
            {activeSection === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection("dashboard")}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Dashboard
                  </motion.button>
                </div>
                <PatientProfileForm
                  profile={profile}
                  onComplete={handleProfileUpdate}
                />
              </motion.div>
            )}

            {/* Appointment Booking */}
            {activeSection === "book-appointment" && (
              <motion.div
                key="book-appointment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection("dashboard")}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Dashboard
                  </motion.button>
                </div>
                <AppointmentBooking 
                  user={user} 
                  onBookingComplete={handleBookingComplete}
                />
              </motion.div>
            )}

            {/* Consultations History Section */}
            {activeSection === "consultations" && (
              <ConsultationHistory
                patientId={user?.id || user?._id}
                onBookFirst={() => setActiveSection("book-appointment")}
              />
            )}

            {/* Prescriptions Section */}
            {activeSection === "prescriptions" && (
              <motion.div
                key="prescriptions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PatientPrescriptions
                  patientId={user?.id || user?._id}
                  onBack={() => setActiveSection("dashboard")}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Feedback Modal with Backend Integration */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeFeedbackModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-800">
                      Treatment Feedback
                    </h2>
                    <p className="text-sm text-gray-600">
                      Share your experience to help us improve
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeFeedbackModal}
                  className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <Feedback 
                  consultations={consultations.filter(c => c.status === 'completed')}
                  onSubmit={handleFeedbackSubmit}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {activeSection === "dashboard" && <Footer />}
    </div>
  );
};

export default PatientDashboard;