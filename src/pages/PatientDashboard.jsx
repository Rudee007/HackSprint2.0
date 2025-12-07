import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Activity,
  MessageSquare,
  User,
  Heart,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Pill,
  LogOut,
  Menu,
  Bell,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ConsultationHistory from "../components/ConsultationHistory";
import PatientPrescriptions from "../components/PatientPrescriptions";
import PatientProfileForm from "../components/PatientProfileForm";
import AppointmentBooking from "../components/AppointmentBooking";
import PatientFeedbackForm from "../components/PatientFeedbackForm";
import NotificationCenter from "../components/NotificationCenter";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Footer from "../components/Footer";
import { translations } from "../i18n/translations";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [therapyData, setTherapyData] = useState(null);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const t = translations[language];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };
  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    wellnessScore: 0,
    upcomingConsultations: 0,
    pendingFeedback: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0,
  });

  // Wellness tracking data
  const wellnessData = [
    { date: "Week 1", score: 65 },
    { date: "Week 2", score: 70 },
    { date: "Week 3", score: 75 },
    { date: "Week 4", score: 78 },
    { date: "Week 5", score: 82 },
    { date: "Week 6", score: 85 },
  ];

  const fetchTherapyData = async (userId) => {
    try {
      const response = await api.get("/patient/treatmentplan");
      if (response.data.success && response.data.data) {
        const plan = response.data.data;
        setTherapyData({
          totalTreatmentDays: plan.totalTreatmentDays || 0,
          purvaDaysCompleted: plan.purvaDaysCompleted || 0,
          pradhanaDaysCompleted: plan.pradhanaDaysCompleted || 0,
          paschatDaysCompleted: plan.paschatDaysCompleted || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching therapy data:", err);
      setTherapyData(null);
    }
  };

  const createDoughnutData = (completed, total, label, color) => {
    const cappedCompleted = Math.min(completed, total);
    const remaining = total - cappedCompleted;
    return {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          label: label,
          data: [cappedCompleted, remaining],
          backgroundColor: [color, "#e5e7eb"],
          borderWidth: 0,
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} days`,
        },
      },
    },
    cutout: "70%",
  };

  const sidebarItems = [
    { id: "dashboard", label: t.dashboard, icon: BarChart3 },
    { id: "book-appointment", label: t.bookAppointment, icon: Calendar },
    { id: "consultations", label: t.myConsultations, icon: Activity },
    { id: "prescriptions", label: t.myPrescriptions, icon: Pill },
    // { id: "wellness", label: t.wellnessTracking, icon: TrendingUp },
    { id: "feedback", label: t.feedback, icon: MessageSquare },
    { id: "profile", label: t.updateProfile, icon: User },
  ];

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const profileResponse = await api.get("/auth/profile");
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data.user;
        setUser(userData);
        await Promise.all([
          fetchConsultations(userData.id || userData._id),
          fetchFeedback(userData.id || userData._id),
          fetchPatientProfile(userData.id || userData._id),
          fetchPrescriptions(userData.id || userData._id),
          fetchTherapyData(userData.id || userData._id),
        ]);
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setError("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async (userId) => {
    try {
      const response = await api.get(
        `/consultations/patient/${userId}?page=1&limit=50`
      );
      if (response.data.success) {
        const consultationsData = response.data.data || [];
        setConsultations(consultationsData);
        setStats((prev) => ({
          ...prev,
          totalConsultations: consultationsData.length,
          completedConsultations: consultationsData.filter(
            (c) => c.status === "completed"
          ).length,
          upcomingConsultations: consultationsData.filter(
            (c) =>
              c.status === "scheduled" && new Date(c.scheduledAt) > new Date()
          ).length,
        }));
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
    }
  };

  const fetchPrescriptions = async (userId) => {
    try {
      const response = await api.get(
        `/prescriptions/patient/${userId}?page=1&limit=50`
      );
      if (response.data.success) {
        const prescriptionsData = response.data.data.prescriptions || [];
        setPrescriptions(prescriptionsData);
        setStats((prev) => ({
          ...prev,
          totalPrescriptions: prescriptionsData.length,
          activePrescriptions: prescriptionsData.filter(
            (p) => p.status === "active"
          ).length,
        }));
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    }
  };

  const fetchFeedback = async (userId) => {
    try {
      const response = await api.get("/feedback/me?page=1&limit=20");
      if (response.data.success) {
        setFeedback(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  const fetchPatientProfile = async (userId) => {
    try {
      const response = await api.get(
        `http://localhost:3003/api/users/${userId}/profile`
      );
      if (response.data.success) {
        setProfile(response.data.data.profile);
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      const response = await api.put(
        `http://localhost:3003/patients/${user.id}/profile`,
        updatedProfile
      );
      if (response.data.success) {
        setProfile(response.data.data.profile);
        setSuccess("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setSuccess("Profile updated locally!");
    }
    setActiveSection("dashboard");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await api.post("/feedback", feedbackData);
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

  const handleBookingComplete = async (bookingData) => {
    try {
      const response = await api.post("/bookings", {
        patientId: user.id,
        ...bookingData,
      });
      if (response.data.success) {
        setSuccess("Appointment booked successfully!");
        await fetchConsultations(user.id);
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
      setError("Failed to book appointment. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4"
            role="status"
            aria-live="polite"
          />
          <p className="text-gray-600 text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

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
            language={language}
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
      case "feedback":
        return <PatientFeedbackForm />;
      case "wellness":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Wellness Tracking
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={wellnessData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Wellness Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 p-8 text-white shadow-lg"
            >
              <h1 className="text-3xl font-bold mb-2">
                {t.welcomeBack}, {user?.name || "Patient"}! 👋
              </h1>
              <p className="text-emerald-100">{t.wellnessJourney}</p>
            </motion.div>

            {/* Therapy Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Therapy Progress
                </h2>
              </div>

              {!therapyData || !therapyData.totalTreatmentDays ? (
                <div className="text-center py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-5002 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium">
                    No treatment plan assigned yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Purva Karma */}
                  <div className="text-center">
                    <div className="relative h-48 mb-4">
                      <Doughnut
                        data={createDoughnutData(
                          therapyData.purvaDaysCompleted,
                          therapyData.totalTreatmentDays,
                          "Purva Karma",
                          "#3b82f6"
                        )}
                        options={doughnutOptions}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {Math.round(
                            (Math.min(
                              therapyData.purvaDaysCompleted,
                              therapyData.totalTreatmentDays
                            ) /
                              therapyData.totalTreatmentDays) *
                              100
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">Complete</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Purva Karma
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      You have completed
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {Math.min(
                        therapyData.purvaDaysCompleted,
                        therapyData.totalTreatmentDays
                      )}{" "}
                      / {therapyData.totalTreatmentDays} sessions
                    </p>
                  </div>

                  {/* Pradhana Karma */}
                  <div className="text-center">
                    <div className="relative h-48 mb-4">
                      <Doughnut
                        data={createDoughnutData(
                          therapyData.pradhanaDaysCompleted,
                          therapyData.totalTreatmentDays,
                          "Pradhana Karma",
                          "#8b5cf6"
                        )}
                        options={doughnutOptions}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {Math.round(
                            (Math.min(
                              therapyData.pradhanaDaysCompleted,
                              therapyData.totalTreatmentDays
                            ) /
                              therapyData.totalTreatmentDays) *
                              100
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">Complete</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Pradhana Karma
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      You have completed
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {Math.min(
                        therapyData.pradhanaDaysCompleted,
                        therapyData.totalTreatmentDays
                      )}{" "}
                      / {therapyData.totalTreatmentDays} sessions
                    </p>
                  </div>

                  {/* Paschat Karma */}
                  <div className="text-center">
                    <div className="relative h-48 mb-4">
                      <Doughnut
                        data={createDoughnutData(
                          therapyData.paschatDaysCompleted,
                          therapyData.totalTreatmentDays,
                          "Paschat Karma",
                          "#ec4899"
                        )}
                        options={doughnutOptions}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {Math.round(
                            (Math.min(
                              therapyData.paschatDaysCompleted,
                              therapyData.totalTreatmentDays
                            ) /
                              therapyData.totalTreatmentDays) *
                              100
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">Complete</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Paschat Karma
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      You have completed
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {Math.min(
                        therapyData.paschatDaysCompleted,
                        therapyData.totalTreatmentDays
                      )}{" "}
                      / {therapyData.totalTreatmentDays} sessions
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Wellness Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Wellness Tracking
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wellnessData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Wellness Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="px-6 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {t.appName}
                  </h1>
                  <p className="text-xs text-gray-600">{t.patientPortal}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
              />
              <NotificationCenter userId={user?.id || user?._id} />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name || "Patient"}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email || ""}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center justify-center text-white font-bold">
                  {(user?.name || "P").charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } mt-[73px] lg:mt-0`}
        >
          <div className="p-4 space-y-2 h-full overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
                <button onClick={() => setError("")} className="ml-auto">
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{success}</span>
                <button onClick={() => setSuccess("")} className="ml-auto">
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {renderContent()}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {activeSection === "dashboard" && <Footer />}
    </div>
  );
};

export default PatientDashboard;
