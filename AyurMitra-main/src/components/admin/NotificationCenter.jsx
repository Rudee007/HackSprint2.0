// src/components/admin/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellRing, Send, Users, Calendar, DollarSign, 
  AlertCircle, CheckCircle, Clock, TrendingUp, Mail,
  MessageSquare, Filter, Search, RefreshCw, Download,
  X, Info, Zap, Package, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRealTime } from '../../context/RealTimeContext';
import NotificationHistory from './NotificationHistory';
import QuickSendForm from './QuickSendForm';

const NotificationCenter = () => {
  // ✅ FIXED: Only get what's available from context
  const { isConnected, socket } = useRealTime();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0
  });

  // ✅ FIXED: WebSocket listener using socket directly
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⏳ Waiting for socket connection...');
      return;
    }

    console.log('✅ Socket connected, adding notification listeners');

    // Add listeners
    const handleNotificationSent = (data) => {
      console.log('📧 New notification event:', data);
      setNotifications(prev => [data, ...prev]);
      toast.success(`Notification sent: ${data.type || 'Unknown type'}`);
    };

    const handleNewAppointment = (data) => {
      console.log('📅 New appointment notification:', data);
      setNotifications(prev => [{
        type: 'appointment',
        subject: 'New Appointment Booked',
        message: `${data.patientName} booked ${data.therapyType}`,
        timestamp: new Date().toLocaleString(),
        status: 'delivered'
      }, ...prev]);
      toast.info(`New appointment: ${data.patientName}`);
    };

    const handleNewPatient = (data) => {
      console.log('👤 New patient notification:', data);
      setNotifications(prev => [{
        type: 'patient',
        subject: 'New Patient Registered',
        message: `${data.patientName} has registered`,
        timestamp: new Date().toLocaleString(),
        status: 'delivered'
      }, ...prev]);
      toast.info(`New patient: ${data.patientName}`);
    };

    // Add socket listeners
    socket.on('notification_sent', handleNotificationSent);
    socket.on('new_appointment_booked', handleNewAppointment);
    socket.on('new_patient_registered', handleNewPatient);

    // Cleanup
    return () => {
      console.log('🧹 Removing notification listeners');
      socket.off('notification_sent', handleNotificationSent);
      socket.off('new_appointment_booked', handleNewAppointment);
      socket.off('new_patient_registered', handleNewPatient);
    };
  }, [socket, isConnected]);

  // Load notification stats
  useEffect(() => {
    loadNotificationStats();
  }, []);

  const loadNotificationStats = async () => {
    try {
      setLoading(true);
      
      // ✅ FIXED: Direct fetch call
      const token = localStorage.getItem('adminToken') || 
                    localStorage.getItem('accessToken') || 
                    localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3003/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          sent: 1247,
          delivered: 1203,
          failed: 12,
          pending: 32
        });
      } else {
        // Use dummy data if API not available
        setStats({
          sent: 1247,
          delivered: 1203,
          failed: 12,
          pending: 32
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Use dummy data on error
      setStats({
        sent: 1247,
        delivered: 1203,
        failed: 12,
        pending: 32
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'send', label: 'Send Notification', icon: Send },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BellRing className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notification Center</h1>
              <p className="text-indigo-100 mt-1">
                Manage and send notifications • {isConnected ? '🟢 Live' : '🔴 Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={loadNotificationStats}
            disabled={loading}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Send}
          label="Total Sent"
          value={stats.sent}
          color="blue"
          trend="+12%"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivered"
          value={stats.delivered}
          color="green"
          trend="+8%"
        />
        <StatCard
          icon={AlertCircle}
          label="Failed"
          value={stats.failed}
          color="red"
          trend="-2%"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          color="yellow"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex items-center space-x-2 p-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab key="dashboard" stats={stats} />
            )}
            {activeTab === 'send' && (
              <SendTab key="send" />
            )}
            {activeTab === 'history' && (
              <HistoryTab key="history" notifications={notifications} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab key="settings" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ========== SUB-COMPONENTS (Keep all your existing ones) ==========

const StatCard = ({ icon: Icon, label, value, color, trend }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${colors[color]} rounded-lg shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${
            trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-600 mt-1">{label}</p>
      </div>
    </motion.div>
  );
};

const DashboardTab = ({ stats }) => {
  const quickActions = [
    { icon: Users, label: 'All Patients', color: 'blue', action: 'send-all-patients' },
    { icon: Calendar, label: 'Today\'s Appointments', color: 'green', action: 'send-today-appointments' },
    { icon: DollarSign, label: 'Payment Reminders', color: 'yellow', action: 'send-payment-reminders' },
    { icon: AlertCircle, label: 'Critical Alerts', color: 'red', action: 'send-critical-alerts' }
  ];

  const recentActivity = [
    { type: 'success', message: 'Daily summary sent to all admins', time: '2 mins ago' },
    { type: 'info', message: 'New appointment alert sent', time: '15 mins ago' },
    { type: 'warning', message: 'Payment reminder sent to 12 patients', time: '1 hour ago' },
    { type: 'success', message: 'Weekly report generated and sent', time: '2 hours ago' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
              green: 'bg-green-100 text-green-600 hover:bg-green-200',
              yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
              red: 'bg-red-100 text-red-600 hover:bg-red-200'
            };
            
            return (
              <button
                key={action.action}
                onClick={() => toast.info(`Action: ${action.label}`)}
                className={`p-4 rounded-xl ${colorClasses[action.color]} transition-colors text-left`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <p className="font-semibold text-sm">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => {
            const typeIcons = {
              success: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
              info: { icon: Info, color: 'text-blue-600 bg-blue-100' },
              warning: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100' }
            };
            const { icon: Icon, color } = typeIcons[activity.type];
            
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const SendTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <QuickSendForm />
    </motion.div>
  );
};

const HistoryTab = ({ notifications }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <NotificationHistory notifications={notifications} />
    </motion.div>
  );
};

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    autoDaily: true,
    autoWeekly: true,
    criticalAlerts: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Settings updated');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-bold text-slate-900">Notification Settings</h3>
      
      <div className="space-y-4">
        <SettingToggle
          label="Email Notifications"
          description="Send notifications via email"
          enabled={settings.emailEnabled}
          onToggle={() => handleToggle('emailEnabled')}
        />
        <SettingToggle
          label="SMS Notifications"
          description="Send notifications via SMS (Twilio)"
          enabled={settings.smsEnabled}
          onToggle={() => handleToggle('smsEnabled')}
        />
        <SettingToggle
          label="Push Notifications"
          description="Send browser push notifications"
          enabled={settings.pushEnabled}
          onToggle={() => handleToggle('pushEnabled')}
        />
        <SettingToggle
          label="Auto Daily Summary"
          description="Automatically send daily summary at 8 AM"
          enabled={settings.autoDaily}
          onToggle={() => handleToggle('autoDaily')}
        />
        <SettingToggle
          label="Auto Weekly Report"
          description="Automatically send weekly report every Monday"
          enabled={settings.autoWeekly}
          onToggle={() => handleToggle('autoWeekly')}
        />
        <SettingToggle
          label="Critical Alerts"
          description="Receive immediate alerts for critical issues"
          enabled={settings.criticalAlerts}
          onToggle={() => handleToggle('criticalAlerts')}
        />
      </div>
    </motion.div>
  );
};

const SettingToggle = ({ label, description, enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default NotificationCenter;
