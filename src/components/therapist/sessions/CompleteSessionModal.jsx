// src/components/therapist/sessions/CompleteSessionModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle, Heart, Activity, Thermometer, 
  Droplet, Weight, TrendingUp, AlertCircle, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CompleteSessionModal = ({ session, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vitals: {
      bloodPressure: { systolic: '', diastolic: '' },
      pulse: '',
      temperature: '',
      weight: ''
    },
    observations: {
      sweatingQuality: '',
      skinTexture: '',
      patientComfort: ''
    },
    adverseEffects: [],
    materialsUsed: [],
    sessionNotes: '',
    patientFeedback: '',
    nextSessionPrep: ''
  });

  const handleVitalsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value
      }
    }));
  };

  const handleBPChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        bloodPressure: {
          ...prev.vitals.bloodPressure,
          [type]: value
        }
      }
    }));
  };

  const handleObservationsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      observations: {
        ...prev.observations,
        [field]: value
      }
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch(`/api/therapists/sessions/${session._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to complete session');

      toast.success('Session completed successfully! ✅');
      onSuccess();
    } catch (error) {
      console.error('Complete session error:', error);
      toast.error(error.message || 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  const duration = session.sessionStartTime 
    ? Math.floor((new Date() - new Date(session.sessionStartTime)) / 60000)
    : 0;

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
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Complete Session</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {session.patientId?.name || 'Patient'} • Duration: {duration} minutes
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
          <div className="p-6 space-y-6">
            {/* Vitals Section */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Patient Vitals
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blood Pressure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure (mmHg)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="120"
                      value={formData.vitals.bloodPressure.systolic}
                      onChange={(e) => handleBPChange('systolic', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-gray-500">/</span>
                    <input
                      type="number"
                      placeholder="80"
                      value={formData.vitals.bloodPressure.diastolic}
                      onChange={(e) => handleBPChange('diastolic', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Pulse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-red-500" />
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="72"
                    value={formData.vitals.pulse}
                    onChange={(e) => handleVitalsChange('pulse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Thermometer className="w-4 h-4 mr-1 text-red-500" />
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={formData.vitals.temperature}
                    onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Weight className="w-4 h-4 mr-1 text-red-500" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70.0"
                    value={formData.vitals.weight}
                    onChange={(e) => handleVitalsChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Observations Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Clinical Observations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sweating Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Droplet className="w-4 h-4 mr-1 text-blue-500" />
                    Sweating Quality
                  </label>
                  <select
                    value={formData.observations.sweatingQuality}
                    onChange={(e) => handleObservationsChange('sweatingQuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="good">Good</option>
                    <option value="moderate">Moderate</option>
                    <option value="poor">Poor</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Skin Texture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skin Texture
                  </label>
                  <select
                    value={formData.observations.skinTexture}
                    onChange={(e) => handleObservationsChange('skinTexture', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="soft">Soft</option>
                    <option value="normal">Normal</option>
                    <option value="rough">Rough</option>
                    <option value="dry">Dry</option>
                  </select>
                </div>

                {/* Patient Comfort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Comfort
                  </label>
                  <select
                    value={formData.observations.patientComfort}
                    onChange={(e) => handleObservationsChange('patientComfort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="mild_discomfort">Mild Discomfort</option>
                    <option value="moderate_discomfort">Moderate Discomfort</option>
                    <option value="severe_discomfort">Severe Discomfort</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Session Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-gray-600" />
                Session Notes
              </label>
              <textarea
                value={formData.sessionNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionNotes: e.target.value }))}
                rows="4"
                placeholder="Enter detailed session notes, observations, or any important information..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Patient Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Feedback (if any)
              </label>
              <textarea
                value={formData.patientFeedback}
                onChange={(e) => setFormData(prev => ({ ...prev, patientFeedback: e.target.value }))}
                rows="3"
                placeholder="Any feedback or comments from the patient..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Next Session Preparation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Session Preparation
              </label>
              <textarea
                value={formData.nextSessionPrep}
                onChange={(e) => setFormData(prev => ({ ...prev, nextSessionPrep: e.target.value }))}
                rows="2"
                placeholder="Any special preparations needed for the next session..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
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
              onClick={handleComplete}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Complete Session</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompleteSessionModal;
