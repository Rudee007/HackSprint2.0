import { Navigate } from 'react-router-dom';
import { doctorAuthService } from '../services/doctorAuthService';

const SimpleDoctorProtectedRoute = ({ children }) => {
  const isLoggedIn = doctorAuthService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/doctor-login" replace />;
  }
  
  return children;
};

export default SimpleDoctorProtectedRoute;