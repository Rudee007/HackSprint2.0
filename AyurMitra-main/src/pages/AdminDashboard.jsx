// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, MessageSquare, BarChart3,
  Shield, Activity, Bell, Menu, LogOut, Zap, ChevronRight
} from 'lucide-react';

import adminService from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';

// ✅ Correct imports
const DashboardOverview = React.lazy(() => import('../components/admin/DashboardOverView'));
const UserManagement = React.lazy(() => import('../components/admin/UserManagement'));
const AppointmentManagement = React.lazy(() => import('../components/admin/AppointmentManagement'));
const FeedbackManagement = React.lazy(() => import('../components/admin/FeedbackManagement'));
const AnalyticsDashboard = React.lazy(() => import('../components/admin/AnalyticsDashboard'));
const ProviderVerification = React.lazy(() => import('../components/admin/ProviderVerification'));
const RealTimeMonitor = React.lazy(() => import('../components/admin/RealTimeMonitor'));
const NotificationCenter = React.lazy(() => import('../components/admin/NotificationCenter'));

// 🎨 ============ DEMO MODE CONFIG ============
// ✅ Set this to TRUE to enable styling without backend
const DEMO_MODE = true; // ← Your friend can change this to false later

// ✅ Demo/Mock data for styling purposes
const DEMO_ADMIN_INFO = {
  name: 'Demo Admin',
  email: 'demo@ayursutra.com',
  role: 'super_admin',
  _id: 'demo-admin-id'
};

