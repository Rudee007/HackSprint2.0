import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Eye, Download, FileText, Users, Calendar, Clock, CheckCircle, Loader2, AlertCircle, RefreshCw ,UserPlus} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';
import PatientExport from './PatientExport';
import AddPatientForm from './AddPatientForm'; // Import the new component

const PatientManagement = ({ doctorInfo, onClose }) => {
  // 🔥 API-driven state
  const [consultations, setConsultations] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  
  // 🔥 UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExport, setShowExport] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false); // New state for add patient form
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // 🔥 Fetch consultations from backend
  const fetchConsultations = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...filters
      };

      console.log('🔄 Fetching consultations with params:', params);
      const response = await doctorApiService.getDoctorConsultations(params);
      console.log(response.data.data.consultations);
      if (response.data.success) {
        setConsultations(response.data.data.consultations || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0,
          pages: response.data.data.pagination?.pages || 1
        }));
        console.log('✅ Consultations loaded:', response.data.data.consultations?.length);
      }
    } catch (err) {
      console.error('❌ Error fetching consultations:', err);
      setError(err.response?.data?.error?.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  // 🔥 Update consultation status
  const updateConsultationStatus = useCallback(async (consultationId, newStatus) => {
    try {
      setUpdating(consultationId);
      console.log(`🔄 Updating consultation ${consultationId} to ${newStatus}`);
      
      // Note: You may need to add this endpoint to your backend
      await doctorApiService.updateConsultationStatus(consultationId, newStatus);
      
      // Refresh the consultations list
      await fetchConsultations();
      console.log('✅ Consultation status updated successfully');
      
    } catch (err) {
      console.error('❌ Error updating consultation status:', err);
      alert('Failed to update consultation status: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setUpdating(null);
    }
  }, [fetchConsultations]);




   // 🔥 Handle successful patient addition
   const handlePatientAdded = (newPatient) => {
    console.log('✅ New patient added:', newPatient);
    setShowAddPatient(false);
    fetchConsultations(); // Refresh the list
  };



  // 🔥 Load data on component mount
  useEffect(() => {
    if (doctorInfo?._id) {
      fetchConsultations();
    }
  }, [doctorInfo, fetchConsultations]);

  // 🔥 Real-time polling (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !updating) {
        fetchConsultations();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [loading, updating, fetchConsultations]);

  // 🔥 Filter consultations based on search
  const filteredConsultations = consultations.filter(consultation => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = consultation.patientId?.name || `Patient ${consultation._id?.slice(-4)}`;
    const symptoms = consultation.notes || consultation.type || '';
    const phone = consultation.patientId?.phone || '';
    
    return (
      patientName.toLowerCase().includes(searchLower) ||
      symptoms.toLowerCase().includes(searchLower) ||
      phone.includes(searchTerm)
    );
  });

  // 🔥 Get status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 🔥 Format consultation data for display
  const formatConsultationData = (consultation) => {
    return {
      _id: consultation._id,
      patientName: consultation.patientId?.name || `Patient ${consultation._id?.slice(-4)}`,
      age: consultation.patientId?.age || 'N/A',
      symptoms: consultation.notes || consultation.type || 'General consultation',
      phone: consultation.patientId?.phone || 'Not provided',
      email: consultation.patientId?.email || 'Not provided',
      status: consultation.status || 'scheduled',
      scheduledFor: consultation.scheduledFor,
      type: consultation.type,
      fees: consultation.fees
    };
  };

  if (loading && consultations.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading patient consultations...</p>
        </div>
      </div>
    );
  }


  if (showAddPatient) {
    return (
      <AddPatientForm
        onPatientAdded={handlePatientAdded}
        onCancel={() => setShowAddPatient(false)}
        doctorInfo={doctorInfo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              placeholder="Search patients by name, symptoms, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Refresh Button */}
            <button 
              onClick={() => fetchConsultations()}
              disabled={loading}
              className="p-3 border-2 border-emerald-200/50 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
            >
              <RefreshCw className={`w-5 h-5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* <button 
              onClick={() => setShowAddPatient(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Patient</span>
            </button> */}

            {/* Export Button */}
            <button 
              onClick={() => setShowExport(!showExport)}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Error loading data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => fetchConsultations()}
            className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Export Component */}
      {showExport && (
        <PatientExport 
          doctorId={doctorInfo?._id}
          patientData={filteredConsultations.map(formatConsultationData)}
          treatmentPlans={treatmentPlans}
        />
      )}

      {/* Stats Cards - Using Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Total Consultations</p>
              <p className="text-2xl font-bold text-blue-900">{pagination.total || consultations.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-1">Scheduled</p>
              <p className="text-2xl font-bold text-orange-900">
                {consultations.filter(c => c.status === "scheduled").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {consultations.filter(c => c.status === "completed").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-1">This Month</p>
              <p className="text-2xl font-bold text-emerald-900">
                {consultations.filter(c => {
                  const consultationDate = new Date(c.scheduledFor || c.createdAt);
                  const thisMonth = new Date();
                  return consultationDate.getMonth() === thisMonth.getMonth() && 
                         consultationDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Users className="w-6 h-6 mr-3 text-emerald-600" />
            Patient Consultations ({filteredConsultations.length})
          </h3>
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
                            {formattedData.patientName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-slate-800">{formattedData.patientName}</div>
                          <div className="text-sm text-slate-500">
                            ID: {consultation._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {consultation.type || 'General'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {consultation.scheduledFor ? 
                        new Date(consultation.scheduledFor).toLocaleDateString('en-IN') : 
                        'Not scheduled'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      ₹{consultation.fees || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(consultation.status)}`}>
                        {(consultation.status || 'scheduled').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center space-x-2">
                      <button 
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Status Update Buttons */}
                      {consultation.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateConsultationStatus(consultation._id, 'confirmed')}
                            disabled={updating === consultation._id}
                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {updating === consultation._id ? 'Updating...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => updateConsultationStatus(consultation._id, 'cancelled')}
                            disabled={updating === consultation._id}
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {consultation.status === 'confirmed' && (
                        <button
                          onClick={() => updateConsultationStatus(consultation._id, 'completed')}
                          disabled={updating === consultation._id}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          {updating === consultation._id ? 'Updating...' : 'Complete'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No consultations found</p>
                    <p className="text-sm">Your patient consultations will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-emerald-100/50 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;
