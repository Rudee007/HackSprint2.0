import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAuthService } from '../services/therapistAuthService';

const TherapistProtectedRoute = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = therapistAuthService.isLoggedIn();
        if (!isLoggedIn) {
            navigate('/therapist-login');
        }
    }, [navigate]);

    const isLoggedIn = therapistAuthService.isLoggedIn();

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-xl text-slate-600 animate-pulse">Loading...</div>
            </div>
        );
    }

    return children;
};

export default TherapistProtectedRoute;