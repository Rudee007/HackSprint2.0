import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, User, Stethoscope, ArrowLeft } from 'lucide-react';

const ConfirmAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Appointment Data</h2>
          <button
            onClick={() => navigate('/appointment-booking')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Start New Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <button
          onClick={() => navigate(`/doctor/${doctor.id}`, { state: { doctor } })}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Doctor Details</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Request Sent!</h1>
            <p className="text-gray-600 text-lg">Your appointment request has been successfully submitted.</p>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Doctor</p>
                  <p className="text-gray-600">{doctor.vaidya_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Treatment</p>
                  <p className="text-gray-600">{doctor.panchakarma}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Status</p>
                  <p className="text-green-600 font-semibold">Pending Confirmation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                <span>Our team will review your appointment request within 24 hours</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                <span>You'll receive a confirmation call with available time slots</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                <span>Prepare for your consultation with {doctor.vaidya_name}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/appointment-booking')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Book Another Appointment
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need help? Contact us at <span className="font-semibold">+91-XXXX-XXXX</span> or <span className="font-semibold">support@ayurveda.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAppointment;