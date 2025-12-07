// src/components/therapist/sessions/StartSessionModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, User, Stethoscope, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const StartSessionModal = ({ session, onClose, onSuccess }) => {
  const [startNotes, setStartNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch(`/api/therapists/sessions/${session._id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startNotes })
      });

      if (!response.ok) throw new Error('Failed to start session');

      toast.success('Session started successfully! 🔴 LIVE');
      onSuccess();
    } catch (error) {
      console.error('Start session error:', error);
      toast.error(error.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Start Therapy Session</h2>
                  <p className="text-green-100 text-sm mt-1">
                    Ready to begin the session?
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Patient Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-medium text-gray-900">
                    {session.patientId?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium text-gray-900">
                    {session.patientId?.age || 'N/A'} years
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Therapy Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {session.therapyData?.therapyType || 'General Therapy'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(session.scheduledAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Doctor Info */}
              {session.therapyData?.doctorId && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Prescribed by:</span>
                    <span className="font-medium text-gray-900">
                      Dr. {session.therapyData.doctorId.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pre-session Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Start Notes (Optional)
              </label>
              <textarea
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
                rows="4"
                placeholder="Enter any observations or notes before starting the session..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                You can add detailed notes during and after the session
              </p>
            </div>

            {/* Important Reminders */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Before Starting:
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>✓ Ensure all equipment is prepared</li>
                    <li>✓ Verify patient identity and consent</li>
                    <li>✓ Check for any allergies or contraindications</li>
                    <li>✓ Inform patient about the procedure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Session Duration Info */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-6">
              <Clock className="w-4 h-4" />
              <span>
                Estimated Duration: {session.estimatedDuration || 60} minutes
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Session</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartSessionModal;
