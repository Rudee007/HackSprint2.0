// src/components/AddPatientForm.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, Heart, UserPlus, Save, 
  AlertCircle, CheckCircle, ArrowLeft, Loader2, 
  Stethoscope, FileText, Activity 
} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';

const AddPatientForm = ({ onPatientAdded, onCancel, doctorInfo }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    medicalHistory: '',
    allergies: '',
    symptoms: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        medicalHistory: formData.medicalHistory.split(',').map(item => item.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(item => item.trim()).filter(Boolean),
        symptoms: formData.symptoms.split(',').map(item => item.trim()).filter(Boolean)
      };

      console.log('🔄 Adding patient:', payload);
      const response = await doctorApiService.addPatient(payload);

      if (response.data.success) {
        setSuccess(`Patient added successfully! Temporary password: ${response.data.data.patient.tempPassword}`);
        setTimeout(() => {
          onPatientAdded(response.data.data.patient);
        }, 3000);
      } else {
        setError(response.data.error?.message || 'Failed to add patient');
      }
    } catch (err) {
      console.error('❌ Add patient error:', err);
      setError(err.response?.data?.error?.message || 'Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header with Back Button */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <UserPlus className="w-7 h-7 mr-3 text-emerald-600" />
                Add New Patient
              </h2>
              <p className="text-gray-600">Create a new patient profile for consultation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-600 font-medium">Dr. {doctorInfo?.userId?.name}</div>
            <div className="text-xs text-gray-500">Adding patient</div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-start space-x-3"
          >
            <CheckCircle className="w-6 h-6 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Patient Added Successfully!</div>
              <div className="text-sm opacity-90">{success}</div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-2xl shadow-lg flex items-start space-x-3"
          >
            <AlertCircle className="w-6 h-6 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Failed to Add Patient</div>
              <div className="text-sm opacity-90">{error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h3 className="text-xl font-bold text-slate-800">Patient Information</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <h4 className="text-lg font-semibold text-gray-800">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  placeholder="Patient's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  placeholder="patient@email.com (optional)"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Heart className="w-4 h-4" />
                  <span>Gender</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              <h4 className="text-lg font-semibold text-gray-800">Medical Information</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4" />
                  <span>Medical History</span>
                </label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                  placeholder="Previous conditions, surgeries, treatments (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>Known Allergies</span>
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                  placeholder="Food allergies, drug reactions, etc. (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Activity className="w-4 h-4" />
                  <span>Current Symptoms</span>
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                  placeholder="Current symptoms, complaints, or concerns (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <motion.button
              type="submit"
              disabled={loading || !formData.name || !formData.phone}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${
                loading || (!formData.name || !formData.phone)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 shadow-emerald-500/25 hover:shadow-xl'
              }`}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              <span>{loading ? 'Adding Patient...' : 'Add Patient'}</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Patients</span>
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddPatientForm;
