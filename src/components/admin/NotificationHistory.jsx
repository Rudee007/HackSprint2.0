// src/components/admin/NotificationHistory.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Download, CheckCircle, XCircle, 
  Clock, Mail, MessageSquare, Calendar 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const NotificationHistory = ({ notifications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    let filtered = notifications || [];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, filterType]);

  const handleExport = () => {
    toast.success('Exporting notification history...');
    // Implement CSV export logic
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No notifications found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => (
            <NotificationItem key={index} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationItem = ({ notification }) => {
  const statusIcons = {
    delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    failed: { icon: XCircle, color: 'text-red-600 bg-red-100' },
    pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100' }
  };

  const typeIcons = {
    email: Mail,
    sms: MessageSquare,
    push: Bell
  };

  const StatusIcon = statusIcons[notification.status]?.icon || Clock;
  const statusColor = statusIcons[notification.status]?.color || 'text-slate-600 bg-slate-100';
  const TypeIcon = typeIcons[notification.type] || Mail;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`p-2 rounded-lg ${statusColor}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <TypeIcon className="w-4 h-4 text-slate-400" />
              <h4 className="font-semibold text-slate-900 truncate">
                {notification.subject || 'No Subject'}
              </h4>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">
              {notification.message || 'No message content'}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
              <span>To: {notification.recipient || 'Unknown'}</span>
              <span>•</span>
              <span>{notification.timestamp || 'Just now'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationHistory;
