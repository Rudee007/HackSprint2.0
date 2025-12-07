import React from 'react';
import { User, Lock, Info } from 'lucide-react';

const DemoCredentials = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Info className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Demo Doctor Credentials</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-700">Dr. Gopal Menon</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Username:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">vaidya.gopal.menon</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Password:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">NGxX5KTt</code>
            </div>
            <div className="text-xs text-blue-600 mt-2">Specializes in: Virechana</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-700">Dr. Nisha Bhat</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Username:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">vaidya.nisha.bhat</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Password:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">yaYbaCIm</code>
            </div>
            <div className="text-xs text-blue-600 mt-2">Specializes in: Nasya</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-blue-700">
        <p><strong>How it works:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Patient searches symptoms → gets 5 matching doctors</li>
          <li>Patient books appointment with specific doctor</li>
          <li>Doctor logs in with CSV credentials → sees only their appointments</li>
          <li>Single dashboard works for all 2000+ doctors dynamically</li>
        </ol>
      </div>
    </div>
  );
};

export default DemoCredentials;