import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { I18nProvider } from "./utils/i18n.jsx";
import AboutUs from "./pages/AboutUs";
import Service from "./pages/Service";
import Contact from "./pages/Contact";
import PanchakarmePage from "./pages/PanchakarmePage";
import PatientLogin from "./pages/PatientLogin";
import DoctorLogin from "./pages/DoctorLogin";
import TherapistLogin from "./pages/TherapistLogin";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import DoctorProtectedRoute from "./components/DoctorProtectedRoute";
import SimpleDoctorProtectedRoute from "./components/SimpleDoctorProtectedRoute";
import TherapistProtectedRoute from "./components/TherapistProtectedRoute";
import PatientDetailsForm from "./components/PatientDetailsForm";
import AppointmentBooking from "./components/AppointmentBooking";
import DoctorDetail from "./components/DoctorRegistrationForm";
import ConfirmAppointment from "./components/ConfirmAppointment";
import Signup from './pages/Signup';
import IntialPatientProfile from './components/InitialPatientProfile';
import { AuthProvider } from "./context/AuthContext";
import DoctorRegistrationForm from './components/DoctorRegistrationForm';
// ✅ Component to handle conditional Navbar rendering
function AppContent() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // ✅ METHOD 1: Simple approach - check if path starts with excluded routes
  const hideNavbar = pathname.startsWith('/doctor') || pathname.startsWith('/therapist');
  
  // ✅ METHOD 2: More specific approach (if you want granular control)
  // const excludedPaths = ['/doctor-dashboard', '/therapist-dashboard'];
  // const isDoctorRoute = /^\/doctor(\/.*)?$/.test(pathname);
  // const isTherapistRoute = /^\/therapist(\/.*)?$/.test(pathname);
  // const hideNavbar = excludedPaths.includes(pathname) || isDoctorRoute || isTherapistRoute;

  return (
    <div className="min-h-screen">
      {/* ✅ CONDITIONAL: Only render Navbar when hideNavbar is false */}
      {!hideNavbar && <Navbar />}
      
      <Routes>
        {/* Public Routes - ✅ WILL have Navbar */}
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

        {/* Patient Routes - ✅ WILL have Navbar */}
        <Route path="/patient-dashboard" element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        
        {/* Doctor Routes - ❌ NO Navbar */}
        <Route path="/doctor-dashboard" element={
          <SimpleDoctorProtectedRoute>
            <DoctorDashboard />
          </SimpleDoctorProtectedRoute>
        } />
        <Route path="/doctor/:doctorId" element={
          <DoctorProtectedRoute>
            <DoctorDashboard />
          </DoctorProtectedRoute>
        } />
        
        {/* Therapist Routes - ❌ NO Navbar */}
        <Route path="/therapist-dashboard" element={
          <TherapistProtectedRoute>
            <TherapistDashboard />
          </TherapistProtectedRoute>
        } />
        <Route path="/therapist/:therapistId" element={
          <TherapistProtectedRoute>
            <TherapistDashboard />
          </TherapistProtectedRoute>
        } />
        
        {/* Management Routes - ✅ WILL have Navbar */}
        <Route path="/management-dashboard" element={
          <ProtectedRoute>
            <ManagementDashboard />
          </ProtectedRoute>
        } />

        {/* Other Routes - ✅ WILL have Navbar */}
        <Route path="/patient-profile" element={<PatientDetailsForm onSubmit={() => {}} onBack={() => {}} />} />

        <Route path="/appointment-booking" element={<AppointmentBooking />} />
        <Route path="/doctor-form" element={<DoctorRegistrationForm />} />

        <Route path="/doctor/:id" element={<DoctorDetail />} />
        <Route path="/doctor-info/:id" element={<DoctorDetail />} />
        <Route path="/confirm-appointment" element={<ConfirmAppointment />} />
      </Routes>
    </div>
  );
}

// ✅ Main App component
function App() {
  return (
    <Router>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </Router>
  );
}

export default App;
