// src/components/therapist/patients/PatientCard.jsx
import React from 'react';
import { User, Phone, Mail, Calendar, CheckCircle, Clock, Eye } from 'lucide-react';

const PatientCard = ({ patient, onViewSessions }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-xl transition-all overflow-hidden group">
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-green-400 to-blue-500 relative">
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              {patient.name?.charAt(0) || 'P'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 px-6 pb-6">
        {/* Patient Name & Age */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
          <p className="text-sm text-gray-500">
            {patient.age ? `${patient.age} years` : 'Age not specified'} • {patient.gender || 'N/A'}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-blue-500" />
            <span>{patient.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-blue-500" />
            <span className="truncate">{patient.email || 'N/A'}</span>
          </div>
        </div>

        {/* Treatment Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Treatment Summary</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {patient.treatmentSummary?.totalSessions || 0}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {patient.treatmentSummary?.completedSessions || 0}
              </p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {patient.treatmentSummary?.upcomingSessions || 0}
              </p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={onViewSessions}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <Eye className="w-5 h-5" />
          <span>View All Sessions</span>
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
