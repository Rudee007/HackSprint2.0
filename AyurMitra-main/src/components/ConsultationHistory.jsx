// src/components/ConsultationHistory.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  User,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  AlertTriangle,
  X,
  Star,
  RefreshCw,
} from "lucide-react";
import api from "../utils/api";
import ConsentForm from "./ConsentForm";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getTypeIcon = (type, sessionType) => {
  if (sessionType === "therapy") return Activity;
  switch (type) {
    case "video":
      return Video;
    case "in_person":
      return MapPin;
    case "follow_up":
      return Phone;
    default:
      return Calendar;
  }
};

const getStatusColor = (status) => {
  const colors = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    no_show: "bg-gray-50 text-gray-700 border-gray-200",
    patient_arrived: "bg-indigo-50 text-indigo-700 border-indigo-200",
    therapist_ready: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
};

const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

const isPast = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isFuture = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ConsultationHistory({
  patientId,
  onBookFirst,
  onBack,
  onFeedbackClick,
}) {
  // Basic state
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // UI state
  const [expandedCards, setExpandedCards] = useState({});

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState(null);
  const [consentData, setConsentData] = useState({});

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleConsult, setRescheduleConsult] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Fetch consultations on mount
  useEffect(() => {
    if (patientId) fetchConsultations();
  }, [patientId]);

  // ═══════════════════════════════════════════════════════════
  // API FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(`/consultations/patient/${patientId}`);
      if (data.success) {
        setConsultations(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
      setError("Unable to load your consultations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERED & GROUPED CONSULTATIONS
  // ═══════════════════════════════════════════════════════════

  const filteredConsults = useMemo(() => {
    return consultations.filter((c) => {
      const matchSearch =
        searchQuery === "" ||
        c.therapyData?.therapyName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.providerId?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        filterType === "all" ||
        (filterType === "therapy" && c.sessionType === "therapy") ||
        (filterType === "consultation" && c.sessionType !== "therapy");

      const matchStatus = filterStatus === "all" || c.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [consultations, searchQuery, filterType, filterStatus]);

  const groupedConsults = useMemo(() => {
    const today = [];
    const upcoming = [];
    const past = [];

    filteredConsults.forEach((c) => {
      if (isToday(c.scheduledAt)) {
        today.push(c);
      } else if (isFuture(c.scheduledAt)) {
        upcoming.push(c);
      } else if (isPast(c.scheduledAt)) {
        past.push(c);
      }
    });

    today.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    upcoming.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    past.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    return { today, upcoming, past };
  }, [filteredConsults]);

  const displayConsults = useMemo(() => {
    if (activeTab === "today") return groupedConsults.today;
    if (activeTab === "upcoming") return groupedConsults.upcoming;
    if (activeTab === "past") return groupedConsults.past;
    return [
      ...groupedConsults.today,
      ...groupedConsults.upcoming,
      ...groupedConsults.past,
    ];
  }, [activeTab, groupedConsults]);

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFeedbackClick = (consultation) => {
    if (onFeedbackClick) {
      onFeedbackClick(consultation);
    }
  };

  const handleConsentClick = (consultation) => {
    setSelectedConsult(consultation);
    setShowConsentModal(true);
  };

  const handleConsentDecision = (consultId, accepted) => {
    setConsentData((prev) => ({
      ...prev,
      [consultId]: { accepted, timestamp: new Date() },
    }));
    setShowConsentModal(false);
  };

  // ═══════════════════════════════════════════════════════════
  // RESCHEDULE HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleRescheduleClick = (consultation) => {
    setRescheduleConsult(consultation);
    setRescheduleReason("");
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    // Validation
    if (!rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    if (rescheduleReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters long");
      return;
    }

    try {
      setRescheduling(true);

      const { data } = await api.post(
        `/consultations/sessions/${rescheduleConsult._id}/reschedule-request`,
        { reason: rescheduleReason.trim() }
      );

      if (data.success) {
        // Success toast
        toast.success(
          `✅ Rescheduling request submitted!\n` +
            `${data.data.cancelledSessions.count} sessions cancelled.\n` +
            `Doctor consultation scheduled for ${new Date(
              data.data.doctorConsultation.scheduledAt
            ).toLocaleDateString()}.`,
          { duration: 6000 }
        );

        // Close modal
        setShowRescheduleModal(false);
        setRescheduleConsult(null);
        setRescheduleReason("");

        // Refresh consultations
        await fetchConsultations();
      }
    } catch (err) {
      console.error("Reschedule error:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to submit rescheduling request. Please try again."
      );
    } finally {
      setRescheduling(false);
    }
  };

  const handleRescheduleCancel = () => {
    if (rescheduling) return;
    setShowRescheduleModal(false);
    setRescheduleConsult(null);
    setRescheduleReason("");
  };

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading your consultations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchConsultations}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            No Consultations Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start your wellness journey by booking your first consultation
          </p>
          {onBookFirst && (
            <button
              onClick={onBookFirst}
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Book Your First Consultation
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              My Consultations
            </h2>
            <p className="text-gray-600">
              {consultations.length} total session
              {consultations.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* {onBookFirst && (
            <button
              onClick={onBookFirst}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 justify-center"
            >
              <Calendar className="w-5 h-5" />
              Book New Session
            </button>
          )} */}
        </div>

        {/* Search & Filters */}
        <div className="grid md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="therapy">Therapy Sessions</option>
            <option value="consultation">Consultations</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-gray-200">
          <TabButton
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            count={filteredConsults.length}
          >
            All
          </TabButton>
          <TabButton
            active={activeTab === "today"}
            onClick={() => setActiveTab("today")}
            count={groupedConsults.today.length}
          >
            Today
          </TabButton>
          <TabButton
            active={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            count={groupedConsults.upcoming.length}
          >
            Upcoming
          </TabButton>
          <TabButton
            active={activeTab === "past"}
            onClick={() => setActiveTab("past")}
            count={groupedConsults.past.length}
          >
            Past
          </TabButton>
        </div>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {displayConsults.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No sessions found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          displayConsults.map((c, idx) => (
            <ConsultationCard
              key={c._id}
              consultation={c}
              isExpanded={expandedCards[c._id]}
              onToggleExpand={() => toggleExpand(c._id)}
              onFeedbackClick={handleFeedbackClick}
              onConsentClick={handleConsentClick}
              onRescheduleClick={handleRescheduleClick}
              consentData={consentData[c._id]}
              index={idx}
            />
          ))
        )}
      </div>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsentModal && selectedConsult && (
          <Modal onClose={() => setShowConsentModal(false)}>
            <ConsentForm
              consultation={selectedConsult}
              onDecision={(accepted) =>
                handleConsentDecision(selectedConsult._id, accepted)
              }
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && rescheduleConsult && (
          <Modal onClose={handleRescheduleCancel}>
            <RescheduleModal
              consultation={rescheduleConsult}
              reason={rescheduleReason}
              onReasonChange={setRescheduleReason}
              onSubmit={handleRescheduleSubmit}
              onCancel={handleRescheduleCancel}
              loading={rescheduling}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-semibold text-sm transition-all relative ${
        active ? "text-emerald-700" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      <span className="flex items-center gap-2">
        {children}
        {count > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
          </span>
        )}
      </span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
        />
      )}
    </button>
  );
}

function ConsultationCard({
  consultation,
  isExpanded,
  onToggleExpand,
  onFeedbackClick,
  onConsentClick,
  onRescheduleClick,
  consentData,
  index,
}) {
  const c = consultation;
  const isTherapy = c.sessionType === "therapy";
  const TypeIcon = getTypeIcon(c.type, c.sessionType);

  const isPanchakarma =
    c.providerId?.speciality === "Panchakarma" ||
    c.provider?.speciality === "Panchakarma" ||
    c.therapyData?.therapyType === "panchakarma";

  const needsConsent =
    c.status === "scheduled" && isPanchakarma && !consentData;

  const canReschedule =
    isTherapy &&
    c.therapyData?.treatmentPlanId &&
    ["scheduled", "confirmed"].includes(c.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left Side */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isTherapy
                    ? "bg-purple-100 text-purple-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isTherapy
                    ? c.therapyData?.therapyName || "Therapy Session"
                    : "Consultation"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(c.scheduledAt)}</span>
                  <span>•</span>
                  <span>{formatTime(c.scheduledAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">
                {c.providerId?.name || c.provider?.name || "Provider"}
              </span>
              {(c.providerId?.speciality || c.provider?.speciality) && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">
                    {c.providerId?.speciality || c.provider?.speciality}
                  </span>
                </>
              )}
            </div>

            {isTherapy && (
              <div className="flex flex-wrap gap-2">
                {c.therapyData?.dayNumber && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold">
                    Day {c.therapyData.dayNumber}
                  </span>
                )}
                {c.therapyData?.room && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                    Room {c.therapyData.room}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                c.status
              )}`}
            >
              {c.status.replace(/_/g, " ")}
            </span>

            {c.fee !== undefined && c.fee !== null && (
              <div className="text-xl font-bold text-emerald-600">
                ₹{c.fee}
              </div>
            )}

            {canReschedule && (
              <button
                onClick={() => onRescheduleClick(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reschedule
              </button>
            )}

            {c.status === "completed" && (
              <button
                onClick={() => onFeedbackClick(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm"
              >
                <Star className="w-4 h-4" />
                Give Feedback
              </button>
            )}

            {needsConsent && (
              <button
                onClick={() => onConsentClick(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Consent
              </button>
            )}

            {consentData && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                  consentData.accepted
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {consentData.accepted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {consentData.accepted ? "Signed" : "Declined"}
              </div>
            )}
          </div>
        </div>

        {/* Expand Button */}
        {(c.notes ||
          c.therapyData?.vitals ||
          c.therapyData?.adverseEffects?.length > 0) && (
          <button
            onClick={onToggleExpand}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Details
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="p-5 bg-gray-50 space-y-4">
              {c.notes && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {c.notes}
                  </p>
                </div>
              )}

              {c.therapyData?.vitals && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Vitals
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {c.therapyData.vitals.bloodPressure && (
                      <VitalCard
                        label="BP"
                        value={`${c.therapyData.vitals.bloodPressure.systolic}/${c.therapyData.vitals.bloodPressure.diastolic}`}
                      />
                    )}
                    {c.therapyData.vitals.pulse && (
                      <VitalCard
                        label="Pulse"
                        value={`${c.therapyData.vitals.pulse} bpm`}
                      />
                    )}
                    {c.therapyData.vitals.temperature && (
                      <VitalCard
                        label="Temp"
                        value={`${c.therapyData.vitals.temperature}°F`}
                      />
                    )}
                    {c.therapyData.vitals.weight && (
                      <VitalCard
                        label="Weight"
                        value={`${c.therapyData.vitals.weight} kg`}
                      />
                    )}
                  </div>
                </div>
              )}

              {c.therapyData?.adverseEffects?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Adverse Effects
                  </h4>
                  <ul className="space-y-2">
                    {c.therapyData.adverseEffects.map((effect, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold">
                            {effect.effect?.replace(/_/g, " ")}:
                          </span>
                          <span>{effect.description || "No description"}</span>
                        </div>
                        {effect.severity && (
                          <div className="text-xs text-amber-600 mt-1">
                            Severity: {effect.severity}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VitalCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

function RescheduleModal({
  consultation,
  reason,
  onReasonChange,
  onSubmit,
  onCancel,
  loading,
}) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Request Rescheduling
            </h3>
            <p className="text-gray-600 text-sm">
              This will cancel all future sessions in your treatment plan
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Treatment Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-100">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Session Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-gray-700 min-w-[100px]">
              Therapy:
            </span>
            <span className="text-gray-900">
              {consultation.therapyData?.therapyName || "Therapy Session"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-gray-700 min-w-[100px]">
              Scheduled:
            </span>
            <span className="text-gray-900">
              {formatDate(consultation.scheduledAt)} at{" "}
              {formatTime(consultation.scheduledAt)}
            </span>
          </div>
          {consultation.therapyData?.dayNumber && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700 min-w-[100px]">
                Progress:
              </span>
              <span className="text-gray-900">
                Day {consultation.therapyData.dayNumber}
                {consultation.therapyData.totalDays &&
                  ` of ${consultation.therapyData.totalDays}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">
              What will happen:
            </h4>
            <ul className="text-sm text-amber-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>All your future therapy sessions will be cancelled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Your therapist's schedule will be freed up</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>
                  A consultation with your doctor will be automatically
                  scheduled (within 1-2 days)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>
                  Your doctor will discuss new scheduling options with you
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reason Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Reason for Rescheduling <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Please provide a detailed reason for rescheduling (minimum 10 characters)..."
          disabled={loading}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
        />
        <div className="flex items-center justify-between mt-2">
          <p
            className={`text-xs ${
              reason.length >= 10 ? "text-emerald-600" : "text-gray-500"
            }`}
          >
            {reason.length >= 10 ? (
              <>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Looks good!
              </>
            ) : (
              `${reason.length}/10 characters minimum`
            )}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || reason.trim().length < 10}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Confirm Reschedule
            </>
          )}
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This action cannot be undone. Your doctor
            will receive your request immediately and will contact you to
            discuss rescheduling options.
          </p>
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
