import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Heart, Calendar, Droplets, Activity, Brain, 
  Utensils, Moon, Coffee, Dumbbell, Pill, Plus, X, 
  CheckCircle, AlertCircle, Loader2, Save, Users
} from 'lucide-react';
import axios from 'axios';

const InitialPatientProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Complete profile state matching your schema
  const [profile, setProfile] = useState({
    dateOfBirth: '',
    gender: '',
    constitution: {
      vata: 33,
      pitta: 33,
      kapha: 34
    },
    medicalHistory: [],
    allergies: [],
    symptoms: [],
    dietHabits: '',
    sleepPattern: '',
    stressLevel: 'moderate',
    digestion: '',
    addictions: [],
  });

  // UI state management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Input helpers for dynamic arrays
  const [newInputs, setNewInputs] = useState({
    symptom: '',
    medicalHistory: '',
    allergy: '',
    addiction: '',
    medication: ''
  });

  // ✅ Proper profile completeness validation
  const isProfileComplete = (profileData, userData) => {
    if (!profileData) return false;
    
    // Check basic required fields that might be outside profile object
    if (!userData?.dateOfBirth && !profileData?.dateOfBirth) {
      console.log('Missing dateOfBirth');
      return false;
    }
    
    if (!userData?.gender && !profileData?.gender) {
      console.log('Missing gender');
      return false;
    }
    
    // Check required health fields
    const requiredFields = [
      'dietHabits', 
      'sleepPattern', 
      'stressLevel',
      'digestion', 
    ];
    
    for (const field of requiredFields) {
      if (!profileData[field] || profileData[field].toString().trim().length === 0) {
        console.log(`Missing or empty field: ${field}`);
        return false;
      }
    }
    
    // Must have symptoms (required array)
    if (!Array.isArray(profileData.symptoms) || profileData.symptoms.length === 0) {
      console.log('Missing or empty symptoms array');
      return false;
    }
    
    // Gender-specific validation (if gender is available)
    const userGender = userData?.gender || profileData?.gender;
    if (userGender === 'female') {
      if (!profileData.menstrualHistory || profileData.menstrualHistory.trim().length === 0) {
        console.log('Missing menstrualHistory for female user');
        return false;
      }
    }
    
    return true;
  };

  // Fetch existing profile on component mount// Fetch existing profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          navigate('/login');
          return;
        }

        console.log('Fetching profile with token...');
        
        const response = await axios.get('http://localhost:3003/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Add after fetching the response
console.log('Full API Response:', response.data);
console.log('User Data:', response.data.data?.user);
console.log('Profile Data:', response.data.data?.user?.profile);

// Add in your validation function


        console.log('API Response:', response.data);

        // ✅ Correct data extraction path
        const userData = response.data.data?.user;
        const userProfile = userData?.profile;
        
        console.log('User Data:', userData);
        console.log('User Profile:', userProfile);
        
        // ✅ Proper completeness check
        if (isProfileComplete(userProfile, userData)) {
          console.log('Profile is complete, redirecting to dashboard');
          navigate('/patient-dashboard');
          return;
        }
        
        console.log('Profile is incomplete, showing form');
        
        // Set existing profile data if any
        if (userProfile) {
          setProfile(prev => ({
            ...prev,
            ...userProfile,
            // Add basic info if available at user level
            dateOfBirth: userData.dateOfBirth || userProfile.dateOfBirth || '',
            gender: userData.gender || userProfile.gender || '',
            // Ensure arrays exist
            medicalHistory: userProfile.medicalHistory || [],
            allergies: userProfile.allergies || [],
            symptoms: userProfile.symptoms || [],
            addictions: userProfile.addictions || [],
            currentMedications: userProfile.currentMedications || [],
            // Ensure constitution exists
            constitution: {
              vata: 33,
              pitta: 33,
              kapha: 34,
              ...userProfile.constitution
            }
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setError('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Unable to load your profile. Please refresh the page.');
        }
        
        setLoading(false);
      }
    };

    if (user.id) {
      fetchProfile();
    } else {
      setError('User session not found. Please log in again.');
      navigate('/login');
      setLoading(false);
    }
  }, [navigate, user.id]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like constitution.vata
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    if (error) setError('');
  };

  // Handle array input changes
  const handleNewInputChange = (field, value) => {
    setNewInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add item to array
  const addToArray = (arrayName, inputKey) => {
    const value = newInputs[inputKey].trim();
    if (value && !profile[arrayName].includes(value)) {
      setProfile(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value]
      }));
      setNewInputs(prev => ({
        ...prev,
        [inputKey]: ''
      }));
    }
  };

  // Remove item from array
  const removeFromArray = (arrayName, item) => {
    setProfile(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter(i => i !== item)
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!profile.dateOfBirth) {
      setError('Date of birth is required.');
      return false;
    }
    
    if (!profile.gender) {
      setError('Gender selection is required.');
      return false;
    }
    
    if (profile.symptoms.length === 0) {
      setError('Please add at least one symptom to help us understand your health concerns.');
      return false;
    }
    
    if (!profile.dietHabits.trim()) {
      setError('Diet habits information is required.');
      return false;
    }
    
    if (!profile.sleepPattern.trim()) {
      setError('Sleep pattern information is required.');
      return false;
    }
    
    if (profile.gender === 'female' && !profile.menstrualHistory.trim()) {
      setError('Menstrual history is required for female patients.');
      return false;
    }
    
    return true;
  };

  // Handle form submission// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setSaving(true);
  setError('');
  setSuccess('');

  try {
    // ✅ Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setError('Authentication required. Please log in again.');
      navigate('/login');
      return;
    }

    // ✅ Include Authorization header in PUT request
    const response = await axios.put(`http://localhost:3003/api/users/${user.id}/profile`, {
      profile: profile
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      setSuccess('Your health profile has been saved successfully!');
      
      setTimeout(() => {
        navigate('/patient-dashboard');
      }, 2000);
    }
  } catch (err) {
    console.error('Profile update error:', err);
    
    // Handle 401 specifically
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setError('Session expired. Please log in again.');
      navigate('/login');
    } else {
      const errorMessage = err.response?.data?.error?.message || 
                          'Unable to save your profile. Please try again.';
      setError(errorMessage);
    }
  } finally {
    setSaving(false);
  }
};

  // Calculate age from date of birth
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years old` : '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
            Complete Your Health Profile
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
            Help us provide personalized Ayurvedic care by sharing detailed information about your health and lifestyle.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 sm:mb-6 mx-4 sm:mx-0 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
              <p className="text-emerald-800 font-medium text-sm sm:text-base">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 mx-4 sm:mx-0 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-red-800 font-medium text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
                    disabled={saving}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                </div>
                {profile.dateOfBirth && (
                  <p className="text-sm text-gray-500 mt-1">{calculateAge(profile.dateOfBirth)}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={profile.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors appearance-none bg-white"
                    disabled={saving}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Constitution (Prakriti) */}
          {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
            <div className="flex items-center mb-6">
              <Droplets className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Constitution (Prakriti)</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Your natural constitution based on Ayurvedic principles. These values will be assessed by our practitioners.
            </p>
            
            <div className="space-y-4">
              {Object.entries(profile.constitution).map(([dosha, value]) => (
                <div key={dosha}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">{dosha}</label>
                    <span className="text-sm text-emerald-600 font-semibold">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleInputChange(`constitution.${dosha}`, parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer slider"
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
          </div> */}

          {/* Current Symptoms - Most Important */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Current Symptoms *</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Please list any symptoms you're currently experiencing to help us understand your immediate health concerns.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={newInputs.symptom}
                onChange={(e) => handleNewInputChange('symptom', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('symptoms', 'symptom'))}
                placeholder="e.g., headache, fatigue, poor digestion"
                className="flex-1 px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => addToArray('symptoms', 'symptom')}
                disabled={!newInputs.symptom.trim() || saving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Symptom
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.symptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="bg-emerald-100 text-emerald-800 px-3 py-2 rounded-full flex items-center gap-2 text-sm"
                >
                  <span className="capitalize">{symptom}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray('symptoms', symptom)}
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {profile.symptoms.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">No symptoms added yet. Please add at least one.</p>
            )}
          </div>

          {/* Medical History & Allergies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medical History */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Medical History</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newInputs.medicalHistory}
                  onChange={(e) => handleNewInputChange('medicalHistory', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('medicalHistory', 'medicalHistory'))}
                  placeholder="e.g., diabetes, hypertension, surgery history"
                  className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors text-sm"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => addToArray('medicalHistory', 'medicalHistory')}
                  disabled={!newInputs.medicalHistory.trim() || saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.medicalHistory.map((condition, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    <span>{condition}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('medicalHistory', condition)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={saving}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {profile.medicalHistory.length === 0 && (
                <p className="text-gray-400 text-sm">No medical history added.</p>
              )}
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Allergies</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newInputs.allergy}
                  onChange={(e) => handleNewInputChange('allergy', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('allergies', 'allergy'))}
                  placeholder="e.g., peanuts, pollen, medication allergies"
                  className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors text-sm"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => addToArray('allergies', 'allergy')}
                  disabled={!newInputs.allergy.trim() || saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('allergies', allergy)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      disabled={saving}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {profile.allergies.length === 0 && (
                <p className="text-gray-400 text-sm">No allergies added.</p>
              )}
            </div>
          </div>

          {/* Lifestyle Habits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diet & Nutrition */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Utensils className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Diet & Nutrition *</h3>
              </div>
              <textarea
                value={profile.dietHabits}
                onChange={(e) => handleInputChange('dietHabits', e.target.value)}
                placeholder="Describe your eating habits, food preferences, meal timings, dietary restrictions..."
                rows={4}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div>

            {/* Sleep Pattern */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Moon className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Sleep Pattern *</h3>
              </div>
              <textarea
                value={profile.sleepPattern}
                onChange={(e) => handleInputChange('sleepPattern', e.target.value)}
                placeholder="Hours of sleep, sleep quality, bedtime routine, any sleep issues..."
                rows={4}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div>
          </div>

          {/* Stress & Mental Health */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
            <div className="flex items-center mb-4">
              <Brain className="w-6 h-6 text-emerald-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Stress Level & Mental Health</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Stress Level</label>
              <select
                value={profile.stressLevel}
                onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors bg-white"
                disabled={saving}
              >
                <option value="low">Low - I feel relaxed and calm most of the time</option>
                <option value="moderate">Moderate - Some stress but generally manageable</option>
                <option value="high">High - Often feeling overwhelmed or stressed</option>
              </select>
            </div>
          </div>

          {/* Digestive Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Digestion *</h3>
              </div>
              <textarea
                value={profile.digestion}
                onChange={(e) => handleInputChange('digestion', e.target.value)}
                placeholder="Digestion quality, appetite, any issues like acidity, bloating, gas..."
                rows={3}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div>

            {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Bowel Habits *</h3>
              </div>
              <textarea
                value={profile.bowelHabits}
                onChange={(e) => handleInputChange('bowelHabits', e.target.value)}
                placeholder="Frequency, consistency, any issues like constipation, loose stools..."
                rows={3}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div> */}
          </div>

          {/* Lifestyle Factors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Addictions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Coffee className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Habits & Addictions</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newInputs.addiction}
                  onChange={(e) => handleNewInputChange('addiction', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('addictions', 'addiction'))}
                  placeholder="e.g., tea, coffee, alcohol, smoking, social media"
                  className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors text-sm"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => addToArray('addictions', 'addiction')}
                  disabled={!newInputs.addiction.trim() || saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.addictions.map((addiction, index) => (
                  <div
                    key={index}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    <span>{addiction}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('addictions', addiction)}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                      disabled={saving}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {profile.addictions.length === 0 && (
                <p className="text-gray-400 text-sm">No habits or addictions added.</p>
              )}
            </div>

            {/* Exercise Routine */}
            {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Dumbbell className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Exercise Routine</h3>
              </div>
              <textarea
                value={profile.exerciseRoutine}
                onChange={(e) => handleInputChange('exerciseRoutine', e.target.value)}
                placeholder="Type of exercise, frequency, duration, intensity level..."
                rows={3}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div> */}
          </div>

          {/* Gender-specific Section */}
          {profile.gender === 'female' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Menstrual History *</h3>
              </div>
              <textarea
                value={profile.menstrualHistory}
                onChange={(e) => handleInputChange('menstrualHistory', e.target.value)}
                placeholder="Cycle regularity, duration, flow, any issues or irregularities, current phase..."
                rows={3}
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors resize-none"
                disabled={saving}
              />
            </div>
          )}

          {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100"> */}
            {/* <div className="flex items-center mb-4">
              <Pill className="w-6 h-6 text-emerald-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Current Medications</h3>
            </div> */}
            {/* <p className="text-gray-600 mb-4 text-sm">
              List any medications, supplements, or herbs you're currently taking.
            </p> */}
            
            {/* <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={newInputs.medication}
                onChange={(e) => handleNewInputChange('medication', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('currentMedications', 'medication'))}
                placeholder="e.g., vitamin D, ashwagandha, prescribed medicines, dosage"
                className="flex-1 px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => addToArray('currentMedications', 'medication')}
                disabled={!newInputs.medication.trim() || saving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div> */}

            {/* <div className="flex flex-wrap gap-2">
              {profile.currentMedications.map((medication, index) => (
                <div
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full flex items-center gap-2 text-sm"
                >
                  <span>{medication}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray('currentMedications', medication)}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {profile.currentMedications.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">No medications added.</p>
            )}
          </div> */}

          {/* Submit Button */}
          <div className="text-center pt-6 px-4 sm:px-0">
            <button
              type="submit"
              disabled={saving || !profile.dateOfBirth || !profile.gender || profile.symptoms.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 mx-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Your Profile...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Complete My Health Profile
                </>
              )}
            </button>
            
            <p className="text-gray-500 text-sm mt-4 px-4">
              Your information is secure and confidential. It will only be used to provide personalized Ayurvedic care.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitialPatientProfile;
