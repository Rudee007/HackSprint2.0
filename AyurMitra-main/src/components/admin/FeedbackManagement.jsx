// src/components/admin/FeedbackManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, Download, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Star, TrendingUp,
  User, Calendar, ChevronLeft, ChevronRight, X, Send,
  Flag, Eye, BarChart3, FileText, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';

const FeedbackManagement = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);
  const [attentionRequired, setAttentionRequired] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    therapyType: 'all',
    requiresAttention: 'all',
    timeRange: '1month'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage, filters]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes, attentionRes] = await Promise.all([
        adminService.getAllFeedback({
          page: currentPage,
          limit: itemsPerPage,
          status: filters.status !== 'all' ? filters.status : undefined,
          therapyType: filters.therapyType !== 'all' ? filters.therapyType : undefined,
          requiresAttention: filters.requiresAttention === 'true' ? 'true' : undefined,
          timeRange: filters.timeRange
        }),
        adminService.getFeedbackStats(),
        adminService.getAttentionRequiredFeedback()
      ]);
  
      console.log('📊 Stats Response:', statsRes); // Debug log
  
      if (feedbackRes.success) {
        const feedbackData = feedbackRes.data.feedback || feedbackRes.data || [];
        const paginationData = feedbackRes.data.pagination || {};
        
        setFeedbackList(Array.isArray(feedbackData) ? feedbackData : []);
        setTotalPages(paginationData.totalPages || 1);
      }
  
      if (statsRes.success) {
        console.log('✅ Stats Data:', statsRes.data); // Debug
        setStats(statsRes.data);
      }
  
      if (attentionRes.success) {
        const attentionData = attentionRes.data.feedback || attentionRes.data.criticalFeedback || attentionRes.data || [];
        setAttentionRequired(Array.isArray(attentionData) ? attentionData : []);
      }
    } catch (error) {
      console.error('❌ Error loading feedback data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };
   
  const handleRespond = async (feedbackId, responseText, actionTaken) => {
    try {
      await adminService.respondToFeedback(feedbackId, responseText, actionTaken);
      setShowRespondModal(false);
      loadData();
    } catch (error) {
      console.error('Error responding to feedback:', error);
    }
  };

  const handleFlag = async (feedbackId, flag, reason) => {
    try {
      await adminService.flagFeedback(feedbackId, flag, reason);
      loadData();
    } catch (error) {
      console.error('Error flagging feedback:', error);
    }
  };

  const handleExport = async () => {
    await adminService.exportFeedbackData(filters, 'csv', filters.timeRange);
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: { bg: 'bg-green-100', text: 'text-green-700', icon: ThumbsUp },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
      high: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      critical: { bg: 'bg-red-600', text: 'text-white', icon: AlertTriangle }
    };
    return badges[severity] || badges.medium;
  };

  const filteredFeedback = feedbackList.filter(feedback =>
    !searchTerm ||
    feedback.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.providerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add this function inside FeedbackManagement component, before return
const calculateAverageRating = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) return 0;
  
  const totalRating = feedbacks.reduce((sum, feedback) => {
    const rating = feedback.ratings?.overallSatisfaction || 
                   feedback.overallRating || 
                   0;
    return sum + rating;
  }, 0);
  
  return totalRating / feedbacks.length;
};


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
    {/* Stats Cards - FIXED */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <StatsCard
    title="Total Feedback"
    value={stats?.overview?.totalFeedback || feedbackList.length || 0}
    icon={MessageSquare}
    gradient="from-blue-500 to-blue-600"
    loading={loading}
  />
  <StatsCard
    title="Average Rating"
    value={
      stats?.overview?.averageRating 
        ? stats.overview.averageRating.toFixed(1)
        : stats?.averageRating 
          ? stats.averageRating.toFixed(1)
          : calculateAverageRating(feedbackList).toFixed(1)
    }
    icon={Star}
    gradient="from-yellow-500 to-yellow-600"
    loading={loading}
  />
  <StatsCard
    title="Needs Attention"
    value={attentionRequired.length || stats?.overview?.criticalFeedbackCount || 0}
    icon={AlertTriangle}
    gradient="from-red-500 to-red-600"
    loading={loading}
  />
  <StatsCard
    title="Responded"
    value={
      stats?.overview?.respondedCount || 
      feedbackList.filter(f => f.adminResponse).length ||
      0
    }
    icon={CheckCircle}
    gradient="from-green-500 to-green-600"
    loading={loading}
  />
</div>

      {/* Attention Required Section */}
      {attentionRequired.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Requires Immediate Attention</h3>
                <p className="text-sm text-red-700">{attentionRequired.length} feedback items need review</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {attentionRequired.slice(0, 3).map(feedback => (
              <div
                key={feedback._id}
                className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                    {feedback.patientId?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{feedback.patientId?.name || 'Anonymous'}</p>
                    <p className="text-sm text-slate-500">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                  Review Now
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Feedback Management</h2>
                <p className="text-slate-600 mt-1">Review and respond to patient feedback</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filters.therapyType}
              onChange={(e) => setFilters({...filters, therapyType: e.target.value})}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="therapy">Therapy</option>
              <option value="followup">Follow-up</option>
            </select>

            <select
              value={filters.requiresAttention}
              onChange={(e) => setFilters({...filters, requiresAttention: e.target.value})}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="true">Requires Attention</option>
              <option value="false">Normal</option>
            </select>

            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No feedback found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            filteredFeedback.map((feedback) => (
              <FeedbackItem
                key={feedback._id}
                feedback={feedback}
                onView={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailsModal(true);
                }}
                onRespond={() => {
                  setSelectedFeedback(feedback);
                  setShowRespondModal(true);
                }}
                onFlag={(flag, reason) => handleFlag(feedback._id, flag, reason)}
                getRatingStars={getRatingStars}
                getSeverityBadge={getSeverityBadge}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredFeedback.length > 0 && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of {filteredFeedback.length} items
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <div className="flex items-center space-x-2">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-medium ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && (
          <FeedbackDetailsModal
            feedback={selectedFeedback}
            onClose={() => setShowDetailsModal(false)}
            getRatingStars={getRatingStars}
          />
        )}
        {showRespondModal && (
          <RespondModal
            feedback={selectedFeedback}
            onClose={() => setShowRespondModal(false)}
            onSubmit={handleRespond}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient, loading }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white shadow-lg`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">{loading ? '...' : value}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl">
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </motion.div>
);

// Feedback Item Component
const FeedbackItem = ({ feedback, onView, onRespond, onFlag, getRatingStars, getSeverityBadge }) => {
  const severityInfo = getSeverityBadge(feedback.severity || 'medium');
  const SeverityIcon = severityInfo.icon;

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {feedback.patientId?.name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-slate-800">{feedback.patientId?.name || 'Anonymous Patient'}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${severityInfo.bg} ${severityInfo.text}`}>
                <SeverityIcon className="w-3 h-3" />
                <span className="capitalize">{feedback.severity || 'Medium'}</span>
              </span>
              {feedback.flags?.requiresAttention && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  ⚠️ Attention Required
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Provider: {feedback.providerId?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

<div className="flex items-center space-x-2 mb-3">
  {getRatingStars(feedback.ratings?.overallSatisfaction || feedback.overallRating || 0)}
  <span className="text-sm text-slate-600 ml-2">
    ({feedback.ratings?.overallSatisfaction || feedback.overallRating || 0}/5)
  </span>
</div>

<p className="text-slate-700 mb-3 line-clamp-2">
  {feedback.textFeedback?.additionalComments || feedback.comments || 'No comments provided'}
</p>

            {feedback.adminResponse && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg mt-3">
                <p className="text-sm font-medium text-blue-900">Admin Response:</p>
                <p className="text-sm text-blue-800 mt-1">{feedback.adminResponse.responseText}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Responded on {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </button>
          {!feedback.adminResponse && (
            <button
              onClick={onRespond}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Respond"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onFlag(!feedback.flags?.flagged, 'Review needed')}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Flag"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Feedback Details Modal
// Update the FeedbackDetailsModal in FeedbackManagement.jsx

const FeedbackDetailsModal = ({ feedback, onClose, getRatingStars }) => {
  if (!feedback) return null;

  console.log('📋 Feedback Details Modal Data:', feedback); // Debug log

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold text-slate-800">Feedback Details</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium">
                  {feedback.patientId?.name || 'Anonymous'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Submission Date</p>
                <p className="font-medium">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Provider Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Provider</p>
                <p className="font-medium">
                  {feedback.providerId?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Therapy Type</p>
                <p className="font-medium capitalize">
                  {feedback.therapyType || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Ratings - FIXED */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Ratings</h4>
            <div className="space-y-3">
              {/* Overall Satisfaction */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overall Satisfaction:</span>
                <div className="flex items-center space-x-2">
                  {getRatingStars(feedback.ratings?.overallSatisfaction || 0)}
                  <span className="text-sm font-medium">
                    ({feedback.ratings?.overallSatisfaction || 0}/5)
                  </span>
                </div>
              </div>

              {/* Treatment Effectiveness */}
              {feedback.ratings?.treatmentEffectiveness && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Treatment Effectiveness:</span>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedback.ratings.treatmentEffectiveness)}
                    <span className="text-sm font-medium">
                      ({feedback.ratings.treatmentEffectiveness}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Patient Care */}
              {feedback.ratings?.patientCare && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Patient Care:</span>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedback.ratings.patientCare)}
                    <span className="text-sm font-medium">
                      ({feedback.ratings.patientCare}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Facility Quality */}
              {feedback.ratings?.facilityQuality && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Facility Quality:</span>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedback.ratings.facilityQuality)}
                    <span className="text-sm font-medium">
                      ({feedback.ratings.facilityQuality}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Therapist Professionalism */}
              {feedback.ratings?.therapistProfessionalism && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Therapist Professionalism:</span>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedback.ratings.therapistProfessionalism)}
                    <span className="text-sm font-medium">
                      ({feedback.ratings.therapistProfessionalism}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Communication Quality */}
              {feedback.ratings?.communicationQuality && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Communication Quality:</span>
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedback.ratings.communicationQuality)}
                    <span className="text-sm font-medium">
                      ({feedback.ratings.communicationQuality}/5)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Metrics */}
          {feedback.healthMetrics && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-3">Health Metrics (Before → After)</h4>
              <div className="grid grid-cols-2 gap-3">
                {feedback.healthMetrics.painLevel && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Pain Level</p>
                    <p className="text-sm font-medium">
                      {feedback.healthMetrics.painLevel.before} → {feedback.healthMetrics.painLevel.after}
                      <span className="text-green-600 ml-2">
                        ↓ {feedback.healthMetrics.painLevel.before - feedback.healthMetrics.painLevel.after}
                      </span>
                    </p>
                  </div>
                )}
                {feedback.healthMetrics.energyLevel && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Energy Level</p>
                    <p className="text-sm font-medium">
                      {feedback.healthMetrics.energyLevel.before} → {feedback.healthMetrics.energyLevel.after}
                      <span className="text-green-600 ml-2">
                        ↑ {feedback.healthMetrics.energyLevel.after - feedback.healthMetrics.energyLevel.before}
                      </span>
                    </p>
                  </div>
                )}
                {feedback.healthMetrics.sleepQuality && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Sleep Quality</p>
                    <p className="text-sm font-medium">
                      {feedback.healthMetrics.sleepQuality.before} → {feedback.healthMetrics.sleepQuality.after}
                      <span className="text-green-600 ml-2">
                        ↑ {feedback.healthMetrics.sleepQuality.after - feedback.healthMetrics.sleepQuality.before}
                      </span>
                    </p>
                  </div>
                )}
                {feedback.healthMetrics.stressLevel && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Stress Level</p>
                    <p className="text-sm font-medium">
                      {feedback.healthMetrics.stressLevel.before} → {feedback.healthMetrics.stressLevel.after}
                      <span className="text-green-600 ml-2">
                        ↓ {feedback.healthMetrics.stressLevel.before - feedback.healthMetrics.stressLevel.after}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-3">Improvements</h4>
              <div className="space-y-3">
                {feedback.improvements.map((improvement, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {improvement.aspect?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {improvement.progressLevel}%
                      </span>
                    </div>
                    {improvement.notes && (
                      <p className="text-sm text-slate-600">{improvement.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments - FIXED */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Comments</h4>
            
            {/* Positive Aspects */}
            {feedback.textFeedback?.positiveAspects && (
              <div className="mb-3">
                <p className="text-sm font-medium text-green-700 mb-1">Positive Aspects:</p>
                <p className="text-slate-700">{feedback.textFeedback.positiveAspects}</p>
              </div>
            )}

            {/* Areas for Improvement */}
            {feedback.textFeedback?.areasForImprovement && (
              <div className="mb-3">
                <p className="text-sm font-medium text-orange-700 mb-1">Areas for Improvement:</p>
                <p className="text-slate-700">{feedback.textFeedback.areasForImprovement}</p>
              </div>
            )}

            {/* Additional Comments */}
            {feedback.textFeedback?.additionalComments && (
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Additional Comments:</p>
                <p className="text-slate-700">{feedback.textFeedback.additionalComments}</p>
              </div>
            )}

            {/* Fallback if no comments */}
            {!feedback.textFeedback?.positiveAspects && 
             !feedback.textFeedback?.areasForImprovement && 
             !feedback.textFeedback?.additionalComments && (
              <p className="text-slate-500 italic">No comments provided</p>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Recommendation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Recommendation Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {feedback.recommendationScore || 0}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Would Recommend</p>
                <div className="flex items-center space-x-2">
                  {feedback.wouldReturnForTreatment && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      ✓ Would Return
                    </span>
                  )}
                  {feedback.wouldRecommendToOthers && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      ✓ Would Recommend
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Response */}
          {feedback.adminResponse && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Admin Response</h4>
              <p className="text-blue-800">{feedback.adminResponse.responseText}</p>
              {feedback.adminResponse.actionTaken && (
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Action Taken:</strong> {feedback.adminResponse.actionTaken}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-3">
                Responded on {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Respond Modal
const RespondModal = ({ feedback, onClose, onSubmit }) => {
  const [responseText, setResponseText] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(feedback._id, responseText, actionTaken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">Respond to Feedback</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-600 mb-2">
              <strong>Patient:</strong> {feedback.patientId?.name}
            </p>
            <p className="text-slate-700 italic">"{feedback.comments}"</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Response *</label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your response to the patient..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Action Taken (Optional)</label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Scheduled follow-up appointment"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <Send className="w-4 h-4" />
              <span>Send Response</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackManagement;
