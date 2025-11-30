import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Edit3, Clock, Star, 
  CheckCircle, AlertCircle, Loader2, Plus, X, 
  Heart, Search, ChevronDown, User, Zap, Frown
} from 'lucide-react';
import axios from 'axios';

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3003/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Feedback = ({ sessionId = null }) => {
  // State Management
  const [feedbacks, setFeedbacks] = useState([]);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5; // Smaller limit for better loading

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [formData, setFormData] = useState({
    sessionId: sessionId || '',
    category: 'symptoms',
    rating: 0,
    symptoms: '',
    sideEffects: '',
    improvements: '',
    comments: '',
    mood: 'neutral',
    energyLevel: 5,
    painLevel: 0,
    sleepQuality: 5
  });

  // Session search
  const [searchSessionId, setSearchSessionId] = useState('');
  const [showSessionSearch, setShowSessionSearch] = useState(false);

  // Categories
  const categories = [
    { value: 'symptoms', label: 'Symptoms', icon: '🩺', color: 'bg-blue-100 text-blue-700' },
    { value: 'treatment', label: 'Treatment', icon: '💊', color: 'bg-green-100 text-green-700' },
    { value: 'therapy', label: 'Therapy', icon: '🧘', color: 'bg-purple-100 text-purple-700' },
    { value: 'general', label: 'General', icon: '💬', color: 'bg-emerald-100 text-emerald-700' }
  ];

  const moods = [
    { value: 'excellent', label: 'Great', emoji: '😊', color: 'bg-green-100' },
    { value: 'good', label: 'Good', emoji: '🙂', color: 'bg-blue-100' },
    { value: 'neutral', label: 'Okay', emoji: '😐', color: 'bg-yellow-100' },
    { value: 'poor', label: 'Poor', emoji: '😔', color: 'bg-orange-100' },
    { value: 'terrible', label: 'Bad', emoji: '😞', color: 'bg-red-100' }
  ];

  // Scroll hook for header effects
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // API Functions
  const fetchSessionFeedback = async (sessionIdToFetch) => {
    if (!sessionIdToFetch) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/feedback/session/${sessionIdToFetch}`);
      if (response.data.success) {
        setSessionFeedback(response.data.data.feedback);
        setSuccess(`Found feedback for session ${sessionIdToFetch}!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(`No feedback found for session ${sessionIdToFetch}.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Load initial feedbacks
  const loadFeedbacks = async (reset = false) => {
    const pageToLoad = reset ? 1 : currentPage;
    
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError('');
    
    try {
      const response = await api.get(`/feedback/my-feedback?page=${pageToLoad}&limit=${limit}`);
      
      if (response.data.success) {
        const { docs, totalPages: pages, totalDocs } = response.data.data;
        
        if (reset) {
          setFeedbacks(docs || []);
          setCurrentPage(1);
        } else {
          setFeedbacks(prev => [...prev, ...(docs || [])]);
        }
        
        setTotalPages(pages || 1);
        setTotalFeedbacks(totalDocs || 0);
        setHasMore(pageToLoad < pages);
      }
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more feedbacks
  const loadMoreFeedbacks = async () => {
    if (!hasMore || loadingMore) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    setLoadingMore(true);
    
    try {
      const response = await api.get(`/feedback/my-feedback?page=${nextPage}&limit=${limit}`);
      
      if (response.data.success) {
        const { docs, totalPages: pages } = response.data.data;
        setFeedbacks(prev => [...prev, ...(docs || [])]);
        setHasMore(nextPage < pages);
      }
    } catch (err) {
      setError('Failed to load more feedback.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      let response;
      if (editingFeedback) {
        response = await api.put(`/feedback/my-feedback/${editingFeedback._id}`, formData);
        setSuccess('Feedback updated successfully! 🎉');
      } else {
        response = await api.post('/feedback', formData);
        setSuccess('Thank you for your feedback! 🌿');
      }
      
      if (response.data.success) {
        resetForm();
        loadFeedbacks(true); // Reset and reload
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.category) {
      setError('Please select a feedback category');
      return false;
    }
    if (formData.rating === 0) {
      setError('Please provide a rating');
      return false;
    }
    if (!formData.comments.trim()) {
      setError('Please share your experience');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      sessionId: sessionId || '',
      category: 'symptoms',
      rating: 0,
      symptoms: '',
      sideEffects: '',
      improvements: '',
      comments: '',
      mood: 'neutral',
      energyLevel: 5,
      painLevel: 0,
      sleepQuality: 5
    });
    setEditingFeedback(null);
    setShowForm(false);
  };

  const handleEdit = (feedback) => {
    const createdAt = new Date(feedback.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      setError('Feedback can only be edited within 24 hours');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setFormData({
      sessionId: feedback.sessionId || '',
      category: feedback.category || 'symptoms',
      rating: feedback.rating || 0,
      symptoms: feedback.symptoms || '',
      sideEffects: feedback.sideEffects || '',
      improvements: feedback.improvements || '',
      comments: feedback.comments || '',
      mood: feedback.mood || 'neutral',
      energyLevel: feedback.energyLevel || 5,
      painLevel: feedback.painLevel || 0,
      sleepQuality: feedback.sleepQuality || 5
    });
    
    setEditingFeedback(feedback);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isEditable = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getMoodInfo = (mood) => {
    return moods.find(m => m.value === mood) || moods[2];
  };

  const handleSessionSearch = () => {
    if (searchSessionId.trim()) {
      fetchSessionFeedback(searchSessionId.trim());
      setShowSessionSearch(false);
      setSearchSessionId('');
    }
  };

  useEffect(() => {
    loadFeedbacks();
    if (sessionId) {
      fetchSessionFeedback(sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Sticky Header */}
      {/* <div className={`
        sticky top-0 z-50 px-4 py-6 
        transition-all duration-300 ease-in-out
        ${scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-emerald-100/50 border-b border-emerald-100' 
          : 'bg-white border-b border-emerald-100'
        }
      `}> */}
        {/* <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-800 mb-2">
            Treatment Feedback
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Share your experience to help us improve your care
          </p>
        </div> */}
      {/* </div> */}

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-2xl flex items-start gap-3"
            >
              <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <span className="text-base leading-relaxed">{success}</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <span className="text-base leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Search */}
        <div className="mt-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <button
              onClick={() => setShowSessionSearch(!showSessionSearch)}
              className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium transition-colors"
            >
              <span className="flex items-center gap-3">
                <Search className="w-5 h-5" />
                Search Session Feedback
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showSessionSearch ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showSessionSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 space-y-4">
                    <input
                      type="text"
                      value={searchSessionId}
                      onChange={(e) => setSearchSessionId(e.target.value)}
                      placeholder="Enter Session ID"
                      className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleSessionSearch()}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSessionSearch}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
                      >
                        Search
                      </button>
                      <button
                        onClick={() => {
                          setShowSessionSearch(false);
                          setSearchSessionId('');
                          setSessionFeedback(null);
                        }}
                        className="px-6 py-4 text-gray-500 hover:text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Session Feedback Display */}
        {sessionFeedback && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">
                  Session: {sessionFeedback.sessionId}
                </h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        sessionFeedback.rating >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-base text-gray-600 ml-2">
                    {sessionFeedback.rating}/5
                  </span>
                </div>
              </div>
              
              {isEditable(sessionFeedback.createdAt) && (
                <button
                  onClick={() => handleEdit(sessionFeedback)}
                  className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700 block mb-2">Category:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryInfo(sessionFeedback.category).color}`}>
                  {getCategoryInfo(sessionFeedback.category).icon} {getCategoryInfo(sessionFeedback.category).label}
                </span>
              </div>
              
              {sessionFeedback.comments && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-gray-700 block mb-2">Comments:</span>
                  <p className="text-base text-gray-700 leading-relaxed">{sessionFeedback.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Form Button */}
        {!showForm && (
          <div className="mb-12 text-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 px-12 rounded-2xl shadow-lg text-lg transition-all"
            >
              <Plus className="w-6 h-6" />
              Share Your Experience
            </motion.button>
          </div>
        )}

        {/* Feedback Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-12 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-800">
                        {editingFeedback ? 'Update Feedback' : 'New Feedback'}
                      </h2>
                      <p className="text-sm text-gray-600">Tell us about your experience</p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Session ID */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Session ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sessionId}
                    onChange={(e) => setFormData({...formData, sessionId: e.target.value})}
                    placeholder="Enter session ID if you have one"
                    className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-4">
                    Feedback Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((category) => (
                      <motion.button
                        key={category.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({...formData, category: category.value})}
                        className={`p-6 rounded-2xl border-2 transition-all text-center ${
                          formData.category === category.value
                            ? `${category.color} border-current shadow-md`
                            : 'border-gray-200 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <div className="text-3xl mb-3">{category.icon}</div>
                        <div className="text-base font-semibold">{category.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-4">
                    Overall Rating *
                  </label>
                  <div className="flex justify-center items-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <motion.button
                        key={rating}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({...formData, rating})}
                        className="p-2"
                      >
                        <Star 
                          className={`w-12 h-12 ${
                            formData.rating >= rating 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-gray-300'
                          } transition-colors`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  {formData.rating > 0 && (
                    <p className="text-center text-gray-600 text-base">
                      You rated: {formData.rating} star{formData.rating > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-4">
                    Current Mood
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {moods.map((mood) => (
                      <motion.button
                        key={mood.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({...formData, mood: mood.value})}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.mood === mood.value
                            ? `${mood.color} border-gray-400 shadow-md`
                            : 'border-gray-200 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-2">{mood.emoji}</div>
                        <div className="text-sm font-semibold">{mood.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-4">
                      Energy Level: {formData.energyLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.energyLevel}
                      onChange={(e) => setFormData({...formData, energyLevel: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-4">
                      Pain Level: {formData.painLevel}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.painLevel}
                      onChange={(e) => setFormData({...formData, painLevel: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>None</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-4">
                      Sleep Quality: {formData.sleepQuality}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.sleepQuality}
                      onChange={(e) => setFormData({...formData, sleepQuality: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Symptoms
                    </label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      rows={4}
                      placeholder="Describe any symptoms..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Side Effects
                    </label>
                    <textarea
                      value={formData.sideEffects}
                      onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                      rows={4}
                      placeholder="Any side effects..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Improvements
                    </label>
                    <textarea
                      value={formData.improvements}
                      onChange={(e) => setFormData({...formData, improvements: e.target.value})}
                      rows={4}
                      placeholder="Positive changes..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                    />
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Additional Comments *
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    rows={5}
                    placeholder="Share your overall experience..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={resetForm}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="px-10 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {editingFeedback ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {editingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
              <Clock className="w-7 h-7" />
              Your Feedback History
            </h2>
            <div className="text-base text-gray-600 bg-emerald-100 px-4 py-2 rounded-full">
              {totalFeedbacks} total
            </div>
          </div>

          {/* Loading State */}
          {loading && feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
              <span className="text-lg text-gray-600">Loading your feedback...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No feedback yet</h3>
              <p className="text-gray-600 text-lg mb-8">
                Share your first experience to help us improve
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg text-lg"
              >
                <Plus className="w-6 h-6" />
                Add Your First Feedback
              </motion.button>
            </div>
          ) : (
            <>
              {/* Feedback Cards */}
              <div className="space-y-6">
                {feedbacks.map((feedback, index) => (
                  <motion.div
                    key={feedback._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${getCategoryInfo(feedback.category).color}`}>
                          {getCategoryInfo(feedback.category).icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {getCategoryInfo(feedback.category).label} Feedback
                          </h3>
                          {feedback.sessionId && (
                            <div className="text-lg text-blue-600 mb-3">
                              Session: {feedback.sessionId}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-6 h-6 ${
                                  feedback.rating >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-lg text-gray-600 ml-2">
                              {feedback.rating}/5
                            </span>
                          </div>
                          <div className="text-base text-gray-500">
                            {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {isEditable(feedback.createdAt) && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(feedback)}
                          className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Edit feedback"
                        >
                          <Edit3 className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>

                    {/* Health Metrics */}
                    {(feedback.mood || feedback.energyLevel || feedback.painLevel || feedback.sleepQuality) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-6 bg-gray-50 rounded-xl">
                        {feedback.mood && (
                          <div className="text-center">
                            <div className="text-2xl mb-2">{getMoodInfo(feedback.mood).emoji}</div>
                            <div className="text-sm text-gray-600 mb-1">Mood</div>
                            <div className="text-lg font-semibold capitalize text-gray-800">{feedback.mood}</div>
                          </div>
                        )}
                        {feedback.energyLevel && (
                          <div className="text-center">
                            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                            <div className="text-sm text-gray-600 mb-1">Energy</div>
                            <div className="text-lg font-semibold text-gray-800">{feedback.energyLevel}/10</div>
                          </div>
                        )}
                        {feedback.painLevel !== undefined && (
                          <div className="text-center">
                            <Frown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                            <div className="text-sm text-gray-600 mb-1">Pain</div>
                            <div className="text-lg font-semibold text-gray-800">{feedback.painLevel}/10</div>
                          </div>
                        )}
                        {feedback.sleepQuality && (
                          <div className="text-center">
                            <div className="text-2xl mb-2">😴</div>
                            <div className="text-sm text-gray-600 mb-1">Sleep</div>
                            <div className="text-lg font-semibold text-gray-800">{feedback.sleepQuality}/10</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-4">
                      {feedback.symptoms && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <h4 className="text-base font-semibold text-blue-800 mb-2">Symptoms:</h4>
                          <p className="text-base text-blue-700 leading-relaxed">{feedback.symptoms}</p>
                        </div>
                      )}
                      
                      {feedback.sideEffects && (
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <h4 className="text-base font-semibold text-orange-800 mb-2">Side Effects:</h4>
                          <p className="text-base text-orange-700 leading-relaxed">{feedback.sideEffects}</p>
                        </div>
                      )}
                      
                      {feedback.improvements && (
                        <div className="p-4 bg-green-50 rounded-xl">
                          <h4 className="text-base font-semibold text-green-800 mb-2">Improvements:</h4>
                          <p className="text-base text-green-700 leading-relaxed">{feedback.improvements}</p>
                        </div>
                      )}
                      
                      {feedback.comments && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h4 className="text-base font-semibold text-gray-800 mb-2">Comments:</h4>
                          <p className="text-base text-gray-700 leading-relaxed">{feedback.comments}</p>
                        </div>
                      )}
                    </div>

                    {/* Edit Indicator */}
                    {isEditable(feedback.createdAt) && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                          <Clock className="w-4 h-4" />
                          Can be edited for {Math.round(24 - (new Date() - new Date(feedback.createdAt)) / (1000 * 60 * 60))} more hours
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-8">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMoreFeedbacks}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-3 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 px-8 py-4 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Loading more feedback...
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6" />
                        Load More Feedback ({feedbacks.length} of {totalFeedbacks})
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {!hasMore && feedbacks.length > 0 && (
                <div className="text-center pt-8 pb-4">
                  <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    You've seen all your feedback
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
