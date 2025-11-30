import { useState } from 'react';
import { Search, Filter, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AppointmentManagement = () => {
  // Mock appointment data
  const [appointments, setAppointments] = useState([
    { 
      id: 1, 
      patientName: 'Rahul Sharma', 
      doctorName: 'Dr. Priya Patel', 
      date: '15 Jul 2023', 
      time: '10:00 AM', 
      type: 'Consultation',
      status: 'Completed'
    },
    { 
      id: 2, 
      patientName: 'Amit Kumar', 
      doctorName: 'Dr. Vikram Singh', 
      date: '16 Jul 2023', 
      time: '11:30 AM', 
      type: 'Follow-up',
      status: 'Scheduled'
    },
    { 
      id: 3, 
      patientName: 'Neha Gupta', 
      doctorName: 'Dr. Ananya Reddy', 
      date: '16 Jul 2023', 
      time: '2:00 PM', 
      type: 'Therapy',
      status: 'Scheduled'
    },
    { 
      id: 4, 
      patientName: 'Sanjay Verma', 
      doctorName: 'Dr. Priya Patel', 
      date: '14 Jul 2023', 
      time: '3:30 PM', 
      type: 'Consultation',
      status: 'Cancelled'
    },
    { 
      id: 5, 
      patientName: 'Rajesh Khanna', 
      doctorName: 'Dr. Vikram Singh', 
      date: '17 Jul 2023', 
      time: '9:00 AM', 
      type: 'Follow-up',
      status: 'Scheduled'
    },
    { 
      id: 6, 
      patientName: 'Meera Joshi', 
      doctorName: 'Dr. Ananya Reddy', 
      date: '13 Jul 2023', 
      time: '1:00 PM', 
      type: 'Consultation',
      status: 'Completed'
    },
    { 
      id: 7, 
      patientName: 'Kiran Rao', 
      doctorName: 'Dr. Priya Patel', 
      date: '18 Jul 2023', 
      time: '4:30 PM', 
      type: 'Therapy',
      status: 'Scheduled'
    },
    { 
      id: 8, 
      patientName: 'Vivek Oberoi', 
      doctorName: 'Dr. Vikram Singh', 
      date: '12 Jul 2023', 
      time: '11:00 AM', 
      type: 'Consultation',
      status: 'Completed'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Filter appointments based on search term, status, and type
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || appointment.status === selectedStatus;
    const matchesType = selectedType === 'All' || appointment.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle appointment status change
  const handleStatusChange = (appointmentId, newStatus) => {
    setAppointments(appointments.map(appointment => {
      if (appointment.id === appointmentId) {
        return { ...appointment, status: newStatus };
      }
      return appointment;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Appointment Management</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Appointment
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient or doctor name..."
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Consultation">Consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Therapy">Therapy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm">
            List View
          </button>
          <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">
            Calendar View
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-slate-600">July 2023</span>
          <button className="p-2 rounded-lg hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{appointment.patientName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{appointment.doctorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-slate-900">
                          <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                          {appointment.date}
                        </div>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status === 'Completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {appointment.status === 'Scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                        {appointment.status === 'Cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {appointment.status === 'Scheduled' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'Completed')}
                              className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium hover:bg-green-100"
                            >
                              Complete
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'Cancelled')}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-100">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-slate-500">
                    No appointments found matching your filters.
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
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAppointments.length}</span> of{' '}
                <span className="font-medium">{filteredAppointments.length}</span> results
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

export default AppointmentManagement;