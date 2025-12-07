import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Circle, Clock, Coffee, Moon, AlertTriangle, 
  CheckCircle, User, Calendar, Settings, Power 
} from 'lucide-react';
import { useRealTime } from '../../context/RealTimeContext';

const ProviderStatusWidget = () => {
  const { providerStatus, updateProviderStatus, isConnected } = useRealTime();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');

  const statusOptions = [
    {
      key: 'available',
      label: 'Available',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Ready to see patients'
    },
    {
      key: 'busy',
      label: 'Busy',
      icon: <User className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'In session with patient'
    },
    {
      key: 'break',
      label: 'On Break',
      icon: <Coffee className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Taking a short break'
    },
    {
      key: 'lunch',
      label: 'Lunch Break',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'Out for lunch'
    },
    {
      key: 'away',
      label: 'Away',
      icon: <Moon className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Temporarily away'
    },
    {
      key: 'offline',
      label: 'Offline',
      icon: <Power className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Not available'
    }
  ];

  const currentStatus = statusOptions.find(s => s.key === providerStatus) || statusOptions;

  const handleStatusChange = async (newStatus) => {
    try {
      const until = availableUntil ? new Date(availableUntil) : null;
      const success = updateProviderStatus(newStatus, until);
      
      if (success) {
        setShowStatusMenu(false);
        setAvailableUntil('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIndicator = () => {
    if (!isConnected) {
      return <Circle className="w-3 h-3 text-red-500 fill-current" />;
    }

    switch (providerStatus) {
      case 'available':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Circle className="w-3 h-3 text-green-500 fill-current" />
          </motion.div>
        );
      case 'busy':
        return <Circle className="w-3 h-3 text-yellow-500 fill-current" />;
      case 'break':
      case 'lunch':
        return <Circle className="w-3 h-3 text-blue-500 fill-current" />;
      case 'away':
        return <Circle className="w-3 h-3 text-purple-500 fill-current" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500 fill-current" />;
    }
  };

  const formatAvailableUntil = () => {
    if (!availableUntil) return null;
    return new Date(availableUntil).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Provider Status</h3>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Current Status Display */}
      <div className={`p-4 rounded-lg border ${currentStatus.color} mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIndicator()}
            <div>
              <div className="flex items-center space-x-2">
                {currentStatus.icon}
                <span className="font-semibold">{currentStatus.label}</span>
              </div>
              <p className="text-sm opacity-75 mt-1">
                {currentStatus.description}
              </p>
            </div>
          </div>
          
          {!isConnected && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
        </div>

        {availableUntil && (
          <div className="mt-3 pt-3 border-t border-current opacity-60">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-3 h-3" />
              <span>Until {formatAvailableUntil()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Menu */}
      <AnimatePresence>
        {showStatusMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-slate-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-slate-800 mb-3">Change Status</h4>
              
              <div className="grid grid-cols-1 gap-2 mb-4">
                {statusOptions.map((status) => (
                  <motion.button
                    key={status.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusChange(status.key)}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg text-left transition-all
                      ${status.key === providerStatus ? 
                        `${status.color} ring-2 ring-current ring-opacity-20` : 
                        'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }
                    `}
                  >
                    <Circle className={`w-3 h-3 fill-current ${
                      status.key === 'available' ? 'text-green-500' :
                      status.key === 'busy' ? 'text-yellow-500' :
                      status.key === 'break' || status.key === 'lunch' ? 'text-blue-500' :
                      status.key === 'away' ? 'text-purple-500' :
                      'text-gray-500'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {status.icon}
                        <span className="font-medium">{status.label}</span>
                      </div>
                      <p className="text-xs opacity-75 mt-1">
                        {status.description}
                      </p>
                    </div>
                    
                    {status.key === providerStatus && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Available Until Time */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Until (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              {/* Custom Message */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a custom status message..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                  rows="2"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowStatusMenu(false)}
                  className="flex-1 px-3 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Status Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleStatusChange('available')}
          disabled={providerStatus === 'available' || !isConnected}
          className="flex items-center justify-center space-x-2 p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Available</span>
        </button>
        
        <button
          onClick={() => handleStatusChange('break')}
          disabled={providerStatus === 'break' || !isConnected}
          className="flex items-center justify-center space-x-2 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Coffee className="w-3 h-3" />
          <span>Break</span>
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Connection Lost
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Status updates are disabled until connection is restored.
          </p>
        </div>
      )}

      {/* Status History */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Today's Activity</h4>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Started work</span>
            <span>9:00 AM</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Lunch break</span>
            <span>1:00 PM - 2:00 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Current status</span>
            <span className="capitalize">{providerStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatusWidget;
