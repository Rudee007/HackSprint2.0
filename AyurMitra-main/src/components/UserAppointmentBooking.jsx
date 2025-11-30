// 🔥 PRODUCTION-READY: Complete Appointment Booking System
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  Video,
  MapPin,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  Languages,
  IndianRupee,
  Stethoscope,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import api from "../utils/api";

// Common symptoms for autocomplete
const COMMON_SYMPTOMS = [
  "Headache", "Fever", "Cough", "Cold", "Body Pain", "Fatigue",
  "Nausea", "Dizziness", "Insomnia", "Anxiety", "Stress",
  "Digestive Issues", "Joint Pain", "Back Pain", "Skin Issues",
  "Weight Loss", "Weight Gain", "Hair Fall", "Acidity"
];

const SEVERITY_LEVELS = [
  { value: "mild", label: "Mild", description: "Minor discomfort, manageable" },
  { value: "moderate", label: "Moderate", description: "Noticeable impact on daily activities" },
  { value: "severe", label: "Severe", description: "Significant disruption, urgent care needed" }
];

const CONSULTATION_TYPES = [
  { 
    value: "video", 
    label: "Video Call", 
    icon: Video, 
    description: "Face-to-face consultation via video" 
  },
  { 
    value: "audio", 
    label: "Audio Call", 
    icon: Phone, 
    description: "Voice-only consultation" 
  },
  { 
    value: "in_person", 
    label: "In-Person", 
    icon: MapPin, 
    description: "Visit clinic physically" 
  }
];

