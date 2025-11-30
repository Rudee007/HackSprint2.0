// src/components/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Award,
  Clock,
  DollarSign,
  Calendar,
  Languages,
  Save,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  GraduationCap,
  Star,
  Heart,
  Users,
  Briefcase,
  Settings,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const ProfileSettings = ({ doctorInfo, user, displayName, onUpdateProfile }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Form state based on doctorInfo structure (NO verification fields)
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    phone: '',
    bio: '',
    
    // Professional Info
    specializations: [],
    totalExperience: 0,
    
    // Qualifications
    bamsUniversity: '',
    bamsYear: '',
    additionalCertifications: [],
    
    // Consultation Settings
    videoFee: 0,
    inPersonFee: 0,
    followUpFee: 0,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    workingDays: [],
    consultationDuration: 30,
    maxPatientsPerDay: 20,
    languages: []
  });

  // Populate form with existing doctor data
  useEffect(() => {
    if (doctorInfo) {
      setFormData({
        name: doctorInfo.userId?.name || '',
        email: doctorInfo.userId?.email || '',
        phone: doctorInfo.userId?.phone || '',
        bio: doctorInfo.professionalInfo?.bio || '',
        specializations: doctorInfo.specializations || [],
        totalExperience: doctorInfo.experience?.totalYears || 0,
        bamsUniversity: doctorInfo.qualifications?.bams?.university || '',
        bamsYear: doctorInfo.qualifications?.bams?.yearOfCompletion || '',
        additionalCertifications: doctorInfo.qualifications?.additionalCertifications || [],
        videoFee: doctorInfo.consultationSettings?.fees?.videoConsultation || 0,
        inPersonFee: doctorInfo.consultationSettings?.fees?.inPersonConsultation || 0,
        followUpFee: doctorInfo.consultationSettings?.fees?.followUpConsultation || 0,
        workingHours: {
          start: doctorInfo.consultationSettings?.availability?.workingHours?.start || '09:00',
          end: doctorInfo.consultationSettings?.availability?.workingHours?.end || '17:00'
        },
        workingDays: doctorInfo.consultationSettings?.availability?.workingDays || [],
        consultationDuration: doctorInfo.consultationSettings?.availability?.consultationDuration || 30,
        maxPatientsPerDay: doctorInfo.consultationSettings?.preferences?.maxPatientsPerDay || 20,
        languages: doctorInfo.consultationSettings?.preferences?.languages || []
      });
    }
  }, [doctorInfo]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onUpdateProfile(formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully! 🎉');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: User, color: 'emerald' },
    { id: 'professional', name: 'Professional', icon: Stethoscope, color: 'blue' },
    { id: 'qualifications', name: 'Qualifications', icon: GraduationCap, color: 'purple' },
    { id: 'consultation', name: 'Consultation', icon: Calendar, color: 'orange' }
  ];

  const weekDays = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const specializations = [
    'Panchakarma', 'Shalakya Tantra', 'Kayachikitsa', 'Dravyaguna', 
    'Rasayana', 'Shalya Tantra', 'Prasuti Tantra', 'Kaumarabhritya'
  ];

  const languageOptions = [
    'Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Professional Header */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.1\\'%3E%3Ccircle cx=\\'30\\' cy=\\'30\\' r=\\'4\\'/\\%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <span className="text-4xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">Dr. {displayName}</h1>
              <div className="flex items-center space-x-4 text-emerald-100 mb-3">
                <span className="flex items-center space-x-1">
                  <Stethoscope className="w-4 h-4" />
                  <span>{doctorInfo?.specializations?.[0] || 'Ayurvedic Specialist'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{doctorInfo?.experience?.totalYears || 0} Years Experience</span>
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-emerald-200">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{doctorInfo?.metrics?.totalPatients || 0} Patients</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{(doctorInfo?.metrics?.averageRating || 0) / 10}/5 Rating</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 fill-current text-red-400" />
                  <span>{doctorInfo?.metrics?.successRate || 0}% Success Rate</span>
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-white/80">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-white">₹{doctorInfo?.consultationSettings?.fees?.videoConsultation || 0}</div>
              <div className="text-sm">Video Consultation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center space-x-3"
          >
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">{success}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-2xl shadow-lg flex items-center space-x-3"
          >
            <AlertCircle className="w-6 h-6" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200/50 bg-gray-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? `text-${tab.color}-600 bg-white border-b-2 border-${tab.color}-500 shadow-sm`
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Basic Information</h3>
                <p className="text-gray-600">Your fundamental profile details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Dr. Your Name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    placeholder="doctor@ayurmitra.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Briefcase className="w-4 h-4" />
                    <span>Experience (Years)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalExperience}
                    onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    min="0"
                    placeholder="Years of practice"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Heart className="w-4 h-4" />
                  <span>Professional Bio</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                  placeholder="Share your expertise, approach to Ayurvedic medicine, and what makes your practice unique..."
                />
              </div>
            </motion.div>
          )}

          {/* Professional Information Tab */}
          {activeTab === 'professional' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Professional Details</h3>
                <p className="text-gray-600">Your medical specializations and expertise</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Stethoscope className="w-4 h-4" />
                    <span>Medical Specializations</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {specializations.map(spec => (
                      <label key={spec} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                specializations: [...prev.specializations, spec]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                specializations: prev.specializations.filter(s => s !== spec)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Languages className="w-4 h-4" />
                    <span>Languages Spoken</span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {languageOptions.map(lang => (
                      <label key={lang} className="flex items-center space-x-2 p-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                languages: [...prev.languages, lang]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                languages: prev.languages.filter(l => l !== lang)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Qualifications Tab */}
          {activeTab === 'qualifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Educational Qualifications</h3>
                <p className="text-gray-600">Your medical education and certifications</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50">
                <h4 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  BAMS Degree Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-purple-700">University/College</label>
                    <input
                      type="text"
                      value={formData.bamsUniversity}
                      onChange={(e) => handleInputChange('bamsUniversity', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      placeholder="University/College Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-purple-700">Year of Completion</label>
                    <input
                      type="number"
                      value={formData.bamsYear}
                      onChange={(e) => handleInputChange('bamsYear', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      min="1980"
                      max="2024"
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                <h4 className="text-xl font-semibold text-amber-800 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Additional Certifications
                </h4>
                <textarea
                  value={formData.additionalCertifications.join(', ')}
                  onChange={(e) => handleArrayChange('additionalCertifications', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 resize-none"
                  placeholder="List any additional certifications, workshops, or specialized training (comma-separated)"
                />
              </div>
            </motion.div>
          )}

          {/* Consultation Settings Tab */}
          {activeTab === 'consultation' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Consultation Settings</h3>
                <p className="text-gray-600">Configure your practice availability and fees</p>
              </div>

              {/* Consultation Fees */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                <h4 className="text-xl font-semibold text-emerald-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Consultation Fees
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-700">Video Consultation (₹)</label>
                    <input
                      type="number"
                      value={formData.videoFee}
                      onChange={(e) => handleInputChange('videoFee', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      min="0"
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-700">In-Person Visit (₹)</label>
                    <input
                      type="number"
                      value={formData.inPersonFee}
                      onChange={(e) => handleInputChange('inPersonFee', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      min="0"
                      placeholder="1500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-700">Follow-up (₹)</label>
                    <input
                      type="number"
                      value={formData.followUpFee}
                      onChange={(e) => handleInputChange('followUpFee', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      min="0"
                      placeholder="800"
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50">
                <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Working Hours & Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">Start Time</label>
                    <input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">End Time</label>
                    <input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">Consultation Duration</label>
                    <select
                      value={formData.consultationDuration}
                      onChange={(e) => handleInputChange('consultationDuration', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Working Days */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-blue-700">Working Days</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                    {weekDays.map(day => (
                      <label 
                        key={day} 
                        className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.workingDays.includes(day)
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-blue-200 hover:border-blue-300 text-blue-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.workingDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                workingDays: [...prev.workingDays, day]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                workingDays: prev.workingDays.filter(d => d !== day)
                              }));
                            }
                          }}
                          className="hidden"
                        />
                        <span className="font-medium capitalize text-sm">{day.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Maximum Patients Per Day</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={formData.maxPatientsPerDay}
                    onChange={(e) => handleInputChange('maxPatientsPerDay', e.target.value)}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-blue-600 mt-1">
                    <span>5</span>
                    <span className="font-semibold">{formData.maxPatientsPerDay} patients</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            className="pt-8 border-t border-gray-200"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40'
              }`}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-6 h-6" />
                </motion.div>
              ) : (
                <Save className="w-6 h-6" />
              )}
              <span>{loading ? 'Updating Your Profile...' : 'Update Profile'}</span>
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
