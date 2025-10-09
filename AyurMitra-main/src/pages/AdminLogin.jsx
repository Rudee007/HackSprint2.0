// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn, Loader, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import adminService from '../services/adminService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DEV_MODE = import.meta.env.MODE === 'development';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Admin login attempt:', formData.email);

    try {
      // Call real backend API
      const result = await adminService.login(formData.email, formData.password);

      if (result.success) {
        console.log('✅ Login successful:', result.data.admin);
        
        toast.success(`Welcome back, ${result.data.admin.name}!`, {
          duration: 3000,
          icon: '👋',
        });

        // Small delay for toast to show
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 500);
      } else {
        setError('Invalid credentials. Please try again.');
        toast.error('Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Invalid email or password');
        toast.error('Invalid credentials');
      } else if (error.response?.status === 403) {
        setError('Your account has been disabled');
        toast.error('Account disabled');
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError('Cannot connect to server. Please check if backend is running.');
        toast.error('Server connection failed');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        setError('Login failed. Please try again.');
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-slate-600 mt-2">AyurMitra Healthcare System</p>
          </div>

          {/* Development Mode Indicator */}
          {DEV_MODE && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <p className="text-xs font-semibold text-blue-800 mb-2">
                🔧 Development Mode
              </p>
              <p className="text-xs text-blue-700">Email: admin@ayurmitra.com</p>
              <p className="text-xs text-blue-700">Password: Admin@123</p>
              <p className="text-xs text-blue-600 mt-2">
                Backend: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api'}
              </p>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter admin email"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              © 2025 AyurMitra Healthcare. Admin Access Only.
            </p>
            {DEV_MODE && (
              <p className="text-xs text-blue-500 mt-2">
                Running in Development Mode
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
