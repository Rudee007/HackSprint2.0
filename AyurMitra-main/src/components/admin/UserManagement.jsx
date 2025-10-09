import { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, MoreVertical, Check, X, UserPlus } from 'lucide-react';

const UserManagement = () => {
  // Mock user data
  const [users, setUsers] = useState([
    { id: 1, name: 'Rahul Sharma', email: 'rahul.sharma@example.com', role: 'Patient', status: 'Active', joinDate: '15 Jan 2023' },
    { id: 2, name: 'Dr. Priya Patel', email: 'priya.patel@example.com', role: 'Doctor', status: 'Active', joinDate: '03 Mar 2023' },
    { id: 3, name: 'Amit Kumar', email: 'amit.kumar@example.com', role: 'Patient', status: 'Inactive', joinDate: '22 Apr 2023' },
    { id: 4, name: 'Dr. Vikram Singh', email: 'vikram.singh@example.com', role: 'Doctor', status: 'Active', joinDate: '10 Feb 2023' },
    { id: 5, name: 'Neha Gupta', email: 'neha.gupta@example.com', role: 'Therapist', status: 'Active', joinDate: '05 May 2023' },
    { id: 6, name: 'Sanjay Verma', email: 'sanjay.verma@example.com', role: 'Patient', status: 'Pending', joinDate: '18 Jun 2023' },
    { id: 7, name: 'Dr. Ananya Reddy', email: 'ananya.reddy@example.com', role: 'Doctor', status: 'Active', joinDate: '29 Jan 2023' },
    { id: 8, name: 'Rajesh Khanna', email: 'rajesh.khanna@example.com', role: 'Patient', status: 'Active', joinDate: '12 Apr 2023' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle user deletion
  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  // Handle user status toggle
  const handleToggleStatus = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select 
                className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Therapist">Therapist</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-700 font-medium">{user.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Doctor' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'Patient' ? 'bg-green-100 text-green-800' :
                        user.role === 'Therapist' ? 'bg-purple-100 text-purple-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' :
                        user.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1 rounded-md ${
                            user.status === 'Active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.status === 'Active' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md" title="Edit User">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
                <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;