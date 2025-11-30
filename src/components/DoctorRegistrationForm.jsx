import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, GraduationCap, Calendar, 
  DollarSign, Languages, CheckCircle, AlertCircle, 
  Loader2, ArrowRight, Clock
} from 'lucide-react';
import axios from 'axios';

const DoctorRegistrationForm = () => {
  const navigate = useNavigate();

  
  // Form state
  const [formState, setFormState] = useState({
    loading: false,
    error: '',
    success: ''
  });

  const [formData, setFormData] = useState({
    degree: '',
    university: '',
    graduationYear: '',
    specializations: [],
    totalExperience: '',
    videoConsultationFee: '',
    inPersonConsultationFee: '',
    availableDays: [],
    startTime: '09:00',
    endTime: '17:00',
    consultationDuration: '30',
    languages: [],
    maxPatientsPerDay: '20',
    bio: ''
  });

  const CONFIG = {
    API_URL: 'http://localhost:3003/api/doctors/register',
    specializations: [
      'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra',
      'Kaumarabhritya', 'Agadatantra', 'Rasayana', 'Vajikarana',
      'Bhutavidya', 'Vata Disorders', 'Pitta Disorders', 'Kapha Disorders',
      'General Ayurveda'
    ],
    languages: [
      'english', 'hindi', 'bengali', 'tamil', 'telugu', 'marathi', 'gujarati'
    ],
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  };

  // Input handlers
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formState.error) {
      setFormState(prev => ({ ...prev, error: '' }));
    }
  }, [formState.error]);

  const handleArrayChange = useCallback((field, value) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const isSelected = currentArray.includes(value);
      const newArray = isSelected 
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [field]: newArray };
    });
  }, []);

  // Enhanced validation
  const validateForm = () => {
    const requiredFields = [
      'degree', 'university', 'graduationYear', 'totalExperience', 'videoConsultationFee'
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        setFormState(prev => ({ 
          ...prev, 
          error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` 
        }));
        return false;
      }
    }

    const currentYear = new Date().getFullYear();
    const gradYear = parseInt(formData.graduationYear);
    if (gradYear < 1980 || gradYear > currentYear) {
      setFormState(prev => ({ ...prev, error: 'Please enter a valid graduation year' }));
      return false;
    }

    if (formData.startTime >= formData.endTime) {
      setFormState(prev => ({ ...prev, error: 'End time must be after start time' }));
      return false;
    }

    if (formData.availableDays.length === 0) {
      setFormState(prev => ({ ...prev, error: 'Please select at least one available day' }));
      return false;
    }

    if (formData.languages.length === 0) {
      setFormState(prev => ({ ...prev, error: 'Please select at least one language' }));
      return false;
    }

    // Additional validation for fees
    const videoFee = parseInt(formData.videoConsultationFee);
    if (videoFee < 50 || videoFee > 5000) {
      setFormState(prev => ({ ...prev, error: 'Video consultation fee must be between ₹50 and ₹5000' }));
      return false;
    }

    return true;
  };

  // Transform data for API (matches backend controller expectations)
  const transformFormData = () => ({
    qualifications: {
      bams: {
        degree: formData.degree.trim(),
        university: formData.university.trim(),
        yearOfCompletion: parseInt(formData.graduationYear)
      }
    },
    specializations: formData.specializations,
    experience: {
      totalYears: parseInt(formData.totalExperience)
    },
    consultationSettings: {
      fees: {
        videoConsultation: parseInt(formData.videoConsultationFee),
        inPersonConsultation: parseInt(formData.inPersonConsultationFee) || parseInt(formData.videoConsultationFee) + 200,
        followUpConsultation: Math.max(parseInt(formData.videoConsultationFee) - 100, 100)
      },
      availability: {
        workingDays: formData.availableDays,
        workingHours: {
          start: formData.startTime,
          end: formData.endTime
        },
        consultationDuration: parseInt(formData.consultationDuration)
      },
      preferences: {
        languages: formData.languages,
        maxPatientsPerDay: parseInt(formData.maxPatientsPerDay)
      }
    },
    professionalInfo: {
      bio: formData.bio.trim()
    }
  });

  // ✅ FIXED Handle submit - works with backend controller
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setFormState({ loading: true, error: '', success: '' });
  
    try {
      // ✅ Get authentication data from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('accessToken');
  
      console.log("🟢 LocalStorage user:", user);
      console.log("🟢 LocalStorage token:", token ? 'Present' : 'Missing');
      


try {
  const tokenPayload = JSON.parse(atob(token.split('.')[1]));
  console.log('🔍 Token payload:', tokenPayload);
  console.log('🔍 Token user ID:', tokenPayload.id);
  console.log('🔍 Token expiry:', new Date(tokenPayload.exp * 1000));
  console.log('🔍 Is expired?', Date.now() >= (tokenPayload.exp * 1000));
} catch (e) {
  console.error('❌ Error decoding token:', e);
}

      // ✅ FIXED: Check user._id instead of user.id
      if (!user || !user.id || !user.role || user.role !== 'doctor') {
        setFormState({
          loading: false,
          error: 'You must be logged in as a doctor to register.',
          success: ''
        });
        return;
      }

      if (!token) {
        setFormState({
          loading: false,
          error: 'No authentication token found. Please log in again.',
          success: ''
        });
        return;
      }

      // ✅ Validate token expiry
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() >= (tokenPayload.exp * 1000);
        
        console.log("🟢 Token expires:", new Date(tokenPayload.exp * 1000));
        console.log("🟢 Is expired?", isExpired);
        
        if (isExpired) {
          setFormState({
            loading: false,
            error: 'Your session has expired. Please log in again.',
            success: ''
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
      } catch (tokenError) {
        console.error("❌ Token validation error:", tokenError);
        setFormState({
          loading: false,
          error: 'Invalid authentication token. Please log in again.',
          success: ''
        });
        return;
      }

      const payload = transformFormData();
      console.log("🟢 Payload being sent:", payload);
      console.log("🟢 User ID from localStorage:", user._id);
      console.log("🟢 User role from localStorage:", user.role);
  
      // ✅ Send request with proper Authorization header
      const response = await axios.post(CONFIG.API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
  
      console.log("🟢 API Response:", response.data);
  
      // ✅ Handle successful response
      if (response.data.success) {
        setFormState({
          loading: false,
          success: 'Registration completed successfully! Redirecting...',
          error: ''
        });
        
        // Store doctor profile info if needed
        if (response.data.data?.doctor) {
          localStorage.setItem('doctorProfile', JSON.stringify(response.data.data.doctor));
        }
        
        setTimeout(() => {
          navigate('/doctor-dashboard', { 
            state: { 
              message: 'Welcome! Your profile has been registered successfully.',
              isNewRegistration: true,
              doctorId: response.data.data?.doctor?.id
            }
          });
        }, 1500);
      } else {
        setFormState({
          loading: false,
          error: response.data.error?.message || 'Registration failed. Please try again.',
          success: ''
        });
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
  
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response) {
        console.error("❌ Backend response:", err.response.data);
        const { status, data } = err.response;
        
        // ✅ Enhanced error handling matching backend controller
        switch (status) {
          case 400: 
            if (data.error?.code === 'VALIDATION_ERROR') {
              errorMessage = 'Please check your inputs and try again.';
              if (data.error?.details && data.error.details.length > 0) {
                errorMessage = data.error.details[0].msg || errorMessage;
              }
            } else if (data.error?.code === 'MISSING_REQUIRED_FIELD') {
              errorMessage = data.error.message;
            } else {
              errorMessage = data.error?.message || 'Invalid data provided. Please check your inputs.';
            }
            break;
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setTimeout(() => navigate('/login'), 2000);
            break;
          case 403: 
            errorMessage = 'You do not have permission to register as a doctor.'; 
            break;
          case 409: 
            errorMessage = 'Doctor profile already exists for this user.'; 
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default: 
            errorMessage = data.error?.message || data.message || errorMessage;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
  
      setFormState({ loading: false, error: errorMessage, success: '' });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Your Doctor Profile</h1>
          <p className="text-gray-600 text-lg">Add your professional details to start accepting patients</p>
        </header>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          
          {/* Status Messages */}
          {formState.success && (
            <div className="mb-8 flex items-start space-x-3 bg-green-50 border border-green-200 rounded-xl p-6">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900">Success!</h4>
                <p className="text-green-800">{formState.success}</p>
              </div>
            </div>
          )}

          {formState.error && (
            <div className="mb-8 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl p-6">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-red-800">{formState.error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Qualifications */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3 pb-2 border-b border-gray-200">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Professional Qualifications
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree *
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => handleChange('degree', e.target.value)}
                    placeholder="BAMS, MD (Ayurveda), etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={formState.loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University *
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleChange('university', e.target.value)}
                    placeholder="University name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={formState.loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year *
                  </label>
                  <input
                    type="number"
                    value={formData.graduationYear}
                    onChange={(e) => handleChange('graduationYear', e.target.value)}
                    placeholder="2020"
                    min="1980"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={formState.loading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    value={formData.totalExperience}
                    onChange={(e) => handleChange('totalExperience', e.target.value)}
                    placeholder="5"
                    min="0"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={formState.loading}
                  />
                </div>
              </div>
            </section>

            {/* Specializations */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Specializations
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CONFIG.specializations.map(specialization => (
                  <label key={specialization} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(specialization)}
                      onChange={() => handleArrayChange('specializations', specialization)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                      disabled={formState.loading}
                    />
                    <span className="text-sm text-gray-700 select-none">{specialization}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Consultation Fees */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3 pb-2 border-b border-gray-200">
                <DollarSign className="w-6 h-6 text-green-600" />
                Consultation Fees
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.videoConsultationFee}
                    onChange={(e) => handleChange('videoConsultationFee', e.target.value)}
                    placeholder="500"
                    min="50"
                    max="5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    disabled={formState.loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee must be between ₹50 and ₹5000</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    In-Person Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.inPersonConsultationFee}
                    onChange={(e) => handleChange('inPersonConsultationFee', e.target.value)}
                    placeholder="700"
                    min="0"
                    max="10000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={formState.loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">If not specified, will be set to video fee + ₹200</p>
                </div>
              </div>
            </section>

            {/* Availability */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3 pb-2 border-b border-gray-200">
                <Clock className="w-6 h-6 text-purple-600" />
                Availability Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={formState.loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={formState.loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Duration (minutes)
                  </label>
                  <select
                    value={formData.consultationDuration}
                    onChange={(e) => handleChange('consultationDuration', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={formState.loading}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Available Days */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Available Days *
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONFIG.days.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.availableDays.includes(day)}
                      onChange={() => handleArrayChange('availableDays', day)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                      disabled={formState.loading}
                    />
                    <span className="text-sm text-gray-700 select-none capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Languages className="w-5 h-5 text-orange-600" />
                Languages Spoken *
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CONFIG.languages.map(language => (
                  <label key={language} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={() => handleArrayChange('languages', language)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                      disabled={formState.loading}
                    />
                    <span className="text-sm text-gray-700 select-none capitalize">{language}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Patients Per Day
                </label>
                <input
                  type="number"
                  value={formData.maxPatientsPerDay}
                  onChange={(e) => handleChange('maxPatientsPerDay', e.target.value)}
                  placeholder="20"
                  min="1"
                  max="50"
                  className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={formState.loading}
                />
              </div>
            </section>

            {/* Bio */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Professional Bio (Optional)</h3>
              <div className="space-y-2">
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Share your experience, treatment philosophy, and what makes your practice unique..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  disabled={formState.loading}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Help patients understand your expertise</span>
                  <span>{formData.bio.length}/1000 characters</span>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={formState.loading}
                className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {formState.loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Creating Your Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-600">
            🔒 Your information is secure and encrypted
          </p>
          <p className="text-xs text-gray-500">
            Profile will be reviewed for verification before activation
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DoctorRegistrationForm;
