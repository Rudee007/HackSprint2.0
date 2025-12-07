// src/components/admin/DashboardOverview.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Activity, UserPlus, Clock, RefreshCw, Shield, Zap
} from 'lucide-react';

const DashboardOverview = ({ dashboardStats, adminInfo }) => {
  const statsCards = [
    {
      title: 'Total Users',
      value: dashboardStats?.overview?.totalUsers || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Active Today',
      value: dashboardStats?.overview?.todaysAppointments || 0,
      icon: Activity,
      gradient: 'from-emerald-500 to-emerald-600',
      change: '+8%',
      realTime: true
    },
    {
      title: 'New This Week',
      value: dashboardStats?.overview?.newUsersThisWeek || 0,
      icon: UserPlus,
      gradient: 'from-purple-500 to-purple-600',
      change: '+24%'
    },
    {
      title: 'Total Appointments',
      value: dashboardStats?.overview?.totalAppointments || 0,
      icon: Calendar,
      gradient: 'from-orange-500 to-orange-600',
      change: '+15%'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {adminInfo?.name || 'Administrator'}! 👋
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            Here's what's happening with your healthcare system today.
          </p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">System Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-white" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer overflow-hidden ${
              stat.realTime ? 'ring-2 ring-emerald-200 ring-opacity-50' : ''
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            {stat.realTime && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-medium">LIVE</span>
                </div>
              </div>
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-800 group-hover:text-slate-900">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-slate-600 font-medium">{stat.title}</p>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">System Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats?.overview?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800">Appointments Today</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats?.overview?.todaysAppointments || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 text-emerald-600 mr-2" />
            System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Database</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">API Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Real-time</span>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Connected</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Uptime</span>
                <span className="font-semibold text-slate-800">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
