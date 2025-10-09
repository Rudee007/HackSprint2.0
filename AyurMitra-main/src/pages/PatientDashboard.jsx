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
} from "lucide-react";
import axios from "axios";
import ConsultationHistory from "../components/ConsultationHistory";

// Components
import PatientProfileForm from "../components/PatientProfileForm";
import AppointmentBooking from "../components/AppointmentBooking";
import Feedback from "../components/Feedback";
import Footer from "../components/Footer";

// 🔥 UPDATED API Configuration
const api = axios.create({
  baseURL: "http://localhost:3003/api", // Match your backend port
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

// Handle auth errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

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
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    wellnessScore: 0,
    upcomingConsultations: 0,
    pendingFeedback: 0
  });

  // 🔥 UPDATED: Initialize Dashboard with Proper APIs
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // if (!token) {
      //   navigate("/patient-login");
      //   return;
      // }

      // 🔥 Get user profile from auth
      const profileResponse = await api.get("/auth/profile");
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data.user;
        setUser(userData);

        // 🔥 Fetch patient data using correct backend endpoints
        await Promise.all([
          fetchConsultations(userData.id || userData._id),
          fetchFeedback(userData.id || userData._id),
          fetchPatientProfile(userData.id || userData._id)
        ]);
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setError("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATED: Fetch Consultations using correct endpoint
  const fetchConsultations = async (userId) => {
    try {
      console.log('🔄 Fetching consultations for patient:', userId);
      
      // Using the correct backend endpoint
      const response = await api.get(`/consultations/patient/${userId}?page=1&limit=50`);
      
      if (response.data.success) {
        const consultationsData = response.data.data || [];
        setConsultations(consultationsData);
        
        // Calculate stats from real data
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
      // Don't fail silently - show user-friendly error
      if (err.response?.status === 404) {
        console.log('No consultations found for this patient');
        setConsultations([]);
      }
    }
  };

  // 🔥 NEW: Fetch Patient Feedback
  const fetchFeedback = async (userId) => {
    try {
      console.log('🔄 Fetching feedback for patient:', userId);
      
      // Get patient's own feedback
      const response = await api.get('/feedback/me?page=1&limit=20');
      
      if (response.data.success) {
        const feedbackData = response.data.data || [];
        setFeedback(feedbackData);
        
        // Calculate pending feedback (consultations without feedback)
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

  // 🔥 NEW: Fetch Patient Profile from Backend
  const fetchPatientProfile = async (userId) => {
    try {
      // This would need a patient profile endpoint in your backend
      const response = await api.get(`http://localhost:3003/api/users/${userId}/profile`);
      
      if (response.data.success) {
        setProfile(response.data.data.profile);
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
      // Fallback to localStorage if backend doesn't have profile
      const savedProfile = localStorage.getItem('user');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
  };

  // 🔥 UPDATED: Handle Profile Update with Backend
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      // Try to save to backend first
      const response = await api.put(`http://localhost:3003/patients/${user.id}/profile`, updatedProfile);
      
      if (response.data.success) {
        setProfile(response.data.data.profile);
        setSuccess("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      // Fallback to localStorage
      localStorage.setItem('patientProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setSuccess("Profile updated locally!");
    }
    
    setActiveSection("dashboard");
    setTimeout(() => setSuccess(""), 3000);
  };

  // 🔥 NEW: Handle Feedback Submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      
      if (response.data.success) {
        setSuccess("Feedback submitted successfully!");
        setIsFeedbackModalOpen(false);
        
        // Refresh feedback data
        await fetchFeedback(user.id);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  // 🔥 NEW: Book New Consultation
  const handleBookingComplete = async (bookingData) => {
    try {
      const response = await api.post('/bookings', {
        patientId: user.id,
        ...bookingData
      });
      
      if (response.data.success) {
        setSuccess("Appointment booked successfully!");
        
        // Refresh consultations
        await fetchConsultations(user.id);
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      
      // Handle conflict errors with alternative slots
      if (err.response?.status === 409 && err.response?.data?.conflictInfo) {
        const conflictData = err.response.data;
        setError(`Time slot conflicts. ${conflictData.alternativeMessage}`);
        // You could show alternative slots UI here
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-700">
            Loading your wellness dashboard...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we prepare your personalized experience
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50"
    >
      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-emerald-100 border border-emerald-400 text-emerald-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeSection === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Welcome Section */}
              <div className="text-center mb-12">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-emerald-800 mb-4"
                >
                  Welcome back, {getDisplayName()}! 🌿
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-gray-600 max-w-2xl mx-auto"
                >
                  Track your Ayurvedic journey and manage your holistic health with ease
                </motion.p>
              </div>

              {/* 🔥 UPDATED: Quick Stats with Real Data */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
                {[
                  {
                    label: "Total Consultations",
                    value: stats.totalConsultations,
                    icon: Calendar,
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                  },
                  {
                    label: "Completed Sessions",
                    value: stats.completedConsultations,
                    icon: CheckCircle,
                    color: "text-emerald-600",
                    bg: "bg-emerald-100",
                  },
                  {
                    label: "Upcoming",
                    value: stats.upcomingConsultations,
                    icon: Bell,
                    color: "text-purple-600",
                    bg: "bg-purple-100",
                  },
                  {
                    label: "Pending Feedback",
                    value: stats.pendingFeedback,
                    icon: MessageSquare,
                    color: "text-orange-600",
                    bg: "bg-orange-100",
                  },
                  {
                    label: "Wellness Score",
                    value: `${stats.wellnessScore || 8.5}/10`,
                    icon: TrendingUp,
                    color: "text-amber-600",
                    bg: "bg-amber-100",
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Action Cards - Same as before but with updated handlers */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    id: "appointments",
                    title: "Book Appointment",
                    description: "Schedule consultation with our Ayurvedic specialists",
                    icon: Calendar,
                    gradient: "from-emerald-500 to-teal-600",
                    action: () => setActiveSection("book-appointment"),
                  },
                  {
                    id: "profile",
                    title: "Update Profile",
                    description: "Manage your health information and preferences",
                    icon: User,
                    gradient: "from-blue-500 to-indigo-600",
                    action: () => setActiveSection("profile"),
                  },
                  {
                    id: "consultations",
                    title: "My Consultations",
                    description: "View consultation history and upcoming appointments",
                    icon: Activity,
                    gradient: "from-amber-500 to-orange-600",
                    action: () => setActiveSection("consultations"),
                  },
                  {
                    id: "wellness",
                    title: "Wellness Tracker",
                    description: "Monitor symptoms and wellness metrics",
                    icon: Heart,
                    gradient: "from-pink-500 to-rose-600",
                    action: () => setActiveSection("wellness"),
                  },
                  {
                    id: "feedback",
                    title: "Give Feedback",
                    description: "Share your experience and help us improve",
                    icon: MessageSquare,
                    gradient: "from-purple-500 to-violet-600",
                    action: openFeedbackModal,
                  },
                  {
                    id: "support",
                    title: "Get Support",
                    description: "Contact our support team for assistance",
                    icon: Shield,
                    gradient: "from-cyan-500 to-blue-600",
                    action: () => setActiveSection("support"),
                  },
                ].map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={card.action}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group"
                  >
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <card.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-700">
                      {card.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                    <div className="flex items-center text-emerald-600 group-hover:translate-x-1 transition-transform">
                      <span className="font-medium">Get started</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 🔥 UPDATED: Recent Activity with Real Consultation Data */}
              {consultations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Recent Consultations
                  </h2>
                  <div className="space-y-4">
                    {consultations
                      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                      .slice(0, 3)
                      .map((consultation, index) => (
                        <div
                          key={consultation._id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {consultation.type === 'video' ? 'Video Consultation' : 
                               consultation.type === 'audio' ? 'Audio Consultation' : 
                               'In-Person Consultation'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(consultation.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(consultation.scheduledAt).toLocaleTimeString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              Dr. {consultation.providerId?.name || 'Provider'}
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              consultation.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : consultation.status === "scheduled"
                                ? "bg-blue-100 text-blue-700"
                                : consultation.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                          </div>
                        </div>
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

          {/* 🔥 NEW: Consultations History Section */}
          {activeSection === "consultations" && (
  <ConsultationHistory
    patientId={user?.id || user?._id}
    onBookFirst={() => setActiveSection("book-appointment")}
  />
)}

        </AnimatePresence>
      </div>

      {/* 🔥 UPDATED: Feedback Modal with Backend Integration */}
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
    </motion.div>
  );
};

export default PatientDashboard;
