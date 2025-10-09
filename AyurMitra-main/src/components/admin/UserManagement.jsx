// src/components/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, Download, Plus, Edit2, Trash2,
  UserCheck, UserX, Mail, Phone, MapPin, Calendar,
  RefreshCw, ChevronLeft, ChevronRight, Eye, X, Check,
  FileSpreadsheet, FileText, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';

const UserManagement = ({ dashboardStats, loading }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, selectedRole, selectedStatus]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (selectedRole !== 'all') params.role = selectedRole;
      if (selectedStatus !== 'all') params.isActive = selectedStatus === 'active';

      const result = await adminService.getUsers(params);
      
      if (result.success) {
        setUsers(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }

    if (activeTab === 'patients') {
      filtered = filtered.filter(u => u.role === 'patient');
    } else if (activeTab === 'doctors') {
      filtered = filtered.filter(u => u.role === 'doctor' || u.role === 'therapist');
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const result = await adminService.toggleUserStatus(userId);
      if (result.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // ============ EXPORT HANDLERS ============
  
  const getExportFilters = () => {
    const filters = {};
    if (selectedRole !== 'all') filters.role = selectedRole;
    if (selectedStatus !== 'all') filters.isActive = selectedStatus === 'active';
    return filters;
  };

  const handleExportAllUsersCSV = async () => {
    setShowExportMenu(false);
    await adminService.exportUsers('csv', getExportFilters());
  };

  const handleExportAllUsersExcel = async () => {
    setShowExportMenu(false);
    await adminService.exportUsers('excel', getExportFilters());
  };

  const handleExportPatientsOnly = async () => {
    setShowExportMenu(false);
    await adminService.exportPatients({ ...getExportFilters(), role: 'patient' });
  };

  const handleExportDoctorsOnly = async () => {
    setShowExportMenu(false);
    await adminService.exportDoctors({ ...getExportFilters() });
  };

  const handleExportFiltered = async () => {
    setShowExportMenu(false);
    const filters = getExportFilters();
    
    // Export based on current tab
    if (activeTab === 'patients') {
      await adminService.exportPatients(filters);
    } else if (activeTab === 'doctors') {
      await adminService.exportDoctors(filters);
    } else {
      await adminService.exportUsers('csv', filters);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      patient: 'bg-blue-100 text-blue-700',
      doctor: 'bg-purple-100 text-purple-700',
      therapist: 'bg-green-100 text-green-700',
      admin: 'bg-red-100 text-red-700'
    };
    return badges[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={dashboardStats?.overview?.totalUsers || 0}
          icon={Users}
          gradient="from-blue-500 to-blue-600"
          loading={loading}
        />
        <StatsCard
          title="Active Users"
          value={dashboardStats?.overview?.activeUsers || 0}
          icon={UserCheck}
          gradient="from-green-500 to-green-600"
          loading={loading}
        />
        <StatsCard
          title="New This Week"
          value={dashboardStats?.overview?.newUsersThisWeek || 0}
          icon={Calendar}
          gradient="from-purple-500 to-purple-600"
          loading={loading}
        />
        <StatsCard
          title="Inactive"
          value={(dashboardStats?.overview?.totalUsers || 0) - (dashboardStats?.overview?.activeUsers || 0)}
          icon={UserX}
          gradient="from-red-500 to-red-600"
          loading={loading}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
              <p className="text-slate-600 mt-1">Manage all system users</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              {/* Export Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Export Menu Dropdown */}
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                          Export Options
                        </div>
                        
                        <button
                          onClick={handleExportFiltered}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">Current View (CSV)</p>
                            <p className="text-xs text-slate-500">Export filtered users as CSV</p>
                          </div>
                        </button>

                        <button
                          onClick={handleExportAllUsersCSV}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">All Users (CSV)</p>
                            <p className="text-xs text-slate-500">Export all users as CSV</p>
                          </div>
                        </button>

                        <button
                          onClick={handleExportAllUsersExcel}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">All Users (Excel)</p>
                            <p className="text-xs text-slate-500">Export all users as Excel</p>
                          </div>
                        </button>

                        <div className="border-t border-slate-200 my-2"></div>

                        <button
                          onClick={handleExportPatientsOnly}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">Patients Only</p>
                            <p className="text-xs text-slate-500">Export patient records</p>
                          </div>
                        </button>

                        <button
                          onClick={handleExportDoctorsOnly}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <Users className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">Doctors Only</p>
                            <p className="text-xs text-slate-500">Export doctor records</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => {
                  setIsCreating(true);
                  setSelectedUser(null);
                  setShowUserModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6">
            {[
              { id: 'all', label: 'All Users', count: users.length },
              { id: 'patients', label: 'Patients', count: users.filter(u => u.role === 'patient').length },
              { id: 'doctors', label: 'Doctors', count: users.filter(u => u.role === 'doctor' || u.role === 'therapist').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="therapist">Therapists</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-2">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onToggleStatus={() => handleToggleStatus(user._id)}
                    onEdit={() => {
                      setSelectedUser(user);
                      setIsCreating(false);
                      setShowUserModal(true);
                    }}
                    onDelete={() => handleDeleteUser(user._id)}
                    getRoleBadge={getRoleBadge}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <div className="flex items-center space-x-2">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-medium ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <UserModal
            user={selectedUser}
            isCreating={isCreating}
            onClose={() => setShowUserModal(false)}
            onSuccess={() => {
              setShowUserModal(false);
              loadUsers();
            }}
          />
        )}
      </AnimatePresence>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient, loading }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white shadow-lg`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">
          {loading ? '...' : value}
        </p>
      </div>
      <div className="p-3 bg-white/20 rounded-xl">
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </motion.div>
);

// User Row Component
const UserRow = ({ user, onToggleStatus, onEdit, onDelete, getRoleBadge }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="hover:bg-slate-50 transition-colors"
  >
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {user.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user.name || 'Unknown'}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        {user.phone && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Phone className="w-4 h-4" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.address?.city && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            <span>{user.address.city}, {user.address.state}</span>
          </div>
        )}
      </div>
    </td>
    <td className="px-6 py-4">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
        {user.role?.toUpperCase()}
      </span>
    </td>
    <td className="px-6 py-4">
      <button
        onClick={onToggleStatus}
        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
          user.isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
      >
        {user.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        <span>{user.isActive ? 'Active' : 'Inactive'}</span>
      </button>
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">
      {new Date(user.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={onEdit}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </motion.tr>
);

// User Modal Component (Create/Edit)
const UserModal = ({ user, isCreating, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'patient',
    password: '',
    isActive: user?.isActive ?? true,
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isCreating) {
        await adminService.createUser(formData);
        toast.success('User created successfully');
      } else {
        await adminService.updateUser(user._id, formData);
        toast.success('User updated successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">
            {isCreating ? 'Create New User' : 'Edit User'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="therapist">Therapist</option>
              </select>
            </div>
          </div>

          {isCreating && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={isCreating}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Active Account</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isCreating ? 'Create User' : 'Update User'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserManagement;
