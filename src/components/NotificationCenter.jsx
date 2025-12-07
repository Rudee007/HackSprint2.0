import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, Clock, Calendar, Heart, 
  MessageSquare, AlertTriangle, CheckCircle, 
  User, Stethoscope, Pill, Activity
} from 'lucide-react';
import axios from 'axios';
 import { translations } from '../i18n/translations';

// API Configuration
const getEnvVar = (key, defaultValue) => {
  try {
    return process?.env?.[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

const api = axios.create({
  baseURL: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:3003/api'),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const NotificationCenter = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Get current language from localStorage
  const language = localStorage.getItem('language') || 'en';
  const t = translations[language];

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Set up real-time polling
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      const USE_MOCK = !getEnvVar('REACT_APP_API_BASE_URL', null);
      
      if (USE_MOCK) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockNotifications = [
          {
            id: '1',
            type: 'appointment_reminder',
            title: 'Upcoming Appointment',
            message: 'Your Panchakarma session with Dr. Sharma is scheduled for tomorrow at 10:00 AM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            priority: 'high',
            actionUrl: '/appointments/123'
          },
          {
            id: '2',
            type: 'treatment_update',
            title: 'Treatment Plan Updated',
            message: 'Dr. Kumar has updated your Ayurvedic treatment plan. Please review the new recommendations.',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            read: false,
            priority: 'medium'
          },
          {
            id: '3',
            type: 'feedback_request',
            title: 'Feedback Requested',
            message: 'Please share your experience about the recent Abhyanga therapy session.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            read: true,
            priority: 'low'
          },
          {
            id: '4',
            type: 'wellness_tip',
            title: 'Daily Wellness Tip',
            message: 'Remember to drink warm water with lemon first thing in the morning for better digestion.',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            read: true,
            priority: 'low'
          }
        ];
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      } else {
        // Real API call
        const response = await api.get(`/notifications/patient/${userId}`);
        if (response.data.success) {
          setNotifications(response.data.data);
          setUnreadCount(response.data.data.filter(n => !n.read).length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const USE_MOCK = !getEnvVar('REACT_APP_API_BASE_URL', null);
      
      if (USE_MOCK) {
        // Update local state for mock
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        // Real API call
        await api.patch(`/notifications/${notificationId}/read`);
        await fetchNotifications(); // Refresh
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const USE_MOCK = !getEnvVar('REACT_APP_API_BASE_URL', null);
      
      if (USE_MOCK) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        await api.patch(`/notifications/patient/${userId}/read-all`);
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_reminder':
        return <Calendar className="w-5 h-5" />;
      case 'treatment_update':
        return <Stethoscope className="w-5 h-5" />;
      case 'feedback_request':
        return <MessageSquare className="w-5 h-5" />;
      case 'wellness_tip':
        return <Heart className="w-5 h-5" />;
      case 'medication_reminder':
        return <Pill className="w-5 h-5" />;
      case 'health_alert':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    if (type === 'appointment_reminder') return 'text-blue-600 bg-blue-100';
    if (type === 'treatment_update') return 'text-emerald-600 bg-emerald-100';
    if (type === 'wellness_tip') return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return t.justNow;
    if (diffInMinutes < 60) return `${diffInMinutes}${t.minutesAgo}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}${t.hoursAgo}`;
    return `${Math.floor(diffInMinutes / 1440)}${t.daysAgo}`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-400 rounded-full opacity-25"
          />
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{t.notifications}</h3>
                    <p className="text-sm text-gray-600">
                      {unreadCount > 0 ? `${unreadCount} ${t.unread}` : t.allCaughtUp}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={markAllAsRead}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {t.markAllRead}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"
                    />
                    <p className="text-gray-500">{t.loadingNotifications}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t.noNotifications}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              
                              {notification.priority === 'high' && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                  {t.urgent}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    {t.viewAllNotifications}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;