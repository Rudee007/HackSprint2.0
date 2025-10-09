// src/components/admin/NotificationCenter.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

const NotificationCenter = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-yellow-100 rounded-xl">
          <Bell className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Center</h2>
          <p className="text-slate-600">Send notifications to users</p>
        </div>
      </div>
      <div className="text-center text-slate-500 py-12">
        <p>Notification center coming soon...</p>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
