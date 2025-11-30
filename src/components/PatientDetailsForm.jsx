import React, { useState } from 'react';
import { User, Phone, MapPin, Heart, Calendar } from 'lucide-react';

const PatientDetailsForm = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    address: '',
    relationshipStatus: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-[2rem]"></div>
        
        <div className="relative bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
          <div className="relative flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-lg">
              <User className="w-8 h-8 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">Patient Details</h2>
              <p className="text-white/90 font-medium drop-shadow-sm">Tell us about yourself</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-lg font-bold text-gray-900">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 bg-white/60 backdrop-blur-xl shadow-lg text-lg"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-bold text-gray-900">Age *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 bg-white/60 backdrop-blur-xl shadow-lg text-lg"
                  placeholder="Your age"
                  min="1"
                  max="120"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-900">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 bg-white/60 backdrop-blur-xl shadow-lg text-lg"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-900">Address *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 bg-white/60 backdrop-blur-xl shadow-lg text-lg resize-none"
                placeholder="Enter your complete address"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-900">Relationship Status With The Patient</label>
            <div className="relative">
              <Heart className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="relationshipStatus"
                value={formData.relationshipStatus}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 bg-white/60 backdrop-blur-xl shadow-lg text-lg"
                placeholder="Enter your relationship status"
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-white/60 backdrop-blur-xl hover:bg-white/80 text-gray-700 hover:text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 border border-white/30 hover:border-gray-300"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 transform active:scale-95"
            >
              Continue to Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientDetailsForm;