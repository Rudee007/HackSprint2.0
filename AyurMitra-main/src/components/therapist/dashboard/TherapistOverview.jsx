// src/components/therapist/dashboard/TherapistOverview.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QuickStats from './QuickStats';
// import TodaysSchedule from './TodaysSchedule';
import ActivityFeed from './ActivityFeed';
import therapistApiService from '../../../services/therapistApiService';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';

const TherapistOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Call the new backend endpoints
      const response = await fetch('/api/therapists/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('therapist_token') || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load dashboard');
      
      const data = await response.json();
      setDashboardData(data.data);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={dashboardData?.todayStats} weeklyStats={dashboardData?.weeklyStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2/3 width) */}
        <div className="lg:col-span-2">
          {/* <TodaysSchedule sessions={dashboardData?.todaysSessions || []} onRefresh={loadDashboardData} /> */}
        </div>

        {/* Activity Feed (1/3 width) */}
        <div>
          <ActivityFeed />
        </div>
      </div>
    </motion.div>
  );
};

export default TherapistOverview;
