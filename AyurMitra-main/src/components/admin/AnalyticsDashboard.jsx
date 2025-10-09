// src/components/admin/AnalyticsDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const AnalyticsDashboard = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
          <p className="text-slate-600">System analytics and insights</p>
        </div>
      </div>
      <div className="text-center text-slate-500 py-12">
        <p>Analytics dashboard coming soon...</p>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
