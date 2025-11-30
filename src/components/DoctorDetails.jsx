/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Star, MapPin, Clock, Award, 
  Phone, Mail, Calendar, CheckCircle, 
  Users, BookOpen, Heart, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// API Configuration - safe access to environment variables
const getEnvVar = (key, defaultValue) => {
  try {
    return process?.env?.[key] || defaultValue;
  } catch {
    return defaultValue;
  }
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

export default function DoctorDetails({ doctor, onBack, onSchedule }) {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const timeSlots = [
    "09:00 AM - 10:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "03:00 PM - 04:00 PM",
    "05:00 PM - 06:00 PM",
  ];

  useEffect(() => {
    if (doctor?.doctorId) {
      fetchDoctorDetails();
    }
  }, [doctor?.doctorId]);

  // Generate unique mock data for each doctor
  const generateMockData = (doctorId, doctorName) => {
    const hash = doctorId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const specializations = [
      ["Panchakarma", "Lifestyle Disorders", "Stress & Mental Health"],
      ["Ayurvedic Cardiology", "Diabetes Management", "Hypertension Care"],
      ["Women's Health", "Fertility Treatment", "Prenatal Care"],
      ["Digestive Disorders", "IBS Treatment", "Liver Care"],
      ["Skin & Hair Care", "Dermatology", "Cosmetic Ayurveda"]
    ];
    
    const universities = [
      "Rajiv Gandhi University of Health Sciences",
      "Gujarat Ayurved University", 
      "Banaras Hindu University",
      "Jamia Hamdard University",
      "National Institute of Ayurveda"
    ];
    
    const workingDaysOptions = [
      ["monday", "tuesday", "wednesday", "thursday", "friday"],
      ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      ["monday", "wednesday", "friday", "saturday", "sunday"]
    ];
    
    const languageOptions = [
      ["english", "hindi", "marathi"],
      ["english", "hindi", "gujarati"],
      ["english", "tamil", "telugu"],
      ["english", "hindi", "bengali"],
      ["english", "kannada", "hindi"]
    ];
    
    const idx = Math.abs(hash) % specializations.length;
    const experience = 3 + (Math.abs(hash) % 15);
    const rating = 4.2 + (Math.abs(hash) % 8) / 10;
    const patients = 100 + (Math.abs(hash) % 300);
    const reviews = 20 + (Math.abs(hash) % 80);
    
    return {
      specializations: specializations[idx],
      experience: { totalYears: experience },
      metrics: {
        averageRating: Math.round(rating * 10) / 10,
        totalPatients: patients,
        totalReviews: reviews,
        successRate: 85 + (Math.abs(hash) % 15),
        patientSatisfactionScore: 8.5 + (Math.abs(hash) % 15) / 10
      },
      professionalInfo: {
        bio: `Dr. ${doctorName} is a dedicated Ayurvedic practitioner with ${experience} years of experience specializing in ${specializations[idx][0]} and holistic wellness. Known for personalized treatment approaches and excellent patient care.`
      },
      qualifications: {
        bams: {
          degree: "Bachelor of Ayurvedic Medicine and Surgery (BAMS)",
          university: universities[idx],
          yearOfCompletion: 2024 - experience - 2
        },
        postGraduation: experience > 5 ? {
          degree: "MD (Ayurveda)",
          specialization: specializations[idx][0],
          university: universities[(idx + 1) % universities.length],
          yearOfCompletion: 2024 - experience + 3
        } : null
      },
      consultationSettings: {
        availability: {
          workingDays: workingDaysOptions[idx % workingDaysOptions.length],
          workingHours: { 
            start: idx % 2 === 0 ? "09:00" : "10:00", 
            end: idx % 2 === 0 ? "17:00" : "18:00" 
          },
          consultationDuration: 30 + (idx % 3) * 15
        },
        fees: {
          videoConsultation: 500 + (Math.abs(hash) % 500),
          inPersonConsultation: 800 + (Math.abs(hash) % 700),
          followUpConsultation: 300 + (Math.abs(hash) % 300)
        },
        preferences: {
          languages: languageOptions[idx % languageOptions.length]
        }
      }
    };
  };

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      
      // API Configuration - Update this when you get the endpoint
      const API_BASE_URL = getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3003/api');
      const USE_MOCK_DATA = !getEnvVar('REACT_APP_API_BASE_URL', null);
      
      if (USE_MOCK_DATA) {
        // Generate unique mock data for each doctor
        setTimeout(() => {
          const mockData = generateMockData(doctor.doctorId, doctor.name);
          setDoctorData(mockData);
          setLoading(false);
        }, 1000);
      } else {
        // Real API call - this will work when you have the endpoint
        const response = await apiClient.get(`/doctors/${doctor.doctorId}`);
        setDoctorData(response.data);
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to load doctor details");
      console.error("Error fetching doctor details:", err);
      setLoading(false);
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

            {/* Schedule Button and Time Slots */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {!showTimeSlots ? (
                  <motion.button
                    key="schedule-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowTimeSlots(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Appointment
                  </motion.button>
                ) : (
                  <motion.div
                    key="time-slots"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4 pt-4 border-t border-gray-100"
                  >
                    <h3 className="text-lg font-bold text-gray-800 text-center flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      Select a Time Slot
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {timeSlots.map((slot, index) => (
                        <motion.button
                          key={slot}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 border-2 ${
                            selectedSlot === slot
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105"
                              : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                        >
                          {slot}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: timeSlots.length * 0.05 }}
                      onClick={() => {
                        if (selectedSlot) {
                          onSchedule({ ...doctor, selectedSlot });
                        }
                      }}
                      disabled={!selectedSlot}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Book Now
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
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
    </div>
  );
}