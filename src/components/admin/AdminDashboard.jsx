// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState({
    dashboard: true,
    metrics: true,
    users: true,
    appointments: true,
    feedback: true
  });
  const [error, setError] = useState({});

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stats = await adminService.getDashboardStats();
        setDashboardStats(stats);
      } catch (err) {
        setError(prev => ({ ...prev, dashboard: err.message || 'Failed to load dashboard stats' }));
      } finally {
        setLoading(prev => ({ ...prev, dashboard: false }));
      }

      try {
        const metrics = await adminService.getSystemMetrics();
        setSystemMetrics(metrics);
      } catch (err) {
        setError(prev => ({ ...prev, metrics: err.message || 'Failed to load system metrics' }));
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch users with pagination
  const fetchUsers = async (page = 1, limit = 10) => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await adminService.getUsers({ page, limit });
      setUsers(response.data);
    } catch (err) {
      setError(prev => ({ ...prev, users: err.message || 'Failed to load users' }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Fetch appointments with pagination
  const fetchAppointments = async (page = 1, limit = 10) => {
    setLoading(prev => ({ ...prev, appointments: true }));
    try {
      const response = await adminService.getAppointments({ page, limit });
      setAppointments(response.data);
    } catch (err) {
      setError(prev => ({ ...prev, appointments: err.message || 'Failed to load appointments' }));
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  };

  // Fetch feedback with pagination
  const fetchFeedback = async (page = 1, limit = 10) => {
    setLoading(prev => ({ ...prev, feedback: true }));
    try {
      const response = await adminService.getFeedback({ page, limit });
      setFeedback(response.data);
    } catch (err) {
      setError(prev => ({ ...prev, feedback: err.message || 'Failed to load feedback' }));
    } finally {
      setLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  // Load initial data
  useEffect(() => {
    fetchUsers();
    fetchAppointments();
    fetchFeedback();
  }, []);

  // Example function to toggle user status
  const handleToggleUserStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      // Refresh users list after toggling status
      fetchUsers();
    } catch (err) {
      setError(prev => ({ ...prev, userAction: err.message || 'Failed to toggle user status' }));
    }
  };

  // Example function to reschedule appointment
  const handleRescheduleAppointment = async (appointmentId, newDateTime, reason) => {
    try {
      await adminService.rescheduleAppointment(appointmentId, { newDateTime, reason });
      // Refresh appointments list after rescheduling
      fetchAppointments();
    } catch (err) {
      setError(prev => ({ ...prev, appointmentAction: err.message || 'Failed to reschedule appointment' }));
    }
  };

  // Example function to cancel appointment
  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await adminService.cancelAppointment(appointmentId, { reason });
      // Refresh appointments list after cancellation
      fetchAppointments();
    } catch (err) {
      setError(prev => ({ ...prev, appointmentAction: err.message || 'Failed to cancel appointment' }));
    }
  };

  // Example function to update feedback status
  const handleUpdateFeedbackStatus = async (feedbackId, status, adminResponse) => {
    try {
      await adminService.updateFeedbackStatus(feedbackId, { status, adminResponse });
      // Refresh feedback list after updating status
      fetchFeedback();
    } catch (err) {
      setError(prev => ({ ...prev, feedbackAction: err.message || 'Failed to update feedback status' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b border-gray-200">Admin Dashboard</h1>
      
      {/* Dashboard Stats Section */}
      <section className="mb-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard & Analytics</h2>
        {loading.dashboard ? (
          <p className="text-gray-500">Loading dashboard stats...</p>
        ) : error.dashboard ? (
          <p className="text-red-500 p-3 bg-red-50 rounded-md">{error.dashboard}</p>
        ) : dashboardStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
              <h3 className="text-lg font-medium text-blue-600 mb-3">User Statistics</h3>
              <p className="text-gray-700 mb-2">Total Users: {dashboardStats.userStats.totalUsers}</p>
              <p className="text-gray-700 mb-2">Active Users: {dashboardStats.userStats.activeUsers}</p>
              <p className="text-gray-700">New Users (30 days): {dashboardStats.userStats.newUsers}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
              <h3 className="text-lg font-medium text-blue-600 mb-3">Appointment Statistics</h3>
              <p className="text-gray-700 mb-2">Total Appointments: {dashboardStats.appointmentStats.total}</p>
              <p className="text-gray-700 mb-2">Completed: {dashboardStats.appointmentStats.completed}</p>
              <p className="text-gray-700 mb-2">Upcoming: {dashboardStats.appointmentStats.upcoming}</p>
              <p className="text-gray-700">Cancelled: {dashboardStats.appointmentStats.cancelled}</p>
            </div>
            {/* Add more stat cards as needed */}
          </div>
        ) : (
          <p>No dashboard stats available</p>
        )}
      </section>

      {/* System Metrics Section */}
      <section className="mb-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Metrics</h2>
        {loading.metrics ? (
          <p className="text-gray-500">Loading system metrics...</p>
        ) : error.metrics ? (
          <p className="text-red-500 p-3 bg-red-50 rounded-md">{error.metrics}</p>
        ) : systemMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
              <h3 className="text-lg font-medium text-blue-600 mb-3">Database Stats</h3>
              <p className="text-gray-700 mb-2">Total Records: {systemMetrics.databaseStats.totalRecords}</p>
              <p className="text-gray-700">Storage Used: {systemMetrics.databaseStats.storageUsed}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
              <h3 className="text-lg font-medium text-blue-600 mb-3">Recent Activity</h3>
              <p className="text-gray-700 mb-2">API Requests (24h): {systemMetrics.recentActivity.apiRequests24h}</p>
              <p className="text-gray-700">Active Sessions: {systemMetrics.recentActivity.activeSessions}</p>
            </div>
            {/* Add more metric cards as needed */}
          </div>
        ) : (
          <p>No system metrics available</p>
        )}
      </section>

      {/* User Management Section */}
      <section className="mb-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">User Management</h2>
        {loading.users ? (
          <p className="text-gray-500">Loading users...</p>
        ) : error.users ? (
          <p className="text-red-500 p-3 bg-red-50 rounded-md">{error.users}</p>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleToggleUserStatus(user._id)}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {/* Add more action buttons as needed */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <p className="text-gray-500 italic p-4">No users found</p>
          )}
      </section>

      {/* Appointment Management Section */}
      <section className="mb-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Management</h2>
        {loading.appointments ? (
          <p className="text-gray-500">Loading appointments...</p>
        ) : error.appointments ? (
          <p className="text-red-500 p-3 bg-red-50 rounded-md">{error.appointments}</p>
        ) : appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map(appointment => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointment.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.providerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appointment.dateTime).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {appointment.status === 'scheduled' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const newDateTime = prompt('Enter new date and time (YYYY-MM-DD HH:MM)');
                              const reason = prompt('Enter reason for rescheduling');
                              if (newDateTime && reason) {
                                handleRescheduleAppointment(appointment._id, newDateTime, reason);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Reschedule
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Enter reason for cancellation');
                              if (reason) {
                                handleCancelAppointment(appointment._id, reason);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <p className="text-gray-500 italic p-4">No appointments found</p>
          )}
      </section>

      {/* Feedback Management Section */}
      <section className="mb-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Feedback Management</h2>
        {loading.feedback ? (
          <p className="text-gray-500">Loading feedback...</p>
        ) : error.feedback ? (
          <p className="text-red-500 p-3 bg-red-50 rounded-md">{error.feedback}</p>
        ) : feedback.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedback.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.rating >= 4 ? 'bg-green-100 text-green-800' : item.rating >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {item.rating}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'reviewed' ? 'bg-green-100 text-green-800' : item.status === 'resolved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          const status = prompt('Enter new status (pending, reviewed, resolved)');
                          const adminResponse = prompt('Enter admin response');
                          if (status) {
                            handleUpdateFeedbackStatus(item._id, status, adminResponse);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <p className="text-gray-500 italic p-4">No feedback found</p>
          )}
      </section>
    </div>
  );
};

export default AdminDashboard;