// src/components/PatientPrescriptions.jsx
// 🔥 PATIENT PRESCRIPTION VIEW WITH DOWNLOAD

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Download, Eye, Calendar, User, FileText, Clock,
  Loader2, AlertCircle, Search, Filter, ChevronRight,
  ArrowLeft, CheckCircle, Package, Info
} from 'lucide-react';
import axios from 'axios';

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3003/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PatientPrescriptions = ({ patientId, onBack }) => {
  // State Management
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch Prescriptions
  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/prescriptions/patient/${patientId}?page=1&limit=50`);

      if (response.data.success) {
        setPrescriptions(response.data.data.prescriptions || []);
      }
    } catch (err) {
      console.error('❌ Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download Prescription
  const handleDownloadPrescription = async (prescriptionId) => {
    try {
      setDownloading(prescriptionId);

      const response = await api.get(`/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Prescription_${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('✅ Prescription downloaded successfully!');
    } catch (error) {
      console.error('❌ Error downloading prescription:', error);
      alert('Failed to download prescription. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // Filter Prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = !searchTerm ||
      prescription.prescriptionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status Color Helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'followup_needed': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-800">My Prescriptions</h1>
          <p className="text-slate-600 mt-2">View and download your prescription history</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Total Prescriptions</p>
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
                {prescriptions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">Follow-ups Needed</p>
              <p className="text-2xl font-bold text-amber-900">
                {prescriptions.filter(p => p.status === 'followup_needed').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">This Month</p>
              <p className="text-2xl font-bold text-purple-900">
                {prescriptions.filter(p => {
                  const createdAt = new Date(p.createdAt);
                  const thisMonth = new Date();
                  return createdAt.getMonth() === thisMonth.getMonth() &&
                    createdAt.getFullYear() === thisMonth.getFullYear();
                }).length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              placeholder="Search by prescription number or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="followup_needed">Follow-up Needed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Prescriptions List */}
      <AnimatePresence mode="wait">
        {selectedPrescription ? (
          <PrescriptionDetails
            prescription={selectedPrescription}
            onBack={() => setSelectedPrescription(null)}
            onDownload={() => handleDownloadPrescription(selectedPrescription._id)}
            downloading={downloading === selectedPrescription._id}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50">
            <div className="px-8 py-6 border-b border-emerald-100/50">
              <h3 className="text-xl font-bold text-slate-800">
                Prescription History ({filteredPrescriptions.length})
              </h3>
            </div>

            <div className="p-8">
              {filteredPrescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPrescriptions.map((prescription) => (
                    <motion.div
                      key={prescription._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="border border-slate-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Pill className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Prescription</p>
                            <p className="font-semibold text-slate-800 text-sm">
                              {prescription.prescriptionNumber}
                            </p>
                          </div>
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
                        <p className="text-xs text-slate-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                        {prescription.followUpDate && (
                          <p className="text-amber-600 text-xs">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Follow-up: {new Date(prescription.followUpDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrescription(prescription);
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPrescription(prescription._id);
                          }}
                          disabled={downloading === prescription._id}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {downloading === prescription._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>Download</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-600">No prescriptions found</p>
                  <p className="text-sm text-slate-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Your prescriptions will appear here after consultations'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Prescription Details Component
const PrescriptionDetails = ({ prescription, onBack, onDownload, downloading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'followup_needed': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-800 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Prescriptions</span>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Prescription Details</h2>
            <p className="text-slate-600 mt-1">{prescription.prescriptionNumber}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(prescription.status)}`}>
                {prescription.status?.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-slate-500">
                Created: {new Date(prescription.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={onDownload}
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
          <div className="bg-emerald-50 p-4 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2 text-emerald-600" />
              Chief Complaint
            </h3>
            <p className="text-slate-700">{prescription.chiefComplaint}</p>
          </div>
          {prescription.diagnosis && (
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Diagnosis
              </h3>
              <p className="text-slate-700">{prescription.diagnosis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Medicines */}
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-emerald-600" />
          Prescribed Medicines ({prescription.medicines?.length || 0})
        </h3>
        <div className="space-y-4">
          {prescription.medicines?.map((med, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{med.name}</h4>
                  <p className="text-sm text-slate-600">{med.genericName}</p>
                  <p className="text-xs text-slate-500 mt-1">{med.category}</p>
                </div>
                <div className="bg-emerald-100 px-3 py-1 rounded-full">
                  <p className="text-xs font-semibold text-emerald-700">Qty: {med.quantity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Dosage:</span>
                  <p className="font-semibold text-slate-900">{med.dosage}</p>
                </div>
                <div>
                  <span className="text-slate-600">Frequency:</span>
                  <p className="font-semibold text-slate-900">{med.frequency}</p>
                </div>
                <div>
                  <span className="text-slate-600">Timing:</span>
                  <p className="font-semibold text-slate-900">{med.timing}</p>
                </div>
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-semibold text-slate-900">{med.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {(prescription.generalInstructions || prescription.dietInstructions || prescription.lifestyleInstructions) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prescription.generalInstructions && (
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">General Instructions</h3>
              <p className="text-slate-700 leading-relaxed">{prescription.generalInstructions}</p>
            </div>
          )}
          {prescription.dietInstructions && (
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Diet Instructions</h3>
              <p className="text-slate-700 leading-relaxed">{prescription.dietInstructions}</p>
            </div>
          )}
          {prescription.lifestyleInstructions && (
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Lifestyle Instructions</h3>
              <p className="text-slate-700 leading-relaxed">{prescription.lifestyleInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Follow-up */}
      {prescription.followUpDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Follow-up Required
          </h3>
          <p className="text-amber-800">
            Next visit scheduled for: <strong>{new Date(prescription.followUpDate).toLocaleDateString()}</strong>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PatientPrescriptions;
