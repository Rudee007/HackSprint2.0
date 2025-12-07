import { useUser, SignOutButton } from '@clerk/clerk-react';
import { BarChart3, Users, Settings, DollarSign } from 'lucide-react';

const ManagementDashboard = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.firstName}</h1>
            <p className="text-gray-600">Management Dashboard</p>
          </div>
          <SignOutButton>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              Sign Out
            </button>
          </SignOutButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-semibold text-gray-800">Analytics</h3>
            <p className="text-gray-600">Business insights</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <Users className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-semibold text-gray-800">Staff Management</h3>
            <p className="text-gray-600">Manage employees</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <DollarSign className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-semibold text-gray-800">Revenue</h3>
            <p className="text-gray-600">Financial reports</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <Settings className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-semibold text-gray-800">System Settings</h3>
            <p className="text-gray-600">Configure system</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;