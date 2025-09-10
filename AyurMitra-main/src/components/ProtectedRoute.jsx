import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isSignedIn && user) {
      const currentPath = location.pathname;
      
      // Don't redirect if already on a dashboard
      if (currentPath.includes('dashboard')) return;
      
      // Get user role from metadata or email domain
      const userRole = user.publicMetadata?.role || getUserRoleFromEmail(user.primaryEmailAddress?.emailAddress);
      
      // Redirect based on role
      switch (userRole) {
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'management':
          navigate('/management-dashboard');
          break;
        default:
          // Default to patient dashboard if no role specified
          navigate('/patient-dashboard');
      }
    }
  }, [isSignedIn, user, navigate, location]);

  // Helper function to determine role from email or other criteria
  const getUserRoleFromEmail = (email) => {
    if (!email) return 'patient';
    
    // You can customize this logic based on your needs
    if (email.includes('doctor') || email.includes('dr.')) return 'doctor';
    if (email.includes('admin') || email.includes('management')) return 'management';
    return 'patient';
  };

  return children;
};

export default ProtectedRoute;