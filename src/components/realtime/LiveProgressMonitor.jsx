import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, Clock, User, Activity,
  TrendingUp, AlertCircle, CheckCircle, Timer
} from 'lucide-react';

const LiveProgressMonitor = ({ sessions, detailed = false, onSelectPatient }) => {
  const [selectedSession, setSelectedSession] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return <Play className="w-4 h-4 text-emerald-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-amber-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-slate-600" />;
      case 'cancelled': return <Square className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateProgress = (session) => {
    if (!session.startedAt || session.status !== 'in_progress') return 0;
    const elapsed = (Date.now() - new Date(session.startedAt)) / (1000 * 60);
    const progress = (elapsed / session.estimatedDuration) * 100;
    return Math.min(progress, 100);
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
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-800">Live Progress Monitor</h3>
              <p className="text-sm text-slate-600">Real-time therapy session tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">Live</span>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Timer className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Active Sessions</h3>
            <p className="text-slate-600">Active therapy sessions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 lg:p-6 border border-slate-200/50 rounded-xl lg:rounded-2xl hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                  onClick={() => onSelectPatient?.(session.patientId)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-lg">{session.patientName}</h4>
                        <p className="text-sm text-slate-600">{session.therapyType} Therapy</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Therapist: {session.therapistName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(session.status)}
                          <span>{session.status.toUpperCase()}</span>
                        </div>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar for Active Sessions */}
                  {session.status === 'in_progress' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Session Progress</span>
                        <span className="text-sm text-slate-600">
                          {Math.round(calculateProgress(session))}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(session)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Session Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block">Start Time</span>
                      <p className="font-medium text-slate-700">
                        {new Date(session.scheduledAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Duration</span>
                      <p className="font-medium text-slate-700">
                        {formatDuration(session.estimatedDuration)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Room</span>
                      <p className="font-medium text-slate-700">{session.roomNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phase</span>
                      <p className="font-medium text-slate-700">{session.currentPhase || 'Prep'}</p>
                    </div>
                  </div>

                  {/* Live Updates */}
                  {session.status === 'in_progress' && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-emerald-800">Session Active</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-emerald-700">
                          <span>Vital Signs: Normal</span>
                          <span>Last Update: {new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveProgressMonitor;
