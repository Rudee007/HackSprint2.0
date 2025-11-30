import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, Award, CheckCircle, Clock,
  Star, Sparkles, Trophy, ChevronRight
} from 'lucide-react';

const SessionMilestones = ({ milestones, selectedPatient }) => {
  const [milestoneData, setMilestoneData] = useState({});

  useEffect(() => {
    // Transform milestones data for display
    const transformed = Object.entries(milestones).reduce((acc, [patientId, data]) => {
      acc[patientId] = {
        ...data,
        achievements: data.achievements || [],
        upcomingGoals: data.upcomingGoals || [],
        progressPercentage: data.progressPercentage || 0
      };
      return acc;
    }, {});
    setMilestoneData(transformed);
  }, [milestones]);

  const getMilestoneIcon = (type) => {
    switch (type) {
      case 'detox_phase': return <Sparkles className="w-5 h-5" />;
      case 'treatment_complete': return <Trophy className="w-5 h-5" />;
      case 'recovery_goal': return <Target className="w-5 h-5" />;
      case 'wellness_milestone': return <Star className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getMilestoneColor = (type) => {
    switch (type) {
      case 'detox_phase': return 'from-purple-400 to-pink-500';
      case 'treatment_complete': return 'from-emerald-400 to-green-500';
      case 'recovery_goal': return 'from-blue-400 to-cyan-500';
      case 'wellness_milestone': return 'from-amber-400 to-orange-500';
      default: return 'from-slate-400 to-slate-500';
    }
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
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-800">Recovery Milestones</h3>
              <p className="text-sm text-slate-600">Personalized therapy progress tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Content */}
      <div className="p-6">
        {Object.keys(milestoneData).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Milestones Yet</h3>
            <p className="text-slate-600">Patient milestones will appear as therapy progresses</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(milestoneData).map(([patientId, data]) => (
              <motion.div
                key={patientId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedPatient === patientId
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:border-emerald-200'
                }`}
              >
                {/* Patient Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {data.patientName?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">{data.patientName}</h4>
                      <p className="text-sm text-slate-600">
                        {data.therapyType} • Day {data.currentDay || 1} of {data.totalDays || 21}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700">
                      {Math.round(data.progressPercentage)}%
                    </div>
                    <div className="text-xs text-slate-500">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                    <span className="text-sm text-slate-600">
                      {data.achievements?.length || 0} milestones achieved
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full"
                    />
                  </div>
                </div>

                {/* Recent Achievements */}
                {data.achievements && data.achievements.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Recent Achievements</span>
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {data.achievements.slice(0, 4).map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm"
                        >
                          <div className={`w-8 h-8 bg-gradient-to-r ${getMilestoneColor(achievement.type)} rounded-lg flex items-center justify-center text-white`}>
                            {getMilestoneIcon(achievement.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm">{achievement.title}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(achievement.achievedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Goals */}
                {data.upcomingGoals && data.upcomingGoals.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Goals</span>
                    </h5>
                    <div className="space-y-2">
                      {data.upcomingGoals.slice(0, 3).map((goal, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium text-blue-800">{goal.title}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>{goal.estimatedDays} days</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionMilestones;
