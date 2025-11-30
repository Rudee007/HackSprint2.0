// src/components/doctor/PatientManagement.jsx
// 🔥 PRODUCTION-READY WITH PATIENT DETAILS MODAL INTEGRATION

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, Download, Users, Calendar, Clock, CheckCircle, 
  Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, 
  XCircle
} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';
import PatientExport from './PatientExport';
import AddPatientForm from './AddPatientForm';
import PatientDetailsModal from './PatientDetailsModal'; // ✅ IMPORT THE MODAL
import toast from 'react-hot-toast';

const PatientManagement = ({ doctorInfo, onNavigateToTreatment }) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  const [consultations, setConsultations] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExport, setShowExport] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 20, 
    total: 0,
    pages: 1 
  });

  // ═══════════════════════════════════════════════════════════
  // API INTEGRATION
  // ═══════════════════════════════════════════════════════════

  const fetchConsultations = useCallback(async (resetPage = false) => {
    if (!doctorInfo?._id) {
      console.warn('⏸ No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: resetPage ? 1 : pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      console.log('🔄 Fetching consultations with params:', params);
      const response = await doctorApiService.getDoctorConsultations(params);

      if (response.data.success) {
        const data = response.data.data;
        setConsultations(data.consultations || []);
        
        if (data.pagination) {
          setPagination({
            page: data.pagination.page || 1,
            limit: data.pagination.limit || 20,
            total: data.pagination.total || 0,
            pages: data.pagination.pages || 1
          });
        }

        console.log('✅ Consultations loaded:', data.consultations?.length || 0);
      } else {
        throw new Error(response.data.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching consultations:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to load consultations';
      setError(errorMessage);
      setConsultations([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [doctorInfo, pagination.page, pagination.limit, statusFilter]);

  const handlePatientAdded = useCallback((newPatient) => {
    console.log('✅ New patient added:', newPatient);
    setShowAddPatient(false);
    toast.success('Patient added successfully!');
    fetchConsultations(true);
  }, [fetchConsultations]);

  const handleCreateTreatmentPlan = useCallback((consultation) => {
    console.log('🔄 Creating treatment plan for consultation:', consultation._id);
    
    setShowDetailsModal(false);
    setSelectedConsultation(null);
    
    if (onNavigateToTreatment) {
      onNavigateToTreatment({
        patientId: consultation.patientId?._id,
        patientName: consultation.patientId?.name || 'Patient',
        consultationId: consultation._id,
        consultationType: consultation.type || 'General',
        patientPhone: consultation.patientId?.phone,
        patientEmail: consultation.patientId?.email
      });
    }
  }, [onNavigateToTreatment]);

  // ✅ HANDLE EYE BUTTON CLICK - OPENS PATIENT DETAILS MODAL
  const handleViewPatientDetails = useCallback((consultation) => {
    console.log('👁 Opening patient details for:', consultation._id);
    setSelectedConsultation(consultation);
    setShowDetailsModal(true);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (doctorInfo?._id) {
      fetchConsultations();
    }
  }, [doctorInfo, fetchConsultations]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        console.log('🔄 Auto-refresh consultations');
        fetchConsultations();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [loading, fetchConsultations]);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  const filteredConsultations = useMemo(() => {
    if (!searchTerm.trim()) return consultations;

    const searchLower = searchTerm.toLowerCase().trim();
    
    return consultations.filter(consultation => {
      const patientName = consultation.patientId?.name || '';
      const patientPhone = consultation.patientId?.phone || '';
      const patientEmail = consultation.patientId?.email || '';
      const consultationType = consultation.type || '';
      const notes = consultation.notes || '';
      const consultationId = consultation._id || '';
      
      return (
        patientName.toLowerCase().includes(searchLower) ||
        patientPhone.includes(searchTerm) ||
        patientEmail.toLowerCase().includes(searchLower) ||
        consultationType.toLowerCase().includes(searchLower) ||
        notes.toLowerCase().includes(searchLower) ||
        consultationId.includes(searchTerm)
      );
    });
  }, [consultations, searchTerm]);

  const stats = useMemo(() => {
    const total = pagination.total || consultations.length;
    const scheduled = consultations.filter(c => c.status === 'scheduled').length;
    const completed = consultations.filter(c => c.status === 'completed').length;
    
    const now = new Date();
    const thisMonth = consultations.filter(c => {
      if (!c.scheduledAt && !c.createdAt) return false;
      const date = new Date(c.scheduledAt || c.createdAt);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }).length;

    return { total, scheduled, completed, thisMonth };
  }, [consultations, pagination.total]);

  const getStatusColor = useCallback((status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  }, []);

  const formatConsultationData = useCallback((consultation) => {
    return {
      _id: consultation._id,
      patientName: consultation.patientId?.name || `Patient ${consultation._id?.slice(-4)}`,
      age: consultation.patientId?.age || 'N/A',
      symptoms: consultation.notes || consultation.type || 'General consultation',
      phone: consultation.patientId?.phone || 'Not provided',
      email: consultation.patientId?.email || 'Not provided',
      status: consultation.status || 'scheduled',
      scheduledAt: consultation.scheduledAt,
      type: consultation.type,
      fees: consultation.fee
    };
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  }, [pagination.pages]);

  // ═══════════════════════════════════════════════════════════
  // RENDER CONDITIONS
  // ═══════════════════════════════════════════════════════════

  if (showAddPatient) {
    return (
      <AddPatientForm
        onPatientAdded={handlePatientAdded}
        onCancel={() => setShowAddPatient(false)}
        doctorInfo={doctorInfo}
      />
    );
  }

  if (loading && consultations.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading patient consultations...</p>
          <p className="text-slate-400 text-sm mt-2">Fetching from backend...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              placeholder="Search patients by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="in_progress">In Progress</option>
            </select>

            <button 
              onClick={() => fetchConsultations()}
              disabled={loading}
              className="p-3 border-2 border-emerald-200/50 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => setShowExport(!showExport)}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error loading data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => fetchConsultations()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {showExport && (
        <PatientExport 
          doctorId={doctorInfo?._id}
          patientData={filteredConsultations.map(formatConsultationData)}
          treatmentPlans={treatmentPlans}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-1">Scheduled</p>
              <p className="text-2xl font-bold text-orange-900">{stats.scheduled}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-1">This Month</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.thisMonth}</p>
            </div>
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Users className="w-6 h-6 mr-3 text-emerald-600" />
              Patient Consultations ({filteredConsultations.length})
            </h3>
            {searchTerm && (
              <span className="text-sm text-slate-600">
                Filtered from {consultations.length} total
              </span>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Scheduled</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Fees</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.length > 0 ? filteredConsultations.map((consultation) => {
                const formattedData = formatConsultationData(consultation);
                
                return (
                  <tr key={consultation._id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {formattedData.patientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-slate-800">{formattedData.patientName}</div>
                          <div className="text-sm text-slate-500">ID: {consultation._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {consultation.type || 'General'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {consultation.scheduledAt ? 
                        new Date(consultation.scheduledAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 
                        'Not scheduled'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      ₹{consultation.fee || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(consultation.status)}`}>
                        {(consultation.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* ✅ EYE BUTTON - OPENS PATIENT DETAILS MODAL */}
                      <button 
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        title="View Patient Details"
                        onClick={() => handleViewPatientDetails(consultation)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">
                      {searchTerm ? 'No consultations match your search' : 'No consultations found'}
                    </p>
                    <p className="text-sm">
                      {searchTerm ? 'Try adjusting your search terms' : 'Your patient consultations will appear here'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-emerald-100/50 bg-slate-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total consultations)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="hidden sm:flex space-x-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = idx + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = idx + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + idx;
                    } else {
                      pageNum = pagination.page - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && consultations.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-slate-700 font-medium">Updating...</span>
          </div>
        </div>
      )}

      {/* ✅ PATIENT DETAILS MODAL - OPENS ON EYE BUTTON CLICK */}
      <AnimatePresence>
        {showDetailsModal && selectedConsultation && (
          <PatientDetailsModal
            consultation={selectedConsultation}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedConsultation(null);
            }}
            onCreateTreatmentPlan={handleCreateTreatmentPlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientManagement;
