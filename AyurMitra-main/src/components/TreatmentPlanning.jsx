// src/components/doctor/TreatmentPlanning.jsx
// 🔥 TREATMENT PLANNING WITH PRESCRIPTION DOWNLOAD

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Save, Trash2, Edit3, Calendar, User, FileText, Clock, 
  Loader2, AlertCircle, CheckCircle, Eye, ArrowLeft, Search,
  Activity, TrendingUp, Pill, X, Download
} from "lucide-react";
import doctorApiService from "../services/doctorApiService";
import QuickPrescription from './QuickPrescription';

const TreatmentPlanning = ({ doctorInfo, onClose }) => {
  // STATE MANAGEMENT
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const [treatmentForm, setTreatmentForm] = useState({
    patientId: '',
    consultationId: '',
    treatmentType: '',
    treatmentPlan: '',
    duration: '',
    medicines: [],
    protocols: [],
    notes: '',
    scheduledDate: '',
    scheduledTime: '',
    preInstructions: '',
    postInstructions: ''
  });

  const [currentView, setCurrentView] = useState('list');
  const [activeTab, setActiveTab] = useState('treatments');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // DATA FETCHING
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

  // 🔥 NEW: DOWNLOAD PRESCRIPTION PDF
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

  // FORM HANDLERS
  const handleSubmitTreatmentPlan = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      const treatmentData = {
        ...treatmentForm,
        scheduledFor: treatmentForm.scheduledDate && treatmentForm.scheduledTime 
          ? new Date(`${treatmentForm.scheduledDate}T${treatmentForm.scheduledTime}`)
          : null
      };

      let response;
      if (editingPlan) {
        response = await doctorApiService.updateTreatmentPlan(editingPlan._id, treatmentData);
      } else {
        response = await doctorApiService.createTreatmentPlan(treatmentData);
      }
      
      if (response.data.success) {
        alert(`✅ Treatment plan ${editingPlan ? 'updated' : 'created'} successfully!`);
        resetForm();
        setCurrentView('list');
        await fetchTreatmentData();
      }

    } catch (err) {
      console.error('❌ Error saving treatment plan:', err);
      setError(err.response?.data?.error?.message || 'Failed to save treatment plan');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTreatmentForm({
      patientId: '', consultationId: '', treatmentType: '', treatmentPlan: '',
      duration: '', medicines: [], protocols: [], notes: '', scheduledDate: '',
      scheduledTime: '', preInstructions: '', postInstructions: ''
    });
    setEditingPlan(null);
  };

  const handleConsultationChange = (e) => {
    const selectedId = e.target.value;
    const selectedConsultation = consultations.find(c => (c._id || c.id) === selectedId);
    
    setTreatmentForm({
      ...treatmentForm,
      consultationId: selectedId,
      patientId: selectedConsultation?.patientId?._id || selectedConsultation?.patientId?.id || selectedConsultation?.patientId || ''
    });
  };

  // ACTION HANDLERS
  const handleCreateNew = () => { resetForm(); setCurrentView('form'); };
  const handleCreatePrescription = () => setCurrentView('prescription');
  
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setTreatmentForm({
      patientId: plan.patientId?._id || plan.patientId?.id || '',
      consultationId: plan.consultationId?._id || plan.consultationId?.id || '',
      treatmentType: plan.treatmentType || '',
      treatmentPlan: plan.treatmentPlan || '',
      duration: plan.duration || '',
      medicines: plan.medicines || [],
      protocols: plan.protocols || [],
      notes: plan.notes || '',
      scheduledDate: plan.scheduledFor ? plan.scheduledFor.split('T')[0] : '',
      scheduledTime: plan.scheduledFor ? plan.scheduledFor.split('T')[1]?.slice(0, 5) : '',
      preInstructions: plan.preInstructions || '',
      postInstructions: plan.postInstructions || ''
    });
    setCurrentView('form');
  };

  const handleViewDetails = (plan) => { setSelectedPlan(plan); setCurrentView('details'); };
  const handleViewPrescriptionDetails = (prescription) => { setSelectedPrescription(prescription); setCurrentView('prescriptionDetails'); };

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

  // FILTERING & HELPERS
  const filteredConsultations = consultations.filter((consultation) => {
    const status = consultation.status || consultation.sessionStatus;
    return status === 'completed' || status === 'scheduled';
  });

  const filteredPlans = treatmentPlans.filter(plan => {
    const matchesSearch = !searchTerm || 
      plan.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.treatmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.treatmentPlan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = !searchTerm || 
      prescription.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const treatmentTypes = [
    'Panchakarma', 'Kayachikitsa (Internal Medicine)', 'Shalakya Tantra (ENT & Ophthalmology)', 
    'Shalya Tantra (Surgery)', 'Kaumarbhritya (Pediatrics)', 'Agadatantra (Toxicology)',
    'Rasayana (Rejuvenation)', 'Vajikarana (Aphrodisiac)', 'Yoga Therapy',
    'Dietary Consultation', 'Lifestyle Counseling'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'followup_needed': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        {/* LIST VIEW */}
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
                <button
                  onClick={handleCreatePrescription}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Pill className="w-4 h-4" />
                  <span className="font-medium">Quick Prescription</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">First Visit</span>
                </button>

                <button
                  onClick={handleCreateNew}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Create Treatment Plan</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Panchakarma</span>
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
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(plan.status)}`}>
                              {plan.status?.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <p><strong>Type:</strong> {plan.treatmentType}</p>
                            <p><strong>Duration:</strong> {plan.duration}</p>
                            {plan.scheduledFor && (
                              <p><strong>Scheduled:</strong> {new Date(plan.scheduledFor).toLocaleDateString()}</p>
                            )}
                            <p className="line-clamp-2"><strong>Plan:</strong> {plan.treatmentPlan}</p>
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
                        onClick={handleCreateNew}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        Create Treatment Plan
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
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(prescription.status)}`}>
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

        {/* FORM VIEW */}
        {currentView === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-xl border border-emerald-100/50"
          >
            <div className="px-8 py-6 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-emerald-600" />
                {editingPlan ? 'Edit Treatment Plan' : 'Create Treatment Plan'}
              </h3>
            </div>

            <form onSubmit={handleSubmitTreatmentPlan} className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Patient Consultation
                  </label>
                  <select
                    value={treatmentForm.consultationId}
                    onChange={handleConsultationChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Patient Consultation</option>
                    {filteredConsultations.map((consultation) => {
                      const consultationId = consultation._id || consultation.id;
                      const patientName = consultation.patientId?.name || 'Unknown';
                      const consultationType = consultation.type || 'consultation';
                      const scheduledDate = new Date(consultation.scheduledAt || consultation.scheduledFor).toLocaleDateString();
                      
                      return (
                        <option key={consultationId} value={consultationId}>
                          {patientName} - {consultationType} - {scheduledDate}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Treatment Type
                  </label>
                  <select
                    value={treatmentForm.treatmentType}
                    onChange={(e) => setTreatmentForm({...treatmentForm, treatmentType: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Treatment Type</option>
                    {treatmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Treatment Plan Description
                </label>
                <textarea
                  value={treatmentForm.treatmentPlan}
                  onChange={(e) => setTreatmentForm({...treatmentForm, treatmentPlan: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  rows="4"
                  placeholder="Describe the detailed treatment plan..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Treatment Duration
                  </label>
                  <select
                    value={treatmentForm.duration}
                    onChange={(e) => setTreatmentForm({...treatmentForm, duration: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Duration</option>
                    <option value="7 days">7 days</option>
                    <option value="14 days">14 days</option>
                    <option value="21 days">21 days (Traditional Panchakarma)</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={treatmentForm.scheduledDate}
                    onChange={(e) => setTreatmentForm({...treatmentForm, scheduledDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Pre-treatment Instructions
                  </label>
                  <textarea
                    value={treatmentForm.preInstructions}
                    onChange={(e) => setTreatmentForm({...treatmentForm, preInstructions: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    rows="4"
                    placeholder="Instructions before treatment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Post-treatment Instructions
                  </label>
                  <textarea
                    value={treatmentForm.postInstructions}
                    onChange={(e) => setTreatmentForm({...treatmentForm, postInstructions: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    rows="4"
                    placeholder="Instructions after treatment..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({...treatmentForm, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingPlan ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingPlan ? 'Update Treatment Plan' : 'Create Treatment Plan'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TREATMENT PLAN DETAILS VIEW */}
        {currentView === 'details' && selectedPlan && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedPlan.patientId?.name}'s Treatment Plan
                  </h2>
                  <p className="text-slate-600 mt-1">{selectedPlan.treatmentType}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPlan.status)}`}>
                      {selectedPlan.status?.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">
                      Duration: {selectedPlan.duration}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditPlan(selectedPlan)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Edit Plan
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Treatment Plan</h3>
              <p className="text-slate-700 leading-relaxed">{selectedPlan.treatmentPlan}</p>
            </div>

            {(selectedPlan.preInstructions || selectedPlan.postInstructions) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedPlan.preInstructions && (
                  <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Pre-treatment Instructions</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedPlan.preInstructions}</p>
                  </div>
                )}
                
                {selectedPlan.postInstructions && (
                  <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Post-treatment Instructions</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedPlan.postInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {selectedPlan.notes && (
              <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Notes</h3>
                <p className="text-slate-700 leading-relaxed">{selectedPlan.notes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* 🔥 PRESCRIPTION DETAILS VIEW WITH DOWNLOAD BUTTON */}
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
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPrescription.status)}`}>
                      {selectedPrescription.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">
                      Created: {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* 🔥 DOWNLOAD BUTTON */}
                <button
                  onClick={() => handleDownloadPrescription(selectedPrescription._id)}
                  disabled={downloading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download Prescription</span>
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

            {(selectedPrescription.generalInstructions || selectedPrescription.dietInstructions || selectedPrescription.lifestyleInstructions) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedPrescription.generalInstructions && (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">General Instructions</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedPrescription.generalInstructions}</p>
                  </div>
                )}
                {selectedPrescription.dietInstructions && (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Diet Instructions</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedPrescription.dietInstructions}</p>
                  </div>
                )}
                {selectedPrescription.lifestyleInstructions && (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Lifestyle Instructions</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedPrescription.lifestyleInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {selectedPrescription.followUpDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Follow-up Required</h3>
                <p className="text-amber-800">
                  Next visit scheduled for: {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* PRESCRIPTION CREATE VIEW */}
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
