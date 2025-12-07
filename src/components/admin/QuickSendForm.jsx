// src/components/admin/QuickSendForm.jsx
import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

const QuickSendForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'email',
    recipient: 'all-patients',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);

  const getToken = () => {
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('token');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      const token = getToken();
      
      // ✅ NOTE: This endpoint doesn't exist yet - you need to create it in backend
      // For now, it will show a mock success
      const response = await axios.post(
        `${API_URL}/api/notifications/admin/send-custom`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Notification sent to ${formData.recipient}!`);
        setFormData({
          type: 'email',
          recipient: 'all-patients',
          subject: '',
          message: '',
          priority: 'normal'
        });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Notification Type</label>
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
        <label className="block text-sm font-medium text-slate-700 mb-2">Send To</label>
        <select
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all-patients">All Patients</option>
          <option value="all-therapists">All Therapists</option>
          <option value="all-admins">All Admins</option>
          <option value="today-appointments">Today's Appointments</option>
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Enter subject"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Enter your message..."
          rows={6}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">{formData.message.length} / 500 characters</p>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
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
                formData.priority === priority.value ? priority.color : 'bg-slate-100 text-slate-600'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
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
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={sending}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
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
