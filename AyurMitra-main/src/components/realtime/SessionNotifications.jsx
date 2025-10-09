import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, X, Eye, EyeOff, Filter,
  CheckCircle, AlertCircle, Info, AlertTriangle,
  Clock, User, Activity, MessageSquare, Calendar
} from 'lucide-react';
import { useRealTime } from '../../context/RealTimeContext';

const SessionNotifications = ({ compact = false }) => {
  const { 
    notifications, 
    unreadNotifications, 
    removeNotification, 
    markNotificationAsRead, 
    clearAllNotifications 
  } = useRealTime();

  const [showAll, setShowAll] = useState(!compact);
  const [filterType, setFilterType] = useState('all');
  const [mutedTypes, setMutedTypes] = useState(new Set());

  const notificationTypes = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'error', label: 'Errors', count: notifications.filter(n => n.type === 'error').length },
    { key: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length },
    { key: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
    { key: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type, read) => {
    const opacity = read ? 'opacity-60' : '';
    switch (type) {
      case 'success':
        return `bg-green-50 border-green-200 ${opacity}`;
      case 'error':
        return `bg-red-50 border-red-200 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 border-yellow-200 ${opacity}`;
      case 'info':
      default:
        return `bg-blue-50 border-blue-200 ${opacity}`;
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    return notification.type === filterType;
  });

  const displayNotifications = compact ? filteredNotifications.slice(0, 5) : filteredNotifications;

  const handleMuteType = (type) => {
    const newMutedTypes = new Set(mutedTypes);
    if (newMutedTypes.has(type)) {
      newMutedTypes.delete(type);
    } else {
      newMutedTypes.add(type);
    }
    setMutedTypes(newMutedTypes);
  };

  const handleMarkAllAsRead = () => {
    unreadNotifications.forEach(notification => {
      markNotificationAsRead(notification.id);
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          <h3 className={`font-semibold text-slate-800 ${compact ? 'text-base' : 'text-lg'}`}>
            Live Notifications
          </h3>
          {unreadNotifications.length > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!compact && (
            <>
              <button
                onClick={() => setShowAll(!showAll)}
                className="p-1 text-slate-600 hover:text-slate-800 rounded"
              >
                {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  {notificationTypes.map(type => (
                    <option key={type.key} value={type.key}>
                      {type.label} {type.count > 0 && `(${type.count})`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {unreadNotifications.length > 0 && !compact && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">
              {unreadNotifications.length} unread notifications
            </span>
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
            >
              Mark All Read
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className={`space-y-2 ${compact ? 'max-h-80' : 'max-h-96'} overflow-y-auto`}>
        <AnimatePresence mode="popLayout">
          {displayNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No notifications</p>
              <p className="text-sm text-slate-500 mt-1">
                Notifications will appear here when events occur
              </p>
            </div>
          ) : (
            displayNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`p-3 rounded-lg border transition-all duration-200 ${getNotificationBgColor(notification.type, notification.read)} ${
                  !notification.read ? 'ring-1 ring-current ring-opacity-20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-slate-500">
                            {getRelativeTime(notification.timestamp)}
                          </span>
                          
                          {notification.sessionId && (
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <Activity className="w-3 h-3" />
                              <span>Session</span>
                            </span>
                          )}
                          
                          {notification.userId && (
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>User</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="Mark as read"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Remove notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {compact && notifications.length > 5 && (
        <div className="mt-4 pt-3 border-t border-slate-200 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
          >
            View All Notifications ({notifications.length})
          </button>
        </div>
      )}
      
      {!compact && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {displayNotifications.length} of {notifications.length} notifications
            </span>
            <span>
              Auto-refresh every 5 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionNotifications;