const DEMO_DASHBOARD_STATS = {
  overview: {
    totalUsers: 1234,
    activeUsers: 856,
    newUsersThisWeek: 45,
    totalAppointments: 3456,
    todaysAppointments: 28,
    thisWeeksAppointments: 145,
    pendingVerifications: 12,
    activeSessions: 8
  }
};
// ============================================

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/appointments')) return 'appointments';
    if (path.includes('/admin/feedback')) return 'feedback';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/verification')) return 'verification';
    if (path.includes('/admin/monitoring')) return 'monitoring';
    if (path.includes('/admin/notifications')) return 'notifications';
    return 'overview';
  };

  const [activeSection, setActiveSection] = useState(getCurrentSection());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const DEV_MODE = import.meta.env.MODE === 'development';

  // ✅ Auth Check with DEMO MODE support
  useEffect(() => {
    const checkAuth = () => {
      // 🎨 DEMO MODE: Skip authentication completely
      if (DEMO_MODE) {
        console.log('🎨 DEMO MODE ACTIVE - Using mock data for styling');
        setAdminInfo(DEMO_ADMIN_INFO);
        setDashboardStats(DEMO_DASHBOARD_STATS);
        setLoading(false);
        return;
      }

      // Normal authentication flow
      const token = localStorage.getItem('adminToken');
      
      console.log('🔐 Auth Check:', { 
        DEV_MODE, 
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      // Require token in production
      if (!DEV_MODE && !token) {
        console.log('❌ No token - Redirecting to login');
        navigate('/admin-login', { replace: true });
        return;
      }

      // Load admin data from localStorage
      try {
        const storedData = localStorage.getItem('adminData');
        if (storedData) {
          const adminData = JSON.parse(storedData);
          console.log('👤 Admin loaded from storage:', adminData);
          setAdminInfo(adminData);
        } else {
          console.warn('⚠️ No admin data in localStorage');
          if (!DEV_MODE) {
            navigate('/admin-login', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Error loading admin data:', error);
        if (!DEV_MODE) {
          navigate('/admin-login', { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate, DEV_MODE]);

  // ✅ Load Dashboard Data from Backend (skip in DEMO MODE)
  useEffect(() => {
    // 🎨 Skip backend calls in DEMO MODE
    if (DEMO_MODE) {
      console.log('🎨 DEMO MODE: Skipping backend API calls');
      return;
    }

    const loadDashboardData = async () => {
      if (!adminInfo) {
        console.log('⏳ Waiting for admin info...');
        return;
      }
      
      try {
        setLoading(true);
        console.log('📊 Fetching dashboard stats from backend...');
        
        const statsResult = await adminService.getDashboardStats();
        
        if (statsResult.success && statsResult.data) {
          console.log('✅ Dashboard stats loaded from backend:', statsResult.data);
          setDashboardStats(statsResult.data);
        } else {
          console.warn('⚠️ Backend returned no data');
          setDashboardStats(null);
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setDashboardStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [adminInfo]);

  const navigationItems = useMemo(() => [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System overview',
      gradient: 'from-blue-500 to-blue-600',
      path: '/admin-dashboard'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      description: 'User management',
      gradient: 'from-purple-500 to-purple-600',
      badge: dashboardStats?.overview?.newUsersThisWeek || 0,
      path: '/admin/users'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      description: 'Schedule management',
      gradient: 'from-green-500 to-green-600',
      badge: dashboardStats?.overview?.todaysAppointments || 0,
      path: '/admin/appointments'
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: MessageSquare,
      description: 'Customer feedback',
      gradient: 'from-orange-500 to-orange-600',
      path: '/admin/feedback'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Reports & insights',
      gradient: 'from-indigo-500 to-indigo-600',
      path: '/admin/analytics'
    },
    {
      id: 'verification',
      label: 'Verifications',
      icon: Shield,
      description: 'Provider approvals',
      gradient: 'from-red-500 to-red-600',
      path: '/admin/verification'
    },
    {
      id: 'monitoring',
      label: 'Live Monitor',
      icon: Activity,
      description: 'Real-time tracking',
      gradient: 'from-emerald-500 to-emerald-600',
      realTime: true,
      path: '/admin/monitoring'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Send notifications',
      gradient: 'from-yellow-500 to-yellow-600',
      path: '/admin/notifications'
    }
  ], [dashboardStats]);

  const handleNavClick = (sectionId, path) => {
    setActiveSection(sectionId);
    if (path && path !== location.pathname) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    
    // 🎨 In DEMO MODE, just reload page
    if (DEMO_MODE) {
      window.location.reload();
      return;
    }

    // Normal logout
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin-login');
  };

  const renderSection = () => {
    const sectionProps = { 
      dashboardStats, 
      adminInfo, 
      loading: DEMO_MODE ? false : loading // ✅ No loading in demo mode
    };
    const components = {
      overview: <DashboardOverview {...sectionProps} />,
      users: <UserManagement {...sectionProps} />,
      appointments: <AppointmentManagement {...sectionProps} />,
      feedback: <FeedbackManagement {...sectionProps} />,
      analytics: <AnalyticsDashboard {...sectionProps} />,
      verification: <ProviderVerification {...sectionProps} />,
      monitoring: <RealTimeMonitor {...sectionProps} />,
      notifications: <NotificationCenter {...sectionProps} />
    };
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {components[activeSection] || components.overview}
      </Suspense>
    );
  };

  // Show loading while checking auth (skip in DEMO MODE)
  if (!DEMO_MODE && !adminInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex">
      <Toaster position="top-right" />
      
      {/* 🎨 DEMO MODE Banner */}
      {DEMO_MODE && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-semibold z-50 shadow-lg">
          🎨 DEMO MODE ACTIVE - For Styling Only (No Backend Required)
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <aside className={`${DEMO_MODE ? 'mt-10' : ''} bg-white/95 backdrop-blur-sm border-r border-slate-200/50 shadow-2xl transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-20'
      } hidden lg:block sticky top-0 h-screen overflow-y-auto`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Admin Portal
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">AyurMitra Healthcare</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {sidebarOpen && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">System Status</span>
                <div className="flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{DEMO_MODE ? 'Demo' : 'Online'}</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <span className="font-semibold">
                    {loading ? '...' : (dashboardStats?.overview?.totalUsers || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Today:</span>
                  <span className="font-semibold">
                    {loading ? '...' : (dashboardStats?.overview?.todaysAppointments || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 ${
                  activeSection === item.id
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl transform scale-105`
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl ${
                  activeSection === item.id ? 'bg-white/20 shadow-lg' : 'bg-slate-100'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                {sidebarOpen && (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center space-x-2">
                        <span>{item.label}</span>
                        {item.realTime && <Zap className="w-3 h-3" />}
                      </div>
                      <div className={`text-xs ${activeSection === item.id ? 'text-white/80' : 'text-slate-500'}`}>
                        {item.description}
                      </div>
                    </div>
                    {item.badge > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {item.badge > 99 ? '99+' : item.badge}
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {adminInfo?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{adminInfo?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{adminInfo?.role?.replace('_', ' ') || 'Administrator'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>{DEMO_MODE ? 'Reload' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className={`${DEMO_MODE ? 'mt-10' : ''} bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-8 py-4 sticky top-0 z-30`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
              <p className="text-slate-600 text-lg">
                {navigationItems.find(item => item.id === activeSection)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{DEMO_MODE ? 'Demo Mode' : 'Online'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-slate-800">{adminInfo?.name}</p>
                  <p className="text-sm text-slate-500">{adminInfo?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {adminInfo?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
