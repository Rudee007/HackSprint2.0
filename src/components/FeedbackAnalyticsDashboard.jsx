import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Star, TrendingUp, TrendingDown, Award, MessageCircle } from 'lucide-react';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

const FeedbackAnalyticsDashboard = ({ feedbackData }) => {
  // Process data for charts
  const processFeedbackTrends = () => {
    const monthlyData = {};
    
    feedbackData.forEach(feedback => {
      const date = new Date(feedback.createdAt);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          count: 0,
          totalRating: 0,
          satisfaction: 0
        };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].totalRating += feedback.ratings?.overallSatisfaction || 0;
    });
    
    return Object.values(monthlyData).map(data => ({
      month: data.month,
      count: data.count,
      avgRating: (data.totalRating / data.count).toFixed(1),
      satisfaction: ((data.totalRating / (data.count * 5)) * 100).toFixed(0)
    }));
  };

  const processRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    feedbackData.forEach(feedback => {
      const rating = Math.round(feedback.ratings?.overallSatisfaction || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });
    
    return Object.entries(distribution).map(([stars, count]) => ({
      name: `${stars} Stars`,
      value: count,
      percentage: ((count / feedbackData.length) * 100).toFixed(1)
    }));
  };

  const processTherapyTypeRatings = () => {
    const therapyData = {};
    
    feedbackData.forEach(feedback => {
      const type = feedback.therapyType || 'Unknown';
      
      if (!therapyData[type]) {
        therapyData[type] = {
          therapy: type,
          count: 0,
          totalRating: 0
        };
      }
      
      therapyData[type].count++;
      therapyData[type].totalRating += feedback.ratings?.overallSatisfaction || 0;
    });
    
    return Object.values(therapyData).map(data => ({
      therapy: data.therapy.charAt(0).toUpperCase() + data.therapy.slice(1),
      avgRating: (data.totalRating / data.count).toFixed(1),
      count: data.count
    }));
  };

  const processHealthMetricsImprovement = () => {
    const metrics = {
      painLevel: { total: 0, count: 0 },
      energyLevel: { total: 0, count: 0 },
      sleepQuality: { total: 0, count: 0 },
      stressLevel: { total: 0, count: 0 },
      overallWellbeing: { total: 0, count: 0 }
    };
    
    feedbackData.forEach(feedback => {
      if (feedback.healthMetrics) {
        Object.keys(metrics).forEach(key => {
          if (feedback.healthMetrics[key]) {
            const before = feedback.healthMetrics[key].before;
            const after = feedback.healthMetrics[key].after;
            
            // Calculate improvement percentage
            const improvement = key === 'painLevel' || key === 'stressLevel'
              ? ((before - after) / before) * 100  // Lower is better
              : ((after - before) / before) * 100; // Higher is better
            
            metrics[key].total += improvement;
            metrics[key].count++;
          }
        });
      }
    });
    
    return Object.entries(metrics)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        metric: key.replace(/([A-Z])/g, ' $1').trim(),
        improvement: (data.total / data.count).toFixed(1)
      }));
  };

  const trendData = processFeedbackTrends();
  const ratingDistribution = processRatingDistribution();
  const therapyRatings = processTherapyTypeRatings();
  const healthImprovements = processHealthMetricsImprovement();

  const calculateOverallStats = () => {
    const totalRating = feedbackData.reduce((sum, fb) => 
      sum + (fb.ratings?.overallSatisfaction || 0), 0
    );
    const avgRating = (totalRating / feedbackData.length).toFixed(1);
    const positiveCount = feedbackData.filter(fb => 
      (fb.ratings?.overallSatisfaction || 0) >= 4
    ).length;
    const satisfactionRate = ((positiveCount / feedbackData.length) * 100).toFixed(0);

    return { avgRating, satisfactionRate, totalFeedback: feedbackData.length };
  };

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 text-amber-500 fill-current" />
            <span className="text-3xl font-bold text-amber-700">{stats.avgRating}</span>
          </div>
          <p className="text-sm font-medium text-amber-700">Average Rating</p>
          <div className="mt-2 flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(stats.avgRating) 
                    ? 'text-amber-400 fill-current' 
                    : 'text-amber-200'
                }`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-purple-500" />
            <span className="text-3xl font-bold text-purple-700">{stats.totalFeedback}</span>
          </div>
          <p className="text-sm font-medium text-purple-700">Total Reviews</p>
          <p className="text-xs text-purple-600 mt-2">All time feedback</p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <span className="text-3xl font-bold text-emerald-700">{stats.satisfactionRate}%</span>
          </div>
          <p className="text-sm font-medium text-emerald-700">Satisfaction Rate</p>
          <div className="mt-2 w-full bg-emerald-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.satisfactionRate}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
            Feedback Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Feedback Count"
                dot={{ fill: '#8B5CF6', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgRating" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Avg Rating"
                dot={{ fill: '#F59E0B', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Rating Distribution Pie Chart */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-500" />
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Therapy Type Ratings Bar Chart */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-purple-500" />
            Ratings by Therapy Type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={therapyRatings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="therapy" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[0, 5]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="avgRating" fill="#8B5CF6" name="Average Rating" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Health Metrics Improvement */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
            Health Metrics Improvement
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={healthImprovements} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="metric" type="category" stroke="#64748b" fontSize={12} width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="improvement" fill="#10B981" name="% Improvement" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackAnalyticsDashboard;
