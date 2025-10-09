// src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Service from './pages/Service';
import Contact from './pages/Contact';
import PanchakarmePage from './pages/PanchakarmePage';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import TherapistLogin from './pages/TherapistLogin';
import Signup from './pages/Signup';
import IntialPatientProfile from './components/InitialPatientProfile';

import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import AdminDashboard from './pages/AdminDashboard';

import ProtectedRoute from './components/ProtectedRoute';
import DoctorProtectedRoute from './components/DoctorProtectedRoute';
import TherapistProtectedRoute from './components/TherapistProtectedRoute';

import PatientDetailsForm from './components/PatientDetailsForm';
import AppointmentBooking from './components/AppointmentBooking';
import DoctorDetail from './components/DoctorRegistrationForm';
import ConfirmAppointment from './components/ConfirmAppointment';
import DoctorRegistrationForm from './components/DoctorRegistrationForm';
import ConsultationHistory from './components/ConsultationHistory';
import { I18nProvider } from './utils/i18n.jsx';
import { AuthProvider } from './context/AuthContext';

// ✅ ONLY ADDITION: Import RealTimeProvider
import { RealTimeProvider } from './context/RealTimeContext';
import RealTimeSessionDashboard from './components/realtime/RealTimeSessionDashboard';

/* ---------- Layout wrapper that decides when to hide Navbar ---------- */
function AppContent() {
  const { pathname } = useLocation();

  // Hide Navbar for any route that starts with /doctor or /therapist
  const hideNavbar =
    pathname.startsWith('/doctor') || pathname.startsWith('/therapist');

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ---------- Public routes ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/service" element={<Service />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/panchakarma" element={<PanchakarmePage />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/therapist-login" element={<TherapistLogin />} />
        <Route path="/initial-profile" element={<IntialPatientProfile />} />

        {/* ---------- Patient routes (with Navbar) ---------- */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- Doctor routes (no Navbar) ---------- */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route
          path="/doctor/:doctorId"
          element={
            <DoctorProtectedRoute>
              <DoctorDashboard />
            </DoctorProtectedRoute>
          }
        />

        {/* ✅ ONLY ADDITION: Real-Time Routes */}
        <Route
          path="/doctor/realtime"
          element={
            <DoctorProtectedRoute>
              <RealTimeSessionDashboard />
            </DoctorProtectedRoute>
          }
        />

        {/* ---------- Therapist routes (no Navbar) ---------- */}
        <Route
          path="/therapist-dashboard"
          element={
            <TherapistDashboard />
          }
        />
        <Route
          path="/therapist/:therapistId"
          element={
            // <TherapistProtectedRoute>
              <TherapistDashboard />
            // </TherapistProtectedRoute>
          }
        />

        {/* ---------- Management routes ---------- */}
        <Route
          path="/management-dashboard"
          element={
            <ProtectedRoute>
              <ManagementDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- Admin dashboard (no login screen) ---------- */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* ---------- Misc. routes ---------- */}
        <Route
          path="/patient-profile"
          element={<PatientDetailsForm onSubmit={() => {}} onBack={() => {}} />}
        />
        <Route path="/appointment-booking" element={<AppointmentBooking />} />
        <Route path="/doctor-form" element={<DoctorRegistrationForm />} />
        <Route path="/doctor/:id" element={<DoctorDetail />} />
        <Route path="/doctor-info/:id" element={<DoctorDetail />} />
        <Route path="/confirm-appointment" element={<ConfirmAppointment />} />
      </Routes>
    </div>
  );
}

/* --------------------------- Main App --------------------------- */
export default function App() {
  return (
    <Router>
      <I18nProvider>
        <AuthProvider>
          {/* ✅ ONLY CHANGE: Wrap with RealTimeProvider to fix the error */}
          <RealTimeProvider>
            <AppContent />
          </RealTimeProvider>
        </AuthProvider>
      </I18nProvider>
    </Router>
  );
}
