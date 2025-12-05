// src/pages/MyPatients.jsx - SCHEMA-ALIGNED VERSION
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Calendar, Activity, Search, Users, FileText, 
  Mail, Clock, Heart, Loader2, RefreshCw, AlertCircle, X,
  CheckCircle, AlertTriangle, TrendingUp, Info, Stethoscope,
  ClipboardList, Shield
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast, Toaster } from 'react-hot-toast';
import './MyPatients.css';
import TreatmentPlanDetailsModal from './TreatmentPlanDetailsModal';

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getPatientInitials = (name) => {
  if (!name || name === 'Unknown Patient') return 'UP';
  const names = name.trim().split(' ');
  return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getPatientInitialsColor = (name) => {
  const colors = ['from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-rose-500 to-pink-600'];
  return colors[(name || '').length % colors.length];
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
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

// 🔥 NEW: Get phase color based on name
const getPhaseColor = (phaseName) => {
  const colors = {
    'purvakarma': 'from-yellow-400 to-orange-500',
    'pradhanakarma': 'from-red-400 to-pink-500',
    'paschatkarma': 'from-green-400 to-emerald-500'
  };
  return colors[phaseName?.toLowerCase()] || 'from-gray-400 to-gray-500';
};

// 🔥 NEW: Get status badge color
const getStatusBadgeColor = (status) => {
  const colors = {
    'active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'completed': 'bg-blue-100 text-blue-700 border-blue-200',
    'paused': 'bg-amber-100 text-amber-700 border-amber-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200'
  };
  return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const MyPatients = () => {
  console.log('🔥 MyPatients mounted - Schema v2.0');
  
  const navigate = useNavigate();
  const dataLoadedOnce = useRef(false);

  // State
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState(null);

  // Patient modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false);

  // Treatment plan detail modal state
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState(null);
  const [isTreatmentDetailModalOpen, setIsTreatmentDetailModalOpen] = useState(false);
  const [loadingTreatmentDetail, setLoadingTreatmentDetail] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════

  const fetchPatients = useCallback(async (isRefresh = false) => {
    console.log('🔥 fetchPatients called');
    if (!isRefresh && dataLoadedOnce.current) {
      console.log('⚠️ Data already loaded');
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await therapistApiService.getTherapistConsultations();

      if (result.success) {
        const consultationsData = result.data || [];
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
            
            if (consultation.status === 'completed') patientData.consultationSummary.completedConsultations++;
            else if (consultation.status === 'scheduled') patientData.consultationSummary.scheduledConsultations++;
            else if (consultation.status === 'cancelled') patientData.consultationSummary.cancelledConsultations++;

            const cDate = new Date(consultation.scheduledAt);
            if (consultation.status === 'completed' &&
                (!patientData.consultationSummary.lastConsultationDate || cDate > new Date(patientData.consultationSummary.lastConsultationDate))) {
              patientData.consultationSummary.lastConsultationDate = consultation.scheduledAt;
            }
            
            if (consultation.status === 'scheduled' && cDate > new Date()) {
              const nextDate = patientData.consultationSummary.nextConsultationDate;
              if (!nextDate || cDate < new Date(nextDate)) {
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
      toast.error('❌ Failed to load patients');
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
  // MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleViewPatientDetails = useCallback(async (patient, e) => {
    e.stopPropagation();
    console.log('🔥 Opening patient details for:', patient.name);
    
    setSelectedPatient(patient);
    setIsPatientModalOpen(true);
    setLoadingTreatmentPlans(true);
    
    try {
      const result = await therapistApiService.getPatientTreatmentPlans(patient._id);
      if (result.success) {
        console.log('✅ Treatment plans loaded:', result.data?.length || 0);
        setTreatmentPlans(result.data || []);
        toast.success(`📋 Loaded ${result.data?.length || 0} treatment plan(s)`);
      } else {
        toast.error(result.error || 'Failed to load treatment plans');
        setTreatmentPlans([]);
      }
    } catch (error) {
      console.error('❌ Error loading treatment plans:', error);
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

  const handleViewTreatmentPlanDetails = useCallback(async (treatmentPlanId) => {
    console.log('🔥 Loading treatment plan details:', treatmentPlanId);
    
    setIsTreatmentDetailModalOpen(true);
    setLoadingTreatmentDetail(true);
    
    try {
      // 🔥 ENHANCED: Now gets full schema data with phases, sessions, etc.
      const result = await therapistApiService.getTreatmentPlanDetails(treatmentPlanId, selectedPatient?._id);
      
      if (result.success) {
        console.log('✅ Enhanced treatment plan loaded:', {
          phases: result.data?.phases?.length || 0,
          sessions: result.data?.sessionStats?.total || 0,
          todaySessions: result.data?.todaySessions?.length || 0,
          progress: result.data?.progress || 0
        });
        
        setSelectedTreatmentPlan(result.data);
        toast.success('✅ Treatment plan details loaded');
      } else {
        toast.error(result.error || 'Failed to load details');
        setIsTreatmentDetailModalOpen(false);
      }
    } catch (error) {
      console.error('❌ Error loading treatment plan details:', error);
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
  // NAVIGATION HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleViewConsultations = useCallback((patientId, e) => {
    e.stopPropagation();
    navigate(`/therapist/consultations/patient/${patientId}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    dataLoadedOnce.current = false;
    fetchPatients(true);
  }, [fetchPatients]);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = [...patients];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        (patient.name || '').toLowerCase().includes(searchLower) ||
        (patient.email || '').toLowerCase().includes(searchLower) ||
        (patient.phone || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => {
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
  }, [patients, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const totalConsultations = patients.reduce((sum, p) => sum + (p.consultationSummary?.totalConsultations || 0), 0);
    const activePatients = patients.filter(p => (p.consultationSummary?.scheduledConsultations || 0) > 0).length;
    return { totalPatients, activePatients, totalConsultations };
  }, [patients]);

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
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
          <button onClick={handleRefresh} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg inline-flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-10 h-10 text-blue-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.totalPatients}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Total Patients</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-10 h-10 text-emerald-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.activePatients}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Active Patients</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-10 h-10 text-purple-500" />
              <span className="text-3xl font-bold text-slate-800">{stats.totalConsultations}</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Total Consultations</p>
          </div>
        </motion.div>

        {/* Search & Filter */}
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
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="consultations">Most Consultations</option>
              <option value="recent">Recent Activity</option>
            </select>
          </div>
        </motion.div>

        {/* Patients List */}
        {filteredAndSortedPatients.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {searchTerm ? 'No Patients Found' : 'No consultation patients yet'}
            </h3>
            <p className="text-slate-600 text-lg">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by completing consultations'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedPatients.map((patient, index) => {
              const patientName = patient.name || 'Unknown Patient';
              const patientAge = calculateAge(patient.profile?.dateOfBirth);
              const consultationSummary = patient.consultationSummary || {};
              const initials = getPatientInitials(patientName);
              const colorGradient = getPatientInitialsColor(patientName);

              return (
                <motion.div
                  key={patient._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1"
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
                          <span>{patient.profile?.gender || 'Not specified'}</span>
                          <span>•</span>
                          <span>{patientAge !== 'N/A' ? `${patientAge} years` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{formatPhoneNumber(patient.phone)}</span>
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

                  {/* Last/Next Visit */}
                  {(consultationSummary.lastConsultationDate || consultationSummary.nextConsultationDate) && (
                    <div className="space-y-2 mb-6">
                      {consultationSummary.lastConsultationDate && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">Last Visit</span>
                            <span className="font-bold text-slate-800">{formatDate(consultationSummary.lastConsultationDate)}</span>
                          </div>
                        </div>
                      )}
                      {consultationSummary.nextConsultationDate && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 font-medium">Next Visit</span>
                            <span className="font-bold text-blue-800">{formatDate(consultationSummary.nextConsultationDate)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => handleViewConsultations(patient._id, e)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 font-medium hover:shadow-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Consultations</span>
                    </button>
                    <button
                      onClick={(e) => handleViewPatientDetails(patient, e)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 font-medium hover:shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Treatment Plans</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PATIENT DETAILS MODAL - 🔥 ENHANCED FOR SCHEMA v2.0
            ═══════════════════════════════════════════════════════════ */}
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
                className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center justify-between rounded-t-3xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl">
                      {getPatientInitials(selectedPatient.name)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                      <p className="text-slate-300 text-sm">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <button onClick={closePatientModal} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Patient Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <User className="w-6 h-6 text-blue-600" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 mb-1 font-medium">Phone</p>
                        <p className="font-bold text-slate-800">{formatPhoneNumber(selectedPatient.phone)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 mb-1 font-medium">Age / Gender</p>
                        <p className="font-bold text-slate-800">
                          {calculateAge(selectedPatient.profile?.dateOfBirth)} years / {selectedPatient.profile?.gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Plans Section */}
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                    <span>Treatment Plans</span>
                  </h3>

                  {loadingTreatmentPlans ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    </div>
                  ) : treatmentPlans.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-12 text-center">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium text-lg">No treatment plans found</p>
                      <p className="text-slate-500 text-sm mt-2">Treatment plans will appear here once assigned</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {treatmentPlans.map((plan) => (
                        <div key={plan._id} className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-purple-500" />
                                {plan.treatmentCategory || plan.panchakarmaType || 'Treatment Plan'}
                              </h4>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <span className="font-medium">Dr. {plan.doctorId?.name || 'Unknown'}</span>
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadgeColor(plan.status)}`}>
                              {plan.status?.toUpperCase()}
                            </span>
                          </div>

                          {/* 🔥 ENHANCED: Phase Pills */}
                          {plan.phases && plan.phases.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {plan.phases.map((phase, idx) => (
                                <span key={idx} className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getPhaseColor(phase.phaseName)}`}>
                                  {phase.phaseName?.toUpperCase()} ({phase.totalDays}d)
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-blue-600 font-medium mb-1">Duration</p>
                              <p className="text-lg font-bold text-blue-700">{plan.totalDays || 'N/A'}</p>
                              <p className="text-xs text-blue-600">days</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-emerald-600 font-medium mb-1">Progress</p>
                              <p className="text-lg font-bold text-emerald-700">{plan.progressPercentage || plan.progress || 0}%</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                              <p className="text-xs text-purple-600 font-medium mb-1">Phases</p>
                              <p className="text-lg font-bold text-purple-700">{plan.phases?.length || 0}</p>
                            </div>
                          </div>

                          {/* 🔥 ENHANCED: Safety indicators */}
                          {(plan.prePanchakarmaInstructions || plan.postPanchakarmaInstructions || plan.safetyNotes) && (
                            <div className="flex gap-2 mb-4 text-xs">
                              {plan.prePanchakarmaInstructions && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                                  <Info className="w-3 h-3" /> Pre-instructions
                                </span>
                              )}
                              {plan.postPanchakarmaInstructions && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                  <CheckCircle className="w-3 h-3" /> Post-care
                                </span>
                              )}
                              {plan.safetyNotes && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                  <Shield className="w-3 h-3" /> Safety
                                </span>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${plan.progressPercentage || plan.progress || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* View Details Button */}
                          <button
                            onClick={() => handleViewTreatmentPlanDetails(plan._id)}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            View Complete Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            TREATMENT PLAN DETAILS MODAL - EXTERNAL COMPONENT
            ═══════════════════════════════════════════════════════════ */}
        <TreatmentPlanDetailsModal
          isOpen={isTreatmentDetailModalOpen}
          onClose={closeTreatmentDetailModal}
          treatmentPlan={selectedTreatmentPlan}
          loading={loadingTreatmentDetail}
        />
      </div>
    </div>
  );
};

export default MyPatients;
