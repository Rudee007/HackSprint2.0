// src/pages/PatientDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Activity,
  MessageSquare,
  User,
  Heart,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Pill,
  Menu,
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
import Feedback from "../components/Feedback";
import PatientFeedbackForm from "../components/PatientFeedbackForm";
import NotificationCenter from "../components/NotificationCenter";
import Footer from "../components/Footer";
import ConsentForm from "../components/ConsentForm";

import { translations } from "../i18n/translations";
import { useI18n } from "../utils/i18n.jsx";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

// ---------- API ----------
const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Component ----------
const PatientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const fallbackConsultations = useMemo(
    () => [
      {
        _id: "demo-1",
        type: "video",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        status: "scheduled",
        provider: { name: "Dr. Meera", speciality: "Panchakarma" },
        fee: 799,
        notes: "Follow-up detox consultation",
      },
      {
        _id: "demo-2",
        type: "in_person",
        scheduledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: "completed",
        provider: { name: "Dr. Rahul", speciality: "Kayachikitsa" },
        fee: 999,
        notes: "Diet & lifestyle review",
      },
      {
        _id: "demo-3",
        type: "audio",
        scheduledAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: "completed",
        provider: { name: "Dr. Kavya", speciality: "Rasayana" },
        fee: 699,
        notes: "Herbal regimen guidance",
      },
    ],
    []
  );

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState(fallbackConsultations);
  const [prescriptions, setPrescriptions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [therapyData, setTherapyData] = useState(null);
  const [consentStates, setConsentStates] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { language, setLanguage: setContextLanguage } = useI18n();
  const t = translations[language] || translations.en;

  const [stats, setStats] = useState({
    totalConsultations: 0,
    completedConsultations: 0,
    upcomingConsultations: 0,
    pendingFeedback: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0,
    wellnessScore: 0,
  });

  const wellnessData = [
    { date: "Week 1", score: 65 },
    { date: "Week 2", score: 70 },
    { date: "Week 3", score: 75 },
    { date: "Week 4", score: 78 },
    { date: "Week 5", score: 82 },
    { date: "Week 6", score: 85 },
  ];

  const sidebarItems = [
    { id: "dashboard", label: t.dashboard || "Dashboard", icon: BarChart3 },
    {
      id: "book-appointment",
      label: t.bookAppointment || "Book Appointment",
      icon: Calendar,
    },
    {
      id: "consultations",
      label: t.myConsultations || "My Consultations",
      icon: Activity,
    },
    {
      id: "prescriptions",
      label: t.myPrescriptionsLabel || "My Prescriptions",
      icon: Pill,
    },
    { id: "feedback", label: t.feedback || "Feedback", icon: MessageSquare },
    { id: "profile", label: t.updateProfile || "Update Profile", icon: User },
  ];

  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (hash) {
      const validIds = sidebarItems.map((s) => s.id).concat(["dashboard"]);
      if (validIds.includes(hash)) setActiveSection(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  useEffect(() => {
    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (lang) => {
    setContextLanguage(lang);
  };

  // ---------- Initialization ----------
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
          fetchFeedback(u.id || u._id),
          fetchPatientProfile(u.id || u._id),
          fetchTherapyData(u.id || u._id),
        ]);
      } else {
        setError("Authentication failed. Please login again.");
      }
    } catch (err) {
      console.error("initializeDashboard error:", err);
      setError("Failed to load dashboard. Refresh or check network.");
    } finally {
      setLoading(false);
    }
  };

  const applyConsultationStats = (arr = []) => {
    setStats((prev) => ({
      ...prev,
      totalConsultations: arr.length,
      completedConsultations: arr.filter((c) => c.status === "completed")
        .length,
      upcomingConsultations: arr.filter(
        (c) => c.status === "scheduled" && new Date(c.scheduledAt) > new Date()
      ).length,
    }));
  };

  // ---------- Fetch handlers ----------
  const fetchConsultations = async (userId) => {
    try {
      const res = await api.get(
        `/consultations/patient/${userId}?page=1&limit=50`
      );
      if (res.data?.success) {
        const arr = res.data.data || [];
        if (arr.length === 0) {
          setConsultations(fallbackConsultations);
          applyConsultationStats(fallbackConsultations);
        } else {
          setConsultations(arr);
          applyConsultationStats(arr);
        }
      } else {
        setConsultations(fallbackConsultations);
        applyConsultationStats(fallbackConsultations);
      }
    } catch (err) {
      console.error("fetchConsultations:", err);
      setConsultations(fallbackConsultations);
      applyConsultationStats(fallbackConsultations);
    }
  };

  const fetchPrescriptions = async (userId) => {
    try {
      const res = await api.get(
        `/prescriptions/patient/${userId}?page=1&limit=50`
      );
      if (res.data?.success) {
        const pres = res.data.data?.prescriptions || res.data.data || [];
        setPrescriptions(pres);
        setStats((prev) => ({
          ...prev,
          totalPrescriptions: pres.length,
          activePrescriptions: pres.filter((p) => p.status === "active").length,
        }));
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      console.error("fetchPrescriptions:", err);
      setPrescriptions([]);
    }
  };

  const fetchFeedback = async (userId) => {
    try {
      const res = await api.get("/feedback/me?page=1&limit=20");
      if (res.data?.success) {
        const fb = res.data.data || [];
        setFeedback(fb);

        setStats((prev) => {
          const pending = consultations.filter(
            (c) =>
              c.status === "completed" && !fb.some((f) => f.sessionId === c._id)
          ).length;
          return { ...prev, pendingFeedback: pending };
        });
      } else {
        setFeedback([]);
      }
    } catch (err) {
      console.error("fetchFeedback:", err);
      setFeedback([]);
    }
  };

  const fetchPatientProfile = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/profile`);
      if (res.data?.success) {
        setProfile(res.data.data.profile);
      } else {
        const saved = localStorage.getItem("user");
        if (saved) setProfile(JSON.parse(saved));
      }
    } catch (err) {
      console.error("fetchPatientProfile:", err);
      const saved = localStorage.getItem("user");
      if (saved) setProfile(JSON.parse(saved));
    }
  };

  const fetchTherapyData = async (userId) => {
    try {
      const res = await api.get("/patient/treatmentplan");
      if (res.data?.success && res.data.data) {
        const plan = res.data.data;
        setTherapyData({
          totalTreatmentDays: plan.totalTreatmentDays || 0,
          purvaDaysCompleted: plan.purvaDaysCompleted || 0,
          pradhanaDaysCompleted: plan.pradhanaDaysCompleted || 0,
          paschatDaysCompleted: plan.paschatDaysCompleted || 0,
        });
      } else {
        setTherapyData(null);
      }
    } catch (err) {
      console.error("fetchTherapyData:", err);
      setTherapyData(null);
    }
  };

  // ---------- Actions ----------
  const handleBookingComplete = async (bookingData) => {
    try {
      const res = await api.post("/bookings", {
        patientId: user.id || user._id,
        ...bookingData,
      });
      if (res.data?.success) {
        setSuccess("Appointment booked successfully!");
        await fetchConsultations(user.id || user._id);
      } else {
        setError("Booking failed.");
      }
    } catch (err) {
      console.error("handleBookingComplete:", err);
      if (err.response?.status === 409 && err.response.data?.conflictInfo) {
        setError(
          `Time slot conflict. ${err.response.data.alternativeMessage || ""}`
        );
      } else {
        setError("Failed to book appointment. Try again.");
      }
    } finally {
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleFeedbackSubmit = async (feedbackPayload) => {
    try {
      const res = await api.post("/feedback", feedbackPayload);
      if (res.data?.success) {
        setSuccess("Feedback submitted. Thanks!");
        setIsFeedbackModalOpen(false);
        await fetchFeedback(user.id || user._id);
      } else {
        setError("Feedback submission failed.");
      }
    } catch (err) {
      console.error("handleFeedbackSubmit:", err);
      setError("Failed to submit feedback.");
    } finally {
      setTimeout(() => setSuccess(""), 3000);
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
        setSuccess("Profile updated successfully!");
      } else {
        setProfile(updatedProfile);
        setSuccess("Profile updated locally.");
      }
    } catch (err) {
      console.error("handleProfileUpdate:", err);
      localStorage.setItem("patientProfile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setSuccess("Profile saved locally.");
    } finally {
      setActiveSection("dashboard");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ---------- Chart helpers ----------
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
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } },
    },
    cutout: "70%",
  };

  const getDisplayName = () =>
    user?.name || user?.firstName || profile?.name || "Patient";

  const getPatientId = () => {
    try {
      if (user?.id || user?._id) return user.id || user._id;
      const saved = localStorage.getItem("user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.id || u?._id) return u.id || u._id;
      }
      if (profile?.userId || profile?._id) return profile.userId || profile._id;
      return null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white rounded-2xl shadow"
        >
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            Loading your wellness dashboard...
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Preparing your personalized view.
          </p>
        </motion.div>
      </div>
    );
  }

  // ---------- Therapy progress UI helper (renders one card) ----------
  const TherapyCard = ({
    title,
    completed,
    total,
    colorClass,
    accentColor,
  }) => {
    const safeTotal = total || 0;
    const safeCompleted = Math.max(0, Math.min(completed || 0, safeTotal));
    const pct =
      safeTotal === 0 ? 0 : Math.round((safeCompleted / safeTotal) * 100);

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-36 md:w-44 md:h-44">
            <Doughnut
              data={createDoughnutData(safeCompleted, safeTotal, accentColor)}
              options={doughnutOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-gray-800">
                  {pct}%
                </div>
                <div className="text-xs text-gray-400 mt-1">{title}</div>
              </div>
            </div>
          </div>

          {/* New: text UNDER the graph */}
          <div className="mt-4 w-full text-center px-2">
            <div className="text-sm md:text-base font-semibold tracking-tight text-gray-800">
              {safeCompleted} of {safeTotal} days completed
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {safeTotal - safeCompleted} day
              {safeTotal - safeCompleted !== 1 ? "s" : ""} remaining
            </div>

            {/* Compact progress bar for quick scan */}
            <div
              className="relative h-2 rounded-full bg-gray-100 overflow-hidden mt-3 mx-auto"
              style={{ width: "85%" }}
              aria-hidden
            >
              <div
                className={`h-full rounded-full`}
                style={{
                  width: `${pct}%`,
                  background: accentColor,
                  transition: "width 600ms ease",
                }}
              />
            </div>

            {/* Accessible label for screen readers */}
            <div className="sr-only" aria-live="polite">
              {title} progress: {safeCompleted} out of {safeTotal} days
              completed ({pct} percent)
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------- Render content ----------
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div id="dashboard" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-6 shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {t.welcomeBackName?.replace("{name}", getDisplayName()) ||
                      `Welcome back, ${getDisplayName()} 🌿`}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t.trackAyurvedicJourney ||
                      "Track your Ayurvedic journey and monitor therapy progress."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 hidden sm:block">
                    {profile?.location || ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationCenter userId={user?.id || user?._id} />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  label: t.totalConsultations || "Total Consultations",
                  value: stats.totalConsultations,
                  icon: Calendar,
                  color: "from-emerald-500 to-teal-500",
                },
                {
                  label: t.completedSessions || "Completed Sessions",
                  value: stats.completedConsultations,
                  icon: CheckCircle,
                  color: "from-green-500 to-emerald-600",
                },
                {
                  label: t.myPrescriptionsLabel || "My Prescriptions",
                  value: stats.totalPrescriptions,
                  icon: Pill,
                  color: "from-indigo-500 to-violet-500",
                },
                {
                  label: t.pendingFeedback || "Pending Feedback",
                  value: stats.pendingFeedback,
                  icon: MessageSquare,
                  color: "from-amber-500 to-orange-500",
                },
                {
                  label: t.wellnessScore || "Wellness Score",
                  value: `${stats.wellnessScore || 8.5}/10`,
                  icon: Heart,
                  color: "from-rose-500 to-pink-500",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-white rounded-2xl p-5 shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-800">
                      {s.value}
                    </div>
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-sm`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setActiveSection("book-appointment")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition"
              >
                <Calendar className="w-4 h-4" />{" "}
                {t.bookAppointmentButton || "Book appointment"}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("feedback")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-700 border border-emerald-200 rounded-xl shadow hover:bg-emerald-50 transition"
              >
                <MessageSquare className="w-4 h-4" />{" "}
                {t.giveFeedback || "Give feedback"}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("prescriptions")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl shadow hover:bg-gray-50 transition"
              >
                <Pill className="w-4 h-4" />{" "}
                {t.viewPrescriptions || "View prescriptions"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t.therapyProgress || "Therapy Progress"}
                </h2>

                {/* Layout: responsive grid; on small screens cards stack */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    return (
                      <>
                        <TherapyCard
                          title={t.purvaKarma || "Purva Karma"}
                          completed={data.purvaDaysCompleted}
                          total={data.totalTreatmentDays}
                          accentColor="#10b981"
                        />
                        <TherapyCard
                          title={t.pradhanaKarma || "Pradhana Karma"}
                          completed={data.pradhanaDaysCompleted}
                          total={data.totalTreatmentDays}
                          accentColor="#f59e0b"
                        />
                        <TherapyCard
                          title={t.paschatKarma || "Paschat Karma"}
                          completed={data.paschatDaysCompleted}
                          total={data.totalTreatmentDays}
                          accentColor="#6366f1"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t.wellnessTracking || "Wellness Tracking"}
                </h2>
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-bold mb-4">
                {t.recentConsultations || "Recent Consultations"}
              </h3>
              {consultations?.length > 0 ? (
                <div className="space-y-3">
                  {consultations.slice(0, 3).map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {c.type === "video" ? "Video" : c.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(c.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm px-3 py-1 rounded-full bg-gray-100">
                        {(c.status || "").toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-700">
                      {t.noConsultationsYet || "No consultations yet"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.bookFirstSession ||
                        "Book your first session to get started"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection("book-appointment")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
                  >
                    <Calendar className="w-4 h-4" /> {t.bookNow || "Book now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "book-appointment":
        return (
          <motion.div
            id="book-appointment"
            key="book-appointment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection("dashboard")}
                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
              </button>
            </div>
            <AppointmentBooking
              user={user}
              onBookingComplete={handleBookingComplete}
              language={language}
            />
          </motion.div>
        );

      case "consultations": {
        const pid = getPatientId();

        const handleConsentDecision = (consultationId, accepted) => {
          setConsentStates((prev) => ({
            ...prev,
            [consultationId]: {
              ...prev[consultationId],
              decision: accepted ? "accepted" : "declined",
              showForm: false,
            },
          }));
          if (accepted) {
            setSuccess("Consent accepted! Therapy will proceed as scheduled.");
          } else {
            setError(
              "Consent declined. Please contact your healthcare provider."
            );
          }
          setTimeout(() => {
            setSuccess("");
            setError("");
          }, 4000);
        };

        const toggleConsentView = (consultationId) => {
          setConsentStates((prev) => ({
            ...prev,
            [consultationId]: {
              ...prev[consultationId],
              viewChecked: !prev[consultationId]?.viewChecked,
              showForm: !prev[consultationId]?.viewChecked,
            },
          }));
        };

        return (
          <div id="consultations" className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-emerald-800">
                  My Consultations
                </h1>
                <p className="text-gray-600">Your consultation history</p>
              </div>
              <button
                onClick={() => setActiveSection("book-appointment")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700"
              >
                Book appointment
              </button>
            </div>

            <div className="space-y-6">
              {consultations?.length > 0 ? (
                consultations.map((c) => (
                  <div key={c._id} className="space-y-4">
                    <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                              {c.type === "video" ? (
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M23 7l-7 5 7 5V7z"></path>
                                  <rect
                                    x="1"
                                    y="5"
                                    width="15"
                                    height="14"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 10.5a8.38 8.38 0 0 1-1.9 5.4l-1.6 1.6a1.65 1.65 0 0 1-2.3.1l-2.2-1.7a16 16 0 0 1-6.9-6.9L5.5 7.2a1.65 1.65 0 0 1 .1-2.3l1.6-1.6A8.38 8.38 0 0 1 12.5 1H13a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-1"></path>
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {c.type === "video"
                                  ? "Video Consultation"
                                  : c.type === "in_person"
                                  ? "In-Person Visit"
                                  : "Consultation"}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(c.scheduledAt).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(c.scheduledAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-gray-700">
                            <span className="font-medium">
                              Dr.{" "}
                              {c.providerId?.name ||
                                c.provider?.name ||
                                "Provider"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {" "}
                              •{" "}
                              {c.providerId?.speciality ||
                                c.provider?.speciality ||
                                "General"}
                            </span>
                          </div>
                          {c.notes && (
                            <div className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Notes:</span>{" "}
                              {c.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {c.status.charAt(0).toUpperCase() +
                              c.status.slice(1)}
                          </span>
                          {c.fee && (
                            <div className="text-emerald-700 font-bold">
                              ₹{c.fee}
                            </div>
                          )}
                          {c.status === "completed" && (
                            <button
                              onClick={() => setActiveSection("feedback")}
                              className="mt-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200"
                            >
                              Give Feedback
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Consent Section */}
                      {c.status === "scheduled" &&
                        (c.providerId?.speciality === "Panchakarma" ||
                          c.provider?.speciality === "Panchakarma") &&
                        !consentStates[c._id]?.decision && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                              <input
                                id={`view-consent-${c._id}`}
                                type="checkbox"
                                checked={
                                  consentStates[c._id]?.viewChecked || false
                                }
                                onChange={() => toggleConsentView(c._id)}
                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500"
                              />
                              <label
                                htmlFor={`view-consent-${c._id}`}
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                View and Confirm your Consent Form
                              </label>
                            </div>
                          </div>
                        )}

                      {consentStates[c._id]?.decision && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                              consentStates[c._id].decision === "accepted"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {consentStates[c._id].decision === "accepted" ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              Consent{" "}
                              {consentStates[c._id].decision === "accepted"
                                ? "Accepted"
                                : "Declined"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {consentStates[c._id]?.showForm && (
                        <ConsentForm
                          consultation={c}
                          onDecision={(accepted) =>
                            handleConsentDecision(c._id, accepted)
                          }
                        />
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No consultations yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Book your first consultation to get started with your
                    wellness journey
                  </p>
                  <button
                    onClick={() => setActiveSection("book-appointment")}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
                  >
                    Book Consultation
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "prescriptions":
        return (
          <motion.div
            id="prescriptions"
            key="prescriptions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PatientPrescriptions
              prescriptions={prescriptions}
              patientId={user?.id || user?._id}
            />
          </motion.div>
        );

      case "feedback":
        return (
          <div id="feedback">
            <PatientFeedbackForm language={language} />
          </div>
        );

      case "profile":
        return (
          <motion.div
            id="profile"
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection("dashboard")}
                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />{" "}
                {t.backToDashboard || "Back to Dashboard"}
              </button>
            </div>
            <PatientProfileForm
              profile={profile}
              onComplete={handleProfileUpdate}
              language={language}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const sectionTitle =
    sidebarItems.find((s) => s.id === activeSection)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Sidebar */}
      <div className="flex">
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow transform transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } mt-[73px] lg:mt-0`}
          aria-hidden={!sidebarOpen && "true"}
        >
          <div className="p-4 space-y-2 h-full overflow-y-auto">
            <div className="mb-2 px-2">
              <div className="text-sm text-gray-500">Navigation</div>
              <div className="text-xs text-gray-400">Quick access</div>
            </div>

            {sidebarItems.map((item) => (
              <button
                key={item.id}
                aria-current={activeSection === item.id ? "page" : undefined}
                aria-label={item.label}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                  window.location.hash = item.id;
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  activeSection === item.id
                    ? "bg-emerald-500 text-white shadow"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow hover:bg-gray-50 active:scale-[0.99] transition"
            >
              <Menu className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Menu</span>
            </button>
            <div className="text-base font-semibold text-gray-700">
              {sectionTitle}
            </div>
          </div>

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

            {renderContent()}
          </AnimatePresence>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsFeedbackModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
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
                <button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <Feedback
                  consultations={consultations.filter(
                    (c) => c.status === "completed"
                  )}
                  onSubmit={handleFeedbackSubmit}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSection === "dashboard" && (
        <>
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
            <button
              type="button"
              onClick={() => setActiveSection("book-appointment")}
              className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition"
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">
                {t.bookAppointmentButton || "Book appointment"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("feedback")}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white text-emerald-700 border border-emerald-200 rounded-full shadow-lg hover:bg-emerald-50 active:scale-[0.98] transition"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">
                {t.feedback || "Feedback"}
              </span>
            </button>
          </div>
          <Footer />
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
