// src/components/therapist/dashboard/QuickStats.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Activity, CheckCircle, TrendingUp, 
  Clock, Users, Star, Award 
} from 'lucide-react';

const QuickStats = ({ stats, weeklyStats }) => {
  const statCards = [
    {
      title: "Today's Sessions",
      value: stats?.sessionsScheduled || 0,
      icon: Calendar,
      color: 'blue',
      trend: '+12%',
      bgGradient: 'from-blue-400 to-blue-600'
    },
    {
      title: 'In Progress',
      value: stats?.sessionsInProgress || 0,
      icon: Activity,
      color: 'green',
      trend: null,
      bgGradient: 'from-green-400 to-green-600',
      pulse: stats?.sessionsInProgress > 0
    },
    {
      title: 'Completed Today',
      value: stats?.sessionsCompleted || 0,
      icon: CheckCircle,
      color: 'purple',
      trend: null,
      bgGradient: 'from-purple-400 to-purple-600'
    },
    {
      title: 'Weekly Total',
      value: weeklyStats?.totalSessions || 0,
      icon: TrendingUp,
      color: 'orange',
      trend: '+8%',
      bgGradient: 'from-orange-400 to-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.bgGradient} rounded-lg shadow-lg ${stat.pulse ? 'animate-pulse' : ''}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {stat.trend && (
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>

              {/* Live indicator for in-progress sessions */}
              {stat.pulse && stat.value > 0 && (
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <span className="text-xs font-medium text-green-600">LIVE</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickStats;
