import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Zap, Shield, User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (error) setError('');
  };

  // Form validation
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:3003/api/auth/login', {
        identifier: formData.username.trim(), // Using same API structure
        password: formData.password,
        userType: 'doctor' // Specify this is a doctor login
      });

    // ✅ FIXED: In DoctorLogin.js handleSubmit
if (response.data.success) {
  // Store authentication data
  localStorage.setItem('accessToken', response.data.data.accessToken);
  localStorage.setItem('user', JSON.stringify(response.data.data.user));
  
  const userData = response.data.data.user;
  const token = response.data.data.accessToken;
  
  login(userData, token);

  const existingProfile = localStorage.getItem('user');

  console.log(existingProfile);
  
  if (existingProfile) {
    setSuccess('Login successful! Redirecting to dashboard...');
    setTimeout(() => {
      navigate('/doctor-dashboard');
    }, 1500);
  } else {
    setSuccess('Login successful! Please complete your profile...');
    setTimeout(() => {
      navigate('/doctor-form');
    }, 1500);
  }
}

    } catch (err) {
      console.error('Doctor login error:', err);
      
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          'Login failed. Please check your credentials and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-purple-400/25 to-pink-500/15 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s'}}></div>
        <div className="absolute top-1/4 left-3/4 w-72 h-72 bg-gradient-to-bl from-indigo-300/20 to-blue-400/10 rounded-full blur-3xl animate-spin" style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-1/4 right-3/4 w-56 h-56 bg-gradient-to-tr from-violet-400/15 to-purple-500/20 rounded-full blur-2xl animate-ping" style={{animationDuration: '3.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-conic from-blue-400/5 via-purple-400/10 to-pink-400/5 rounded-full blur-3xl animate-spin" style={{animationDuration: '35s', animationDirection: 'reverse'}}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent animate-pulse" style={{animationDuration: '6s'}}></div>
        
        {/* Modern grid overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35))]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500 w-full">
          {/* Gradient border animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-[1px] bg-indigo-900/90 rounded-3xl"></div>
          
          {/* Sheen effect */}
          <div className="pointer-events-none absolute -top-1/2 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent translate-y-0 group-hover:translate-y-full transition-transform duration-700"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <Stethoscope className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-pulse">
                  <Zap className="w-3 h-3 text-pink-900" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
                Vaidya Portal
              </h1>
              <p className="text-blue-100/80 text-lg font-medium">Advanced medical management</p>
            </div>

            {/* Features */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-8">
                <div className="flex flex-col items-center space-y-2 group">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-xs text-blue-200 font-medium">HIPAA Safe</span>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-400/50 to-transparent"></div>
                <div className="flex flex-col items-center space-y-2 group">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Zap className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-xs text-purple-200 font-medium">Real-time</span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Doctor login form">
              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <p className="text-green-200 text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                  <p className="text-red-200 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-blue-200 font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 transition-all duration-200"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-blue-200 font-medium flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Login to Dashboard'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center pt-6">
              <p className="text-blue-200/60 text-sm">
                Secure access to your medical practice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
