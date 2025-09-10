import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import {
  Calendar, Users, Activity, TrendingUp, Clock, Video, FileText, 
  Settings, BarChart3, Stethoscope, AlertCircle, CheckCircle, 
  DollarSign, Star, Search, Filter, Plus, Eye, Edit, Phone,
  Mail, MapPin, Award, Zap, Heart, Menu, X, ArrowRight,
  Bell, RefreshCw, Download, Upload, BookOpen, Target, Home,
  MessageCircle, MoreVertical
} from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import axios from 'axios';

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ResponsiveDoctorDashboard = () => {
  // Responsive state
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  
  // State Management
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState({});

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Chart Colors
  const CHART_COLORS = {
    primary: ['#14B8A6', '#10B981', '#059669', '#047857'],
    secondary: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
    status: {
      scheduled: '#3B82F6',
      confirmed: '#10B981', 
      completed: '#059669',
      cancelled: '#EF4444',
      pending: '#F59E0B'
    }
  };

  // Navigation Items
  const navigationItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3, color: 'emerald' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, color: 'blue' },
    { id: 'patients', label: 'Patient Management', icon: Users, color: 'indigo' },
    { id: 'consultations', label: 'Consultation Hub', icon: Video, color: 'purple' },
    { id: 'treatments', label: 'Treatment Plans', icon: FileText, color: 'green' },
    { id: 'analytics', label: 'Analytics & Reports', icon: TrendingUp, color: 'orange' },
    { id: 'availability', label: 'Availability', icon: Clock, color: 'cyan' },
    { id: 'profile', label: 'Profile & Settings', icon: Settings, color: 'slate' }
  ];

  // Bottom navigation items for mobile
  const bottomNavItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: Settings }
  ];

  // Sample Data
  const [dashboardData] = useState({
    stats: {
      todayAppointments: 24,
      pendingApprovals: 8,
      completedTreatments: 156,
      monthlyRevenue: 125000,
      patientSatisfaction: 94,
      activePatients: 289
    },
    appointmentStatusData: [
      { status: 'Scheduled', count: 12, color: '#3B82F6' },
      { status: 'Confirmed', count: 8, color: '#10B981' },
      { status: 'Completed', count: 15, color: '#059669' },
      { status: 'Pending', count: 5, color: '#F59E0B' },
      { status: 'Cancelled', count: 2, color: '#EF4444' }
    ],
    revenueData: [
      { date: 'Mon', revenue: 18000, patients: 12 },
      { date: 'Tue', revenue: 22000, patients: 15 },
      { date: 'Wed', revenue: 19000, patients: 13 },
      { date: 'Thu', revenue: 25000, patients: 18 },
      { date: 'Fri', revenue: 28000, patients: 20 },
      { date: 'Sat', revenue: 24000, patients: 16 },
      { date: 'Sun', revenue: 21000, patients: 14 }
    ],
    patientSatisfactionData: [
      { name: 'Excellent', value: 45, color: '#059669' },
      { name: 'Very Good', value: 30, color: '#10B981' },
      { name: 'Good', value: 15, color: '#34D399' },
      { name: 'Average', value: 8, color: '#F59E0B' },
      { name: 'Poor', value: 2, color: '#EF4444' }
    ],
    recentAppointments: [
      { id: 1, patient: 'Rajesh Kumar', time: '09:30 AM', type: 'Consultation', status: 'confirmed', phone: '+91 9876543210', urgency: 'normal' },
      { id: 2, patient: 'Priya Sharma', time: '10:15 AM', type: 'Follow-up', status: 'scheduled', phone: '+91 9876543211', urgency: 'high' },
      { id: 3, patient: 'Amit Patel', time: '11:00 AM', type: 'Treatment', status: 'pending', phone: '+91 9876543212', urgency: 'normal' },
      { id: 4, patient: 'Sneha Gupta', time: '11:45 AM', type: 'Consultation', status: 'confirmed', phone: '+91 9876543213', urgency: 'low' },
      { id: 5, patient: 'Vikram Singh', time: '02:30 PM', type: 'Panchakarma', status: 'scheduled', phone: '+91 9876543214', urgency: 'normal' }
    ]
  });

  // Utility functions
  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUrgencyIndicator = (urgency) => {
    return urgency === 'high' ? '🔴' : urgency === 'low' ? '🟡' : '🟢';
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Loading Doctor Dashboard...</h2>
          <p className="text-gray-600 text-lg">Preparing your medical practice insights</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Dr. Portal</h1>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all touch-manipulation ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Responsive Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || isDesktop) && (
            <motion.div
              initial={isMobile ? { x: '-100%' } : { x: 0 }}
              animate={{ x: 0 }}
              exit={isMobile ? { x: '-100%' } : { x: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`
                ${isMobile ? 'fixed' : 'sticky'} top-0 left-0 z-50 h-screen 
                ${isMobile ? 'w-80' : isTablet ? 'w-64' : 'w-80'} 
                bg-white/95 backdrop-blur-md border-r border-emerald-100 
                flex flex-col shadow-xl ${isDesktop ? 'shadow-none' : ''}
                overflow-y-auto
              `}
            >
              {/* Sidebar Header */}
              <div className="p-6 lg:p-8 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 lg:w-14 h-12 lg:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                      <Stethoscope className="w-6 lg:w-7 h-6 lg:h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-emerald-800">AyurMitra</h2>
                      <p className="text-xs lg:text-sm text-gray-600">Doctor Dashboard</p>
                    </div>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="px-6 lg:px-8 py-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {doctorProfile?.user?.name?.charAt(0) || 'D'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      Dr. {doctorProfile?.user?.name || 'Doctor'}
                    </h3>
                    <p className="text-emerald-700 text-sm font-medium">
                      {doctorProfile?.specializations?.[0] || 'Ayurvedic Specialist'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-6">
                <nav className="space-y-2">
                  {navigationItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setActiveSection(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
                        ${activeSection === item.id
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-102'
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'}`} />
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>{item.label}</div>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'text-white' : 'text-gray-400'} group-hover:translate-x-1`} />
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-emerald-100 bg-gray-50">
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Support
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Fully Responsive */}
        <div className="flex-1 min-w-0">
          <div className={`
            max-w-7xl mx-auto 
            ${isMobile ? 'px-4 py-6 pb-24' : isTablet ? 'px-6 py-8' : 'px-8 py-12'}
          `}>
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Welcome Header - Responsive */}
                  <div className="text-center lg:text-left">
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        ${isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl md:text-5xl'} 
                        font-bold text-emerald-800 mb-4
                      `}
                    >
                      Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Doctor! 🩺
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`
                        ${isMobile ? 'text-base' : 'text-lg lg:text-xl'} 
                        text-gray-600 max-w-2xl ${isMobile ? 'mx-auto' : 'lg:mx-0'}
                      `}
                    >
                      Here's your practice overview and key insights for today
                    </motion.p>
                  </div>

                  {/* Stats Grid - Fully Responsive */}
                  <div className={`
                    grid gap-4 lg:gap-6
                    ${isMobile 
                      ? 'grid-cols-2' 
                      : isTablet 
                        ? 'grid-cols-3' 
                        : 'grid-cols-6'
                    }
                  `}>
                    {[
                      {
                        label: "Today's Appointments",
                        value: dashboardData.stats.todayAppointments,
                        icon: Calendar,
                        gradient: 'from-blue-500 to-indigo-600',
                        change: '+12%'
                      },
                      {
                        label: 'Pending Approvals',
                        value: dashboardData.stats.pendingApprovals,
                        icon: AlertCircle,
                        gradient: 'from-yellow-500 to-orange-600',
                        change: '-3%'
                      },
                      {
                        label: 'Active Patients',
                        value: dashboardData.stats.activePatients,
                        icon: Users,
                        gradient: 'from-emerald-500 to-teal-600',
                        change: '+8%'
                      },
                      {
                        label: 'Monthly Revenue',
                        value: formatCurrency(dashboardData.stats.monthlyRevenue),
                        icon: DollarSign,
                        gradient: 'from-green-500 to-emerald-600',
                        change: '+15%'
                      },
                      {
                        label: 'Satisfaction Rate',
                        value: `${dashboardData.stats.patientSatisfaction}%`,
                        icon: Star,
                        gradient: 'from-purple-500 to-violet-600',
                        change: '+2%'
                      },
                      {
                        label: 'Treatments Done',
                        value: dashboardData.stats.completedTreatments,
                        icon: Award,
                        gradient: 'from-pink-500 to-rose-600',
                        change: '+22%'
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                      >
                        <div className={`w-12 lg:w-14 h-12 lg:h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                          <stat.icon className="w-6 lg:w-7 h-6 lg:h-7 text-white" />
                        </div>
                        <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 mb-2`}>
                          {stat.value}
                        </div>
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2 font-medium`}>
                          {stat.label}
                        </div>
                        <div className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} from last month
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts Section - Responsive Grid */}
                  <div className={`
                    grid gap-6 lg:gap-8
                    ${isMobile 
                      ? 'grid-cols-1' 
                      : isTablet 
                        ? 'grid-cols-1' 
                        : 'grid-cols-2'
                    }
                  `}>
                    {/* Appointment Status Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>Appointment Status</h3>
                          <p className="text-gray-600 text-sm">Today's appointment breakdown</p>
                        </div>
                        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                        <BarChart data={dashboardData.appointmentStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: 'none', 
                              borderRadius: '12px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                            }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {dashboardData.appointmentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Revenue Trend Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>Weekly Revenue</h3>
                          <p className="text-gray-600 text-sm">Revenue and patient trends</p>
                        </div>
                        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                        <AreaChart data={dashboardData.revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: 'none', 
                              borderRadius: '12px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                            }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#colorRevenue)" strokeWidth={3} />
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </div>

                  {/* Additional Cards Row - Responsive */}
                  <div className={`
                    grid gap-6 lg:gap-8
                    ${isMobile 
                      ? 'grid-cols-1' 
                      : isTablet 
                        ? 'grid-cols-2' 
                        : 'grid-cols-3'
                    }
                  `}>
                    {/* Patient Satisfaction Pie Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Patient Satisfaction</h3>
                          <p className="text-gray-600 text-sm">Feedback distribution</p>
                        </div>
                        <Heart className="w-6 h-6 text-pink-500" />
                      </div>
                      <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                        <PieChart>
                          <Pie
                            data={dashboardData.patientSatisfactionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={isMobile ? 60 : 80}
                            innerRadius={isMobile ? 30 : 40}
                            paddingAngle={2}
                            label
                          >
                            {dashboardData.patientSatisfactionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Quick Actions Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Quick Actions</h3>
                          <p className="text-gray-600 text-sm">Common tasks</p>
                        </div>
                        <Zap className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'View Today\'s Schedule', icon: Calendar, action: () => setActiveSection('appointments') },
                          { label: 'Add Treatment Plan', icon: FileText, action: () => setActiveSection('treatments') },
                          { label: 'Patient Consultation', icon: Video, action: () => setActiveSection('consultations') },
                          { label: 'Update Availability', icon: Clock, action: () => setActiveSection('availability') }
                        ].map((action, index) => (
                          <button
                            key={action.label}
                            onClick={action.action}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-emerald-50 rounded-xl transition-colors group touch-manipulation"
                          >
                            <action.icon className="w-5 h-5 text-gray-500 group-hover:text-emerald-600" />
                            <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 group-hover:text-emerald-700`}>{action.label}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Recent Performance */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Performance</h3>
                          <p className="text-gray-600 text-sm">This month's metrics</p>
                        </div>
                        <Target className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Success Rate</span>
                          <span className="text-lg font-bold text-emerald-600">94%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Patient Return Rate</span>
                          <span className="text-lg font-bold text-blue-600">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Recent Appointments - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>Today's Appointments</h3>
                        <p className="text-gray-600">Upcoming consultations and treatments</p>
                      </div>
                      <button 
                        onClick={() => setActiveSection('appointments')}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 touch-manipulation"
                      >
                        <Eye className="w-4 h-4" />
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {dashboardData.recentAppointments.slice(0, isMobile ? 3 : 5).map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {appointment.patient.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold text-gray-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
                                  {appointment.patient}
                                </h4>
                                <span className="text-sm">{getUrgencyIndicator(appointment.urgency)}</span>
                              </div>
                              <div className={`flex items-center gap-4 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {appointment.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Activity className="w-4 h-4" />
                                  {appointment.type}
                                </span>
                                {!isMobile && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {appointment.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                            {!isMobile && (
                              <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors group-hover:scale-110">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Other Sections Placeholder */}
              {activeSection !== 'overview' && (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      {navigationItems.find(item => item.id === activeSection)?.icon && 
                        React.createElement(navigationItems.find(item => item.id === activeSection).icon, { className: "w-10 h-10 text-gray-400" })
                      }
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 capitalize">
                      {activeSection.replace('-', ' ')} Section
                    </h3>
                    <p className="text-gray-600 text-lg max-w-md mx-auto">
                      This section is under development. The {activeSection} functionality will be available soon with comprehensive features and modern interface.
                    </p>
                    <button 
                      onClick={() => setActiveSection('overview')}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to Overview
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile Only */}
      {isMobile && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg flex items-center justify-center text-white z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30">
          <div className="flex items-center justify-around">
            {bottomNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors touch-manipulation ${
                  activeSection === item.id
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDoctorDashboard;
