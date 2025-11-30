// src/pages/TherapistPatientDetails.jsx - 🔥 WITH TREATMENT PLAN DETAIL MODAL 🔥

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, FileText, Calendar, Activity, User, Clock, 
  CheckCircle, AlertCircle, Loader2, X, Heart, 
  Pill, Shield, AlertTriangle, TrendingUp, Mail, Phone,
  MapPin, Stethoscope, ClipboardList, Info
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast, Toaster } from 'react-hot-toast';

const TherapistPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  
  // Modal state
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPatientTreatmentPlans();
  }, [patientId]);

  const fetchPatientTreatmentPlans = async () => {
    console.log('🔥 Fetching treatment plans for patient:', patientId);
    
    try {
      setLoading(true);
      
      const result = await therapistApiService.getPatientTreatmentPlans(patientId);
      
      console.log('Treatment plans result:', result);
      
      if (result.success) {
        setTreatmentPlans(result.data || []);
        
        if (result.data && result.data.length > 0) {
          setPatientInfo(result.data[0].patientId);
        }
        
        toast.success(`Loaded ${result.data?.length || 0} treatment plans`);
      } else {
        toast.error(result.error || 'Failed to load treatment plans');
      }
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      toast.error('Failed to load treatment plans');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH TREATMENT PLAN DETAILS FOR MODAL
  const handleViewDetails = async (treatmentPlanId) => {
    console.log('🔥 Fetching treatment plan details:', treatmentPlanId);
    
    try {
      setModalLoading(true);
      setIsModalOpen(true);
      
      const result = await therapistApiService.getTreatmentPlanDetails(treatmentPlanId, patientId);
      
      console.log('Treatment plan details result:', result);
      
      if (result.success) {
        setSelectedTreatmentPlan(result.data);
        toast.success('Treatment plan details loaded');
      } else {
        toast.error(result.error || 'Failed to load details');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error fetching treatment plan details:', error);
      toast.error('Failed to load treatment plan details');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTreatmentPlan(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20">
        <Toaster position="top-right" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading patient details...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/therapist/patients')}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Patients</span>
        </motion.button>

        {/* Patient Header Card */}
        {patientInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                  {(patientInfo.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-800 mb-2">{patientInfo.name || 'Unknown Patient'}</h1>
                  <div className="flex items-center space-x-4 text-slate-600 mb-3">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{patientInfo.email || 'N/A'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{patientInfo.phone || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {patientInfo.profile?.gender || 'Not specified'}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      Age: {calculateAge(patientInfo.profile?.dateOfBirth)} years
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Treatment Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-rose-500" />
            <span>Treatment Plans</span>
          </h2>
          
          {treatmentPlans.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-16 text-center">
              <FileText className="w-24 h-24 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No Treatment Plans</h3>
              <p className="text-slate-600 text-lg">No treatment plans found for this patient</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {treatmentPlans.map((plan, index) => (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (index * 0.05) }}
                  className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-2xl transition-all"
                >
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {plan.treatmentType || 'Treatment Plan'}
                      </h3>
                      <p className="text-slate-600 text-sm flex items-center space-x-1">
                        <Stethoscope className="w-4 h-4" />
                        <span>Created by: {plan.doctorId?.name || 'Unknown Doctor'}</span>
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="font-bold text-slate-800">{plan.duration || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-slate-500">Progress</p>
                        <p className="font-bold text-slate-800">{plan.progress || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Plan Preview */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 mb-6">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Treatment Plan:</p>
                    <p className="text-slate-600 text-sm line-clamp-2">{plan.treatmentPlan || 'No details'}</p>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => handleViewDetails(plan._id)}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-4 rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Full Details</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 🔥🔥🔥 TREATMENT PLAN DETAILS MODAL 🔥🔥🔥 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-6 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Treatment Plan Details</h2>
                    <p className="text-rose-100 text-sm">Complete treatment information</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {modalLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
                  </div>
                ) : selectedTreatmentPlan ? (
                  <div className="space-y-6">
                    {/* Patient Info Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <User className="w-6 h-6 text-blue-600" />
                        <span>Patient Information</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Name</p>
                          <p className="font-bold text-slate-800">{selectedTreatmentPlan.patientId?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Email</p>
                          <p className="font-bold text-slate-800">{selectedTreatmentPlan.patientId?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Phone</p>
                          <p className="font-bold text-slate-800">{selectedTreatmentPlan.patientId?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Gender / Age</p>
                          <p className="font-bold text-slate-800">
                            {selectedTreatmentPlan.patientId?.profile?.gender || 'N/A'} / {calculateAge(selectedTreatmentPlan.patientId?.profile?.dateOfBirth)} years
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Treatment Plan Details */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <ClipboardList className="w-6 h-6 text-purple-600" />
                        <span>Treatment Details</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-semibold">Treatment Type</p>
                          <p className="text-lg font-bold text-slate-800">{selectedTreatmentPlan.treatmentType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-semibold">Treatment Plan</p>
                          <p className="text-slate-800 whitespace-pre-wrap">{selectedTreatmentPlan.treatmentPlan || 'No treatment plan specified'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Duration</p>
                            <p className="font-bold text-slate-800">{selectedTreatmentPlan.duration || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              selectedTreatmentPlan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              selectedTreatmentPlan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {selectedTreatmentPlan.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pre-Instructions */}
                      {selectedTreatmentPlan.preInstructions && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                          <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Pre-Instructions</span>
                          </h3>
                          <p className="text-amber-900">{selectedTreatmentPlan.preInstructions}</p>
                        </div>
                      )}

                      {/* Post-Instructions */}
                      {selectedTreatmentPlan.postInstructions && (
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200">
                          <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Post-Instructions</span>
                          </h3>
                          <p className="text-teal-900">{selectedTreatmentPlan.postInstructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Medicines & Protocols */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Medicines */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                        <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center space-x-2">
                          <Pill className="w-5 h-5" />
                          <span>Medicines</span>
                        </h3>
                        {selectedTreatmentPlan.medicines && selectedTreatmentPlan.medicines.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedTreatmentPlan.medicines.map((medicine, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span className="text-green-900">{medicine}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-green-700 italic">No medicines prescribed</p>
                        )}
                      </div>

                      {/* Protocols */}
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
                        <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Protocols</span>
                        </h3>
                        {selectedTreatmentPlan.protocols && selectedTreatmentPlan.protocols.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedTreatmentPlan.protocols.map((protocol, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-indigo-600 font-bold">•</span>
                                <span className="text-indigo-900">{protocol}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-indigo-700 italic">No specific protocols</p>
                        )}
                      </div>
                    </div>

                    {/* Patient Medical History */}
                    {selectedTreatmentPlan.patientId?.profile && (
                      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                          <Heart className="w-6 h-6 text-red-500" />
                          <span>Medical History</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Medical History</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.medicalHistory?.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Allergies</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.allergies?.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Current Symptoms</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.symptoms?.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Addictions</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.addictions?.join(', ') || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consultation Info */}
                    {selectedTreatmentPlan.consultationId && (
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200">
                        <h3 className="text-lg font-bold text-rose-800 mb-3 flex items-center space-x-2">
                          <Calendar className="w-5 h-5" />
                          <span>Related Consultation</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 mb-1">Type</p>
                            <p className="font-bold text-slate-800">{selectedTreatmentPlan.consultationId.type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1">Scheduled For</p>
                            <p className="font-bold text-slate-800">{formatDate(selectedTreatmentPlan.consultationId.scheduledAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Section */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Treatment Progress</span>
                      </h3>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">Progress</span>
                          <span className="text-lg font-bold text-yellow-700">{selectedTreatmentPlan.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${selectedTreatmentPlan.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      {selectedTreatmentPlan.notes && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-semibold">Notes</p>
                          <p className="text-slate-800">{selectedTreatmentPlan.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-slate-100 rounded-2xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Created At</p>
                          <p className="font-bold text-slate-800">{formatDate(selectedTreatmentPlan.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Last Updated</p>
                          <p className="font-bold text-slate-800">{formatDate(selectedTreatmentPlan.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No treatment plan details available</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all font-bold shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TherapistPatientDetails;
