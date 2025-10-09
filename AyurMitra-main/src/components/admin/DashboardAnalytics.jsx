import { BarChart3, Users, Calendar, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardAnalytics = () => {
  // Mock data for dashboard analytics
  const stats = [
    { title: 'Total Users', value: '2,543', change: '+12%', icon: Users, color: 'bg-blue-500' },
    { title: 'Appointments', value: '1,873', change: '+8%', icon: Calendar, color: 'bg-green-500' },
    { title: 'Revenue', value: '₹1.2M', change: '+15%', icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Active Sessions', value: '342', change: '+5%', icon: Activity, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <div className="flex space-x-2">
          <select className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</h3>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs font-medium text-green-500">{stat.change} from last period</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">User Growth</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                <span className="text-xs text-slate-500">New Users</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-300 rounded-full mr-1"></div>
                <span className="text-xs text-slate-500">Returning</span>
              </div>
            </div>
          </div>
          
          {/* User Growth Chart */}
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'New Users',
                    data: [65, 78, 90, 105, 125, 138, 152, 168, 180, 195, 210, 225],
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.3,
                    fill: true,
                  },
                  {
                    label: 'Returning Users',
                    data: [45, 52, 60, 70, 85, 95, 110, 125, 140, 155, 170, 185],
                    borderColor: 'rgb(147, 197, 253)',
                    backgroundColor: 'rgba(147, 197, 253, 0.1)',
                    tension: 0.3,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                      boxWidth: 10,
                      usePointStyle: true,
                      pointStyle: 'circle',
                    },
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      drawBorder: false,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Appointment Analytics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Appointment Analytics</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-slate-500">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
                <span className="text-xs text-slate-500">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-xs text-slate-500">Cancelled</span>
              </div>
            </div>
          </div>
          
          {/* Appointment Analytics Chart */}
          <div className="h-64">
            <Bar
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Completed',
                    data: [45, 52, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105],
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4,
                  },
                  {
                    label: 'Scheduled',
                    data: [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 4,
                  },
                  {
                    label: 'Cancelled',
                    data: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                      boxWidth: 10,
                      usePointStyle: true,
                      pointStyle: 'circle',
                    },
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    stacked: true,
                    grid: {
                      drawBorder: false,
                    },
                  },
                  x: {
                    stacked: true,
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-800">
                    {item % 2 === 0 ? 'New user registered' : 'Appointment completed'}
                  </h4>
                  <span className="text-xs text-slate-500">2 hours ago</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item % 2 === 0 
                    ? 'A new patient has registered on the platform.' 
                    : 'Dr. Sharma completed an appointment with Patient #1089.'}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default DashboardAnalytics;