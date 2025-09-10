import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    TrendingUp,
    Search,
    Filter,
    Plus,
    Eye,
    Calendar,
    LogOut,
    User
} from "lucide-react";
import { therapistAuthService } from "../services/therapistAuthService";
import { treatmentService } from "../services/treatmentService";
import Footer from "../components/Footer";

const TherapistDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("patients");
    const [therapistInfo, setTherapistInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [assignedPatients, setAssignedPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [progressUpdate, setProgressUpdate] = useState({
        status: '',
        notes: ''
    });

    useEffect(() => {
        const currentTherapist = therapistAuthService.getCurrentTherapist();
        if (!currentTherapist) {
            navigate("/therapist-login");
            return;
        }
        setTherapistInfo(currentTherapist);
        loadAssignedPatients(currentTherapist.name);
    }, [navigate]);

    const loadAssignedPatients = async (therapistName) => {
        try {
            const patients = treatmentService.getTreatmentPlansForTherapist(therapistName);
            setAssignedPatients(patients);
        } catch (error) {
            console.error('Error loading assigned patients:', error);
        }
    };

    const handleProgressUpdate = async (e) => {
        e.preventDefault();

        if (!selectedPatient || !progressUpdate.status) {
            alert('Please select a patient and progress status');
            return;
        }

        const result = treatmentService.updateTreatmentProgress(selectedPatient.id, {
            progressStatus: progressUpdate.status,
            progressNotes: progressUpdate.notes,
            lastUpdatedBy: therapistInfo.name
        });

        if (result.success) {
            alert('Progress updated successfully');
            setProgressUpdate({ status: '', notes: '' });
            setSelectedPatient(null);
            loadAssignedPatients(therapistInfo.name);
        } else {
            alert('Error updating progress: ' + result.error);
        }
    };

    const handleLogout = () => {
        therapistAuthService.logout();
        navigate("/therapist-login");
    };

    // Transform assigned patients for display
    const patients = assignedPatients.map(plan => ({
        id: plan.id,
        name: `Patient ${plan.patientId}`,
        condition: plan.patientName,
        treatmentType: plan.treatmentType,
        doctorName: plan.doctorName,
        appointmentDate: plan.appointmentDate,
        appointmentTime: plan.appointmentTime,
        protocol: plan.detailedProtocol,
        status: plan.progressStatus || "Active",
        avatar: `P${plan.patientId}`,
        createdAt: plan.createdAt,
        lastUpdated: plan.updatedAt
    }));

    if (!therapistInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-gray-600 animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex flex-1">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">MD</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">MedDashboard</h1>
                                <p className="text-sm text-gray-500">Therapist Portal</p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveSection("patients")}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === "patients"
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Patient Management</span>
                            </button>

                            <button
                                onClick={() => setActiveSection("progress")}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === "progress"
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span>Update Progress</span>
                            </button>

                            <button
                                onClick={() => setActiveSection("profile")}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === "profile"
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span>Profile & Settings</span>
                            </button>
                        </nav>
                    </div>


                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {activeSection === "patients" && "Patient Management"}
                                    {activeSection === "progress" && "Update Progress"}
                                    {activeSection === "profile" && "Profile & Settings"}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {activeSection === "patients" && "Manage your patient records and information"}
                                    {activeSection === "progress" && "Update patient treatment progress"}
                                    {activeSection === "profile" && "Manage your profile and settings"}
                                </p>
                            </div>
                            {activeSection === "patients" && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadAssignedPatients(therapistInfo.name)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        <span>Refresh</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            console.log('Current therapist info:', therapistInfo);
                                            console.log('localStorage treatmentPlans before fix:', localStorage.getItem('treatmentPlans'));

                                            // Fix missing therapist assignments using the service
                                            const result = await treatmentService.fixMissingTherapistAssignments();
                                            console.log('Fix result:', result);

                                            console.log('localStorage treatmentPlans after fix:', localStorage.getItem('treatmentPlans'));
                                            console.log('Plans for this therapist:', treatmentService.getTreatmentPlansForTherapist(therapistInfo.name));

                                            // Refresh the patient list
                                            loadAssignedPatients(therapistInfo.name);

                                            if (result.success && result.fixedCount > 0) {
                                                alert(`Fixed ${result.fixedCount} treatment plans with missing therapist assignments!`);
                                            } else if (result.success) {
                                                alert('No treatment plans needed fixing.');
                                            } else {
                                                alert('Error fixing treatment plans: ' + result.error);
                                            }
                                        }}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Fix Plans</span>
                                    </button>
                                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        <span>Add New Patient</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8">
                        {activeSection === "patients" && (
                            <div className="space-y-6">
                                {/* Search and Filter */}
                                <div className="flex items-center justify-between">
                                    <div className="relative">
                                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search patients..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Filter className="w-4 h-4" />
                                        <span>Filter</span>
                                    </button>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                                <p className="text-2xl font-bold text-gray-900">{assignedPatients.length}</p>
                                                <p className="text-sm text-green-600">Assigned to you</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                                                <p className="text-2xl font-bold text-gray-900">{assignedPatients.filter(p => !p.progressStatus || p.progressStatus === 'Active').length}</p>
                                                <p className="text-sm text-green-600">In treatment</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                                <p className="text-2xl font-bold text-gray-900">{assignedPatients.filter(p => p.progressStatus === 'Completed').length}</p>
                                                <p className="text-sm text-green-600">Successfully treated</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                                                <p className="text-2xl font-bold text-gray-900">{assignedPatients.filter(p => new Date(p.appointmentDate) > new Date()).length}</p>
                                                <p className="text-sm text-orange-600">Scheduled</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Patients Table */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
                                        <p className="text-sm text-gray-500">View and manage your patient records</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {patients.length > 0 ? patients.map((patient) => (
                                                    <tr key={patient.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                    <span className="text-white font-medium text-sm">{patient.avatar}</span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                                                    <div className="text-sm text-gray-500">Assigned by: {patient.doctorName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{patient.condition}</div>
                                                            <div className="text-xs text-gray-500">{patient.treatmentType}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{patient.appointmentDate}</div>
                                                            <div className="text-xs text-gray-500">{patient.appointmentTime}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${patient.status === 'Active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : patient.status === 'Completed'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {patient.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => setSelectedPatient(assignedPatients.find(p => p.id === patient.id))}
                                                                    className="text-blue-600 hover:text-blue-900"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPatient(assignedPatients.find(p => p.id === patient.id));
                                                                        setActiveSection('progress');
                                                                    }}
                                                                    className="text-green-600 hover:text-green-900"
                                                                    title="Update Progress"
                                                                >
                                                                    <TrendingUp className="w-4 h-4" />
                                                                </button>
                                                                <button className="text-gray-600 hover:text-gray-900" title="Schedule">
                                                                    <Calendar className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                            <p>No patients assigned yet</p>
                                                            <p className="text-sm">Patients will appear here when doctors create treatment plans</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "progress" && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Update Patient Progress</h3>

                                    {selectedPatient && (
                                        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                                            <h4 className="font-semibold text-emerald-800 mb-2">Selected Patient Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><span className="font-medium">Patient ID:</span> {selectedPatient.patientId}</div>
                                                <div><span className="font-medium">Condition:</span> {selectedPatient.patientName}</div>
                                                <div><span className="font-medium">Treatment:</span> {selectedPatient.treatmentType}</div>
                                                <div><span className="font-medium">Doctor:</span> {selectedPatient.doctorName}</div>
                                                <div><span className="font-medium">Next Appointment:</span> {selectedPatient.appointmentDate} at {selectedPatient.appointmentTime}</div>
                                            </div>
                                            <div className="mt-3">
                                                <span className="font-medium">Treatment Protocol:</span>
                                                <p className="text-sm text-gray-700 mt-1">{selectedPatient.detailedProtocol}</p>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleProgressUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
                                            <select
                                                value={selectedPatient?.id || ''}
                                                onChange={(e) => {
                                                    const patient = assignedPatients.find(p => p.id === e.target.value);
                                                    setSelectedPatient(patient);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Choose a patient...</option>
                                                {assignedPatients.map(patient => (
                                                    <option key={patient.id} value={patient.id}>
                                                        Patient {patient.patientId} - {patient.patientName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Status</label>
                                            <select
                                                value={progressUpdate.status}
                                                onChange={(e) => setProgressUpdate({ ...progressUpdate, status: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Select progress status...</option>
                                                <option value="Excellent Progress">Excellent Progress</option>
                                                <option value="Good Progress">Good Progress</option>
                                                <option value="Moderate Progress">Moderate Progress</option>
                                                <option value="Slow Progress">Slow Progress</option>
                                                <option value="No Change">No Change</option>
                                                <option value="Completed">Treatment Completed</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Notes</label>
                                            <textarea
                                                rows={4}
                                                value={progressUpdate.notes}
                                                onChange={(e) => setProgressUpdate({ ...progressUpdate, notes: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter detailed progress notes, observations, and recommendations..."
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button
                                                type="submit"
                                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                Update Progress
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeSection === "profile" && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <p className="mt-1 text-sm text-gray-900">{therapistInfo.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Specialization</label>
                                            <p className="mt-1 text-sm text-gray-900">{therapistInfo.specialization}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <p className="mt-1 text-sm text-gray-900">{therapistInfo.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default TherapistDashboard;