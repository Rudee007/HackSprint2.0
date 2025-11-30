import React from 'react';
import { Star, MapPin, Video, Monitor } from 'lucide-react';

/**
 * Props
 * ──────────────────────────────────────────────────────────
 * doctor      object  – enriched doctor record
 * onSchedule  func    – callback(doctor) on “Schedule” click
 */
const DoctorCard = ({ doctor, onSchedule }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6
                  flex flex-col md:flex-row gap-6">
    {/* Avatar */}
    <div className="flex-shrink-0">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr
                      from-emerald-500 to-teal-600 flex items-center
                      justify-center text-white text-3xl font-bold">
        {doctor?.name?.charAt(0) || 'D'}
      </div>
    </div>

    {/* Details */}
    <div className="flex-1">
      <h3 className="text-2xl font-bold text-gray-900">
        Dr.&nbsp;{doctor?.name || 'Unknown'}
      </h3>

      <p className="text-emerald-700 font-medium">
        {doctor?.specializations?.[0] || 'Ayurvedic Specialist'}
      </p>

      <p className="text-gray-600 mt-1">
        {(doctor?.experience?.totalYears || 0)} years experience
      </p>

      {/* Rating + location */}
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <span className="flex items-center gap-1 text-yellow-500">
          <Star className="w-4 h-4" />
          {(doctor?.rating || 4.5).toFixed(1)}/5.0
        </span>

        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {doctor?.userId?.location || 'Online'}
        </span>
      </div>

      {/* Fees */}
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1 bg-blue-100 text-blue-700
                         px-3 py-1 rounded-md">
          <Video className="w-4 h-4" />
          {`\u20B9${doctor?.consultationSettings?.fees?.videoConsultation ?? '—'}`}
        </span>

        <span className="flex items-center gap-1 bg-green-100 text-green-700
                         px-3 py-1 rounded-md">
          <Monitor className="w-4 h-4" />
          {`\u20B9${doctor?.consultationSettings?.fees?.inPersonConsultation ?? '—'}`}
        </span>
      </div>
    </div>

    {/* CTA */}
    <div className="flex items-center">
      <button
        onClick={() => onSchedule(doctor)}
        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600
                   hover:from-emerald-700 hover:to-teal-700 text-white
                   font-bold rounded-xl shadow-lg transition"
      >
        Schedule
      </button>
    </div>
  </div>
);

export default DoctorCard;
