// src/components/therapist/feedback/FeedbackAnalytics.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, TrendingUp, MessageSquare, Award, 
  ThumbsUp, Loader2, BarChart3 
} from 'lucide-react';
import FeedbackList from './FeedbackList';
import FeedbackCharts from './FeedbackCharts';

const FeedbackAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview or list

  useEffect(() => {
    // Simulate loading analytics - replace with actual API call
    setTimeout(() => {
      setAnalytics({
        averageRating: 4.7,
        totalFeedback: 128,
        positiveRate: 92,
        responseRate: 95,
        recentTrend: '+12%'
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-600" />
          <p className="text-gray-600">Loading feedback analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
        <p className="text-gray-500 mt-1">Track your performance and patient satisfaction</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {analytics.recentTrend}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Average Rating</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.averageRating}</p>
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(analytics.averageRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Feedback</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalFeedback}</p>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Positive Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.positiveRate}%</p>
          <p className="text-sm text-gray-500 mt-2">4+ star ratings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Response Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.responseRate}%</p>
          <p className="text-sm text-gray-500 mt-2">Feedback responded</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>All Feedback</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' ? (
            <FeedbackCharts />
          ) : (
            <FeedbackList />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;
