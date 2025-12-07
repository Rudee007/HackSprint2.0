// src/components/doctor/TreatmentPlanning.jsx
// 🔥 REFACTORED v4.0 - SEPARATED PANCHAKARMA WIZARD INTO CHILD COMPONENT

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Save, Trash2, Edit3, Calendar, User, FileText, Clock, 
  Loader2, AlertCircle, CheckCircle, Eye, ArrowLeft, Search,
  Activity, TrendingUp, Pill, X, Download, Heart, Sparkles,
  ChevronRight, Check, Users, Clipboard
} from "lucide-react";
import doctorApiService from "../services/doctorApiService";
import QuickPrescription from './QuickPrescription';
import PanchakarmaPlanner from './PanchakarmaPlanner'; // 🔥 NEW COMPONENT

const TreatmentPlanning = ({ doctorInfo, onClose }) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const [currentView, setCurrentView] = useState('list'); // 'list', 'prescription', 'panchakarma', 'details', 'prescriptionDetails'
  const [activeTab, setActiveTab] = useState('treatments');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ═══════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════

  const fetchTreatmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [consultationsResponse, treatmentPlansResponse, prescriptionsResponse] = await Promise.all([
        doctorApiService.getDoctorConsultations({ page: 1, limit: 50 }),
        doctorApiService.getTreatmentPlans({ page: 1, limit: 100 }),
        doctorApiService.getPrescriptions({ page: 1, limit: 100 })
      ]);

      if (consultationsResponse.data.success) {
        setConsultations(consultationsResponse.data.data.consultations || []);
      }

      if (treatmentPlansResponse.data.success) {
        setTreatmentPlans(treatmentPlansResponse.data.data.treatmentPlans || []);
      }

      if (prescriptionsResponse.data.success) {
        setPrescriptions(prescriptionsResponse.data.data.prescriptions || []);
      }

    } catch (err) {
      console.error('❌ Error fetching treatment data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load treatment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatmentData();
  }, [fetchTreatmentData]);

  // ═══════════════════════════════════════════════════════════
  // PRESCRIPTION HANDLERS (UNCHANGED)
  // ═══════════════════════════════════════════════════════════

  const handleDownloadPrescription = async (prescriptionId) => {
    try {
      setDownloading(true);
      const response = await doctorApiService.downloadPrescriptionPDF(prescriptionId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Prescription_${selectedPrescription.prescriptionNumber || prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('✅ Prescription downloaded successfully!');
    } catch (error) {
      console.error('❌ Error downloading prescription:', error);
      alert('Failed to download prescription. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      const response = await doctorApiService.deletePrescription(prescriptionId);
      if (response.data.success) {
        alert('✅ Prescription deleted successfully');
        await fetchTreatmentData();
      }
    } catch (error) {
      console.error('❌ Error deleting prescription:', error);
      alert('Failed to delete prescription');
    }
  };

  const handleViewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setCurrentView('prescriptionDetails');
  };

  // ═══════════════════════════════════════════════════════════
  // TREATMENT PLAN HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleCreatePanchakarma = () => {
    setCurrentView('panchakarma');
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setCurrentView('details');
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setCurrentView('details');
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this treatment plan?')) return;
    try {
      const response = await doctorApiService.deleteTreatmentPlan(planId);
      if (response.data.success) {
        alert('✅ Treatment plan deleted successfully');
        await fetchTreatmentData();
      }
    } catch (error) {
      console.error('❌ Error deleting treatment plan:', error);
      alert('Failed to delete treatment plan');
    }
  };

  const handleCreatePrescription = () => setCurrentView('prescription');

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  const filteredConsultations = consultations.filter((consultation) => {
    const status = consultation.status || consultation.sessionStatus;
    return status === 'completed' || status === 'scheduled';
  });

  const filteredPlans = treatmentPlans.filter(plan => {
    const matchesSearch = !searchTerm || 
      plan.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.treatmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = !searchTerm || 
      prescription.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'followup_needed': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading treatment planning data...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Navigation */}
      {currentView !== 'list' && (
        <button
          onClick={() => setCurrentView('list')}
          className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to List</span>
        </button>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════
            LIST VIEW
            ═══════════════════════════════════════════════════════════ */}
        {currentView === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🌿 Treatment Planning</h2>
                <p className="text-slate-600 mt-1">Manage treatment plans and prescriptions</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* 🔥 Quick Prescription Button (UNCHANGED) */}
                <button
                  onClick={handleCreatePrescription}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Pill className="w-4 h-4" />
                  <span className="font-medium">Quick Prescription</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">First Visit</span>
                </button>

                {/* 🔥 Panchakarma Plan Button (UNCHANGED) */}
                <button
                  onClick={handleCreatePanchakarma}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">Panchakarma Plan</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Full Protocol</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Treatment Plans</p>
                    <p className="text-2xl font-bold text-emerald-900">{treatmentPlans.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Prescriptions</p>
                    <p className="text-2xl font-bold text-blue-900">{prescriptions.length}</p>
                  </div>
                  <Pill className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Active</p>
                    <p className="text-2xl font-bold text-green-900">
                      {treatmentPlans.filter(p => p.status === 'active').length + prescriptions.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Follow-ups</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {prescriptions.filter(p => p.status === 'followup_needed').length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Tab System */}
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('treatments')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      activeTab === 'treatments'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Treatment Plans ({filteredPlans.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      activeTab === 'prescriptions'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Pill className="w-4 h-4 inline mr-2" />
                    Prescriptions ({filteredPrescriptions.length})
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    {activeTab === 'prescriptions' && <option value="followup_needed">Follow-up Needed</option>}
                  </select>
                </div>
              </div>

              {/* Treatment Plans Tab */}
              {activeTab === 'treatments' && (
                <div>
                  {filteredPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredPlans.map((plan) => (
                        <motion.div
                          key={plan._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className="border border-slate-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800 truncate">
                              {plan.patientId?.name || 'Unknown Patient'}
                            </h4>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(plan.status)}`}>
                              {plan.status?.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <p><strong>Type:</strong> {plan.treatmentCategory}</p>
                            <p><strong>Duration:</strong> {plan.totalDays} days</p>
                            <p><strong>Panchakarma:</strong> {plan.panchakarmaType}</p>
                            <p className="line-clamp-2"><strong>Plan:</strong> {plan.treatmentName}</p>
                          </div>

                          <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                            <button 
                              onClick={() => handleViewDetails(plan)}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button 
                              onClick={() => handleEditPlan(plan)}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(plan._id)}
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-600">No treatment plans found</p>
                      <p className="text-sm text-slate-500 mb-4">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Create your first treatment plan to get started'
                        }
                      </p>
                      <button
                        onClick={handleCreatePanchakarma}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        Create Panchakarma Plan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === 'prescriptions' && (
                <div>
                  {filteredPrescriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredPrescriptions.map((prescription) => (
                        <motion.div
                          key={prescription._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-800">
                                {prescription.patientId?.name || 'Unknown Patient'}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1">
                                {prescription.prescriptionNumber || 'No number'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(prescription.status)}`}>
                              {prescription.status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <p><strong>Chief Complaint:</strong> {prescription.chiefComplaint?.substring(0, 50)}...</p>
                            {prescription.diagnosis && (
                              <p><strong>Diagnosis:</strong> {prescription.diagnosis.substring(0, 50)}...</p>
                            )}
                            <p><strong>Medicines:</strong> {prescription.medicines?.length || 0} items</p>
                            {prescription.followUpDate && (
                              <p className="text-amber-600"><strong>Follow-up:</strong> {new Date(prescription.followUpDate).toLocaleDateString()}</p>
                            )}
                            <p className="text-xs text-slate-500">
                              Created: {new Date(prescription.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                            <button 
                              onClick={() => handleViewPrescriptionDetails(prescription)}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button 
                              onClick={() => handleDeletePrescription(prescription._id)}
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-600">No prescriptions found</p>
                      <p className="text-sm text-slate-500 mb-4">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Create your first prescription to get started'
                        }
                      </p>
                      <button
                        onClick={handleCreatePrescription}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Create Prescription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            🔥 PANCHAKARMA PLANNER (NEW CHILD COMPONENT)
            ═══════════════════════════════════════════════════════════ */}
        {currentView === 'panchakarma' && (
          <PanchakarmaPlanner
            consultations={filteredConsultations}
            onBack={() => setCurrentView('list')}
            onSuccess={fetchTreatmentData}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════
            TREATMENT PLAN DETAILS VIEW
            ═══════════════════════════════════════════════════════════ */}
        {currentView === 'details' && selectedPlan && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedPlan.patientId?.name}'s Treatment Plan
                  </h2>
                  <p className="text-slate-600 mt-1">{selectedPlan.treatmentName}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusColor(selectedPlan.status)}`}>
                      {selectedPlan.status?.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">
                      Duration: {selectedPlan.totalDays} days
                    </span>
                    <span className="text-sm text-slate-500">
                      Type: {selectedPlan.panchakarmaType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phases */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Treatment Phases</h3>
                {selectedPlan.phases?.map((phase, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-800 mb-2 capitalize">{phase.phaseName}</h4>
                    <p className="text-sm text-slate-600 mb-3">{phase.phaseInstructions}</p>
                    <div className="space-y-2">
                      {phase.therapySessions?.map((session, sidx) => (
                        <div key={sidx} className="bg-slate-50 p-3 rounded-lg">
                          <p className="font-medium text-slate-800">{session.therapyName}</p>
                          <p className="text-xs text-slate-600">
                            {session.sessionCount} sessions × {session.durationMinutes} mins
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PRESCRIPTION DETAILS VIEW (UNCHANGED)
            ═══════════════════════════════════════════════════════════ */}
        {currentView === 'prescriptionDetails' && selectedPrescription && (
          <motion.div
            key="prescriptionDetails"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Prescription for {selectedPrescription.patientId?.name}
                  </h2>
                  <p className="text-slate-600 mt-1">{selectedPrescription.prescriptionNumber}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusColor(selectedPrescription.status)}`}>
                      {selectedPrescription.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">
                      Created: {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownloadPrescription(selectedPrescription._id)}
                  disabled={downloading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Chief Complaint</h3>
                  <p className="text-slate-700">{selectedPrescription.chiefComplaint}</p>
                </div>
                {selectedPrescription.diagnosis && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Diagnosis</h3>
                    <p className="text-slate-700">{selectedPrescription.diagnosis}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Prescribed Medicines ({selectedPrescription.medicines?.length || 0})
              </h3>
              <div className="space-y-4">
                {selectedPrescription.medicines?.map((med, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-bold text-slate-900">{med.name}</h4>
                    <p className="text-sm text-slate-600">{med.genericName}</p>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-slate-600">Dosage:</span>
                        <p className="font-semibold">{med.dosage}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Frequency:</span>
                        <p className="font-semibold">{med.frequency}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Timing:</span>
                        <p className="font-semibold">{med.timing}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Duration:</span>
                        <p className="font-semibold">{med.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUICK PRESCRIPTION VIEW (UNCHANGED)
            ═══════════════════════════════════════════════════════════ */}
        {currentView === 'prescription' && (
          <QuickPrescription
            consultations={filteredConsultations}
            onBack={() => setCurrentView('list')}
            onSuccess={fetchTreatmentData}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TreatmentPlanning;
