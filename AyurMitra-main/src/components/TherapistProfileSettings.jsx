import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  Award,
  Clock,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle,
  Heart,
  Users,
  Briefcase,
  Loader2,
  GraduationCap,
  Star
} from 'lucide-react';

const dayKeyMap = {
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
  Sunday: 'sunday'
};

const TherapistProfileSettings = ({
  therapistProfile,
  displayName,
  onUpdateProfile,
  onUpdateAvailability // NEW: passed from dashboard
}) => {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    // User model fields
    name: '',
    email: '',
    phone: '',
    // Therapist model fields
    bio: '',
    specialization: [],
    experienceYears: 0,
    certifications: [],
    isActive: true,
    verificationStatus: 'pending',
    // Availability inputs (minimal)
    workingHours: { start: '09:00', end: '17:00' },
    workingDays: [],
    sessionDuration: 60,
    maxPatientsPerDay: 8,
    slotGapMinutes: 30 // gap between two slots
  });

  // ═══════════════════════════════════════════════════════════
  // POPULATE FORM FROM THERAPIST PROFILE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!therapistProfile) return;

    const availability = therapistProfile.availability || {};

    setFormData((prev) => ({
      ...prev,
      name: therapistProfile.userId?.name || '',
      email: therapistProfile.userId?.email || '',
      phone: therapistProfile.userId?.phone || '',
      bio: therapistProfile.bio || '',
      specialization: therapistProfile.specialization || [],
      experienceYears: therapistProfile.experienceYears || 0,
      certifications: therapistProfile.certifications || [],
      isActive:
        typeof therapistProfile.isActive === 'boolean'
          ? therapistProfile.isActive
          : true,
      verificationStatus:
        therapistProfile.verificationStatus || 'pending',
      workingHours: {
        start: availability.workingHours?.start || '09:00',
        end: availability.workingHours?.end || '17:00'
      },
      workingDays:
        availability.workingDays?.length
          ? availability.workingDays
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      sessionDuration: availability.sessionDuration || 60,
      maxPatientsPerDay: availability.maxPatientsPerDay || 8
    }));
  }, [therapistProfile]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  const toggleWorkingDay = (day) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      return {
        ...prev,
        workingDays: exists
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day]
      };
    });
  };

  const timeToMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const pad = (x) => String(x).padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  };

  // Example: 00:00–12:00, 90 min, 30 min gap → 6 slots like your sample
  const generateSlots = (startTime, endTime, sessionDuration, gapMinutes) => {
    const slots = [];
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return slots;

    let current = start;
    const len = sessionDuration;
    const gap = gapMinutes;

    while (current + len <= end) {
      const slotStart = current;
      const slotEnd = current + len;

      slots.push({
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd)
      });

      current = slotEnd + gap;
    }

    return slots;
  };

  // ═══════════════════════════════════════════════════════════
  // SUBMIT
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'availability') {
        if (!onUpdateAvailability) {
          setError('Availability update handler is not configured');
          return;
        }

        const {
          workingHours,
          workingDays,
          sessionDuration,
          maxPatientsPerDay,
          slotGapMinutes
        } = formData;

        const availabilityPayload = {
          workingDays: [...workingDays],
          workingHours: {
            start: workingHours.start,
            end: workingHours.end
          },
          maxPatientsPerDay:
            parseInt(maxPatientsPerDay, 10) || 8,
          sessionDuration:
            parseInt(sessionDuration, 10) || 60
        };

        // Build monday–sunday sections with auto-generated slots
        weekDays.forEach((label) => {
          const key = dayKeyMap[label];
          const isAvailable = workingDays.includes(label);

          if (!isAvailable) {
            availabilityPayload[key] = {
              isAvailable: false,
              slots: []
            };
          } else {
            const slots = generateSlots(
              workingHours.start,
              workingHours.end,
              parseInt(sessionDuration, 10) || 60,
              slotGapMinutes
            );
            availabilityPayload[key] = {
              isAvailable: true,
              slots
            };
          }
        });

        const result = await onUpdateAvailability(availabilityPayload);

        if (result?.success) {
          setSuccess('✅ Availability updated successfully! 🎉');
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError(result?.error || 'Failed to update availability');
        }
        return;
      }

      // PROFILE BRANCH (basic/professional/certifications)
      const updatePayload = {
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        bio: formData.bio?.trim() || '',
        specialization: formData.specialization || [],
        experienceYears:
          parseInt(formData.experienceYears, 10) || 0,
        certifications: (formData.certifications || []).map(
          (cert) => ({
            therapy: cert.therapy,
            level: cert.level,
            experienceYears:
              Number(cert.experienceYears) || 0,
            certificateUrl: cert.certificateUrl
          })
        ),
        isActive: formData.isActive,
        verificationStatus: formData.verificationStatus
      };

      const result = await onUpdateProfile(updatePayload);

      if (result?.success) {
        setSuccess('✅ Profile updated successfully! 🎉');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errMsg =
          result?.error || 'Failed to update profile';
        setError(errMsg);
      }
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════
  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: User, color: 'emerald' },
    { id: 'professional', name: 'Professional', icon: Heart, color: 'blue' },
    { id: 'certifications', name: 'Certifications', icon: GraduationCap, color: 'purple' },
    { id: 'availability', name: 'Availability', icon: Calendar, color: 'orange' }
  ];

  const weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  const specializations = [
    'Panchakarma',
    'Abhyanga',
    'Shirodhara',
    'Swedana',
    'Basti',
    'Nasya',
    'Stress Relief',
    'Pain Management',
    'Detoxification',
    'Rejuvenation'
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.1\\'%3E%3Ccircle cx=\\'30\\' cy=\\'30\\' r=\\'4\\'/\\%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <span className="text-4xl font-bold text-white">
                {displayName?.charAt(0)?.toUpperCase() || 'T'}
              </span>
            </div>
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">
                {displayName || 'Therapist'}
              </h1>
              <div className="flex items-center space-x-4 text-emerald-100 mb-3">
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>
                    {therapistProfile?.specialization?.[0] ||
                      'Ayurvedic Therapist'}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>
                    {therapistProfile?.experienceYears || 0}{' '}
                    Years Experience
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-emerald-200">
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {therapistProfile?.metrics?.totalSessions ||
                      0}{' '}
                    Sessions
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>
                    {therapistProfile?.metrics?.averageRating
                      ? therapistProfile.metrics.averageRating.toFixed(
                          1
                        )
                      : '0.0'}
                    /5 Rating
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error */}
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

      {/* Tabs + Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
        {/* Tab Nav */}
        <div className="flex border-b border-gray-200/50 bg-gray-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
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
          {/* BASIC TAB */}
          {activeTab === 'basic' && (
            <motion.div
              key="tab-basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  Basic Information
                </h3>
                <p className="text-gray-600">
                  Your fundamental profile details
                </p>
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
                    onChange={(e) =>
                      handleInputChange('name', e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Your Name"
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
                    onChange={(e) =>
                      handleInputChange('email', e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="therapist@ayurmitra.com"
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
                    onChange={(e) =>
                      handleInputChange('phone', e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                    value={formData.experienceYears}
                    onChange={(e) =>
                      handleInputChange(
                        'experienceYears',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                  onChange={(e) =>
                    handleInputChange('bio', e.target.value)
                  }
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Share your expertise, approach to Ayurvedic therapy, and what makes your practice unique..."
                />
              </div>
            </motion.div>
          )}

          {/* PROFESSIONAL TAB */}
          {activeTab === 'professional' && (
            <motion.div
              key="tab-professional"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  Professional Details
                </h3>
                <p className="text-gray-600">
                  Your therapy specializations and expertise
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Heart className="w-4 h-4" />
                  <span>Therapy Specializations</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializations.map((spec) => (
                    <label
                      key={spec}
                      className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.specialization.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              specialization: [
                                ...prev.specialization,
                                spec
                              ]
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              specialization: prev.specialization.filter(
                                (s) => s !== spec
                              )
                            }));
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium">
                        {spec}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CERTIFICATIONS TAB (read-only) */}
          {activeTab === 'certifications' && (
            <motion.div
              key="tab-certifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  Certifications
                </h3>
                <p className="text-gray-600">
                  Your professional certifications (managed by admin)
                </p>
              </div>

              <div className="space-y-4">
                {formData.certifications.map((cert, index) => (
                  <div
                    key={`${cert.therapy}-${index}`}
                    className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-purple-900">
                          {cert.therapy}
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          {cert.level} • {cert.experienceYears || 0} years
                          experience
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                ))}
                {formData.certifications.length === 0 && (
                  <div className="text-center py-12 bg-purple-50 rounded-xl border-2 border-dashed border-purple-300">
                    <Award className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-purple-600 font-medium">
                      No certifications added yet
                    </p>
                    <p className="text-sm text-purple-500 mt-2">
                      Contact your administrator to add certifications
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === 'availability' && (
            <motion.div
              key="tab-availability"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  Availability Settings
                </h3>
                <p className="text-gray-600">
                  Select working days, hours and session duration.
                  Time slots will be auto-generated and saved to your schedule.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50 space-y-6">
                <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Working Hours & Schedule
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) =>
                        handleWorkingHoursChange('start', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) =>
                        handleWorkingHoursChange('end', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">
                      Session Duration
                    </label>
                    <select
                      value={formData.sessionDuration}
                      onChange={(e) =>
                        handleInputChange(
                          'sessionDuration',
                          parseInt(e.target.value, 10) || 60
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">
                      Gap Between Slots
                    </label>
                    <select
                      value={formData.slotGapMinutes}
                      onChange={(e) =>
                        handleInputChange(
                          'slotGapMinutes',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value={0}>No gap</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-blue-700">
                      Maximum Patients Per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.maxPatientsPerDay}
                      onChange={(e) =>
                        handleInputChange(
                          'maxPatientsPerDay',
                          parseInt(e.target.value, 10) || 8
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <label className="block text-sm font-semibold text-blue-700">
                    Working Days
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all text-sm font-medium ${
                          formData.workingDays.includes(day)
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-blue-200 hover:border-blue-300 text-blue-700 bg-white'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs text-blue-700">
                  Example: 00:00–12:00 with 90 minute sessions and 30 minute
                  gap generates slots 00:00–01:30, 02:00–03:30, 04:00–05:30,
                  06:00–07:30, 08:00–09:30, 10:00–11:30 for each working day,
                  matching the availability schema you shared.
                </p>
              </div>
            </motion.div>
          )}

          {/* SUBMIT */}
          <motion.div
            className="pt-8 border-t border-gray-200 mt-8"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>
                    {activeTab === 'availability'
                      ? 'Updating Availability...'
                      : 'Updating Your Profile...'}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span>
                    {activeTab === 'availability'
                      ? 'Save Availability'
                      : 'Update Profile'}
                  </span>
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default TherapistProfileSettings;
