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

// Components
import PatientProfileForm from "../components/PatientProfileForm";
import AppointmentBooking from "../components/AppointmentBooking";
import Feedback from "../components/Feedback"; // Import the Feedback component
import Footer from "../components/Footer";

// API Configuration
const api = axios.create({
  baseURL: "http://localhost:3000/api",
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Main Dashboard Component
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
  const [hasProfile, setHasProfile] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedTreatments: 0,
    wellnessScore: 0,
    upcomingAppointments: 0,
  });

  // Initialize Dashboard Data
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch user profile
      const profileResponse = await api.get("/auth/profile");
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data.user;
        const userProfile = userData.profile;

        setUser(userData);
        setProfile(userProfile);

        // Check if profile is complete
        setHasProfile(isProfileComplete(userProfile, userData));

        // Fetch additional data if profile exists
        if (userProfile) {
          await Promise.all([
            fetchAppointments(userData.id),
            fetchTreatments(userData.id),
            calculateStats(userData.id),
          ]);
        }
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setError("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Profile Completeness Check
  const isProfileComplete = (profileData, userData) => {
    if (!profileData) return false;

    const dateOfBirth = userData?.dateOfBirth || profileData?.dateOfBirth;
    const gender = userData?.gender || profileData?.gender;

    return (
      dateOfBirth &&
      gender &&
      Array.isArray(profileData.symptoms) &&
      profileData.symptoms.length > 0 &&
      profileData.dietHabits?.trim() &&
      profileData.sleepPattern?.trim() &&
      profileData.digestion?.trim() &&
      profileData.bowelHabits?.trim()
    );
  };

  // Fetch Appointments
  const fetchAppointments = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  // Fetch Treatments
  const fetchTreatments = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/treatments`);
      if (response.data.success) {
        setTreatments(response.data.data.treatments || []);
      }
    } catch (err) {
      console.error("Error fetching treatments:", err);
    }
  };

  // Calculate Dashboard Stats
  const calculateStats = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      // Use default stats if API fails
      setStats({
        totalAppointments: appointments.length,
        completedTreatments: treatments.filter((t) => t.status === "completed")
          .length,
        wellnessScore: 8.5,
        upcomingAppointments: appointments.filter(
          (a) => new Date(a.date) > new Date()
        ).length,
      });
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setHasProfile(true);
    setActiveSection("dashboard");
    setSuccess("Profile updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
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
    return user?.name || user?.firstName || "Patient";
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

  // Show Profile Form if Incomplete

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
                  Your Wellness Dashboard 🌿
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-gray-600 max-w-2xl mx-auto"
                >
                  Track your Ayurvedic journey and manage your holistic health
                  with ease
                </motion.p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                {[
                  {
                    label: "Total Appointments",
                    value: stats.totalAppointments,
                    icon: Calendar,
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                  },
                  {
                    label: "Treatments Completed",
                    value: stats.completedTreatments,
                    icon: CheckCircle,
                    color: "text-emerald-600",
                    bg: "bg-emerald-100",
                  },
                  {
                    label: "Wellness Score",
                    value: `${stats.wellnessScore}/10`,
                    icon: TrendingUp,
                    color: "text-amber-600",
                    bg: "bg-amber-100",
                  },
                  {
                    label: "Upcoming",
                    value: stats.upcomingAppointments,
                    icon: Bell,
                    color: "text-purple-600",
                    bg: "bg-purple-100",
                  },
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

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    id: "appointments",
                    title: "Book Appointment",
                    description:
                      "Schedule consultation with our Ayurvedic specialists",
                    icon: Calendar,
                    gradient: "from-emerald-500 to-teal-600",
                    action: () => setActiveSection("book-appointment"),
                  },
                  {
                    id: "profile",
                    title: "Update Profile",
                    description:
                      "Manage your health information and preferences",
                    icon: User,
                    gradient: "from-blue-500 to-indigo-600",
                    action: () => setActiveSection("profile"),
                  },
                  {
                    id: "treatments",
                    title: "My Treatments",
                    description: "View treatment plans and track progress",
                    icon: Activity,
                    gradient: "from-amber-500 to-orange-600",
                    action: () => setActiveSection("treatments"),
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
                    action: openFeedbackModal, // Opens modal instead of navigating
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

              {/* Recent Activity */}
              {(appointments.length > 0 || treatments.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {[...appointments, ...treatments]
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                      )
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {item.type || "Appointment"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.status || "Scheduled"}
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
              <AppointmentBooking user={user} />
            </motion.div>
          )}

          {/* Other sections can be added here */}
        </AnimatePresence>
      </div>

      {/* Feedback Modal */}
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
                <Feedback />
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
