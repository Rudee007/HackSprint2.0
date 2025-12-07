// src/components/therapist/analytics/PerformanceAnalytic.jsx

import React from 'react';
import { BarChart3 } from 'lucide-react';

const PerformanceAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-500 mt-1">Coming soon - detailed performance metrics and insights</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-12">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-gray-500">
            This feature will provide detailed performance analytics and insights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
