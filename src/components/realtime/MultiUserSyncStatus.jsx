import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Wifi, Eye, Activity, Clock,
  UserCheck, UserX, Zap, Circle
} from 'lucide-react';

const MultiUserSyncStatus = ({ connectedUsers }) => {
  const [userActivity, setUserActivity] = useState({});

  useEffect(() => {
    // Simulate user activity tracking
    const activityTimer = setInterval(() => {
      setUserActivity(prev => {
        const newActivity = { ...prev };
        connectedUsers.forEach(user => {
          newActivity[user.id] = {
            ...newActivity[user.id],
            lastSeen: Date.now(),
            isActive: Math.random() > 0.3 // 70% chance of being active
          };
        });
        return newActivity;
      });
    }, 5000);

    return () => clearInterval(activityTimer);
  }, [connectedUsers]);

  const getUserRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return '👨‍⚕️';
      case 'therapist': return '💆‍♂️';
      case 'nurse': return '👩‍⚕️';
      case 'patient': return '🧘‍♀️';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  const getUserRoleColor = (role) => {
    switch (role) {
      case 'doctor': return 'from-blue-400 to-blue-600';
      case 'therapist': return 'from-green-400 to-green-600';
      case 'nurse': return 'from-purple-400 to-purple-600';
      case 'patient': return 'from-amber-400 to-amber-600';
      case 'admin': return 'from-red-400 to-red-600';
      default: return 'from-slate-400 to-slate-600';
    }
  };

  const getConnectionStatus = (user) => {
    const activity = userActivity[user.id];
    if (!activity) return 'connecting';
    
    const timeDiff = Date.now() - activity.lastSeen;
    if (timeDiff < 30000 && activity.isActive) return 'active';
    if (timeDiff < 60000) return 'idle';
    return 'away';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-100';
      case 'idle': return 'text-amber-600 bg-amber-100';
      case 'away': return 'text-slate-600 bg-slate-100';
      case 'connecting': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-emerald-100/50"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-800">Connected Users</h3>
              <p className="text-sm text-slate-600">Real-time collaboration status</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{connectedUsers.length} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Users List */}
      <div className="p-6">
        {connectedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Users Connected</h3>
            <p className="text-slate-600">Connected users will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {connectedUsers.map((user, index) => {
                const status = getConnectionStatus(user);
                const activity = userActivity[user.id];
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      <div className={`w-12 h-12 bg-gradient-to-r ${getUserRoleColor(user.role)} rounded-xl flex items-center justify-center shadow-lg relative`}>
                        <span className="text-xl">{getUserRoleIcon(user.role)}</span>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          status === 'active' ? 'bg-emerald-500' :
                          status === 'idle' ? 'bg-amber-500' :
                          status === 'away' ? 'bg-slate-400' :
                          'bg-blue-500'
                        }`} />
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-slate-800">{user.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-slate-600 capitalize">{user.role}</span>
                          <span className="text-xs text-slate-500">
                            {activity ? formatLastSeen(activity.lastSeen) : 'Just connected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User Activity */}
                    <div className="flex items-center space-x-3">
                      {/* Current Activity */}
                      {user.currentActivity && (
                        <div className="text-right">
                          <div className="text-xs font-medium text-slate-700">{user.currentActivity}</div>
                          {user.currentPatient && (
                            <div className="text-xs text-slate-500">Patient: {user.currentPatient}</div>
                          )}
                        </div>
                      )}

                      {/* Connection Indicator */}
                      <div className="flex items-center space-x-1">
                        {status === 'active' && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Circle className="w-3 h-3 text-emerald-500 fill-current" />
                          </motion.div>
                        )}
                        <Wifi className={`w-4 h-4 ${
                          status === 'active' ? 'text-emerald-600' :
                          status === 'idle' ? 'text-amber-600' :
                          status === 'away' ? 'text-slate-400' :
                          'text-blue-600'
                        }`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Sync Status Summary */}
        {connectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">System Sync Status</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-emerald-700">
                  <UserCheck className="w-4 h-4" />
                  <span>{connectedUsers.filter(u => getConnectionStatus(u) === 'active').length} active</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>{connectedUsers.filter(u => getConnectionStatus(u) === 'idle').length} idle</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MultiUserSyncStatus;
