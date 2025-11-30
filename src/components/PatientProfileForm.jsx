import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, MapPin, Heart, Save, Loader2 } from 'lucide-react';
import axios from 'axios';

// 🔥 API Configuration
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PatientProfileForm = ({ profile, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    address: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    medicalHistory: '',
    // 🔥 NEW: Ayurvedic-specific fields
    symptoms: [],
    dietHabits: '',
    sleepPattern: '',
    digestion: '',
    bowelHabits: '',
    stressLevel: '',
    exerciseHabits: '',
    allergies: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        // Try to load from backend first
        if (profile) {
          setFormData(profile);
        } else {
          // Fallback to localStorage
          const savedProfile = localStorage.getItem('patientProfile');
          if (savedProfile) {
            setFormData(JSON.parse(savedProfile));
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // 🔥 NEW: Handle array inputs (symptoms)
  const handleArrayInput = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.phone) {
      setError('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      // 🔥 Try to save to backend first
      const response = await api.put('/patients/profile', formData);
      
      if (response.data.success) {
        console.log('✅ Profile saved to backend');
        onComplete && onComplete(response.data.data.profile);
      }
    } catch (err) {
      console.error('❌ Backend save failed:', err);
      
      // 🔥 Fallback to localStorage
      localStorage.setItem('patientProfile', JSON.stringify(formData));
      console.log('📱 Profile saved to localStorage');
      onComplete && onComplete(formData);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 rounded-[2rem]"></div>
        
        <div className="relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
          <div className="relative flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-lg">
              <User className="w-8 h-8 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">Patient Profile</h2>
              <p className="text-white/90 font-medium drop-shadow-sm">Complete your health information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative p-8 space-y-6">
          {error && (
            <div className="bg-gradient-to-r from-red-500/10 via-pink-500/5 to-red-500/10 backdrop-blur-xl border border-red-200/30 rounded-3xl p-6 flex items-center space-x-4 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Emergency contact number"
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* 🔥 NEW: Ayurvedic Health Assessment */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
              Ayurvedic Health Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Current Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  value={Array.isArray(formData.symptoms) ? formData.symptoms.join(', ') : formData.symptoms}
                  onChange={(e) => handleArrayInput('symptoms', e.target.value)}
                  placeholder="e.g., headache, fatigue, anxiety"
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                />
                <p className="text-sm text-gray-600">Separate multiple symptoms with commas</p>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Sleep Pattern</label>
                <select
                  name="sleepPattern"
                  value={formData.sleepPattern}
                  onChange={handleInputChange}
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                >
                  <option value="">Select sleep pattern</option>
                  <option value="excellent">Excellent (7-8 hours, restful)</option>
                  <option value="good">Good (6-7 hours, mostly restful)</option>
                  <option value="fair">Fair (5-6 hours, sometimes restless)</option>
                  <option value="poor">Poor (less than 5 hours, often restless)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Digestion</label>
                <select
                  name="digestion"
                  value={formData.digestion}
                  onChange={handleInputChange}
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                >
                  <option value="">Select digestion status</option>
                  <option value="strong">Strong (no issues, good appetite)</option>
                  <option value="moderate">Moderate (occasional discomfort)</option>
                  <option value="weak">Weak (frequent digestive issues)</option>
                  <option value="irregular">Irregular (varies day to day)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-gray-900">Stress Level</label>
                <select
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleInputChange}
                  className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg"
                  disabled={isSaving}
                >
                  <option value="">Select stress level</option>
                  <option value="low">Low (calm, relaxed)</option>
                  <option value="moderate">Moderate (manageable stress)</option>
                  <option value="high">High (frequent stress/anxiety)</option>
                  <option value="severe">Severe (overwhelming stress)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-bold text-gray-900">Diet Habits</label>
              <textarea
                name="dietHabits"
                value={formData.dietHabits}
                onChange={handleInputChange}
                placeholder="Describe your typical diet, food preferences, and eating patterns"
                rows="3"
                className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg resize-none"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-bold text-gray-900">Exercise Habits</label>
              <textarea
                name="exerciseHabits"
                value={formData.exerciseHabits}
                onChange={handleInputChange}
                placeholder="Describe your exercise routine and physical activity level"
                rows="2"
                className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg resize-none"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Address and Medical History */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your complete address"
              rows="3"
              className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg resize-none"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900">Medical History & Allergies</label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              placeholder="Any existing medical conditions, allergies, current medications, or previous treatments"
              rows="4"
              className="w-full p-4 border-0 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 text-lg resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Submit Button */}
          <div className="relative pt-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            <button
              type="submit"
              disabled={isSaving}
              className="group relative w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white py-6 px-8 rounded-3xl font-black text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] hover:-translate-y-2 transform active:scale-95 shadow-[0_8px_32px_rgba(16,185,129,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-center space-x-4">
                {isSaving ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="tracking-wide">Updating Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-7 h-7 group-hover:scale-125 transition-all duration-300" />
                    <span className="tracking-wide">Save Profile</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfileForm;
