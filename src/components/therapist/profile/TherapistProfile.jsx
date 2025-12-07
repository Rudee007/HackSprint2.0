// src/components/therapist/profile/TherapistProfile.jsx
import React from 'react';
import { User } from 'lucide-react';

const TherapistProfile = () => {
  const user = JSON.parse(localStorage.getItem('loggedInTherapist') || '{}');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {user.name?.charAt(0) || 'T'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name || 'Therapist'}</h2>
            <p className="text-gray-500">{user.email || 'email@example.com'}</p>
            <p className="text-sm text-gray-400 mt-1">Therapist ID: {user._id || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Email:</span> {user.email}</p>
              <p><span className="text-gray-600">Phone:</span> {user.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Specialization</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Type:</span> Ayurvedic Therapist</p>
              <p><span className="text-gray-600">Experience:</span> Professional</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistProfile;
