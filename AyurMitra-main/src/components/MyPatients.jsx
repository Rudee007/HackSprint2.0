// src/pages/MyPatients.jsx - 🔥 WITH NESTED MODALS (NO NAVIGATION) 🔥
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Calendar, Activity, Search, Filter, 
  ChevronRight, MapPin, Mail, Clock, TrendingUp,
  Heart, Star, AlertCircle, Loader2, RefreshCw,
  CheckCircle, XCircle, Users, FileText, MessageCircle,
  X, Stethoscope, ClipboardList, Pill, Shield, AlertTriangle, Info
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast, Toaster } from 'react-hot-toast';
import './MyPatients.css';

// ═══════════════════════════════════════════════════════════
// 🎨 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getPatientInitials = (name) => {
  if (!name || name === 'Unknown' || name === 'Unknown Patient') {
    return 'P';
  }
  
  const names = name.trim().split(' ');
  
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};

const getPatientInitialsColor = (name) => {
  const colors = [
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-cyan-600',
    'from-purple-500 to-violet-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-purple-600',
    'from-red-500 to-rose-600',
    'from-teal-500 to-emerald-600'
  ];
  
  const index = (name || '').length % colors.length;
  return colors[index];
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const formatDateTime = (dateString) => {
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

const formatPhoneNumber = (phone) => {
  if (!phone || phone === 'N/A') return 'N/A';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.substring(2, 7)} ${cleaned.substring(7)}`;
  }
  
  return phone;
};

// ═══════════════════════════════════════════════════════════
// 🔥 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const MyPatients = () => {
  console.log('🔥 [COMPONENT] MyPatients mounted (WITH MODALS)');
  
  const navigate = useNavigate();
  const dataLoadedOnce = useRef(false);

  // State
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState(null);

  // 🔥 MODAL STATE
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false);
  
  // 🔥 TREATMENT PLAN DETAIL MODAL STATE
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState(null);
  const [isTreatmentDetailModalOpen, setIsTreatmentDetailModalOpen] = useState(false);
  const [loadingTreatmentDetail, setLoadingTreatmentDetail] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOAD PATIENTS FROM CONSULTATIONS
  // ═══════════════════════════════════════════════════════════

  const fetchPatients = useCallback(async (isRefresh = false) => {
    console.log('🔥 [FETCH] fetchPatients called');
    
    if (!isRefresh && dataLoadedOnce.current) {
      console.log('⚠️ [FETCH] Data already loaded');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      const result = await therapistApiService.getTherapistConsultations();
      
      if (result.success) {
        const consultationsData = result.data || [];
        setConsultations(consultationsData);
        
        // Extract unique patients
        const patientMap = new Map();
        
        consultationsData.forEach((consultation) => {
          const patient = consultation.patientId;
          
          if (patient && patient._id) {
            const patientId = patient._id;
            
            if (!patientMap.has(patientId)) {
              patientMap.set(patientId, {
                _id: patientId,
                name: patient.name || 'Unknown Patient',
                email: patient.email || 'N/A',
                phone: patient.phone || 'N/A',
                profile: patient.profile || {},
                consultationSummary: {
                  totalConsultations: 0,
                  completedConsultations: 0,
                  scheduledConsultations: 0,
                  cancelledConsultations: 0,
                  lastConsultationDate: null,
                  nextConsultationDate: null
                }
              });
            }
            
            const patientData = patientMap.get(patientId);
            patientData.consultationSummary.totalConsultations++;
            
            if (consultation.status === 'completed') {
              patientData.consultationSummary.completedConsultations++;
            } else if (consultation.status === 'scheduled') {
              patientData.consultationSummary.scheduledConsultations++;
            } else if (consultation.status === 'cancelled') {
              patientData.consultationSummary.cancelledConsultations++;
            }
            
            const consultationDate = new Date(consultation.scheduledAt);
            if (!patientData.consultationSummary.lastConsultationDate || 
                consultationDate > new Date(patientData.consultationSummary.lastConsultationDate)) {
              if (consultation.status === 'completed') {
                patientData.consultationSummary.lastConsultationDate = consultation.scheduledAt;
              }
            }
            
            if (consultation.status === 'scheduled' && consultationDate > new Date()) {
              if (!patientData.consultationSummary.nextConsultationDate ||
                  consultationDate < new Date(patientData.consultationSummary.nextConsultationDate)) {
                patientData.consultationSummary.nextConsultationDate = consultation.scheduledAt;
              }
            }
          }
        });
        
        const patientsData = Array.from(patientMap.values());
        setPatients(patientsData);
        dataLoadedOnce.current = true;
        
        toast.success(`✅ Loaded ${patientsData.length} patients`);
      } else {
        setError(result.error || 'Failed to load consultations');
        toast.error(result.error || 'Failed to load consultations');
        setPatients([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load patients');
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients(false);
  }, [fetchPatients]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 PATIENT MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleViewPatientDetails = useCallback(async (patient, e) => {
    e.stopPropagation();
    console.log('🔥 [HANDLER] handleViewPatientDetails:', patient._id);
    
    setSelectedPatient(patient);
    setIsPatientModalOpen(true);
    setLoadingTreatmentPlans(true);
    
    try {
      const result = await therapistApiService.getPatientTreatmentPlans(patient._id);
      
      if (result.success) {
        setTreatmentPlans(result.data || []);
        toast.success(`Loaded ${result.data?.length || 0} treatment plans`);
      } else {
        toast.error(result.error || 'Failed to load treatment plans');
        setTreatmentPlans([]);
      }
    } catch (error) {
      toast.error('Failed to load treatment plans');
      setTreatmentPlans([]);
    } finally {
      setLoadingTreatmentPlans(false);
    }
  }, []);

  const closePatientModal = () => {
    setIsPatientModalOpen(false);
    setSelectedPatient(null);
    setTreatmentPlans([]);
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 TREATMENT PLAN DETAIL MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleViewTreatmentPlanDetails = useCallback(async (treatmentPlanId) => {
    console.log('🔥 [HANDLER] handleViewTreatmentPlanDetails:', treatmentPlanId);
    
    setIsTreatmentDetailModalOpen(true);
    setLoadingTreatmentDetail(true);
    
    try {
      const result = await therapistApiService.getTreatmentPlanDetails(treatmentPlanId, selectedPatient?._id);
      
      if (result.success) {
        setSelectedTreatmentPlan(result.data);
        toast.success('Treatment plan details loaded');
      } else {
        toast.error(result.error || 'Failed to load details');
        setIsTreatmentDetailModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to load treatment plan details');
      setIsTreatmentDetailModalOpen(false);
    } finally {
      setLoadingTreatmentDetail(false);
    }
  }, [selectedPatient]);

  const closeTreatmentDetailModal = () => {
    setIsTreatmentDetailModalOpen(false);
    setSelectedTreatmentPlan(null);
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 OTHER HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleRefresh = useCallback(() => {
    dataLoadedOnce.current = false;
    fetchPatients(true);
  }, [fetchPatients]);

  const handleViewConsultations = useCallback((patientId, e) => {
    e.stopPropagation();
    navigate(`/therapist/consultations/patient/${patientId}`);
  }, [navigate]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = [...patients];
    
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        const name = patient.name || '';
        const email = patient.email || '';
        const phone = patient.phone || '';
        
        const searchLower = searchTerm.toLowerCase();
        return name.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               phone.toLowerCase().includes(searchLower);
      });
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'consultations':
          return (b.consultationSummary?.totalConsultations || 0) - (a.consultationSummary?.totalConsultations || 0);
        case 'recent':
          const aDate = a.consultationSummary?.lastConsultationDate || 0;
          const bDate = b.consultationSummary?.lastConsultationDate || 0;
          return new Date(bDate) - new Date(aDate);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [patients, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const totalConsultations = patients.reduce((sum, p) => sum + (p.consultationSummary?.totalConsultations || 0), 0);
    const completedConsultations = patients.reduce((sum, p) => sum + (p.consultationSummary?.completedConsultations || 0), 0);
    const scheduledConsultations = patients.reduce((sum, p) => sum + (p.consultationSummary?.scheduledConsultations || 0), 0);
    const activePatients = patients.filter(p => (p.consultationSummary?.scheduledConsultations || 0) > 0).length;
    
    return {
      totalPatients,
      activePatients,
      totalConsultations,
      completedConsultations,
      scheduledConsultations
    };
  }, [patients]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Patients</h2>
          <p className="text-slate-600">Fetching consultation patients...</p>
        </motion.div>
      </div>
    );
  }

  if (error && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Failed to Load Patients</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={handleRefresh} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg inline-flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥🔥🔥 MAIN RENDER 🔥🔥🔥
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-rose-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.totalPatients}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Total Patients</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-emerald-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.activePatients}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Active Patients</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.totalConsultations}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Total Consultations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.completedConsultations}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Completed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.scheduledConsultations}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Scheduled</p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="consultations">Sort by Consultations</option>
                <option value="recent">Sort by Recent Activity</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Patients List */}
        {filteredAndSortedPatients.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Patients Found</h3>
            <p className="text-slate-600 text-lg mb-2">
              {searchTerm ? 'Try adjusting your search criteria' : 'No consultation patients yet'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedPatients.map((patient, index) => {
              const patientName = patient.name || 'Unknown Patient';
              const patientEmail = patient.email || 'N/A';
              const patientPhone = patient.phone || 'N/A';
              const patientGender = patient.profile?.gender || 'Not specified';
              const patientAge = patient.profile?.dateOfBirth 
                ? new Date().getFullYear() - new Date(patient.profile.dateOfBirth).getFullYear()
                : 'N/A';
              
              const consultationSummary = patient.consultationSummary || {};
              
              const initials = getPatientInitials(patientName);
              const colorGradient = getPatientInitialsColor(patientName);
              
              return (
                <motion.div
                  key={patient._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-2xl transition-all"
                >
                  {/* Patient Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{patientName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{patientGender}</span>
                          <span>•</span>
                          <span>{patientAge} years</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{patientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{formatPhoneNumber(patientPhone)}</span>
                    </div>
                  </div>

                  {/* Consultation Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {consultationSummary.totalConsultations || 0}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {consultationSummary.completedConsultations || 0}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {consultationSummary.scheduledConsultations || 0}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Scheduled</div>
                    </div>
                  </div>

                  {/* Last/Next Consultation */}
                  {(consultationSummary.lastConsultationDate || consultationSummary.nextConsultationDate) && (
                    <div className="space-y-2 mb-4">
                      {consultationSummary.lastConsultationDate && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 font-medium">Last Visit</span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatDate(consultationSummary.lastConsultationDate)}
                            </span>
                          </div>
                        </div>
                      )}
                      {consultationSummary.nextConsultationDate && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600 font-medium">Next Visit</span>
                            <span className="text-sm font-bold text-blue-800">
                              {formatDate(consultationSummary.nextConsultationDate)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => handleViewConsultations(patient._id, e)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-all border border-rose-200 font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Consultations</span>
                    </button>
                    <button
                      onClick={(e) => handleViewPatientDetails(patient, e)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔥🔥🔥 PATIENT DETAILS MODAL (Treatment Plans List) 🔥🔥🔥 */}
      <AnimatePresence>
        {isPatientModalOpen && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closePatientModal}
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
                  <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl`}>
                    {getPatientInitials(selectedPatient.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                    <p className="text-rose-100 text-sm">{selectedPatient.email}</p>
                  </div>
                </div>
                <button
                  onClick={closePatientModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Patient Info */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <p className="font-bold text-slate-800">{formatPhoneNumber(selectedPatient.phone)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Age / Gender</p>
                      <p className="font-bold text-slate-800">
                        {calculateAge(selectedPatient.profile?.dateOfBirth)} years / {selectedPatient.profile?.gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Treatment Plans Section */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                    <ClipboardList className="w-7 h-7 text-rose-500" />
                    <span>Treatment Plans</span>
                  </h3>
                  
                  {loadingTreatmentPlans ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
                    </div>
                  ) : treatmentPlans.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-12 text-center">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">No treatment plans found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {treatmentPlans.map((plan) => (
                        <div key={plan._id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-slate-800 mb-1">{plan.treatmentType || 'Treatment Plan'}</h4>
                              <p className="text-sm text-slate-600">By: {plan.doctorId?.name || 'Unknown'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {plan.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/50 rounded-xl p-3">
                              <p className="text-xs text-slate-600">Duration</p>
                              <p className="font-bold text-slate-800">{plan.duration || 'N/A'}</p>
                            </div>
                            <div className="bg-white/50 rounded-xl p-3">
                              <p className="text-xs text-slate-600">Progress</p>
                              <p className="font-bold text-slate-800">{plan.progress || 0}%</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewTreatmentPlanDetails(plan._id)}
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all font-bold"
                          >
                            View Full Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥🔥🔥 TREATMENT PLAN DETAIL MODAL (Nested) 🔥🔥🔥 */}
      {/* I'll continue in next message due to length... */}

            {/* 🔥🔥🔥 TREATMENT PLAN DETAIL MODAL (Full Details - Nested over Patient Modal) 🔥🔥🔥 */}
            <AnimatePresence>
        {isTreatmentDetailModalOpen && selectedTreatmentPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeTreatmentDetailModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Treatment Plan Details</h2>
                    <p className="text-purple-100 text-sm">{selectedTreatmentPlan.treatmentType || 'Complete Information'}</p>
                  </div>
                </div>
                <button
                  onClick={closeTreatmentDetailModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {loadingTreatmentDetail ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
                  </div>
                ) : (
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
                          <p className="font-bold text-slate-800">{formatPhoneNumber(selectedTreatmentPlan.patientId?.phone)}</p>
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
                          <div className="bg-white rounded-xl p-4">
                            <p className="text-slate-800 whitespace-pre-wrap">{selectedTreatmentPlan.treatmentPlan || 'No treatment plan specified'}</p>
                          </div>
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
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Diet Habits</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.dietHabits || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-semibold">Sleep Pattern</p>
                            <p className="text-slate-800">{selectedTreatmentPlan.patientId.profile.sleepPattern || 'None'}</p>
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
                            <p className="font-bold text-slate-800 capitalize">{selectedTreatmentPlan.consultationId.type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1">Scheduled For</p>
                            <p className="font-bold text-slate-800">{formatDateTime(selectedTreatmentPlan.consultationId.scheduledAt)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1">Status</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                              selectedTreatmentPlan.consultationId.status === 'completed' ? 'bg-green-100 text-green-700' :
                              selectedTreatmentPlan.consultationId.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {selectedTreatmentPlan.consultationId.status}
                            </span>
                          </div>
                          {selectedTreatmentPlan.consultationId.notes && (
                            <div className="col-span-2">
                              <p className="text-sm text-slate-600 mb-1">Notes</p>
                              <p className="text-slate-800">{selectedTreatmentPlan.consultationId.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Section */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Treatment Progress</span>
                      </h3>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">Progress</span>
                          <span className="text-2xl font-bold text-yellow-700">{selectedTreatmentPlan.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-5 rounded-full transition-all duration-500 flex items-center justify-center"
                            style={{ width: `${selectedTreatmentPlan.progress || 0}%` }}
                          >
                            {selectedTreatmentPlan.progress > 10 && (
                              <span className="text-xs font-bold text-white">{selectedTreatmentPlan.progress}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedTreatmentPlan.notes && (
                        <div>
                          <p className="text-sm text-slate-600 mb-2 font-semibold">Treatment Notes</p>
                          <div className="bg-white rounded-xl p-4">
                            <p className="text-slate-800">{selectedTreatmentPlan.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-slate-100 rounded-2xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 mb-1">Created At</p>
                          <p className="font-bold text-slate-800">{formatDateTime(selectedTreatmentPlan.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-1">Last Updated</p>
                          <p className="font-bold text-slate-800">{formatDateTime(selectedTreatmentPlan.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Info (if available) */}
                    {selectedTreatmentPlan.doctorId && (
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200">
                        <h3 className="text-lg font-bold text-cyan-800 mb-3 flex items-center space-x-2">
                          <Stethoscope className="w-5 h-5" />
                          <span>Prescribed By</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 mb-1">Doctor Name</p>
                            <p className="font-bold text-slate-800">{selectedTreatmentPlan.doctorId.name || 'N/A'}</p>
                          </div>
                          {selectedTreatmentPlan.doctorId.specialization && (
                            <div>
                              <p className="text-sm text-slate-600 mb-1">Specialization</p>
                              <p className="font-bold text-slate-800">{selectedTreatmentPlan.doctorId.specialization}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  onClick={closeTreatmentDetailModal}
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

export default MyPatients;
