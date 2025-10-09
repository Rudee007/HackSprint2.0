// src/components/admin/AppointmentManagement.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const AppointmentManagement = ({ dashboardStats }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Appointment Management</h2>
            <p className="text-slate-600">View and manage all appointments</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-2">Total Appointments</p>
            <p className="text-3xl font-bold text-blue-600">{dashboardStats?.overview?.totalAppointments || 0}</p>
          </div>
          <div className="p-6 bg-green-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-2">Today's Appointments</p>
            <p className="text-3xl font-bold text-green-600">{dashboardStats?.overview?.todaysAppointments || 0}</p>
          </div>
          <div className="p-6 bg-orange-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-2">This Week</p>
            <p className="text-3xl font-bold text-orange-600">{dashboardStats?.overview?.thisWeeksAppointments || 0}</p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-500">
          <p>Appointment management interface coming soon...</p>
          <p className="text-sm mt-2">Schedule, reschedule, and cancel appointments</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AppointmentManagement;
