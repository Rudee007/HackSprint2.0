// src/components/admin/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellRing, Send, Users, Calendar, 
  AlertCircle, CheckCircle, Clock, TrendingUp, 
  RefreshCw, Activity, Settings, Mail, Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRealTime } from '../../context/RealTimeContext';
import NotificationHistory from './NotificationHistory';
import QuickActions from './QuickActions';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

const NotificationCenter = () => {
  const { isConnected, socket } = useRealTime();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0
  });
  const [connectionStatus, setConnectionStatus] = useState({
    email: false,
    sms: false,
    lastChecked: null
  });

  const getToken = () => {
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('token');
  };

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationSent = (data) => {
      setNotifications(prev => [{
        type: data.type || 'notification',
        subject: data.subject || 'Notification Sent',
        message: data.message || JSON.stringify(data),
        timestamp: new Date().toLocaleString('en-IN'),
        status: 'delivered',
        recipient: data.recipient || 'Unknown'
      }, ...prev]);
      toast.success(`✅ Notification sent`);
      loadNotificationStats();
    };

    socket.on('notification_sent', handleNotificationSent);
    socket.on('new_appointment_booked', (data) => {
      setNotifications(prev => [{
        type: 'appointment',
        subject: 'New Appointment',
        message: `${data.patientName} - ${data.therapyType}`,
        timestamp: new Date().toLocaleString('en-IN'),
        status: 'delivered'
      }, ...prev]);
      toast.info(`📅 ${data.patientName}`);
    });

    return () => {
      socket.off('notification_sent', handleNotificationSent);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    loadNotificationStats();
    loadNotificationHistory();
    testConnections();
  }, []);

  const loadNotificationStats = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/notifications/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/notifications/admin/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { page: 1, limit: 50 }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const testConnections = async () => {
    try {
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/notifications/test-connection`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConnectionStatus({
          email: response.data.data.email,
          sms: response.data.data.sms,
          lastChecked: new Date().toLocaleString('en-IN')
        });
        toast.success('Connection test complete!');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'actions', label: 'Quick Actions', icon: Send },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BellRing className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notification Center</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Offline</span>
                    </>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>{connectionStatus.email ? '✅' : '❌'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{connectionStatus.sms ? '✅' : '❌'}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              loadNotificationStats();
              loadNotificationHistory();
              testConnections();
            }}
            disabled={loading}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Send} label="Sent" value={stats.sent} color="blue" />
        <StatCard icon={CheckCircle} label="Delivered" value={stats.delivered} color="green" />
        <StatCard icon={AlertCircle} label="Failed" value={stats.failed} color="red" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
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
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab 
                key="dashboard" 
                stats={stats} 
                notifications={notifications}
              />
            )}
            {activeTab === 'actions' && (
              <ActionsTab key="actions" onSuccess={loadNotificationStats} />
            )}
            {activeTab === 'history' && (
              <HistoryTab key="history" notifications={notifications} onRefresh={loadNotificationHistory} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab key="settings" connectionStatus={connectionStatus} onTest={testConnections} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
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
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${colors[color]} rounded-lg shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </motion.div>
  );
};

const DashboardTab = ({ stats, notifications }) => {
  const recentNotifications = notifications.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-900 font-semibold">Delivery Rate</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-900 font-semibold">Success Rate</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.sent > 0 ? Math.round(((stats.sent - stats.failed) / stats.sent) * 100) : 0}%
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-purple-900 font-semibold">Queue</p>
          <p className="text-2xl font-bold text-purple-700">{stats.pending}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <span>Recent Activity</span>
        </h3>
        {recentNotifications.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Bell className="w-5 h-5 text-indigo-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">{item.timestamp}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ActionsTab = ({ onSuccess }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    <QuickActions onSuccess={onSuccess} />
  </motion.div>
);

const HistoryTab = ({ notifications, onRefresh }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    <NotificationHistory notifications={notifications} onRefresh={onRefresh} />
  </motion.div>
);

const SettingsTab = ({ connectionStatus, onTest }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
    <div className="bg-slate-50 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Connection Status</h3>
        <button onClick={onTest} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Test Now
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${connectionStatus.email ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center space-x-2">
            <Mail className={`w-5 h-5 ${connectionStatus.email ? 'text-green-700' : 'text-red-700'}`} />
            <span className={`font-semibold ${connectionStatus.email ? 'text-green-900' : 'text-red-900'}`}>
              Email {connectionStatus.email ? 'OK' : 'Failed'}
            </span>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${connectionStatus.sms ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center space-x-2">
            <Phone className={`w-5 h-5 ${connectionStatus.sms ? 'text-green-700' : 'text-red-700'}`} />
            <span className={`font-semibold ${connectionStatus.sms ? 'text-green-900' : 'text-red-900'}`}>
              SMS {connectionStatus.sms ? 'OK' : 'Failed'}
            </span>
          </div>
        </div>
      </div>
      {connectionStatus.lastChecked && (
        <p className="text-xs text-slate-500 mt-3">Last: {connectionStatus.lastChecked}</p>
      )}
    </div>
  </motion.div>
);

export default NotificationCenter;
