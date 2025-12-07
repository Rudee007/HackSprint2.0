// src/components/therapist/sessions/SessionCard.jsx
import React, { useState } from 'react';
import { 
  Clock, User, Stethoscope, Play, Square, Eye, 
  MapPin, Phone, Mail, Activity, CheckCircle 
} from 'lucide-react';
import StartSessionModal from './StartSessionModal';
import CompleteSessionModal from './CompleteSessionModal';

const SessionCard = ({ session, onRefresh }) => {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between">
          {/* Patient Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">
                {session.patientId?.name?.charAt(0) || 'P'}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {session.patientId?.name || 'Unknown Patient'}
              </h3>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(session.scheduledAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className="flex items-center">
                  <Stethoscope className="w-4 h-4 mr-1" />
                  {session.therapyData?.therapyType || 'Therapy'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(session.status)}`}>
              {session.status.replace('_', ' ')}
            </span>

            {session.status === 'scheduled' && (
              <button
                onClick={() => setShowStartModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}

            {session.status === 'in_progress' && (
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Complete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showStartModal && (
        <StartSessionModal
          session={session}
          onClose={() => setShowStartModal(false)}
          onSuccess={() => {
            setShowStartModal(false);
            onRefresh();
          }}
        />
      )}

      {showCompleteModal && (
        <CompleteSessionModal
          session={session}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={() => {
            setShowCompleteModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default SessionCard;
