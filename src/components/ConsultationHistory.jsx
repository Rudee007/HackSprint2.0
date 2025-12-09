// 🔥 FIXED & PRODUCTION-READY: ConsultationHistory Component 
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Video,
  Phone,
  MapPin,
  Clock,
  User as UserIcon,
  X,
  CheckCircle
} from "lucide-react";
import api from "../utils/api";
import Feedback from "./Feedback";
import ConsentForm from "./ConsentForm";

export default function ConsultationHistory({
  patientId,
  consultations: providedConsultations = null,
  onBookFirst,
  onBack,
  onFeedbackSubmit
}) {
  /* ──────────────────── State Management ──────────────────── */
  const [consults, setConsults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");

  // Feedback Modal State 
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Consent State
  const [consentStates, setConsentStates] = useState({});

  const LIMIT = 10;

  /* ───────── Fetch Consultations on Mount / Page Change ──────── */
  useEffect(() => {
    if (providedConsultations) {
      applyExternalConsultations(providedConsultations);
      setPage(1);
      return;
    }
    if (!patientId) return;
    setPage(1);
    fetchConsultations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, providedConsultations]);

  const normalizeConsultation = (consultation) => {
    const provider =
      consultation.providerId ||
      consultation.provider ||
      consultation.doctorId ||
      consultation.doctor ||
      {};

    return {
      _id: consultation._id || consultation.id || crypto.randomUUID?.() || String(Math.random()),
      type:
        consultation.type ||
        consultation.mode ||
        consultation.consultationType ||
        "consultation",
      scheduledAt:
        consultation.scheduledAt ||
        consultation.date ||
        consultation.slot?.startTime ||
        new Date().toISOString(),
      status:
        consultation.status ||
        consultation.consultationStatus ||
        "scheduled",
      providerId: provider,
      fee: consultation.fee ?? consultation.amount ?? consultation.price,
      notes: consultation.notes || consultation.description || consultation.reason
    };
  };

  const applyExternalConsultations = (list = []) => {
    const normalized = list.map(normalizeConsultation);
    setConsults(normalized);
    setTotalCount(normalized.length);
    setTotalPages(Math.max(1, Math.ceil(normalized.length / LIMIT)));
  };

  const fetchConsultations = async (resetPage = false) => {
    // Avoid API call if no patient is selected 
    if (!patientId) return;

    // If parent passes data, prefer it and skip API to keep UI consistent
    if (providedConsultations) {
      applyExternalConsultations(providedConsultations);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        page: resetPage ? 1 : page,
        limit: LIMIT,
        ...(filterStatus !== "all" && { status: filterStatus })
      };

      const response = await api.get(`/consultations/patient/${patientId}`, { params });
      const data = response.data?.data || response.data?.consultations || [];
      const pagination = response.data?.pagination || response.data?.data?.pagination;

      const normalized = data.map(normalizeConsultation);

      setConsults(normalized);
      setTotalCount(
        pagination?.total ??
        response.data?.total ??
        normalized.length
      );
      setTotalPages(
        pagination?.pages ??
        Math.max(
          1,
          Math.ceil(
            (pagination?.total ?? normalized.length) / (pagination?.limit ?? LIMIT)
          )
        )
      );
      if (resetPage && pagination?.page) {
        setPage(pagination.page);
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to load consultations";
      setError(message);
      setConsults([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providedConsultations) {
      applyExternalConsultations(providedConsultations);
      return;
    }
    if (!patientId) return;
    fetchConsultations(page === 1 && filterStatus === "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus]);

  /* ───────────── Helper Functions ─────────── */
  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-purple-100 text-purple-800 border-purple-200"
    };

    return statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getConsultationIcon = (type) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "audio": return <Phone className="w-5 h-5" />;
      case "in_person": return <MapPin className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getConsultationLabel = (type) => {
    switch (type) {
      case "video": return "Video Consultation";
      case "audio": return "Audio Consultation";
      case "in_person": return "In-Person Visit";
      default: return "Consultation";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleFeedbackClick = (consultation) => {
    setSelectedConsultation(consultation);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmitInternal = async (feedbackData) => {
    try {
      if (onFeedbackSubmit) {
        await onFeedbackSubmit({
          ...feedbackData,
          consultationId: selectedConsultation._id,
          providerId: selectedConsultation.providerId?._id
        });
      }
      setFeedbackModalOpen(false);
      setSelectedConsultation(null);

      // Refresh consultations to show feedback submitted 
      await fetchConsultations();
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  const handleConsentDecision = (consultationId, accepted) => {
    setConsentStates(prev => ({
      ...prev,
      [consultationId]: {
        ...prev[consultationId],
        decision: accepted ? 'accepted' : 'declined',
        showForm: false
      }
    }));
  };

  const toggleConsentView = (consultationId) => {
    setConsentStates(prev => ({
      ...prev,
      [consultationId]: {
        ...prev[consultationId],
        viewChecked: !prev[consultationId]?.viewChecked,
        showForm: !prev[consultationId]?.viewChecked
      }
    }));
  };

  /* ────────────────  Loading State  ───────────────── */
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
        <p className="text-lg font-semibold text-gray-700">
          Loading your consultations...
        </p>
      </motion.div>
    );
  }

  /* ────────────────  Error State  ───────────────── */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-lg font-semibold text-red-600 mb-2">{error}</p>
        <button
          onClick={fetchConsultations}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  /* ────────────────  Empty State  ───────────────── */
  if (consults.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            No Consultations Yet
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {filterStatus !== "all"
              ? `No ${filterStatus} consultations found. Try changing the filter.`
              : "Start your wellness journey by booking your first consultation with our Ayurvedic specialists."
            }
          </p>
          {onBookFirst && filterStatus === "all" && (
            <button
              onClick={onBookFirst}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:-translate-y-0.5"
            >
              Book Your First Consultation
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ────────────────── Main Consultations List ─────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </motion.button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">
              My Consultations
            </h1>
            <p className="text-gray-600 mt-1">
              {totalCount} {totalCount === 1 ? 'consultation' : 'consultations'} found
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1); // Reset to first page on filter change 
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Consultations Cards */}
      <div className="space-y-6 mb-8">
        <AnimatePresence mode="popLayout">
          {consults.map((consultation, index) => (
            <div key={consultation._id} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: Consultation Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        {getConsultationIcon(consultation.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getConsultationLabel(consultation.type)}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(consultation.scheduledAt)} at {formatTime(consultation.scheduledAt)}
                        </div>
                      </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        Dr. {consultation.providerId?.name || consultation.provider?.name || "Provider"}
                      </span>
                      {(consultation.providerId?.speciality || consultation.provider?.speciality) && (
                        <span className="text-sm text-gray-500">
                          • {consultation.providerId?.speciality || consultation.provider?.speciality}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {consultation.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        <span className="font-medium">Notes:</span> {consultation.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3">
                    {/* Status Badge */}
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusBadge(
                        consultation.status
                      )}`}
                    >
                      {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                    </span>

                    {/* Fee */}
                    {consultation.fee && (
                      <div className="text-lg font-bold text-emerald-700">
                        ₹{consultation.fee}
                      </div>
                    )}

                    {/* Feedback Button */}
                    {consultation.status === "completed" && (
                      <button
                        onClick={() => handleFeedbackClick(consultation)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Give Feedback
                      </button>
                    )}
                  </div>
                </div>

                {/* Consent Section - Only for scheduled Panchakarma consultations */}
                {consultation.status === "scheduled" &&
                  (consultation.providerId?.speciality === "Panchakarma" || consultation.provider?.speciality === "Panchakarma") &&
                  !consentStates[consultation._id]?.decision && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          id={`view-consent-${consultation._id}`}
                          type="checkbox"
                          checked={consentStates[consultation._id]?.viewChecked || false}
                          onChange={() => toggleConsentView(consultation._id)}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500"
                        />
                        <label
                          htmlFor={`view-consent-${consultation._id}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          View and Confirm your Consent Form
                        </label>
                      </div>
                    </div>
                  )}

                {consentStates[consultation._id]?.decision && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${consentStates[consultation._id].decision === 'accepted'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                      }`}>
                      {consentStates[consultation._id].decision === 'accepted' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        Consent {consentStates[consultation._id].decision === 'accepted' ? 'Accepted' : 'Declined'}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Consent Form Modal */}
              <AnimatePresence>
                {consentStates[consultation._id]?.showForm && (
                  <ConsentForm
                    consultation={consultation}
                    onDecision={(accepted) => handleConsentDecision(consultation._id, accepted)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </span>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🔥 Feedback Modal Integration */}
      <AnimatePresence>
        {feedbackModalOpen && selectedConsultation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setFeedbackModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
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
                      Consultation Feedback
                    </h2>
                    <p className="text-sm text-gray-600">
                      Dr. {selectedConsultation.providerId?.name || selectedConsultation.provider?.name || "Provider"} • {formatDate(selectedConsultation.scheduledAt)}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFeedbackModalOpen(false)}
                  className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <Feedback
                  consultations={[selectedConsultation]}
                  onSubmit={handleFeedbackSubmitInternal}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}