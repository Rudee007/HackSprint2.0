import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, User, Heart, Stethoscope, 
  Clock, CheckCircle, AlertCircle, Loader2, 
  Edit3, Save, RefreshCw, Search, Plus, X
} from 'lucide-react';
import axios from 'axios';

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AppointmentBooking = ({ user, onBack }) => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scrolled, setScrolled] = useState(false);
  
  // Form Data State
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    symptoms: [],
    currentSymptoms: '',
    dietHabits: '',
    sleepPattern: '',
    digestion: '',
    bowelHabits: '',
    exerciseHabits: '',
    stressLevel: 'moderate',
    previousTreatments: '',
    allergies: '',
    currentMedications: '',
    preferredDate: '',
    preferredTime: '',
    urgency: 'normal',
    additionalNotes: ''
  });

  // UI State
  const [activeStep, setActiveStep] = useState(1);
  const [editMode, setEditMode] = useState({});
  const [recommendations, setRecommendations] = useState(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Categories for symptoms
  const symptomCategories = [
    { value: 'digestive', label: 'Digestive Issues', icon: '🍽️', symptoms: ['Indigestion', 'Acidity', 'Bloating', 'Constipation', 'Diarrhea'] },
    { value: 'respiratory', label: 'Respiratory', icon: '🫁', symptoms: ['Cough', 'Cold', 'Asthma', 'Breathing Issues'] },
    { value: 'musculoskeletal', label: 'Joint & Muscle', icon: '🦴', symptoms: ['Joint Pain', 'Back Pain', 'Muscle Ache', 'Arthritis'] },
    { value: 'mental', label: 'Mental Health', icon: '🧠', symptoms: ['Stress', 'Anxiety', 'Depression', 'Insomnia'] },
    { value: 'skin', label: 'Skin Issues', icon: '🧴', symptoms: ['Eczema', 'Psoriasis', 'Acne', 'Rash'] },
    { value: 'other', label: 'Other', icon: '🏥', symptoms: ['Headache', 'Fever', 'Fatigue', 'Weight Issues'] }
  ];

  // Fetch user profile data
  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/auth/profile');
      
      if (response.data.success) {
        const userData = response.data.data.user;
        const userProfile = userData.profile || {};
        
        setProfileData({
          name: userData.name || userData.firstName || '',
          age: userProfile.age || '',
          gender: userData.gender || userProfile.gender || '',
          phone: userData.phone || userProfile.phone || '',
          email: userData.email || '',
          symptoms: userProfile.symptoms || [],
          currentSymptoms: '',
          dietHabits: userProfile.dietHabits || '',
          sleepPattern: userProfile.sleepPattern || '',
          digestion: userProfile.digestion || '',
          bowelHabits: userProfile.bowelHabits || '',
          exerciseHabits: userProfile.exerciseHabits || '',
          stressLevel: userProfile.stressLevel || 'moderate',
          previousTreatments: userProfile.previousTreatments || '',
          allergies: userProfile.allergies || '',
          currentMedications: userProfile.currentMedications || '',
          preferredDate: '',
          preferredTime: '',
          urgency: 'normal',
          additionalNotes: ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load your profile information. You can still proceed with the appointment.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle symptom selection
  const handleSymptomToggle = (symptom) => {
    setProfileData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  // Validate form
  const validateForm = () => {
    const requiredFields = ['name', 'age', 'gender', 'phone'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (profileData.symptoms.length === 0 && !profileData.currentSymptoms.trim()) {
      setError('Please select or describe your symptoms');
      return false;
    }
    
    return true;
  };

  // Submit appointment request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare appointment data
      const appointmentData = {
        patientInfo: {
          name: profileData.name,
          age: parseInt(profileData.age),
          gender: profileData.gender,
          phone: profileData.phone,
          email: profileData.email
        },
        healthInfo: {
          symptoms: [...profileData.symptoms, ...profileData.currentSymptoms.split(',').map(s => s.trim()).filter(s => s)],
          dietHabits: profileData.dietHabits,
          sleepPattern: profileData.sleepPattern,
          digestion: profileData.digestion,
          bowelHabits: profileData.bowelHabits,
          exerciseHabits: profileData.exerciseHabits,
          stressLevel: profileData.stressLevel,
          previousTreatments: profileData.previousTreatments,
          allergies: profileData.allergies,
          currentMedications: profileData.currentMedications
        },
        appointmentPreferences: {
          preferredDate: profileData.preferredDate,
          preferredTime: profileData.preferredTime,
          urgency: profileData.urgency,
          additionalNotes: profileData.additionalNotes
        }
      };

      // Call recommendation microservice
      const response = await api.post('/appointments/request-recommendation', appointmentData);
      
      if (response.data.success) {
        setRecommendations(response.data.data);
        setSuccess('Doctor recommendations received successfully! 🎉');
        setActiveStep(3); // Move to recommendations step
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response.data.message || 'Failed to get recommendations');
      }
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError(err.response?.data?.message || 'Failed to process your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Book appointment with recommended doctor
  const bookAppointment = async (doctorId, appointmentSlot) => {
    setSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/appointments/book', {
        doctorId,
        appointmentSlot,
        patientData: profileData
      });
      
      if (response.data.success) {
        setSuccess('Appointment booked successfully! You will receive a confirmation shortly. 📅');
        setTimeout(() => {
          if (onBack) onBack();
        }, 3000);
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Loading your information...</h2>
          <p className="text-gray-600 text-lg">We're preparing your appointment booking form</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Sticky Header */}
      <div className={`
        sticky top-0 z-40 px-6 py-6
        transition-all duration-300 ease-in-out
        ${scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-emerald-100' 
          : 'bg-white border-b border-emerald-100'
        }
      `}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </motion.button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-emerald-800">Book Appointment</h1>
                <p className="text-gray-600">Step {activeStep} of 3</p>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step <= activeStep
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4 md:hidden">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= activeStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-2xl flex items-start gap-3"
            >
              <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <span className="text-base leading-relaxed">{success}</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <span className="text-base leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step 1: Personal & Health Information */}
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Your Health Information
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  We've pre-filled this form with your previous information. Please review and update as needed.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setActiveStep(2); }} className="space-y-8">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <User className="w-6 h-6 text-emerald-600" />
                    Personal Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Age *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={profileData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Gender *
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Current Symptoms */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-emerald-600" />
                    Current Symptoms
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Previous Symptoms */}
                    {profileData.symptoms.length > 0 && (
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-3">
                          Your Previous Symptoms
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {profileData.symptoms.map((symptom, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium"
                            >
                              {symptom}
                              <button
                                type="button"
                                onClick={() => handleSymptomToggle(symptom)}
                                className="text-emerald-500 hover:text-emerald-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Symptom Categories */}
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-4">
                        Select Current Symptoms
                      </label>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {symptomCategories.map((category) => (
                          <div key={category.value} className="border border-gray-200 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <span className="text-xl">{category.icon}</span>
                              {category.label}
                            </h4>
                            <div className="space-y-2">
                              {category.symptoms.map((symptom) => (
                                <label key={symptom} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={profileData.symptoms.includes(symptom)}
                                    onChange={() => handleSymptomToggle(symptom)}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-gray-700">{symptom}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Additional Symptoms */}
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Additional Symptoms (describe any others)
                      </label>
                      <textarea
                        value={profileData.currentSymptoms}
                        onChange={(e) => handleInputChange('currentSymptoms', e.target.value)}
                        rows={4}
                        placeholder="Describe any other symptoms you're experiencing..."
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Health Details */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-emerald-600" />
                    Health Details
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Diet Habits
                      </label>
                      <textarea
                        value={profileData.dietHabits}
                        onChange={(e) => handleInputChange('dietHabits', e.target.value)}
                        rows={3}
                        placeholder="Describe your typical diet..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Sleep Pattern
                      </label>
                      <textarea
                        value={profileData.sleepPattern}
                        onChange={(e) => handleInputChange('sleepPattern', e.target.value)}
                        rows={3}
                        placeholder="Describe your sleep schedule..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Digestion
                      </label>
                      <textarea
                        value={profileData.digestion}
                        onChange={(e) => handleInputChange('digestion', e.target.value)}
                        rows={3}
                        placeholder="How is your digestion..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Stress Level
                      </label>
                      <select
                        value={profileData.stressLevel}
                        onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg text-lg transition-all"
                  >
                    Continue to Preferences
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 2: Appointment Preferences */}
          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Appointment Preferences
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Let us know your preferred appointment timing and any additional information.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    Preferred Schedule
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={profileData.preferredDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Preferred Time
                      </label>
                      <select
                        value={profileData.preferredTime}
                        onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                        className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                      >
                        <option value="">Select preferred time</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                        <option value="evening">Evening (5 PM - 8 PM)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'normal', label: 'Normal', desc: 'Can wait a few days', color: 'bg-green-100 text-green-700 border-green-200' },
                        { value: 'urgent', label: 'Urgent', desc: 'Within 24 hours', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                        { value: 'emergency', label: 'Emergency', desc: 'Immediate attention', color: 'bg-red-100 text-red-700 border-red-200' }
                      ].map((level) => (
                        <motion.button
                          key={level.value}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('urgency', level.value)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            profileData.urgency === level.value
                              ? `${level.color} border-current shadow-md`
                              : 'border-gray-200 hover:border-emerald-300 bg-white'
                          }`}
                        >
                          <div className="font-semibold mb-1">{level.label}</div>
                          <div className="text-sm opacity-80">{level.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Additional Information
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Current Medications
                      </label>
                      <textarea
                        value={profileData.currentMedications}
                        onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                        rows={3}
                        placeholder="List any medications you're currently taking..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Allergies
                      </label>
                      <textarea
                        value={profileData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        rows={3}
                        placeholder="Any known allergies or sensitivities..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Additional Notes
                      </label>
                      <textarea
                        value={profileData.additionalNotes}
                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                        rows={4}
                        placeholder="Any additional information you'd like the doctor to know..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveStep(1)}
                    className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-colors"
                  >
                    Back
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg text-lg transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Getting Recommendations...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Find Doctor Recommendations
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Doctor Recommendations */}
          {activeStep === 3 && recommendations && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Recommended Doctors
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Based on your symptoms and preferences, here are our top doctor recommendations.
                </p>
              </div>

              <div className="grid gap-6">
                {recommendations.doctors?.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{doctor.name}</h3>
                        <p className="text-emerald-600 font-semibold text-lg mb-2">{doctor.specialization}</p>
                        <p className="text-gray-600 mb-4">{doctor.experience} years experience</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>⭐ {doctor.rating}/5.0</span>
                          <span>👥 {doctor.patientCount}+ patients</span>
                          <span>📍 {doctor.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">Why recommended:</h4>
                      <p className="text-gray-700 leading-relaxed">{doctor.recommendationReason}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600">
                        <span className="font-semibold">Available slots:</span>
                        <div className="flex gap-2 mt-2">
                          {doctor.availableSlots?.map((slot, idx) => (
                            <span key={idx} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => bookAppointment(doctor.id, doctor.availableSlots[0])}
                        disabled={submitting}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Booking...' : 'Book Appointment'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveStep(2)}
                  className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-colors"
                >
                  Back to Preferences
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppointmentBooking;
