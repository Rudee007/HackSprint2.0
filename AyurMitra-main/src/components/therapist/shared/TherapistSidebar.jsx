// src/components/therapist/Shared file/TherapistSidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, Calendar, Users, MessageSquare, 
  BarChart3, User, Activity
} from 'lucide-react';

const TherapistSidebar = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sessions', label: "Today's Sessions", icon: Calendar },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <aside className="w-64 bg-white border-r shadow-sm h-full">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AyurSutra</h2>
            <p className="text-xs text-gray-500">Therapist Portal</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 text-green-700 font-medium shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default TherapistSidebar;
