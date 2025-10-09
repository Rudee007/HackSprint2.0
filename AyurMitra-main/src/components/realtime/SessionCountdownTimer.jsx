import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';

const SessionCountdownTimer = ({ sessionId, remainingTime, status, estimatedDuration = 60 }) => {
  const [localTime, setLocalTime] = useState(remainingTime);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    setLocalTime(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    if (!localTime) return;

    const { remainingSeconds } = localTime;
    const totalSeconds = estimatedDuration * 60;
    const timeRatio = remainingSeconds / totalSeconds;

    setIsWarning(timeRatio <= 0.25 && timeRatio > 0.1); // 25% to 10%
    setIsCritical(timeRatio <= 0.1); // Less than 10%
  }, [localTime, estimatedDuration]);

  // Local countdown for smooth updates
  useEffect(() => {
    if (!localTime || status !== 'in_progress') return;

    const interval = setInterval(() => {
      setLocalTime(prev => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        
        const newSeconds = prev.remainingSeconds - 1;
        return {
          remainingSeconds: newSeconds,
          remainingMinutes: Math.ceil(newSeconds / 60)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localTime, status]);

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeDisplay = () => {
    if (!localTime) return '00:00';
    return formatTime(localTime.remainingSeconds);
  };

  const getProgressPercentage = () => {
    if (!localTime) return 100;
    const totalSeconds = estimatedDuration * 60;
    const elapsed = totalSeconds - localTime.remainingSeconds;
    return Math.min((elapsed / totalSeconds) * 100, 100);
  };

  const getTimerColor = () => {
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  const getBackgroundColor = () => {
    if (isCritical) return 'bg-red-50 border-red-200';
    if (isWarning) return 'bg-yellow-50 border-yellow-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'in_progress':
        return <Play className="w-5 h-5 text-green-600" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  if (!localTime && status !== 'in_progress') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Session not active</p>
        <p className="text-sm text-slate-500 mt-1">Timer will appear when session starts</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border rounded-lg p-6 transition-all duration-300 ${getBackgroundColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-slate-800">Session Timer</h3>
        </div>
        
        {isCritical && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center space-x-1 text-red-600"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Time Low!</span>
          </motion.div>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="text-center mb-6">
        <motion.div
          className={`text-6xl font-mono font-bold mb-2 ${getTimerColor()}`}
          animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={isCritical ? { repeat: Infinity, duration: 1 } : {}}
        >
          {getTimeDisplay()}
        </motion.div>
        
        <p className="text-sm text-slate-600">
          {localTime ? `${localTime.remainingMinutes} minutes remaining` : 'Session inactive'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="text-slate-500">Status</p>
          <p className="font-semibold text-slate-700 capitalize">
            {status.replace('_', ' ')}
          </p>
        </div>
        
        <div>
          <p className="text-slate-500">Estimated</p>
          <p className="font-semibold text-slate-700">{estimatedDuration}min</p>
        </div>
        
        <div>
          <p className="text-slate-500">Elapsed</p>
          <p className="font-semibold text-slate-700">
            {localTime ? 
              Math.round((estimatedDuration * 60 - localTime.remainingSeconds) / 60) : 
              0
            }min
          </p>
        </div>
      </div>

      {/* Warning Messages */}
      {isWarning && !isCritical && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Session time is running low
            </span>
          </div>
        </motion.div>
      )}

      {isCritical && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Session time is almost over!
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Consider extending the session or wrapping up.
          </p>
        </motion.div>
      )}

      {/* Time Ended */}
      {localTime && localTime.remainingSeconds <= 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center"
        >
          <CheckCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <span className="text-sm font-semibold text-red-800">
            Session time has ended
          </span>
          <p className="text-sm text-red-700 mt-1">
            You can continue the session or end it now.
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="mt-4 flex justify-center space-x-3">
        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Extend +15min
        </button>
        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Add Break
        </button>
      </div>
    </motion.div>
  );
};

export default SessionCountdownTimer;
