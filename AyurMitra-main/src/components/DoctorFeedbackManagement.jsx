// src/components/DoctorFeedbackManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Search,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  BarChart3,
  Smile,
  Frown,
  Meh,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Heart,
} from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function DoctorFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [actionTaken, setActionTaken] = useState("no_action");
  const [submitting, setSubmitting] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/feedback/doctor");
      if (res.data.success) {
        setFeedbacks(res.data.data || []);
      }
    } catch (err) {
      console.error("Load feedbacks error:", err);
      setError(err.response?.data?.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (feedback) => {
    setSelectedFeedback(feedback);
    setResponseText("");
    setActionTaken("no_action");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/feedback/doctor/${selectedFeedback._id}/review`, {
        responseText,
        actionTaken,
      });
      if (res.data.success) {
        setFeedbacks((prev) =>
          prev.map((f) => (f._id === selectedFeedback._id ? res.data.data : f))
        );
        setShowResponseModal(false);
        setSelectedFeedback(null);
      }
    } catch (err) {
      console.error("Submit response error:", err);
      alert("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchSearch =
        searchQuery === "" ||
        f.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.textFeedback?.positiveAspects?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.textFeedback?.concernsOrIssues?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && f.status !== "reviewed") ||
        (filterStatus === "reviewed" && f.status === "reviewed");

      const matchRating =
        filterRating === "all" ||
        (filterRating === "5" && f.ratings?.overallSatisfaction === 5) ||
        (filterRating === "4" && f.ratings?.overallSatisfaction === 4) ||
        (filterRating === "3" && f.ratings?.overallSatisfaction === 3) ||
        (filterRating === "low" && f.ratings?.overallSatisfaction <= 2);

      return matchSearch && matchStatus && matchRating;
    });
  }, [feedbacks, searchQuery, filterStatus, filterRating]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter((f) => f.status !== "reviewed").length;
    const avgRating =
      feedbacks.length > 0
        ? (
            feedbacks.reduce((sum, f) => sum + (f.ratings?.overallSatisfaction || 0), 0) /
            feedbacks.length
          ).toFixed(1)
        : "0.0";
    const recommended = feedbacks.filter((f) => f.wouldRecommendToOthers).length;
    return { total, pending, avgRating, recommended };
  }, [feedbacks]);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient feedback...</p>
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
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Feedback</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFeedbacks}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Feedback"
          value={stats.total}
          icon={MessageSquare}
          gradient="from-blue-500 to-cyan-600"
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          icon={Clock}
          gradient="from-amber-500 to-orange-600"
          badge={stats.pending > 0}
        />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating}
          icon={Star}
          gradient="from-yellow-500 to-amber-600"
          suffix="/5"
        />
        <StatCard
          label="Would Recommend"
          value={`${Math.round((stats.recommended / stats.total) * 100) || 0}%`}
          icon={ThumbsUp}
          gradient="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient or feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="low">Low (≤2)</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
            <p className="text-gray-500">Patient feedback will appear here once submitted</p>
            <button
              onClick={loadFeedbacks}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          filteredFeedbacks.map((feedback, idx) => (
            <FeedbackCard
              key={feedback._id}
              feedback={feedback}
              isExpanded={expandedCards[feedback._id]}
              onToggleExpand={() => toggleExpand(feedback._id)}
              onRespond={() => handleRespond(feedback)}
              index={idx}
            />
          ))
        )}
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedFeedback && (
          <Modal onClose={() => setShowResponseModal(false)}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Respond to Feedback</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Patient: {selectedFeedback.patientId?.name || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span className="font-semibold text-gray-900">
                    {selectedFeedback.ratings?.overallSatisfaction}/5 Overall Rating
                  </span>
                </div>
                {selectedFeedback.textFeedback?.positiveAspects && (
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Positive:</strong> {selectedFeedback.textFeedback.positiveAspects}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                <textarea
                  rows={5}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Thank you for your feedback..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="no_action">No Action Required</option>
                  <option value="treatment_adjusted">Treatment Plan Adjusted</option>
                  <option value="follow_up_scheduled">Follow-up Scheduled</option>
                  <option value="medication_changed">Medication Changed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitResponse}
                  disabled={submitting || !responseText.trim()}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {submitting ? "Submitting..." : "Submit Response"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS - DO NOT REMOVE
// ============================================

function StatCard({ label, value, icon: Icon, gradient, suffix = "", badge = false }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl text-white shadow-lg relative`}>
      {badge && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-white/80" />
        <div className="text-3xl font-bold">
          {value}
          {suffix && <span className="text-xl ml-1">{suffix}</span>}
        </div>
      </div>
      <div className="text-sm font-medium text-white/90">{label}</div>
    </div>
  );
}

function FeedbackCard({ feedback, isExpanded, onToggleExpand, onRespond, index }) {
  const getRatingIcon = (rating) => {
    if (rating >= 4) return Smile;
    if (rating === 3) return Meh;
    return Frown;
  };

  const RatingIcon = getRatingIcon(feedback.ratings?.overallSatisfaction || 0);
  const isReviewed = feedback.status === "reviewed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {feedback.patientId?.name?.charAt(0).toUpperCase() || "P"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {feedback.patientId?.name || "Patient"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(feedback.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (feedback.ratings?.overallSatisfaction || 0)
                        ? "text-amber-500 fill-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <RatingIcon className="w-6 h-6 text-emerald-600" />
            </div>

            {feedback.wouldRecommendToOthers && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <ThumbsUp className="w-3 h-3" />
                Would Recommend
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isReviewed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isReviewed ? "✓ Reviewed" : "⏱ Pending"}
            </span>

            {!isReviewed && (
              <button
                onClick={onRespond}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Respond
              </button>
            )}

            <button
              onClick={onToggleExpand}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              {isExpanded ? "Hide" : "View"}
            </button>
          </div>
        </div>

        {!isExpanded && feedback.textFeedback?.positiveAspects && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-3">
            {feedback.textFeedback.positiveAspects}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-6 bg-gray-50 space-y-4">
              {feedback.textFeedback?.positiveAspects && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h5 className="font-semibold text-emerald-900 mb-2">✨ What Went Well</h5>
                  <p className="text-sm text-emerald-800">{feedback.textFeedback.positiveAspects}</p>
                </div>
              )}

              {feedback.textFeedback?.concernsOrIssues && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h5 className="font-semibold text-amber-900 mb-2">⚠️ Concerns</h5>
                  <p className="text-sm text-amber-800">{feedback.textFeedback.concernsOrIssues}</p>
                </div>
              )}

              {feedback.doctorResponse && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                  <h5 className="font-semibold text-emerald-900 mb-2">Your Response</h5>
                  <p className="text-sm text-emerald-800">{feedback.doctorResponse.responseText}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
