/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft, Star, MapPin, Clock, Award,
  Phone, Mail, Calendar, CheckCircle,
  Users, BookOpen, Heart, Loader2, X,
  ChevronLeft, ChevronRight, User, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// API Configuration - safe access to environment variables
const getEnvVar = (key, defaultValue) => {
  const value = import.meta.env?.[key];
  if (!value && defaultValue) {
    console.warn(`Environment variable ${key} not found, using default: ${defaultValue}`);
  }
  return value || defaultValue;
};

const API_CONFIG = {
  baseURL: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3003/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create axios instance with config
const apiClient = axios.create(API_CONFIG);

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generate mock data for doctor details fallback
const generateMockData = (doctorId, doctorName) => {
  return {
    _id: doctorId || 'mock-id',
    name: doctorName || 'Doctor',
    location: 'Not specified',
    specializations: ['Ayurvedic Medicine'],
    consultationSettings: {
      availability: {
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        workingHours: { start: "09:00", end: "17:00" },
        consultationDuration: 30
      },
      fees: {
        videoConsultation: 500,
        inPersonConsultation: 800,
        followUpConsultation: 300
      },
      preferences: {
        languages: ["english", "hindi"]
      }
    },
    metrics: {
      averageRating: 4.5,
      totalPatients: 150,
      totalReviews: 45,
      successRate: 90,
      patientSatisfactionScore: 9.2
    },
    experience: { totalYears: 8 },
    professionalInfo: {
      bio: `Dr. ${doctorName || 'Doctor'} is a dedicated Ayurvedic practitioner with extensive experience in holistic healthcare and patient wellness.`
    },
    qualifications: {
      bams: {
        degree: "Bachelor of Ayurvedic Medicine and Surgery (BAMS)",
        university: "Rajiv Gandhi University of Health Sciences",
        yearOfCompletion: 2016
      }
    }
  };
};

export default function DoctorDetails({ doctor, onBack, onSchedule, quickAppointmentData }) {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState('confirm'); // 'confirm' or 'schedule'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [alternativeSlots, setAlternativeSlots] = useState([]);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  const doctorId = doctor?.doctorId;

  const fetchDoctorDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Real API call to get doctor details
      const response = await apiClient.get(`/users/${doctor.doctorId}`);

      if (response.data && response.data.success) {
        // Transform backend user data to expected format
        const userData = response.data.data;
        const transformedData = {
          _id: userData._id,
          name: userData.name,
          location: userData.address?.city || doctor.location,
          specializations: userData.profile?.specializations || [doctor.speciality],
          consultationSettings: {
            availability: {
              workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
              workingHours: { start: "09:00", end: "17:00" },
              consultationDuration: 30
            },
            fees: {
              videoConsultation: 500,
              inPersonConsultation: 800,
              followUpConsultation: 300
            },
            preferences: {
              languages: ["english", "hindi"]
            }
          },
          metrics: {
            averageRating: 4.5,
            totalPatients: 150,
            totalReviews: 45,
            successRate: 90,
            patientSatisfactionScore: 9.2
          },
          experience: { totalYears: 8 },
          professionalInfo: {
            bio: `Dr. ${userData.name} is a dedicated Ayurvedic practitioner with extensive experience in holistic healthcare and patient wellness.`
          },
          qualifications: {
            bams: {
              degree: "Bachelor of Ayurvedic Medicine and Surgery (BAMS)",
              university: "Rajiv Gandhi University of Health Sciences",
              yearOfCompletion: 2016
            }
          }
        };
        setDoctorData(transformedData);
      } else {
        // Fallback to mock data if API fails
        const mockData = generateMockData(doctor.doctorId, doctor.name);
        setDoctorData(mockData);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching doctor details:", err);
      // Use mock data as fallback
      const mockData = generateMockData(doctor.doctorId, doctor.name);
      setDoctorData(mockData);
      setLoading(false);
    }
  }, [doctor.doctorId, doctor.location, doctor.speciality, doctor.name]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId, fetchDoctorDetails]);



  const fetchAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true);
      const response = await apiClient.get(`/booking/provider/${doctor.doctorId}/bookings`, {
        params: { date: date.toISOString().split('T')[0] }
      });

      // Generate available slots based on doctor's working hours and existing bookings
      const workingHours = doctorData?.consultationSettings?.availability?.workingHours || { start: "09:00", end: "17:00" };
      const duration = doctorData?.consultationSettings?.availability?.consultationDuration || 30;
      const existingBookings = response.data?.data?.bookings || [];

      const slots = generateTimeSlots(workingHours, duration, existingBookings);
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      // Generate mock slots as fallback
      const mockSlots = [
        { startTime: "09:00", start: "9:00 AM", end: "9:30 AM", available: true },
        { startTime: "10:00", start: "10:00 AM", end: "10:30 AM", available: true },
        { startTime: "11:30", start: "11:30 AM", end: "12:00 PM", available: true },
        { startTime: "14:00", start: "2:00 PM", end: "2:30 PM", available: true },
        { startTime: "15:30", start: "3:30 PM", end: "4:00 PM", available: false },
        { startTime: "16:00", start: "4:00 PM", end: "4:30 PM", available: true }
      ];
      setAvailableSlots(mockSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateTimeSlots = (workingHours, duration, existingBookings) => {
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + duration;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const adjustedEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
        const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;

        const isBooked = existingBookings.some(booking => {
          const bookingTime = new Date(booking.scheduledAt).toTimeString().slice(0, 5);
          return bookingTime === startTime;
        });

        slots.push({
          startTime,
          start: formatTime(startTime),
          end: formatTime(endTime),
          available: !isBooked
        });
      }
    }

    return slots;
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchAvailableSlots(date);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select both date and time slot');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not authenticated. Please log in to book appointments.');
      return;
    }

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.startTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const bookingData = {
        providerId: doctor.doctorId,
        patientId: userId,
        startTime: appointmentDateTime.toISOString(),
        duration: doctorData?.consultationSettings?.availability?.consultationDuration || 30,
        type: 'in_person',
        providerType: 'doctor',
        fee: doctorData?.consultationSettings?.fees?.inPersonConsultation || 1000,
        sessionType: 'consultation',
        notes: `Quick appointment for: ${quickAppointmentData?.symptoms || 'General consultation'}`
      };

      const response = await apiClient.post('/booking/create', bookingData);

      if (response.data.success) {
        onSchedule({
          ...doctor,
          appointmentDetails: {
            date: selectedDate,
            slot: selectedSlot,
            bookingId: response.data.data.consultationId
          }
        });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Handle slot conflict with alternative slots
        // Backend error structure: err.response.data.error contains the conflict data
        const errorData = err.response.data.error || err.response.data.data || {};
        const alternatives = errorData.suggestedAlternatives || [];

        if (alternatives.length > 0) {
          // Show alternatives modal
          setAlternativeSlots(alternatives);
          setConflictMessage(errorData.alternativeMessage || errorData.conflictInfo?.conflictReason || 'Slot unavailable');
          setShowAlternativesModal(true);
        } else {
          setError(`Slot unavailable: ${errorData.conflictInfo?.conflictReason || errorData.message || 'This time slot is already booked'}`);
          // Refresh slots
          fetchAvailableSlots(selectedDate);
        }
      } else {
        console.error('Booking error:', err);
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to book appointment. Please try again.');
      }
    }
  };

  const formatWorkingDays = (days) => {
    if (!days || days.length === 0) return "Not specified";
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
  };

  const formatLanguages = (languages) => {
    if (!languages || languages.length === 0) return "English";
    return languages.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(", ");
  };

  const handleAlternativeSlotSelect = async (alternativeSlot) => {
    try {
      setShowAlternativesModal(false);
      setError('');

      // Parse the alternative slot date and time
      const altDate = new Date(alternativeSlot.startTime);
      const [hours, minutes] = alternativeSlot.start.split(':');
      const ampm = alternativeSlot.start.includes('PM') && parseInt(hours) !== 12 ? 12 : 0;
      const hour24 = (parseInt(hours) % 12) + ampm;
      altDate.setHours(hour24, parseInt(minutes.split(' ')[0]));

      const bookingData = {
        providerId: doctor.doctorId,
        patientId: localStorage.getItem('userId'),
        startTime: altDate.toISOString(),
        duration: doctorData?.consultationSettings?.availability?.consultationDuration || 30,
        type: 'in_person',
        providerType: 'doctor',
        fee: doctorData?.consultationSettings?.fees?.inPersonConsultation || 1000,
        sessionType: 'consultation',
        notes: `Quick appointment for: ${quickAppointmentData?.symptoms || 'General consultation'}`
      };

      const response = await apiClient.post('/booking/create', bookingData);

      if (response.data.success) {
        onSchedule({
          ...doctor,
          appointmentDetails: {
            date: altDate,
            slot: {
              startTime: alternativeSlot.startTime,
              start: alternativeSlot.start,
              end: alternativeSlot.end
            },
            bookingId: response.data.data.consultationId
          }
        });
      }
    } catch (err) {
      console.error('Error booking alternative slot:', err);
      setError(err.response?.data?.message || 'Failed to book alternative slot. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/40 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-gray-600">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50/40 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={onBack} className="text-emerald-600 hover:text-emerald-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/40">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4">
          <button
            onClick={onBack}
            className="hover:text-emerald-200 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="font-bold text-lg">Doctor Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Doctor Header Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl">
                  {doctor.name?.[0]?.toUpperCase() || "D"}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">Dr. {doctor.name}</h2>
                  <p className="text-emerald-100 font-medium mb-2">
                    {doctorData?.specializations?.join(", ") || doctor.speciality}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{doctorData?.metrics?.averageRating || doctor.rating} Rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{doctorData?.experience?.totalYears || doctor.experience} years</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{doctor.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Total Patients</p>
                    <p className="text-sm">{doctorData?.metrics?.totalPatients || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-sm">{doctorData?.metrics?.successRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Appointment Button */}
            <div className="p-6">
              <motion.button
                onClick={() => setShowBookingFlow(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </motion.button>
            </div>
          </div>

          {/* Short Bio Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              About Dr. {doctor.name}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {doctorData?.professionalInfo?.bio ||
                `Dr. ${doctor.name} is a highly experienced Ayurvedic practitioner with ${doctorData?.experience?.totalYears || doctor.experience} years of dedicated service in holistic healthcare.`}
            </p>
          </div>

          {/* Total Experience */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Professional Experience
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <div>
                  <p className="font-semibold text-emerald-800">Total Experience</p>
                  <p className="text-sm text-emerald-600">Years of Practice</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-700">
                    {doctorData?.experience?.totalYears || 0}
                  </p>
                  <p className="text-sm text-emerald-600">Years</p>
                </div>
              </div>

              {doctorData?.qualifications && (
                <div className="grid grid-cols-1 gap-3">
                  {doctorData.qualifications.bams && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        {doctorData.qualifications.bams.degree} ({doctorData.qualifications.bams.yearOfCompletion})
                      </span>
                    </div>
                  )}
                  {doctorData.qualifications.postGraduation && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        {doctorData.qualifications.postGraduation.degree} - {doctorData.qualifications.postGraduation.specialization}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Availability
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="font-medium text-emerald-800 mb-2">Working Days</p>
                <p className="text-sm text-emerald-700">
                  {formatWorkingDays(doctorData?.consultationSettings?.availability?.workingDays)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700 text-sm">Working Hours</p>
                  <p className="text-sm text-gray-600">
                    {doctorData?.consultationSettings?.availability?.workingHours?.start || "09:00"} -
                    {doctorData?.consultationSettings?.availability?.workingHours?.end || "17:00"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700 text-sm">Session Duration</p>
                  <p className="text-sm text-gray-600">
                    {doctorData?.consultationSettings?.availability?.consultationDuration || 30} minutes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Feedback */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
            <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Consultation Feedback
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-emerald-700">Average Rating</p>
                <p className="text-emerald-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  {doctorData?.metrics?.averageRating || "4.5"}/5
                </p>
              </div>
              <div>
                <p className="font-medium text-emerald-700">Total Reviews</p>
                <p className="text-emerald-600">{doctorData?.metrics?.totalReviews || 0} reviews</p>
              </div>
              <div>
                <p className="font-medium text-emerald-700">Patient Satisfaction</p>
                <p className="text-emerald-600">{doctorData?.metrics?.patientSatisfactionScore || "9.0"}/10</p>
              </div>
              <div>
                <p className="font-medium text-emerald-700">Languages</p>
                <p className="text-emerald-600">
                  {formatLanguages(doctorData?.consultationSettings?.preferences?.languages)}
                </p>
              </div>
            </div>

            {/* Consultation Fees */}
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <p className="font-medium text-emerald-700 mb-2">Consultation Fees</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded">
                  <p className="font-medium">Video</p>
                  <p className="text-emerald-600">₹{doctorData?.consultationSettings?.fees?.videoConsultation || 600}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="font-medium">In-Person</p>
                  <p className="text-emerald-600">₹{doctorData?.consultationSettings?.fees?.inPersonConsultation || 1000}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="font-medium">Follow-up</p>
                  <p className="text-emerald-600">₹{doctorData?.consultationSettings?.fees?.followUpConsultation || 400}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Booking Flow Modal */}
      <AnimatePresence>
        {showBookingFlow && (
          <BookingFlowModal
            doctor={doctor}
            doctorData={doctorData}
            quickAppointmentData={quickAppointmentData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
            onDateSelect={handleDateSelect}
            onSlotSelect={setSelectedSlot}
            onBook={handleBookAppointment}
            onClose={() => {
              setShowBookingFlow(false);
              setCurrentStep('confirm');
              setSelectedDate(null);
              setSelectedSlot(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Alternative Slots Modal */}
      <AnimatePresence>
        {showAlternativesModal && (
          <AlternativeSlotsModal
            conflictMessage={conflictMessage}
            alternativeSlots={alternativeSlots}
            onSelect={handleAlternativeSlotSelect}
            onClose={() => {
              setShowAlternativesModal(false);
              setAlternativeSlots([]);
              setConflictMessage('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Booking Flow Modal Component
function BookingFlowModal({
  doctor,
  doctorData,
  quickAppointmentData,
  currentStep,
  setCurrentStep,
  selectedDate,
  selectedSlot,
  availableSlots,
  loadingSlots,
  onDateSelect,
  onSlotSelect,
  onBook,
  onClose
}) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {currentStep === 'confirm' ? 'Confirm Details' : 'Select Date & Time'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {currentStep === 'confirm' ? (
            <ConfirmationStep
              doctor={doctor}
              quickAppointmentData={quickAppointmentData}
              onNext={() => setCurrentStep('schedule')}
            />
          ) : (
            <SchedulingStep
              doctor={doctor}
              doctorData={doctorData}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              availableSlots={availableSlots}
              loadingSlots={loadingSlots}
              onDateSelect={onDateSelect}
              onSlotSelect={onSlotSelect}
              onBook={onBook}
              onBack={() => setCurrentStep('confirm')}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Confirmation Step Component
function ConfirmationStep({ doctor, quickAppointmentData, onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Quick Appointment Details</h3>
        <p className="text-gray-600">Please verify your information before scheduling</p>
      </div>

      {/* Doctor Info */}
      <div className="bg-emerald-50 rounded-xl p-4">
        <h4 className="font-semibold text-emerald-800 mb-2">Selected Doctor</h4>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
            {doctor.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">Dr. {doctor.name}</p>
            <p className="text-sm text-gray-600">{doctor.speciality}</p>
          </div>
        </div>
      </div>

      {/* Quick Appointment Data */}
      {quickAppointmentData && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-800 mb-3">Your Information</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Age</p>
              <p className="text-gray-800">{quickAppointmentData.age} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gender</p>
              <p className="text-gray-800 capitalize">{quickAppointmentData.gender}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Symptoms</p>
            <p className="text-gray-800 text-sm bg-white p-3 rounded-lg">
              {quickAppointmentData.symptoms}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Severity</p>
            <p className="text-gray-800 capitalize">
              {quickAppointmentData.severity === 'always' && 'Severe / Constant'}
              {quickAppointmentData.severity === 'often' && 'Moderate / Frequent'}
              {quickAppointmentData.severity === 'sometimes' && 'Mild / Occasional'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
        >
          Proceed to Schedule
        </button>
      </div>
    </div>
  );
}

// Scheduling Step Component
function SchedulingStep({
  doctor,
  doctorData,
  selectedDate,
  selectedSlot,
  availableSlots,
  loadingSlots,
  onDateSelect,
  onSlotSelect,
  onBook,
  onBack
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateAvailable = (date) => {
    const dayOfWeek = date.getDay();
    const workingDays = doctorData?.consultationSettings?.availability?.workingDays ||
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return workingDays.includes(dayNames[dayOfWeek]) && date >= today;
  };

  const renderCalendar = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isAvailable = isDateAvailable(date);
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;

      days.push(
        <button
          key={day}
          onClick={() => isAvailable && onDateSelect(date)}
          disabled={!isAvailable}
          className={`p-2 text-sm rounded-lg transition-colors ${isSelected
            ? 'bg-emerald-600 text-white'
            : isAvailable
              ? 'hover:bg-emerald-100 text-gray-800'
              : 'text-gray-300 cursor-not-allowed'
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  }, [currentMonth, currentYear, selectedDate, doctorData?.consultationSettings?.availability?.workingDays, today]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h3>
        <div className="bg-gray-50 rounded-xl p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                const prevDate = new Date(prevYear, prevMonth, 1);
                const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);

                if (prevDate >= currentDate) {
                  setCurrentMonth(prevMonth);
                  setCurrentYear(prevYear);
                }
              }}
              disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <button
              onClick={() => {
                const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 1);
                const nextDate = new Date(nextYear, nextMonth, 1);

                if (nextDate <= maxDate) {
                  setCurrentMonth(nextMonth);
                  setCurrentYear(nextYear);
                }
              }}
              disabled={currentYear >= today.getFullYear() + 1 && currentMonth >= today.getMonth()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar}
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Time Slot</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            {loadingSlots ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-gray-600">Loading available slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No slots available for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    onClick={() => slot.available && onSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${selectedSlot?.startTime === slot.startTime
                      ? 'bg-emerald-600 text-white'
                      : slot.available
                        ? 'bg-white border border-gray-200 hover:bg-emerald-50 text-gray-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {slot.start} - {slot.end}
                    {!slot.available && <div className="text-xs mt-1">Booked</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onBook}
          disabled={!selectedDate || !selectedSlot}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-colors"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
}

// Alternative Slots Modal Component
function AlternativeSlotsModal({ conflictMessage, alternativeSlots, onSelect, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Alternative Time Slots Available</h2>
              <p className="text-white/90 text-sm">{conflictMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Slot Conflict Detected</p>
                <p className="text-sm text-amber-700">
                  The selected time slot is already booked. Please choose one of the alternative slots below.
                </p>
              </div>
            </div>
          </div>

          {alternativeSlots.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No alternative slots available at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3">
                Suggested Alternatives ({alternativeSlots.length})
              </h3>
              {alternativeSlots.map((slot, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(slot)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-emerald-700">
                            {formatDate(slot.date || slot.startTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.start} - {slot.end}
                          </p>
                        </div>
                      </div>
                      {slot.reason && (
                        <p className="text-xs text-gray-500 ml-13">{slot.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.rank && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                          #{slot.rank}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}