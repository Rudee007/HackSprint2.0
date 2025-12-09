// src/components/TherapyProgress.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  AlertCircle,
  ChevronRight,
  Star,
  MessageSquare,
  Loader2,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:3003/api/v1",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TherapyProgress = ({ patientId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchProgressData();
      const interval = setInterval(() => {
        if (progressData?.activeSession) {
          fetchProgressData();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [patientId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${patientId}/therapy-progress`);
      if (response.data?.success) {
        setProgressData(response.data.data);
        setError(null);
      } else {
        setError('Failed to load therapy progress');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err.response?.data?.error?.message || 'Failed to load therapy progress');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    if (!selectedSession) return;
    
    setFeedbackSubmitting(true);
    try {
      const response = await api.post(
        `/patients/${patientId}/sessions/${selectedSession}/feedback`,
        feedbackData
      );
      
      if (response.data?.success) {
        setShowFeedbackModal(false);
        setSelectedSession(null);
        await fetchProgressData();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert(err.response?.data?.error?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading therapy progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Progress</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            )}
            <button
              onClick={fetchProgressData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Treatment Plan</h3>
          <p className="text-gray-600 mb-6">You don't have an active therapy plan yet.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Book Appointment
            </button>
          )}
        </div>
      </div>
    );
  }

  const { overallProgress, upcomingSessions = [], completedSessions = [], activeSession, instructions, phases = [] } = progressData;

  return (
    <div className="space-y-6 pb-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Therapy Progress</h1>
            </div>
            <p className="text-emerald-50">Track your Panchakarma journey</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallProgress.progressPercentage}%</div>
            <div className="text-sm text-emerald-50">Complete</div>
          </div>
        </div>
      </motion.div>

      {/* Active Session Alert */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Activity className="w-6 h-6 text-amber-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Session in Progress</h3>
                <p className="text-sm text-gray-600">{activeSession.therapyName}</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                LIVE
              </span>
            </div>

            {/* Stage Progress */}
            <div className="flex items-center justify-between mb-2">
              {['preparation', 'massage', 'steam', 'rest', 'cleanup'].map((stage, idx) => (
                <div key={stage} className="flex flex-col items-center flex-1">
                  <div className={`w-3 h-3 rounded-full transition-all ${
                    stage === activeSession.currentStage
                      ? 'bg-amber-500 scale-150 shadow-lg'
                      : activeSession.stages.indexOf(stage) < activeSession.stages.indexOf(activeSession.currentStage)
                      ? 'bg-emerald-500'
                      : 'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-600 mt-1 capitalize">{stage}</span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activeSession.percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-sm font-semibold text-gray-700">{activeSession.percentage}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Ring */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - overallProgress.progressPercentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-emerald-600">
                {overallProgress.progressPercentage}%
              </span>
              <span className="text-sm text-gray-600">Complete</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {overallProgress.completedSessions}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wider">Completed</div>
            </div>
            <div className="w-px bg-gray-300" />
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {overallProgress.totalSessionsPlanned}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wider">Total</div>
            </div>
          </div>

          {/* Treatment Info */}
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">{overallProgress.treatmentName}</h3>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
              {overallProgress.panchakarmaType}
            </span>
            {overallProgress.estimatedCompletionDate && (
              <p className="text-sm text-gray-600 mt-2 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                Completion: {formatDate(overallProgress.estimatedCompletionDate)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Phase Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Treatment Phases</h2>
          </div>

          <div className="space-y-6">
            {['purvakarma', 'pradhanakarma', 'paschatkarma'].map((phaseName, index) => {
              const phase = phases.find(p => p.name === phaseName);
              const isCurrent = overallProgress.currentPhase === phaseName;
              const isCompleted = ['purvakarma', 'pradhanakarma', 'paschatkarma'].indexOf(overallProgress.currentPhase) > index;

              return (
                <div key={phaseName} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < 2 && (
                      <div className={`w-0.5 h-12 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <h3 className="font-semibold text-gray-900 capitalize mb-1">
                      {phaseName.replace('karma', ' Karma')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {phaseName === 'purvakarma' && 'Preparation Phase'}
                      {phaseName === 'pradhanakarma' && 'Main Treatment'}
                      {phaseName === 'paschatkarma' && 'Post-Treatment Care'}
                    </p>
                    {phase && (
                      <p className="text-xs text-gray-500">{phase.totalDays} days</p>
                    )}
                    {isCurrent && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        Current Phase
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
            {upcomingSessions.length}
          </span>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <motion.div
                key={session.sessionId}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {session.sessionNumber}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{session.therapyName}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold capitalize">
                      {session.phaseName}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                      Day {session.dayNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(session.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(session.scheduledStartTime)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Instructions */}
      {instructions && (instructions.prePanchakarma || instructions.postPanchakarma || instructions.safety) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Important Instructions</h2>
          </div>

          <div className="space-y-4">
            {instructions.prePanchakarma && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Pre-Treatment Care</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{instructions.prePanchakarma}</p>
              </div>
            )}
            {instructions.postPanchakarma && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Post-Treatment Care</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{instructions.postPanchakarma}</p>
              </div>
            )}
            {instructions.safety && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Safety Guidelines</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{instructions.safety}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Completed Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Completed Sessions</h2>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
            {completedSessions.length}
          </span>
        </div>

        {completedSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No completed sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((session) => (
              <motion.div
                key={session._id}
                whileHover={{ scale: 1.01 }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{session.therapyName}</h3>
                    <p className="text-sm text-gray-600">{formatDate(session.scheduledAt)}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                      Day {session.dayNumber}
                    </span>

                    {session.rating ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= session.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {session.patientFeedback && (
                          <p className="text-sm text-gray-600 italic mt-1">
                            "{session.patientFeedback}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSession(session._id);
                          setShowFeedbackModal(true);
                        }}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Add Feedback
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <FeedbackForm
                onClose={() => setShowFeedbackModal(false)}
                onSubmit={handleFeedbackSubmit}
                submitting={feedbackSubmitting}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Inline Feedback Form Component
const FeedbackForm = ({ onClose, onSubmit, submitting }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [comfortLevel, setComfortLevel] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    onSubmit({
      rating,
      feedback,
      symptoms,
      comfortLevel
    });
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Session Feedback</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            How would you rate this session? *
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-semibold text-gray-900 mb-2">
            Your Feedback
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience with this session..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-500 text-right mt-1">
            {feedback.length}/500
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label htmlFor="symptoms" className="block text-sm font-semibold text-gray-900 mb-2">
            Any Symptoms? (Optional)
          </label>
          <input
            type="text"
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., Mild soreness, Relaxed, Energized"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Comfort Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Comfort Level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'comfortable', label: 'Comfortable', emoji: '😊' },
              { value: 'mild_discomfort', label: 'Mild Discomfort', emoji: '😐' },
              { value: 'moderate_discomfort', label: 'Moderate', emoji: '😣' },
              { value: 'severe_discomfort', label: 'Severe', emoji: '😖' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setComfortLevel(option.value)}
                className={`p-3 border-2 rounded-lg transition-all ${
                  comfortLevel === option.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-xs font-medium text-gray-700">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </>
  );
};

export default TherapyProgress;
