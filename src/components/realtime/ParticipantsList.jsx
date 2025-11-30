import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, User, Crown, Shield, Stethoscope, 
  Circle, UserPlus, UserMinus, MessageCircle,
  Phone, Video, Mic, MicOff, Camera, CameraOff
} from 'lucide-react';

const ParticipantsList = ({ participants = [], sessionId }) => {
  const [expandedParticipant, setExpandedParticipant] = useState(null);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'therapist':
        return <User className="w-4 h-4 text-green-600" />;
      case 'patient':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'therapist':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'patient':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getJoinTime = (joinedAt) => {
    if (!joinedAt) return 'Just joined';
    
    const diff = Date.now() - new Date(joinedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  const getStatusIndicator = (participant) => {
    if (participant.leftAt) {
      return <Circle className="w-3 h-3 text-gray-400 fill-current" />;
    }
    
    if (participant.isActive) {
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Circle className="w-3 h-3 text-green-500 fill-current" />
        </motion.div>
      );
    }
    
    return <Circle className="w-3 h-3 text-yellow-500 fill-current" />;
  };

  const formatParticipantName = (participant) => {
    return participant.userEmail || participant.userName || `${participant.role || 'User'}`;
  };

  if (participants.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="text-center">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-800 mb-2">No Active Participants</h4>
          <p className="text-sm text-slate-600">
            Participants will appear here when they join the session
          </p>
        </div>
      </div>
    );
  }

  const activeParticipants = participants.filter(p => p.isActive && !p.leftAt);
  const inactiveParticipants = participants.filter(p => !p.isActive || p.leftAt);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-slate-800">
            Session Participants ({participants.length})
          </h4>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-slate-600">{activeParticipants.length} active</span>
        </div>
      </div>

      {/* Active Participants */}
      {activeParticipants.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
            <Circle className="w-2 h-2 text-green-500 fill-current mr-2" />
            Active Participants ({activeParticipants.length})
          </h5>
          
          <div className="space-y-2">
            <AnimatePresence>
              {activeParticipants.map((participant) => (
                <motion.div
                  key={participant.userId || participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 bg-slate-50 rounded-lg border transition-all cursor-pointer hover:bg-slate-100 ${
                    expandedParticipant === participant.userId ? 'border-emerald-200 bg-emerald-50' : 'border-transparent'
                  }`}
                  onClick={() => setExpandedParticipant(
                    expandedParticipant === participant.userId ? null : participant.userId
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIndicator(participant)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-slate-800">
                            {formatParticipantName(participant)}
                          </p>
                          {participant.userRole === 'doctor' && (
                            <Crown className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          Joined {getJoinTime(participant.joinedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleColor(participant.userRole)}`}>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(participant.userRole)}
                          <span className="capitalize">{participant.userRole}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedParticipant === participant.userId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-500">Email:</span>
                              <p className="font-medium text-slate-700">
                                {participant.userEmail || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Session Time:</span>
                              <p className="font-medium text-slate-700">
                                {getJoinTime(participant.joinedAt)}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex space-x-2 mt-3">
                            <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs hover:bg-slate-50 transition-colors">
                              <MessageCircle className="w-3 h-3" />
                              <span>Message</span>
                            </button>
                            
                            {participant.userRole !== 'patient' && (
                              <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs hover:bg-slate-50 transition-colors">
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Recently Left Participants */}
      {inactiveParticipants.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
            <Circle className="w-2 h-2 text-gray-400 fill-current mr-2" />
            Recently Left ({inactiveParticipants.length})
          </h5>
          
          <div className="space-y-2">
            {inactiveParticipants.slice(0, 3).map((participant) => (
              <div
                key={`${participant.userId}-inactive`}
                className="p-2 bg-gray-50 rounded-lg border border-gray-200 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Circle className="w-2 h-2 text-gray-400 fill-current" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {formatParticipantName(participant)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Left {getJoinTime(participant.leftAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleColor(participant.userRole)} opacity-60`}>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(participant.userRole)}
                      <span className="capitalize">{participant.userRole}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {inactiveParticipants.length > 3 && (
              <p className="text-xs text-slate-500 text-center py-2">
                +{inactiveParticipants.length - 3} more participants left this session
              </p>
            )}
          </div>
        </div>
      )}

      {/* Session Stats */}
      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-800">{participants.length}</p>
          <p className="text-xs text-slate-600">Total</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">{activeParticipants.length}</p>
          <p className="text-xs text-slate-600">Active</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-600">{inactiveParticipants.length}</p>
          <p className="text-xs text-slate-600">Left</p>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
