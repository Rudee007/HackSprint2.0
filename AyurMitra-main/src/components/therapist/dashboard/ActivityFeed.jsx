// src/components/therapist/dashboard/ActivityFeed.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle, AlertCircle, MessageSquare, 
  Star, Clock, Bell
} from 'lucide-react';

const ActivityFeed = () => {
  // Sample activities - you can fetch real data from backend
  const activities = [
    {
      id: 1,
      type: 'session_completed',
      message: 'Completed session with Rajesh Kumar',
      time: '10 minutes ago',
      icon: CheckCircle,
      color: 'green'
    },
    {
      id: 2,
      type: 'feedback_received',
      message: 'New feedback from Priya Sharma',
      time: '25 minutes ago',
      icon: Star,
      color: 'yellow',
      rating: 5
    },
    {
      id: 3,
      type: 'session_scheduled',
      message: 'New session scheduled for tomorrow',
      time: '1 hour ago',
      icon: Clock,
      color: 'blue'
    },
    {
      id: 4,
      type: 'message',
      message: 'Message from Dr. Verma',
      time: '2 hours ago',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      id: 5,
      type: 'alert',
      message: 'Patient vitals require attention',
      time: '3 hours ago',
      icon: AlertCircle,
      color: 'red'
    }
  ];

  const getColorClasses = (color) => {
    const classes = {
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600'
    };
    return classes[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Activity Feed</h2>
          </div>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Activities List */}
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                  
                  {activity.rating && (
                    <div className="flex items-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < activity.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Activities
        </button>
      </div>
    </div>
  );
};

export default ActivityFeed;
