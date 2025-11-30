import React, { useState } from 'react';
import { Download, FileText, Table, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PatientExport = ({ doctorId, patientData = [], treatmentPlans = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exportingFormat, setExportingFormat] = useState('');

  // Function to convert data to CSV format
  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  // Function to download file
  const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    setLoading(true);
    setExportingFormat(format);
    setError('');
    setSuccess('');

    try {
      console.log(`🔄 Starting ${format.toUpperCase()} export...`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const date = new Date().toISOString().split('T')[0];
      let content, filename, mimeType;

      switch (format) {
        case 'csv':
          content = convertToCSV(patientData);
          filename = `patients_${date}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          // For Excel, we'll create a simple HTML table that Excel can open
          const excelContent = `
            <table>
              <tr>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Symptoms</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Appointment Date</th>
              </tr>
              ${patientData.map(patient => `
                <tr>
                  <td>${patient.patientName}</td>
                  <td>${patient.age}</td>
                  <td>${patient.symptoms}</td>
                  <td>${patient.phone}</td>
                  <td>${patient.email}</td>
                  <td>${patient.address}</td>
                  <td>${patient.status}</td>
                  <td>${patient.appointmentDate}</td>
                </tr>
              `).join('')}
            </table>
          `;
          content = excelContent;
          filename = `patients_${date}.xls`;
          mimeType = 'application/vnd.ms-excel';
          break;
          
        case 'json':
          const jsonData = {
            exportDate: new Date().toISOString(),
            doctorId: doctorId,
            patients: patientData,
            treatmentPlans: treatmentPlans,
            summary: {
              totalPatients: patientData.length,
              totalTreatmentPlans: treatmentPlans.length,
              statusBreakdown: {
                pending: patientData.filter(p => p.status === 'pending').length,
                confirmed: patientData.filter(p => p.status === 'confirmed').length,
                completed: patientData.filter(p => p.status === 'completed').length,
                cancelled: patientData.filter(p => p.status === 'cancelled').length,
              }
            }
          };
          content = JSON.stringify(jsonData, null, 2);
          filename = `patients_backup_${date}.json`;
          mimeType = 'application/json';
          break;
          
        default:
          throw new Error('Unsupported format');
      }
      
      downloadFile(content, filename, mimeType);
      
      setSuccess(`${format.toUpperCase()} export completed successfully! File downloaded: ${filename}`);
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error(`Export error:`, err);
      
      let errorMessage = `Failed to export ${format.toUpperCase()} data`;
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setExportingFormat('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Export Patient Data</h3>
          <p className="text-slate-600 text-sm">Download your patient records in various formats ({patientData.length} patients)</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-center space-x-2 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center space-x-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Export */}
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          className="flex flex-col items-center space-y-3 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            {loading && exportingFormat === 'csv' ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">CSV Format</p>
            <p className="text-xs text-slate-500">Spreadsheet compatible</p>
          </div>
        </button>

        {/* Excel Export */}
        <button
          onClick={() => handleExport('excel')}
          disabled={loading}
          className="flex flex-col items-center space-y-3 p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
            {loading && exportingFormat === 'excel' ? (
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            ) : (
              <Table className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">Excel Format</p>
            <p className="text-xs text-slate-500">Formatted spreadsheet</p>
          </div>
        </button>

        {/* JSON Backup */}
        <button
          onClick={() => handleExport('json')}
          disabled={loading}
          className="flex flex-col items-center space-y-3 p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            {loading && exportingFormat === 'json' ? (
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            ) : (
              <Database className="w-6 h-6 text-purple-600" />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">Complete Backup</p>
            <p className="text-xs text-slate-500">Full data with relations</p>
          </div>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Preparing your {exportingFormat} export...</span>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> All exports are filtered to your personal patient data only. 
          Files are generated securely and not stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default PatientExport;
