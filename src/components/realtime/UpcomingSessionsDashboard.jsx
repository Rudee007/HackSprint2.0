import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, MapPin, AlertCircle,
  Timer, Play, Bell, ChevronRight, Zap
} from 'lucide-react';

const UpcomingSessionsDashboard = ({ sessions }) => {
  const [timeRemaining, setTimeRemaining] = useState({});

  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date();
      const newTimeRemaining = {};

      sessions.forEach(session => {
        const sessionTime = new Date(session.scheduledAt);
        const diff = sessionTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          newTimeRemaining[session.id] = {
            hours,
            minutes,
            seconds,
            total: diff
          };
        } else {
          newTimeRemaining[session.id] = {
            hours: 0,
            minutes: 0,
            seconds: 0,
            total: 0,
            overdue: true
          };
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  const getUrgencyColor = (totalMs) => {
    const hours = totalMs / (1000 * 60 * 60);
    if (hours <= 0) return 'from-red-500 to-red-600';
    if (hours <= 1) return 'from-orange-500 to-red-500';
    if (hours <= 2) return 'from-amber-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getUrgencyBg = (totalMs) => {
    const hours = totalMs / (1000 * 60 * 60);
    if (hours <= 0) return 'bg-red-50 border-red-200';
    if (hours <= 1) return 'bg-orange-50 border-orange-200';
    if (hours <= 2) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const formatTherapyType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-800">Upcoming Sessions</h3>
              <p className="text-sm text-slate-600">Today's scheduled therapy sessions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-emerald-700">
            <Timer className="w-4 h-4" />
            <span>{sessions.length} sessions</span>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Upcoming Sessions</h3>
            <p className="text-slate-600">Scheduled sessions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sessions
                .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                .map((session, index) => {
                  const countdown = timeRemaining[session.id] || { hours: 0, minutes: 0, seconds: 0, total: 0 };
                  
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 lg:p-6 rounded-xl lg:rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${getUrgencyBg(countdown.total)}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-lg">{session.patientName}</h4>
                            <p className="text-sm text-slate-600">{formatTherapyType(session.therapyType)}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>Room {session.roomNumber}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{session.therapistName}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className="text-right">
                          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r ${getUrgencyColor(countdown.total)} text-white shadow-lg`}>
                            {countdown.overdue ? (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold text-sm">OVERDUE</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Timer className="w-4 h-4" />
                                <div className="font-mono font-bold">
                                  {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(session.scheduledAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-500 block">Duration</span>
                          <p className="font-medium text-slate-700">
                            {Math.floor(session.estimatedDuration / 60)}h {session.estimatedDuration % 60}m
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Type</span>
                          <p className="font-medium text-slate-700 capitalize">
                            {session.sessionType || 'Standard'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Phase</span>
                          <p className="font-medium text-slate-700">
                            Day {session.dayNumber} of {session.totalDays}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preparation</span>
                          <p className="font-medium text-slate-700">
                            {session.preparationTime}min
                          </p>
                        </div>
                      </div>

                      {/* Pre-session Alerts */}
                      {session.alerts && session.alerts.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Bell className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">Pre-session Reminders</span>
                          </div>
                          <ul className="text-xs text-amber-700 space-y-1">
                            {session.alerts.map((alert, i) => (
                              <li key={i} className="flex items-center space-x-1">
                                <span>•</span>
                                <span>{alert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>Ready to start in:</span>
                          <span className="font-mono font-medium">
                            {Math.max(0, countdown.minutes - 30)} minutes
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {countdown.total <= 30 * 60 * 1000 && countdown.total > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              <Play className="w-4 h-4" />
                              <span>Start Early</span>
                            </motion.button>
                          )}
                          
                          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UpcomingSessionsDashboard;
