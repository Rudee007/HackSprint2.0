// src/components/therapist/patients/PatientSessionsView.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Activity, 
  Loader2, FileText, Heart, TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientSessionsView = ({ patient, onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatientSessions = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch(`/api/therapists/sessions/patient/${patient._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data = await response.json();
      setSessions(data.data.sessions || []);
      
    } catch (error) {
      console.error('Load patient sessions error:', error);
      toast.error('Failed to load patient sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientSessions();
  }, [patient._id]);

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'scheduled': Clock,
      'in_progress': Activity,
      'completed': CheckCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Sessions for {patient.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} • 
            {sessions.filter(s => s.status === 'completed').length} completed
          </p>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Patient Name</p>
            <p className="text-lg font-semibold text-gray-900">{patient.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Age</p>
            <p className="text-lg font-semibold text-gray-900">{patient.age || 'N/A'} years</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Contact</p>
            <p className="text-lg font-semibold text-gray-900">{patient.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{patient.email}</p>
          </div>
        </div>
      </div>

      {/* Sessions Timeline */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Sessions Found
            </h3>
            <p className="text-gray-500">
              This patient has no recorded sessions yet
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    session.status === 'completed' ? 'bg-green-100' :
                    session.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getStatusIcon(session.status)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg capitalize">
                      {session.therapyData?.therapyType || 'General Therapy'}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(session.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(session.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {session.actualDuration && (
                        <span className="flex items-center">
                          <Activity className="w-4 h-4 mr-1" />
                          {session.actualDuration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${getStatusColor(session.status)}`}>
                  {getStatusIcon(session.status)}
                  <span className="capitalize">{session.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Session Details (for completed sessions) */}
              {session.status === 'completed' && session.therapyData && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {session.therapyData.vitals?.pulse && (
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-gray-500">Pulse</p>
                          <p className="font-medium">{session.therapyData.vitals.pulse} bpm</p>
                        </div>
                      </div>
                    )}
                    {session.therapyData.vitals?.bloodPressure && (
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-gray-500">Blood Pressure</p>
                          <p className="font-medium">
                            {session.therapyData.vitals.bloodPressure.systolic}/
                            {session.therapyData.vitals.bloodPressure.diastolic}
                          </p>
                        </div>
                      </div>
                    )}
                    {session.therapyData.vitals?.temperature && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-gray-500">Temperature</p>
                          <p className="font-medium">{session.therapyData.vitals.temperature}°F</p>
                        </div>
                      </div>
                    )}
                    {session.therapyData.observations?.patientComfort && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-gray-500">Comfort</p>
                          <p className="font-medium capitalize">
                            {session.therapyData.observations.patientComfort.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Session Notes */}
                  {session.sessionNotes && session.sessionNotes.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Session Notes:</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {session.sessionNotes[session.sessionNotes.length - 1]?.note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSessionsView;
