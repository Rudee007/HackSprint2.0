import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Clock, Activity, 
  BarChart3, PieChart, Calendar, Target,
  ArrowUp, ArrowDown, Minus, RefreshCw,
  Zap, CheckCircle, AlertCircle,
  ChevronDown, Sparkles
} from 'lucide-react';
import { useRealTime } from '../../context/RealTimeContext';
import realtimeSessionService from '../../services/realtimeSessionService';

const LiveSessionMetrics = () => {
  const { isConnected, activeSessions } = useRealTime();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch metrics data
  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchMetrics, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await realtimeSessionService.getSessionAnalytics({
        timeRange,
        includeRealTime: true
      });
      
      if (response.data.success) {
        setMetrics(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.response?.data?.error?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Trend utilities
  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUp className="w-3 h-3 lg:w-4 lg:h-4" />;
    if (trend < 0) return <ArrowDown className="w-3 h-3 lg:w-4 lg:h-4" />;
    return <Minus className="w-3 h-3 lg:w-4 lg:h-4" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (trend < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value) => {
    return `${Math.abs(value).toFixed(1)}%`;
  };

  // Time range options
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  // Memoized summary stats
  const summaryStats = useMemo(() => {
    if (!metrics) return [];
    
    return [
      {
        label: 'Total Sessions',
        value: metrics.totalSessions?.count || 0,
        trend: metrics.totalSessions?.trend || 0,
        icon: Calendar,
        color: 'blue'
      },
      {
        label: 'Completed',
        value: metrics.completedSessions?.count || 0,
        trend: metrics.completedSessions?.trend || 0,
        icon: CheckCircle,
        color: 'emerald'
      },
      {
        label: 'Avg Duration',
        value: formatDuration(metrics.averageDuration || 0),
        trend: 0,
        icon: Clock,
        color: 'purple'
      },
      {
        label: 'Unique Patients',
        value: metrics.uniquePatients || 0,
        trend: 0,
        icon: Users,
        color: 'amber'
      }
    ];
  }, [metrics]);

  // Loading State
  if (loading && !metrics) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-emerald-100/50 p-4 lg:p-8"
      >
        <div className="flex items-center justify-center h-64 lg:h-80">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-2">Loading Analytics</h3>
            <p className="text-sm lg:text-base text-slate-600">Gathering your session insights...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-red-100/50 p-4 lg:p-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-2">Analytics Unavailable</h3>
          <p className="text-sm lg:text-base text-slate-600 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-emerald-100/50 p-4 lg:p-8"
    >
      {/* Header Section */}
      <motion.div
        variants={cardVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8"
      >
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800">Live Session Analytics</h3>
            <p className="text-xs lg:text-sm text-slate-600">Real-time performance insights</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              disabled={loading}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2 lg:p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 lg:w-5 lg:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Real-Time Status Cards */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative p-4 lg:p-6 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-green-50 rounded-2xl border border-emerald-200/50 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs lg:text-sm font-semibold text-emerald-700 mb-1">Active Sessions</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl lg:text-3xl font-bold text-emerald-800">{activeSessions?.size || 0}</p>
                {activeSessions?.size > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {/* <Pulse className="w-4 h-4 text-emerald-600" /> */}
                  </motion.div>
                )}
              </div>
            </div>
            <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-600" />
          </div>
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/20 rounded-full"></div>
          <div className="absolute -right-8 -bottom-4 w-20 h-20 bg-emerald-300/10 rounded-full"></div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-blue-100/50 to-cyan-50 rounded-2xl border border-blue-200/50 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs lg:text-sm font-semibold text-blue-700 mb-1">Connection Status</p>
              <div className="flex items-center space-x-2">
                <p className={`text-lg lg:text-xl font-bold ${isConnected ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isConnected ? 'Online' : 'Offline'}
                </p>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
            </div>
            <Zap className={`w-8 h-8 lg:w-10 lg:h-10 ${isConnected ? 'text-blue-600' : 'text-red-500'}`} />
          </div>
          {/* Background decoration */}
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-200/20 rounded-full"></div>
          <div className="absolute -right-8 -bottom-4 w-20 h-20 bg-blue-300/10 rounded-full"></div>
        </motion.div>
      </motion.div>

      {/* Main Metrics Grid */}
      <AnimatePresence>
        {metrics && (
          <>
            {/* Summary Stats */}
            <motion.div
              variants={cardVariants}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8"
            >
              {summaryStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`relative p-3 lg:p-4 bg-gradient-to-br from-${stat.color}-50 via-${stat.color}-100/50 to-${stat.color}-50 rounded-xl lg:rounded-2xl border border-${stat.color}-200/50 shadow-sm overflow-hidden group cursor-pointer`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 text-${stat.color}-600`} />
                      {stat.trend !== 0 && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getTrendColor(stat.trend)}`}>
                          {getTrendIcon(stat.trend)}
                          <span className="font-semibold">{formatPercentage(stat.trend)}</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-lg lg:text-2xl font-bold text-${stat.color}-900 mb-1`}>
                      {stat.value}
                    </p>
                    <p className={`text-xs lg:text-sm font-medium text-${stat.color}-700`}>
                      {stat.label}
                    </p>
                  </div>
                  {/* Background decoration */}
                  <div className={`absolute -right-2 -top-2 w-8 h-8 lg:w-12 lg:h-12 bg-${stat.color}-200/20 rounded-full group-hover:scale-110 transition-transform`}></div>
                </motion.div>
              ))}
            </motion.div>

            {/* Detailed Metrics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {/* Session Duration Stats */}
              <motion.div
                variants={cardVariants}
                className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl lg:rounded-2xl border border-slate-200/50 shadow-sm"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <h4 className="text-sm lg:text-base font-semibold text-slate-800">Duration Analytics</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xl lg:text-2xl font-bold text-slate-800">
                      {formatDuration(metrics.averageDuration || 0)}
                    </p>
                    <p className="text-xs lg:text-sm text-slate-600">Average Duration</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl lg:text-2xl font-bold text-slate-800">
                      {formatDuration(metrics.totalDuration || 0)}
                    </p>
                    <p className="text-xs lg:text-sm text-slate-600">Total Time</p>
                  </div>
                </div>
              </motion.div>

              {/* Patient Analytics */}
              <motion.div
                variants={cardVariants}
                className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl lg:rounded-2xl border border-slate-200/50 shadow-sm"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-slate-600" />
                  <h4 className="text-sm lg:text-base font-semibold text-slate-800">Patient Activity</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
                  <div>
                    <p className="text-lg lg:text-xl font-bold text-slate-800">
                      {metrics.uniquePatients || 0}
                    </p>
                    <p className="text-xs text-slate-600">Unique</p>
                  </div>
                  
                  <div>
                    <p className="text-lg lg:text-xl font-bold text-emerald-700">
                      {metrics.newPatients || 0}
                    </p>
                    <p className="text-xs text-slate-600">New</p>
                  </div>
                  
                  <div>
                    <p className="text-lg lg:text-xl font-bold text-blue-700">
                      {metrics.returningPatients || 0}
                    </p>
                    <p className="text-xs text-slate-600">Returning</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Session Status Breakdown */}
            {metrics.statusBreakdown && (
              <motion.div
                variants={cardVariants}
                className="p-4 lg:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl lg:rounded-2xl border border-slate-200/50 shadow-sm mb-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="w-5 h-5 text-slate-600" />
                  <h4 className="text-sm lg:text-base font-semibold text-slate-800">Session Status Breakdown</h4>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(metrics.statusBreakdown).map(([status, count]) => {
                    const statusColors = {
                      completed: 'text-emerald-700 bg-emerald-100',
                      active: 'text-blue-700 bg-blue-100',
                      pending: 'text-amber-700 bg-amber-100',
                      cancelled: 'text-red-700 bg-red-100'
                    };
                    
                    return (
                      <div key={status} className="text-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-2 ${statusColors[status] || 'text-slate-700 bg-slate-100'}`}>
                          {count}
                        </div>
                        <p className="text-xs font-medium text-slate-700 capitalize">
                          {status.replace('_', ' ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Completion Rate Display */}
            {metrics.completionRate && (
              <motion.div
                variants={cardVariants}
                className="p-4 lg:p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl lg:rounded-2xl border border-emerald-200/50 shadow-sm mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm lg:text-base font-semibold text-emerald-800">Completion Rate</h4>
                      <p className="text-xs lg:text-sm text-emerald-600">Overall session success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl lg:text-3xl font-bold text-emerald-800">
                      {metrics.completionRate}%
                    </p>
                    <div className="w-16 lg:w-20 h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metrics.completionRate}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Footer with Last Updated */}
      <motion.div
        variants={cardVariants}
        className="pt-4 lg:pt-6 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0"
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <p className="text-xs lg:text-sm text-slate-600 font-medium">Real-time insights powered by live data</p>
        </div>
        
        {lastUpdated && (
          <p className="text-xs text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LiveSessionMetrics;
