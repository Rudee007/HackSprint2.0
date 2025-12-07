// src/components/doctor/PatientDetailsModal.jsx
// 🔥 PRODUCTION-READY - Patient Details Modal with Treatment Plan Integration

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertTriangle,
  Activity,
  Heart,
  Pill,
  Stethoscope,
  TrendingUp,
  Clock,
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Droplet,
  Wind,
  Mountain
} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';
import toast from 'react-hot-toast';

const PatientDetailsModal = ({ 
  consultation, 
  isOpen, 
  onClose, 
  onCreateTreatmentPlan 
}) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ═══════════════════════════════════════════════════════════
  // FETCH PATIENT DETAILS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!consultation?.patientId?._id) {
        setError('Patient ID not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching patient details for:', consultation.patientId._id);

        const response = await doctorApiService.getPatientDetails(consultation.patientId._id);

        if (response.data.success) {
          setPatientDetails(response.data.data);
          console.log('✅ Patient details loaded:', response.data.data);
        } else {
          throw new Error(response.data.error?.message || 'Failed to load patient details');
        }
      } catch (err) {
        console.error('❌ Error fetching patient details:', err);
        const errorMsg = err.response?.data?.error?.message || 'Failed to load patient details';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPatientDetails();
    }
  }, [isOpen, consultation]);

  // ═══════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  const getDoshaColor = (dosha) => {
    const colors = {
      vata: 'text-blue-600 bg-blue-50 border-blue-200',
      pitta: 'text-red-600 bg-red-50 border-red-200',
      kapha: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[dosha] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getDoshaIcon = (dosha) => {
    const icons = {
      vata: <Wind className="w-5 h-5" />,
      pitta: <Activity className="w-5 h-5" />,
      kapha: <Mountain className="w-5 h-5" />
    };
    return icons[dosha] || <Droplet className="w-5 h-5" />;
  };

  const getStressLevelColor = (level) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      moderate: 'text-yellow-600 bg-yellow-50',
      high: 'text-red-600 bg-red-50'
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  };

  const handleCreateTreatmentPlan = () => {
    console.log('🔄 Opening treatment plan modal for:', patientDetails);
    onCreateTreatmentPlan(consultation);
    onClose();
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════
  if (!isOpen) return null;

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800">Loading Patient Details</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800">Error Loading Patient</h3>
              <p className="text-sm text-slate-600 mt-2">{error}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!patientDetails) return null;

  const patient = patientDetails;
  const dominantDosha = patient.dominantDosha || 'balanced';

  // ═══════════════════════════════════════════════════════════
  // MAIN MODAL RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* ═══════════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                  <span className="text-3xl font-bold text-white">
                    {patient.name?.charAt(0).toUpperCase() || 'P'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{patient.name || 'Patient'}</h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    ID: {patient.id?.slice(-8)} • Age: {patient.age || 'N/A'} • {patient.gender || 'Not specified'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mt-6">
              {['overview', 'medical', 'ayurvedic', 'lifestyle'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white text-emerald-600 shadow-lg'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CONTENT
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Phone</p>
                          <p className="text-sm font-bold text-blue-900 mt-0.5">{patient.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-bold text-purple-900 mt-0.5 truncate">{patient.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">DOB</p>
                          <p className="text-sm font-bold text-amber-900 mt-0.5">
                            {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border-2 border-slate-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Status</p>
                          <p className="text-lg font-bold text-slate-800">{patient.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Verified</p>
                          <p className="text-lg font-bold text-slate-800">
                            {patient.emailVerified ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Registered</p>
                          <p className="text-lg font-bold text-slate-800">
                            {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-8 h-8 text-amber-600" />
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Dosha</p>
                          <p className="text-lg font-bold text-slate-800 capitalize">{dominantDosha}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {patient.address && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-slate-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Address</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {patient.address.street}, {patient.address.city}, {patient.address.state} - {patient.address.zipCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* MEDICAL TAB */}
              {activeTab === 'medical' && (
                <motion.div
                  key="medical"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Medical History */}
                  {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-5 border-2 border-red-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-red-800">Medical History</h3>
                      </div>
                      <ul className="space-y-2">
                        {patient.medicalHistory.map((condition, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-red-900">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span className="font-medium">{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Allergies */}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-5 border-2 border-orange-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-orange-800">⚠️ Allergies</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-orange-200 text-orange-900 rounded-full text-sm font-semibold border-2 border-orange-300"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {patient.symptoms && patient.symptoms.length > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-5 border-2 border-yellow-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-yellow-800">Current Symptoms</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {patient.symptoms.map((symptom, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-yellow-200 text-yellow-900 rounded-full text-sm font-medium"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Medications */}
                  {patient.currentMedications && patient.currentMedications.length > 0 && (
                    <div className="bg-indigo-50 rounded-xl p-5 border-2 border-indigo-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-indigo-800">Current Medications</h3>
                      </div>
                      <ul className="space-y-2">
                        {patient.currentMedications.map((med, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-indigo-900">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            <span className="font-medium">{med}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {patient.medicalHistory?.length === 0 && patient.allergies?.length === 0 && patient.symptoms?.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">No medical history available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* AYURVEDIC TAB */}
              {activeTab === 'ayurvedic' && (
                <motion.div
                  key="ayurvedic"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Dosha Constitution */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-6 border-2 border-indigo-200">
                    <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center space-x-2">
                      <Heart className="w-6 h-6" />
                      <span>Ayurvedic Constitution (Prakriti)</span>
                    </h3>

                    <div className="space-y-4">
                      {['vata', 'pitta', 'kapha'].map((dosha) => (
                        <div key={dosha} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getDoshaIcon(dosha)}
                              <span className="font-semibold text-indigo-900 capitalize">{dosha}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-900">
                              {patient.constitution?.[dosha] || 33}%
                            </span>
                          </div>
                          <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${patient.constitution?.[dosha] || 33}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                dosha === 'vata' ? 'bg-blue-600' :
                                dosha === 'pitta' ? 'bg-red-600' : 'bg-green-600'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-6 p-4 rounded-xl border-2 ${getDoshaColor(dominantDosha)}`}>
                      <p className="text-sm font-semibold">
                        Dominant Dosha: <span className="text-lg capitalize">{dominantDosha}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stress Level */}
                  {patient.stressLevel && (
                    <div className={`rounded-xl p-5 border-2 ${getStressLevelColor(patient.stressLevel)}`}>
                      <div className="flex items-center space-x-3">
                        <Activity className="w-6 h-6" />
                        <div>
                          <p className="text-sm font-semibold">Stress Level</p>
                          <p className="text-lg font-bold capitalize">{patient.stressLevel}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* LIFESTYLE TAB */}
              {activeTab === 'lifestyle' && (
                <motion.div
                  key="lifestyle"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {[
                    { label: 'Diet Habits', value: patient.dietHabits, icon: Pill },
                    { label: 'Sleep Pattern', value: patient.sleepPattern, icon: Clock },
                    { label: 'Digestion', value: patient.digestion, icon: Activity },
                    { label: 'Bowel Habits', value: patient.bowelHabits, icon: Heart },
                    { label: 'Exercise Routine', value: patient.exerciseRoutine, icon: TrendingUp },
                  ].map((item, idx) => (
                    item.value && (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start space-x-3">
                          <item.icon className="w-5 h-5 text-slate-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                            <p className="text-sm text-slate-900 mt-1">{item.value}</p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}

                  {!patient.dietHabits && !patient.sleepPattern && !patient.digestion && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">No lifestyle information available</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              FOOTER - ACTION BUTTONS
          ═══════════════════════════════════════════════════════════ */}
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreateTreatmentPlan}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Create Treatment Plan</span>
              </button>
              <button
                onClick={onClose}
                className="px-8 py-4 border-2 border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PatientDetailsModal;
