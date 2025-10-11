// src/components/admin/QuickSendForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Mail, MessageSquare, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuickSendForm = () => {
  const [formData, setFormData] = useState({
    type: 'email',
    recipient: 'all-patients',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      
      // ✅ FIXED: Direct fetch call instead of apiService
      const token = localStorage.getItem('adminToken') || 
                    localStorage.getItem('accessToken') || 
                    localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3003/api/notifications/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Notification sent to ${formData.recipient}!`);
        setFormData({
          type: 'email',
          recipient: 'all-patients',
          subject: '',
          message: '',
          priority: 'normal'
        });
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Notification Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Notification Type
        </label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'email', label: 'Email', icon: Mail },
            { value: 'sms', label: 'SMS', icon: MessageSquare },
            { value: 'both', label: 'Both', icon: Send }
          ].map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === type.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  formData.type === type.value ? 'text-indigo-600' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-medium ${
                  formData.type === type.value ? 'text-indigo-600' : 'text-slate-600'
                }`}>
                  {type.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipient */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Send To
        </label>
        <select
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all-patients">All Patients</option>
          <option value="all-therapists">All Therapists</option>
          <option value="all-doctors">All Doctors</option>
          <option value="today-appointments">Today's Appointments</option>
          <option value="pending-payments">Pending Payments</option>
          <option value="custom">Custom Recipients</option>
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Subject *
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Enter notification subject"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Message *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Enter your message here..."
          rows={6}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          {formData.message.length} / 500 characters
        </p>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Priority
        </label>
        <div className="flex space-x-4">
          {[
            { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
            { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
            { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700' },
            { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
          ].map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => setFormData({ ...formData, priority: priority.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.priority === priority.value
                  ? priority.color
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setFormData({
            type: 'email',
            recipient: 'all-patients',
            subject: '',
            message: '',
            priority: 'normal'
          })}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={sending}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {sending ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Notification</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default QuickSendForm;