export default function AppointmentBooking({ user, onBookingComplete, onBack }) {
  /* ──────────────────── State Management ──────────────────── */
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Step 1: Patient Info & Symptoms
  const [formData, setFormData] = useState({
    age: user?.age || "",
    gender: user?.gender || "",
    phone: user?.phone || "",
    symptoms: [],
    symptomInput: "",
    severity: "moderate",
    consultationType: "video",
    notes: ""
  });
  
  // Step 2: Doctor Recommendations
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Step 3: Slot Selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Step 4: Confirmation
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Form validation
  const [errors, setErrors] = useState({});

  /* ───────────── Step Navigation ─────────── */
  const steps = [
    { number: 1, title: "Symptoms", icon: Stethoscope },
    { number: 2, title: "Doctor", icon: UserIcon },
    { number: 3, title: "Schedule", icon: Calendar },
    { number: 4, title: "Confirm", icon: CheckCircle }
  ];

  const canProceedToStep2 = () => {
    return formData.age && formData.gender && formData.symptoms.length > 0;
  };

  const canProceedToStep3 = () => {
    return selectedDoctor !== null;
  };

  const canProceedToStep4 = () => {
    return selectedDate && selectedSlot;
  };

  /* ───────────── Step 1: Handle Symptoms Input ─────────── */
  const handleSymptomInputChange = (value) => {
    setFormData(prev => ({ ...prev, symptomInput: value }));
  };

  const addSymptom = (symptom) => {
    if (symptom && !formData.symptoms.includes(symptom)) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptom],
        symptomInput: ""
      }));
    }
  };

  const removeSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const getFilteredSymptoms = () => {
    if (!formData.symptomInput) return [];
    return COMMON_SYMPTOMS.filter(s => 
      s.toLowerCase().includes(formData.symptomInput.toLowerCase()) &&
      !formData.symptoms.includes(s)
    );
  };

  /* ───────────── Step 2: Get Doctor Recommendations ─────────── */
  const fetchDoctorRecommendations = async () => {
    setLoading(true);
    setError("");
    setDoctors([]);

    try {
      const payload = {
        age: parseInt(formData.age),
        gender: formData.gender,
        symptoms: formData.symptoms.join(", ").toLowerCase(),
        severity: formData.severity
      };

      // Call ML API for recommendations
      const { data } = await axios.post("http://127.0.0.1:8000/recommend", payload);
      
      const recommendedDoctors = data?.doctors || data?.data?.doctors || 
                                 data?.recommendations?.[0]?.doctors || [];
      
      if (recommendedDoctors.length === 0) {
        setError("No doctors found matching your symptoms. Please try different symptoms.");
      } else {
        setDoctors(recommendedDoctors);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error("Doctor recommendation error:", err);
      setError("Failed to get doctor recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ───────────── Step 3: Fetch Available Slots ─────────── */
  const fetchAvailableSlots = async (date) => {
    if (!selectedDoctor) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      const formattedDate = date.toISOString().split('T')[0];
      
      const { data } = await api.get(
        `/scheduling/providers/${selectedDoctor.doctorId}/availability`,
        { 
          params: { 
            date: formattedDate,
            therapyType: "consultation"
          }
        }
      );

      if (data.success && data.data?.slots) {
        setAvailableSlots(data.data.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Failed to load available slots. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate next 30 days for date picker
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  /* ───────────── Step 4: Confirm Booking ─────────── */
  const confirmBooking = async () => {
    setLoading(true);
    setError("");

    try {
      const bookingPayload = {
        patientId: user?.id || user?._id,
        providerId: selectedDoctor.doctorId,
        startTime: selectedSlot.startTime,
        duration: 30,
        type: formData.consultationType,
        providerType: "doctor",
        fee: selectedDoctor.fee || 1500,
        sessionType: "consultation",
        meetingLink: formData.consultationType !== "in_person" ? "" : undefined,
        notes: formData.notes,
        symptoms: formData.symptoms.join(", "),
        severity: formData.severity
      };

      const { data } = await api.post("/bookings", bookingPayload);

      if (data.success) {
        setBookingDetails(data.data);
        setBookingSuccess(true);
        
        // Call parent callback after 2 seconds
        setTimeout(() => {
          if (onBookingComplete) {
            onBookingComplete(data.data);
          }
        }, 2000);
      } else {
        setError("Failed to confirm booking. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      
      if (err.response?.status === 409) {
        setError("This time slot is no longer available. Please select another slot.");
        setCurrentStep(3);
        fetchAvailableSlots(selectedDate);
      } else {
        setError("Failed to book appointment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────  Render Functions  ───────────────── */
  
  // Step 1: Patient Information & Symptoms
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Tell us about your health
        </h2>
        <p className="text-gray-600">
          Share your symptoms so we can recommend the right specialist
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Enter age"
            min="1"
            max="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="Contact number"
          />
        </div>
      </div>

      {/* Symptoms Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Symptoms * (Select at least one)
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.symptomInput}
              onChange={(e) => handleSymptomInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && formData.symptomInput) {
                  e.preventDefault();
                  addSymptom(formData.symptomInput);
                }
              }}
              className="flex-1 outline-none"
              placeholder="Type or search symptoms..."
            />
          </div>

          {/* Autocomplete Dropdown */}
          {formData.symptomInput && getFilteredSymptoms().length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {getFilteredSymptoms().map((symptom, index) => (
                <button
                  key={index}
                  onClick={() => addSymptom(symptom)}
                  className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors"
                >
                  {symptom}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Symptoms */}
        {formData.symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.symptoms.map((symptom, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
              >
                {symptom}
                <button
                  onClick={() => removeSymptom(symptom)}
                  className="hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Severity Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Severity Level *
        </label>
        <div className="grid md:grid-cols-3 gap-3">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.severity === level.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
            >
              <div className="font-semibold text-gray-900">{level.label}</div>
              <div className="text-sm text-gray-600 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Consultation Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Consultation Type *
        </label>
        <div className="grid md:grid-cols-3 gap-3">
          {CONSULTATION_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFormData(prev => ({ ...prev, consultationType: type.value }))}
              className={`p-4 border-2 rounded-lg transition-all ${
                formData.consultationType === type.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
            >
              <type.icon className={`w-6 h-6 mb-2 ${
                formData.consultationType === type.value ? "text-emerald-600" : "text-gray-500"
              }`} />
              <div className="font-semibold text-gray-900">{type.label}</div>
              <div className="text-sm text-gray-600 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
          placeholder="Any additional information you'd like to share..."
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchDoctorRecommendations}
          disabled={!canProceedToStep2() || loading}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding Doctors...
            </>
          ) : (
            <>
              Find Doctors
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  // Step 2: Doctor Recommendations
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Recommended Specialists
        </h2>
        <p className="text-gray-600">
          Based on your symptoms, we recommend these Ayurvedic specialists
        </p>
      </div>

      {/* Doctor Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {doctors.map((doctor, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              selectedDoctor?.doctorId === doctor.doctorId
                ? "border-emerald-500 bg-emerald-50 shadow-lg"
                : "border-gray-200 hover:border-emerald-300 hover:shadow-md"
            }`}
            onClick={() => setSelectedDoctor(doctor)}
          >
            {/* Doctor Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {doctor.name?.charAt(0)?.toUpperCase() || "D"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Dr. {doctor.name || "Specialist"}
                  </h3>
                  <p className="text-sm text-gray-600">{doctor.speciality || "Ayurvedic Specialist"}</p>
                </div>
              </div>
              
              {selectedDoctor?.doctorId === doctor.doctorId && (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            {/* Doctor Details */}
            <div className="space-y-2 mb-4">
              {doctor.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{doctor.rating}/5</span>
                  <span className="text-sm text-gray-500">
                    ({doctor.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
              
              {doctor.experience && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="w-4 h-4" />
                  {doctor.experience} years experience
                </div>
              )}
              
              {doctor.languages && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Languages className="w-4 h-4" />
                  {Array.isArray(doctor.languages) 
                    ? doctor.languages.join(", ") 
                    : doctor.languages}
                </div>
              )}
            </div>

            {/* Fee */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consultation Fee</span>
                <span className="text-lg font-bold text-emerald-700">
                  ₹{doctor.fee || 1500}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setCurrentStep(3);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow);
            fetchAvailableSlots(tomorrow);
          }}
          disabled={!canProceedToStep3()}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          View Schedule
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Step 3: Slot Selection
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Date & Time
        </h2>
        <p className="text-gray-600">
          Select a convenient slot for your consultation with Dr. {selectedDoctor?.name}
        </p>
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Date
        </label>
        <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto p-2">
          {getNext30Days().map((date, index) => {
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  fetchAvailableSlots(date);
                }}
                className={`p-3 border-2 rounded-lg transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className={`text-xs ${isToday ? "text-emerald-600 font-semibold" : "text-gray-500"}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Available Time Slots
        </label>
        
        {loadingSlots ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-gray-600">Loading available slots...</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No slots available for this date</p>
            <p className="text-sm text-gray-500 mt-1">Please select another date</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableSlots.map((slot, index) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 border-2 rounded-lg font-medium transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 hover:border-emerald-300 text-gray-700"
                  }`}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-sm">{slot.start}</div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep(2)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep(4)}
          disabled={!canProceedToStep4()}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          Review Booking
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Step 4: Confirmation
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Confirm Your Booking
        </h2>
        <p className="text-gray-600">
          Please review your appointment details before confirming
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 space-y-4">
        {/* Doctor Info */}
        <div className="flex items-center gap-4 pb-4 border-b border-emerald-200">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {selectedDoctor?.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Dr. {selectedDoctor?.name}
            </h3>
            <p className="text-sm text-gray-600">{selectedDoctor?.speciality}</p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Date & Time</div>
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              {selectedDate?.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-2 font-semibold text-gray-900 mt-1">
              <Clock className="w-4 h-4 text-emerald-600" />
              {selectedSlot?.start} - {selectedSlot?.end}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Consultation Type</div>
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              {formData.consultationType === 'video' && <Video className="w-4 h-4 text-emerald-600" />}
              {formData.consultationType === 'audio' && <Phone className="w-4 h-4 text-emerald-600" />}
              {formData.consultationType === 'in_person' && <MapPin className="w-4 h-4 text-emerald-600" />}
              {CONSULTATION_TYPES.find(t => t.value === formData.consultationType)?.label}
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <div className="text-sm text-gray-600 mb-2">Symptoms</div>
          <div className="flex flex-wrap gap-2">
            {formData.symptoms.map((symptom, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-emerald-700 rounded-full text-sm font-medium"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {/* Fee */}
        <div className="pt-4 border-t border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="text-2xl font-bold text-emerald-700">
              ₹{selectedDoctor?.fee || 1500}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep(3)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={confirmBooking}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Confirm Booking
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  // Success Screen
  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-emerald-600" />
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Booking Confirmed! 🎉
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Your appointment has been successfully scheduled
      </p>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 max-w-md mx-auto mb-8">
        <div className="text-sm text-gray-600 mb-2">Appointment with</div>
        <div className="text-xl font-bold text-gray-900 mb-4">
          Dr. {selectedDoctor?.name}
        </div>
        
        <div className="flex items-center justify-center gap-4 text-emerald-700 font-semibold">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {selectedDate?.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedSlot?.start}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (onBack) onBack();
        }}
        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
      >
        Back to Dashboard
      </motion.button>
    </motion.div>
  );

  /* ────────────────  Main Render  ───────────────── */
  if (bookingSuccess) {
    return (
      <div className="max-w-4xl mx-auto">
        {renderSuccess()}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {onBack && !bookingSuccess && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step.number
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-2">
                  {step.title}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    currentStep > step.number ? "bg-emerald-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </AnimatePresence>
      </div>
    </div>
  );
}
