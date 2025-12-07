// src/components/therapist/patients/PatientsManager.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader2, Eye } from 'lucide-react';
import PatientCard from './PatientCard';
import PatientSessionsView from './PatientSessionsView';
import toast from 'react-hot-toast';

const PatientsManager = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or sessions

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch('/api/therapists/patients/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load patients');
      
      const data = await response.json();
      setPatients(data.data.patients || []);
      
    } catch (error) {
      console.error('Load patients error:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleViewSessions = (patient) => {
    setSelectedPatient(patient);
    setViewMode('sessions');
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'sessions' && selectedPatient) {
    return (
      <PatientSessionsView 
        patient={selectedPatient} 
        onBack={() => {
          setViewMode('grid');
          setSelectedPatient(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <p className="text-gray-500 mt-1">
          Manage and track your assigned patients
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Patients</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{patients.length}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Treatments</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {patients.filter(p => p.treatmentSummary?.upcomingSessions > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completed</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {patients.reduce((acc, p) => acc + (p.treatmentSummary?.completedSessions || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Patients Found
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'No patients have been assigned to you yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <PatientCard 
                patient={patient} 
                onViewSessions={() => handleViewSessions(patient)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsManager;
