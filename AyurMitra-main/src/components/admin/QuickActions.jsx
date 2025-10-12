// src/components/admin/QuickActions.jsx
import React, { useState } from 'react';
import { Users, Calendar, Mail, MessageSquare, Bell, Loader, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

const QuickActions = ({ onSuccess }) => {
  const [loading, setLoading] = useState({});

  const getToken = () => {
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('token');
  };

  const handleAction = async (action) => {
    setLoading(prev => ({ ...prev, [action.id]: true }));
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/api/notifications${action.endpoint}`,
        action.body || {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || `${action.label} completed!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error(error.response?.data?.message || `Failed: ${action.label}`);
    } finally {
      setLoading(prev => ({ ...prev, [action.id]: false }));
    }
  };

  const actions = [
    {
      id: 'bulk-reminders',
      icon: Calendar,
      label: 'Send Bulk Reminders',
      description: 'Send reminders for tomorrow\'s appointments',
      endpoint: '/admin/bulk/reminders',
      color: 'blue'
    },
    {
      id: 'daily-summary',
      icon: Mail,
      label: 'Daily Summary',
      description: 'Send today\'s summary to all admins',
      endpoint: '/admin/daily-summary',
      color: 'green'
    },
    {
      id: 'feedback-requests',
      icon: MessageSquare,
      label: 'Feedback Requests',
      description: 'Request feedback from completed sessions',
      endpoint: '/admin/bulk/feedback-requests',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Quick Actions</h3>
        <p className="text-sm text-slate-600 mb-6">Execute common notification tasks with one click</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = loading[action.id];
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            green: 'bg-green-50 border-green-200 hover:bg-green-100',
            purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
          };
          
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isLoading}
              className={`p-6 rounded-xl border-2 ${colorClasses[action.color]} transition-all hover:shadow-md disabled:opacity-50 text-left`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-8 h-8 text-indigo-600" />
                {isLoading && <Loader className="w-5 h-5 animate-spin text-indigo-600" />}
              </div>
              <p className="font-bold text-slate-900 mb-1">{action.label}</p>
              <p className="text-sm text-slate-600">{action.description}</p>
            </button>
          );
        })}
      </div>

      {/* Test Notifications */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Test Notifications</h3>
        <TestNotifications onSuccess={onSuccess} />
      </div>
    </div>
  );
};

const TestNotifications = ({ onSuccess }) => {
  const [testData, setTestData] = useState({
    email: '',
    phone: '',
    subject: 'Test Notification',
    message: 'This is a test notification from AyurSutra Admin Panel'
  });
  const [sending, setSending] = useState({ email: false, sms: false });

  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');

  const sendTestEmail = async () => {
    if (!testData.email) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(prev => ({ ...prev, email: true }));
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/api/notifications/test-email`,
        {
          email: testData.email,
          subject: testData.subject,
          templateName: 'appointmentConfirmation',
          data: { patientName: 'Test User', therapyType: 'Test Therapy', appointmentDate: 'Today', appointmentTime: 'Now' }
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Test email sent!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSending(prev => ({ ...prev, email: false }));
    }
  };

  const sendTestSMS = async () => {
    if (!testData.phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setSending(prev => ({ ...prev, sms: true }));
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/api/notifications/test-sms`,
        {
          phoneNumber: testData.phone,
          message: testData.message
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Test SMS sent!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test SMS');
    } finally {
      setSending(prev => ({ ...prev, sms: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Test Email */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          <span>Test Email</span>
        </h4>
        <input
          type="email"
          value={testData.email}
          onChange={(e) => setTestData({ ...testData, email: e.target.value })}
          placeholder="Enter email address"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 text-sm"
        />
        <button
          onClick={sendTestEmail}
          disabled={sending.email}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {sending.email ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{sending.email ? 'Sending...' : 'Send Test Email'}</span>
        </button>
      </div>

      {/* Test SMS */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <span>Test SMS</span>
        </h4>
        <input
          type="tel"
          value={testData.phone}
          onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
          placeholder="+91 1234567890"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 text-sm"
        />
        <button
          onClick={sendTestSMS}
          disabled={sending.sms}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {sending.sms ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{sending.sms ? 'Sending...' : 'Send Test SMS'}</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
