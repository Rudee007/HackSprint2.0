// src/components/therapist/sessions/SessionsManager.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Search, Loader2 } from 'lucide-react';
import SessionCard from './SessionCard';
import toast from 'react-hot-toast';

const SessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scheduled, in_progress, completed
  const [searchTerm, setSearchTerm] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch('/api/therapists/sessions/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data = await response.json();
      setSessions(data.data.sessions || []);
      
    } catch (error) {
      console.error('Load sessions error:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = session.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.therapyData?.therapyType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
        <p className="text-gray-500 mt-1">View and manage all your therapy sessions</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name or therapy type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Sessions Found
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'No sessions match the selected filter'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SessionCard session={session} onRefresh={loadSessions} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsManager;
