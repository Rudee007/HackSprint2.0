// components/TherapistLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Leaf, 
  Sparkles, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Mail,
  Phone 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // ✅ Added missing import

const TherapistLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Now properly imported

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState('text'); // ✅ Added missing state

  // Handle input changes with auto-detection
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-detect input type for username field
    if (name === 'username') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      
      if (emailRegex.test(value)) {
        setInputType('email');
      } else if (phoneRegex.test(value.replace(/\s/g, ''))) {
        setInputType('phone');
      } else {
        setInputType('text');
      }
    }
    
    // Clear errors when user types
    if (error) setError('');
  };

  // Form validation
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Email or phone number is required');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  // ✅ Fixed handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:3003/api/auth/login', {
        identifier: formData.username.trim(),
        password: formData.password,
        userType: 'therapist' // ✅ Correct user type for therapist
      });

      if (response.data.success) {
        // Store authentication data
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        const userData = response.data.data.user;
        const token = response.data.data.accessToken;

        // Update auth context
        login(userData, token);

        // ✅ Check if therapist profile exists
        const existingProfile = localStorage.getItem('therapistProfile');
        
        if (existingProfile) {
          // Profile exists, go to dashboard
          setSuccess('Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/therapist-dashboard');
          }, 1500);
        } else {
          // No profile, go to profile creation
          setSuccess('Login successful! Please complete your profile...');
          setTimeout(() => {
            navigate('/therapist-form'); // Adjust route as needed
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Therapist login error:', err);
      
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          'Login failed. Please check your credentials and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get input icon based on detected type
  const getInputIcon = () => {
    if (inputType === 'email') {
      return <Mail className="w-4 h-4" />;
    } else if (inputType === 'phone') {
      return <Phone className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements - Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large screens */}
        <div className="hidden lg:block absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="hidden lg:block absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-green-400/25 to-emerald-500/15 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3.5s' }}></div>
        
        {/* Medium screens */}
        <div className="hidden md:block lg:hidden absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br from-emerald-400/25 to-teal-500/15 rounded-full blur-2xl animate-pulse"></div>
        <div className="hidden md:block lg:hidden absolute -bottom-10 -left-10 w-56 h-56 bg-gradient-to-tr from-green-400/20 to-emerald-500/10 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3.5s' }}></div>
        
        {/* Small screens */}
        <div className="md:hidden absolute -top-5 -right-5 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="md:hidden absolute -bottom-5 -left-5 w-28 h-28 bg-gradient-to-tr from-green-400/15 to-emerald-500/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3.5s' }}></div>
        
        {/* Universal elements */}
        <div className="absolute top-1/5 right-1/5 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-gradient-to-bl from-teal-300/20 to-emerald-400/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '22s' }}></div>
        <div className="absolute bottom-1/5 left-1/5 w-24 sm:w-36 md:w-52 h-24 sm:h-36 md:h-52 bg-gradient-to-tr from-green-400/15 to-teal-500/20 rounded-full blur-2xl animate-ping" style={{ animationDuration: '4.5s' }}></div>
        
        {/* Grid overlay - Responsive */}
        <div className="absolute inset-0 opacity-10 sm:opacity-15 md:opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
          backgroundSize: '20px 20px', 
          backgroundPosition: '0 0, 0 0'
        }}></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35))]"></div>
      </div>

      {/* Main Content Container - Fully responsive */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl relative z-10 flex items-center justify-center min-h-screen px-2 sm:px-4">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500 w-full">
          {/* Gradient border animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-2xl sm:rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-[1px] bg-emerald-900/90 rounded-2xl sm:rounded-3xl"></div>
          
          {/* Sheen effect */}
          <div className="pointer-events-none absolute -top-1/2 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent translate-y-0 group-hover:translate-y-full transition-transform duration-700"></div>

          <div className="relative z-10">
            {/* Header - Responsive */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative mx-auto mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-900" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-2 sm:mb-3">
                Therapist Portal
              </h1>
              <p className="text-emerald-100/80 text-sm sm:text-base md:text-lg font-medium">
                Healing & wellness center
              </p>
            </div>

            {/* Feature Icons - Responsive */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-center space-x-6 sm:space-x-8">
                <div className="flex flex-col items-center space-y-1 sm:space-y-2 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                  </div>
                  <span className="text-xs text-emerald-200 font-medium">Healing</span>
                </div>
                <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-transparent via-teal-400/50 to-transparent"></div>
                <div className="flex flex-col items-center space-y-1 sm:space-y-2 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                    <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-teal-300" />
                  </div>
                  <span className="text-xs text-teal-200 font-medium">Wellness</span>
                </div>
              </div>
            </div>

            {/* Login Form - Responsive */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" aria-label="Therapist login form">
              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 flex-shrink-0" />
                  <p className="text-green-200 text-sm sm:text-base font-medium">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 bg-red-500/20 border border-red-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-300 flex-shrink-0" />
                  <p className="text-red-200 text-sm sm:text-base font-medium">{error}</p>
                </div>
              )}

              {/* Email/Phone Input */}
              <div className="space-y-2">
                <label className="text-emerald-200 font-medium flex items-center space-x-2 text-sm sm:text-base">
                  {getInputIcon()}
                  <span>Email or Phone Number</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-lg sm:rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-300/50 transition-all duration-200"
                    placeholder="Enter email or phone number"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
                {formData.username && (
                  <p className="text-xs text-emerald-300/60 mt-1">
                    Detected: {inputType === 'email' ? 'Email address' : inputType === 'phone' ? 'Phone number' : 'Username'}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-emerald-200 font-medium flex items-center space-x-2 text-sm sm:text-base">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-lg sm:rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-300/50 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-300 hover:text-emerald-200 transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.password.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-emerald-300/40 text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Login to Dashboard'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center pt-4 sm:pt-6">
              <p className="text-emerald-200/60 text-xs sm:text-sm">
                Secure access to your therapy practice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistLogin;
