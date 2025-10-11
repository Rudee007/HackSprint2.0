// src/components/admin/ProviderVerification.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Clock, AlertCircle,
  Eye, FileText, Mail, Phone, MapPin, Award,
  Calendar, User, RefreshCw, Search, Filter,
  ChevronDown, ChevronUp, Download, MessageSquare,
  Briefcase, GraduationCap, Building, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';

const ProviderVerification = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    loadPendingVerifications();
  }, [filterStatus]);

  const loadPendingVerifications = async () => {
    setLoading(true);
    try {
      const result = await adminService.getPendingVerifications();
      if (result.success) {
        const filtered = result.data.filter(
          provider => provider.verificationStatus?.status === filterStatus
        );
        setProviders(filtered);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = (provider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  const submitVerification = async (status, notes) => {
    try {
      const result = await adminService.updateDoctorVerification(
        selectedProvider._id,
        status,
        notes
      );

      if (result.success) {
        toast.success(`Provider ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        setShowModal(false);
        setSelectedProvider(null);
        loadPendingVerifications();
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to update verification status');
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.specializations?.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Provider Verification</h1>
              <p className="text-indigo-100 mt-1">
                Review and approve healthcare provider applications
              </p>
            </div>
          </div>
          <button
            onClick={loadPendingVerifications}
            disabled={loading}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="Pending" count={providers.filter(p => p.verificationStatus?.status === 'pending').length} color="yellow" />
          <StatCard label="Under Review" count={providers.filter(p => p.verificationStatus?.status === 'under_review').length} color="blue" />
          <StatCard label="Approved" count={providers.filter(p => p.verificationStatus?.status === 'approved').length} color="green" />
          <StatCard label="Rejected" count={providers.filter(p => p.verificationStatus?.status === 'rejected').length} color="red" />
        </div>
      </motion.div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No providers found</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <ProviderCard
              key={provider._id}
              provider={provider}
              expanded={expandedCard === provider._id}
              onToggle={() => setExpandedCard(expandedCard === provider._id ? null : provider._id)}
              onAction={() => handleVerificationAction(provider)}
              getStatusBadge={getStatusBadge}
            />
          ))
        )}
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showModal && selectedProvider && (
          <VerificationModal
            provider={selectedProvider}
            onClose={() => {
              setShowModal(false);
              setSelectedProvider(null);
            }}
            onSubmit={submitVerification}
            getStatusBadge={getStatusBadge}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Provider Card Component (keeping the same)
const ProviderCard = ({ provider, expanded, onToggle, onAction, getStatusBadge }) => {
  const status = provider.verificationStatus?.status || 'pending';
  const badge = getStatusBadge(status);
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {provider.userId?.name?.charAt(0) || 'D'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">
                  Dr. {provider.userId?.name || 'Unknown'}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center space-x-1">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{provider.userId?.email}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{provider.userId?.phone}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{new Date(provider.createdAt).toLocaleDateString()}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {provider.specializations?.slice(0, 3).map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                  >
                    {spec}
                  </span>
                ))}
                {provider.specializations?.length > 3 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    +{provider.specializations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            {status === 'pending' && (
              <button
                onClick={onAction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Review</span>
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-slate-200 space-y-4"
            >
              <InfoSection title="Qualifications" icon={Award}>
                <div className="space-y-2">
                  <InfoItem label="Degree" value={provider.qualifications?.bams?.degree} />
                  <InfoItem label="University" value={provider.qualifications?.bams?.university} />
                  <InfoItem label="Year" value={provider.qualifications?.bams?.yearOfCompletion} />
                </div>
              </InfoSection>

              <InfoSection title="Experience" icon={FileText}>
                <InfoItem label="Total Years" value={`${provider.experience?.totalYears} years`} />
              </InfoSection>

              {provider.userId?.location && (
                <InfoSection title="Location" icon={MapPin}>
                  <InfoItem label="City" value={provider.userId.location.city} />
                  <InfoItem label="State" value={provider.userId.location.state} />
                </InfoSection>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// IMPROVED Verification Modal Component
const VerificationModal = ({ provider, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (status) => {
    setSubmitting(true);
    await onSubmit(status, notes);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Review Provider Application</h2>
          <p className="text-indigo-100 mt-1">Dr. {provider.userId?.name}</p>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8">
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={Mail} label="Email" value={provider.userId?.email} />
                <DetailRow icon={Phone} label="Phone" value={provider.userId?.phone} />
              </div>
            </div>

            {/* Education & Qualifications */}
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Education & Qualifications</span>
              </h3>
              <div className="space-y-3">
                <DetailRow label="Degree" value={provider.qualifications?.bams?.degree} />
                <DetailRow label="University" value={provider.qualifications?.bams?.university} />
                <DetailRow label="Year of Completion" value={provider.qualifications?.bams?.yearOfCompletion} />
              </div>
            </div>

            {/* Experience & Specializations */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <span>Experience & Specializations</span>
              </h3>
              <div className="space-y-4">
                <DetailRow label="Total Experience" value={`${provider.experience?.totalYears} years`} />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.specializations?.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <span>Verification Notes</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Add your notes about this verification (optional)..."
              />
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed Actions */}
        <div className="border-t border-slate-200 px-8 py-6 bg-slate-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleSubmit('approved')}
              disabled={submitting}
              className="flex-1 px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleSubmit('rejected')}
              disabled={submitting}
              className="flex-1 px-6 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              <span>Reject</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper Components
const StatCard = ({ label, count, color }) => {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className={`${colors[color]} border-2 rounded-lg p-4 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </div>
  );
};

const InfoSection = ({ title, icon: Icon, children }) => (
  <div>
    <div className="flex items-center space-x-2 mb-3">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h4 className="font-semibold text-slate-900">{title}</h4>
    </div>
    {children}
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-600">{label}:</span>
    <span className="text-sm font-medium text-slate-900 text-right">{value || 'N/A'}</span>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3">
    {Icon && (
      <div className="p-2 bg-white rounded-lg mt-0.5">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

export default ProviderVerification;
