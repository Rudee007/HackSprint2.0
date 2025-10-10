// src/components/admin/AppointmentManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, Filter, Download, RefreshCw, Clock,
  User, Phone, MapPin, ChevronLeft, ChevronRight, X,
  CheckCircle, XCircle, AlertCircle, Edit2, Trash2,
  FileText, ChevronDown, Video, Users as UsersIcon, Plus,
  UserPlus, DollarSign, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';

const AppointmentManagement = ({ dashboardStats, loading }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadAppointments();
  }, [currentPage, selectedStatus, selectedType, dateFilter]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'scheduledAt',
        sortOrder: 'desc'
      };

      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.consultationType = selectedType;

      // Date filtering
      const now = new Date();
      if (dateFilter === 'today') {
        params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        params.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        params.startDate = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === 'month') {
        params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      const result = await adminService.getAppointments(params);
      
      if (result.success) {
        setAppointments(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.providerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      const result = await adminService.createAppointment(appointmentData);
      if (result.success) {
        setShowCreateModal(false);
        toast.success('Appointment created successfully!');
        loadAppointments();
      } else if (result.conflict) {
        // Conflict detected - show alternatives
        toast.error('Time slot conflict! Please check alternatives.');
        // You can pass alternatives to the modal to show them
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleAssignProvider = async (appointmentId, providerId, providerType, reason) => {
    try {
      const result = await adminService.assignProvider(appointmentId, providerId, providerType, reason);
      if (result.success) {
        setShowAssignModal(false);
        loadAppointments();
      }
    } catch (error) {
      console.error('Error assigning provider:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      const result = await adminService.cancelAppointment(appointmentId, reason);
      if (result.success) {
        loadAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleReschedule = async (appointmentId, newDateTime, reason) => {
    try {
      const result = await adminService.rescheduleAppointment(appointmentId, newDateTime, reason);
      if (result.success) {
        setShowRescheduleModal(false);
        loadAppointments();
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };

  const handleExportAppointments = async (filters = {}) => {
    setShowExportMenu(false);
    await adminService.exportAppointments({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      ...filters
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      rescheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      no_show: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle }
    };
    return badges[status] || badges.scheduled;
  };

  const getTypeBadge = (type) => {
    const badges = {
      video: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Video },
      in_person: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: UsersIcon }
    };
    return badges[type] || badges.video;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Appointments"
          value={dashboardStats?.overview?.totalAppointments || 0}
          icon={Calendar}
          gradient="from-blue-500 to-blue-600"
          loading={loading}
        />
        <StatsCard
          title="Today's Appointments"
          value={dashboardStats?.overview?.todaysAppointments || 0}
          icon={Clock}
          gradient="from-green-500 to-green-600"
          loading={loading}
        />
        <StatsCard
          title="This Week"
          value={dashboardStats?.overview?.thisWeeksAppointments || 0}
          icon={CheckCircle}
          gradient="from-purple-500 to-purple-600"
          loading={loading}
        />
        <StatsCard
          title="Pending"
          value={appointments.filter(a => a.status === 'scheduled').length}
          icon={AlertCircle}
          gradient="from-orange-500 to-orange-600"
          loading={loading}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Appointment Management</h2>
              <p className="text-slate-600 mt-1">View and manage all appointments</p>
            </div>
            <div className="flex space-x-3">
              {/* Create Appointment Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>

              <button
                onClick={loadAppointments}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => handleExportAppointments()}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">All Appointments</p>
                            <p className="text-xs text-slate-500">Export all appointments</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleExportAppointments({ status: 'scheduled' })}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3"
                        >
                          <Clock className="w-4 h-4 text-orange-600" />
                          <div>
                            <p className="font-medium text-sm">Scheduled Only</p>
                            <p className="text-xs text-slate-500">Export pending appointments</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleExportAppointments({ status: 'completed' })}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">Completed Only</p>
                            <p className="text-xs text-slate-500">Export completed appointments</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="video">Video Consultation</option>
              <option value="in_person">In-Person</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No appointments found</p>
              <p className="text-sm mt-2">Try adjusting your filters or create a new appointment</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    onView={() => {
                      setSelectedAppointment(appointment);
                      setShowDetailsModal(true);
                    }}
                    onReschedule={() => {
                      setSelectedAppointment(appointment);
                      setShowRescheduleModal(true);
                    }}
                    onAssign={() => {
                      setSelectedAppointment(appointment);
                      setShowAssignModal(true);
                    }}
                    onCancel={() => handleCancelAppointment(appointment._id)}
                    getStatusBadge={getStatusBadge}
                    getTypeBadge={getTypeBadge}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredAppointments.length > 0 && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <div className="flex items-center space-x-2">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-medium ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
        {showRescheduleModal && (
          <RescheduleModal
            appointment={selectedAppointment}
            onClose={() => setShowRescheduleModal(false)}
            onReschedule={handleReschedule}
          />
        )}
        {showCreateModal && (
          <CreateAppointmentModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateAppointment}
          />
        )}
        {showAssignModal && (
          <AssignProviderModal
            appointment={selectedAppointment}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignProvider}
          />
        )}
      </AnimatePresence>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient, loading }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white shadow-lg`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">{loading ? '...' : value}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl">
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </motion.div>
);

// Appointment Row Component
const AppointmentRow = ({ appointment, onView, onReschedule, onAssign, onCancel, getStatusBadge, getTypeBadge }) => {
  const statusInfo = getStatusBadge(appointment.status);
  const typeInfo = getTypeBadge(appointment.consultationType);
  const StatusIcon = statusInfo.icon;
  const TypeIcon = typeInfo.icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-slate-50 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {appointment.patientId?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{appointment.patientId?.name || 'Unknown Patient'}</p>
            <p className="text-sm text-slate-500">{appointment.patientId?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-slate-800">{appointment.providerId?.name || 'Unknown Provider'}</p>
          <p className="text-sm text-slate-500 capitalize">{appointment.providerId?.role || 'Doctor'}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(appointment.scheduledAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{new Date(appointment.scheduledAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 w-fit ${typeInfo.bg} ${typeInfo.text}`}>
          <TypeIcon className="w-3 h-3" />
          <span className="capitalize">{appointment.consultationType?.replace('_', ' ')}</span>
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 w-fit ${statusInfo.bg} ${statusInfo.text}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize">{appointment.status}</span>
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <FileText className="w-4 h-4" />
          </button>
          {appointment.status === 'scheduled' && (
            <>
              <button
                onClick={onAssign}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Assign Provider"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={onReschedule}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Reschedule"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancel"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// Appointment Details Modal
const AppointmentDetailsModal = ({ appointment, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Appointment Details</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Patient</p>
            <p className="text-lg font-semibold text-slate-800">{appointment.patientId?.name}</p>
            <p className="text-sm text-slate-600">{appointment.patientId?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Provider</p>
            <p className="text-lg font-semibold text-slate-800">{appointment.providerId?.name}</p>
            <p className="text-sm text-slate-600 capitalize">{appointment.providerId?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Date & Time</p>
            <p className="text-lg font-semibold text-slate-800">
              {new Date(appointment.scheduledAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600">
              {new Date(appointment.scheduledAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Type</p>
            <p className="text-lg font-semibold text-slate-800 capitalize">
              {appointment.consultationType?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {appointment.notes && (
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Notes</p>
            <p className="text-slate-700">{appointment.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// Reschedule Modal
const RescheduleModal = ({ appointment, onClose, onReschedule }) => {
  const [newDateTime, setNewDateTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onReschedule(appointment._id, newDateTime, reason);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">Reschedule Appointment</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Date & Time *</label>
            <input
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Reason for rescheduling..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Reschedule</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Create Appointment Modal
const CreateAppointmentModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    providerId: '',
    providerType: 'doctor',
    type: 'video',
    scheduledAt: '',
    duration: 30,
    fee: '',
    sessionType: 'consultation',
    meetingLink: '',
    notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (formData.providerType) {
      loadProviders(formData.providerType);
    }
  }, [formData.providerType]);

  const loadPatients = async () => {
    const result = await adminService.getPatientsList();
    if (result.success) {
      setPatients(result.data);
    }
  };

  const loadProviders = async (type) => {
    const result = type === 'doctor' 
      ? await adminService.getDoctorsList()
      : await adminService.getTherapistsList();
    if (result.success) {
      setProviders(result.data);
    }
  };

  const checkAvailability = async () => {
    if (!formData.providerId || !formData.scheduledAt) return;
    
    setCheckingSlot(true);
    const result = await adminService.checkSlotAvailability(
      formData.providerId,
      formData.scheduledAt,
      formData.duration
    );
    setCheckingSlot(false);
    
    if (result.success) {
      setSlotAvailable(result.data.available);
      if (!result.data.available) {
        toast.error('Time slot not available!');
      } else {
        toast.success('Time slot is available!');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">Create New Appointment</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Patient *</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>

            {/* Provider Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provider Type *</label>
              <select
                value={formData.providerType}
                onChange={(e) => setFormData({...formData, providerType: e.target.value, providerId: ''})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="doctor">Doctor</option>
                <option value="therapist">Therapist</option>
              </select>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provider *</label>
              <select
                value={formData.providerId}
                onChange={(e) => setFormData({...formData, providerId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select {formData.providerType}</option>
                {providers.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.specialization})</option>
                ))}
              </select>
            </div>

            {/* Consultation Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="video">Video Call</option>
                <option value="in_person">In-Person</option>
              </select>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                onBlur={checkAvailability}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
              {checkingSlot && <p className="text-sm text-blue-600 mt-1">Checking availability...</p>}
              {slotAvailable === false && <p className="text-sm text-red-600 mt-1">❌ Slot not available</p>}
              {slotAvailable === true && <p className="text-sm text-green-600 mt-1">✅ Slot available</p>}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration (min) *</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                min="15"
                max="120"
                step="15"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fee (₹) *</label>
              <input
                type="number"
                value={formData.fee}
                onChange={(e) => setFormData({...formData, fee: e.target.value})}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Session Type</label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="therapy">Therapy Session</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Meeting Link */}
          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Link *</label>
              <input
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required={formData.type === 'video'}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Additional notes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || slotAvailable === false}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Create Appointment</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Assign Provider Modal
const AssignProviderModal = ({ appointment, onClose, onAssign }) => {
  const [providerType, setProviderType] = useState(appointment?.providerType || 'doctor');
  const [providerId, setProviderId] = useState('');
  const [reason, setReason] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders(providerType);
  }, [providerType]);

  const loadProviders = async (type) => {
    const result = type === 'doctor' 
      ? await adminService.getDoctorsList()
      : await adminService.getTherapistsList();
    if (result.success) {
      setProviders(result.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAssign(appointment._id, providerId, providerType, reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">Assign Provider</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Provider Type *</label>
            <select
              value={providerType}
              onChange={(e) => {
                setProviderType(e.target.value);
                setProviderId('');
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="doctor">Doctor</option>
              <option value="therapist">Therapist</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select {providerType} *</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select {providerType}</option>
              {providers.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} - {p.specialization} ({p.experience} years exp)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for assigning/reassigning provider..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Assign Provider</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentManagement;
