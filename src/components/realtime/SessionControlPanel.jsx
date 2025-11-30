import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, Square, AlertTriangle, Clock, 
  CheckCircle, SkipForward, Plus, Minus 
} from 'lucide-react';
import { useSession } from '../../hooks/useSession';

const SessionControlPanel = ({ sessionId, sessionStatus, onStatusChange }) => {
  const {
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    loading
  } = useSession(sessionId);

  const [showConfirm, setShowConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, confirmMessage = null) => {
    if (confirmMessage && !showConfirm) {
      setShowConfirm({ action, message: confirmMessage });
      return;
    }

    setActionLoading(action);
    setShowConfirm(null);

    try {
      let success = false;
      
      switch (action) {
        case 'start':
          success = await startSession(sessionId);
          break;
        case 'pause':
          success = await pauseSession(sessionId);
          break;
        case 'resume':
          success = await resumeSession(sessionId);
          break;
        case 'end':
          success = await endSession(sessionId);
          break;
        case 'cancel':
          success = await cancelSession(sessionId);
          break;
        default:
          break;
      }

      if (success && onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (sessionStatus) {
      case 'scheduled':
      case 'patient_arrived':
        actions.push({
          key: 'start',
          label: 'Start Session',
          icon: <Play className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700 text-white',
          primary: true
        });
        actions.push({
          key: 'cancel',
          label: 'Cancel',
          icon: <Square className="w-4 h-4" />,
          color: 'bg-red-600 hover:bg-red-700 text-white',
          confirm: 'Are you sure you want to cancel this session?'
        });
        break;

      case 'in_progress':
        actions.push({
          key: 'pause',
          label: 'Pause',
          icon: <Pause className="w-4 h-4" />,
          color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        });
        actions.push({
          key: 'end',
          label: 'End Session',
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
          confirm: 'Are you sure you want to end this session?'
        });
        break;

      case 'paused':
        actions.push({
          key: 'resume',
          label: 'Resume',
          icon: <Play className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700 text-white',
          primary: true
        });
        actions.push({
          key: 'end',
          label: 'End Session',
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
          confirm: 'Are you sure you want to end this session?'
        });
        break;

      default:
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No actions available for this session status</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
        <Play className="w-4 h-4 mr-2 text-emerald-600" />
        Session Controls
      </h4>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Confirm Action</span>
          </div>
          <p className="text-sm text-yellow-700 mb-4">{showConfirm.message}</p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleAction(showConfirm.action)}
              disabled={actionLoading}
              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowConfirm(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <motion.button
            key={action.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction(action.key, action.confirm)}
            disabled={loading || actionLoading === action.key}
            className={`
              flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-all duration-200
              ${action.color}
              ${action.primary ? 'ring-2 ring-emerald-200' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {actionLoading === action.key ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              action.icon
            )}
            <span className="text-sm">
              {actionLoading === action.key ? 'Processing...' : action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Session Status Info */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Current Status:</span>
          <span className="font-semibold text-slate-800 capitalize">
            {sessionStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-sm font-medium text-slate-700 mb-3">Quick Actions</p>
        
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center space-x-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <Plus className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-600">Extend Time</span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <SkipForward className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-600">Skip Break</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionControlPanel;
