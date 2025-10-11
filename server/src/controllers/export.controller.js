// src/controllers/export.controller.js
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Therapist = require('../models/Therapist');
const Consultation = require('../models/Consultation');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// ============ USER EXPORTS (Admin) ============

// Export all users (patients, doctors, therapists)
exports.exportAllUsersCSV = asyncHandler(async (req, res) => {
  const { role, isActive, startDate, endDate } = req.query;
  
  // Build filter
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  console.log('📊 Exporting users with filter:', filter);
  
  const users = await User.find(filter)
    .select('name email phone role isActive address createdAt emailVerified')
    .sort({ createdAt: -1 })
    .lean();
  
  if (!users || users.length === 0) {
    throw new AppError('No users found for export', 404, 'NO_DATA');
  }
  
  // Define CSV fields
  const fields = [
    { label: 'User ID', value: '_id' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Role', value: 'role' },
    { label: 'Status', value: row => row.isActive ? 'Active' : 'Inactive' },
    { label: 'Email Verified', value: row => row.emailVerified ? 'Yes' : 'No' },
    { label: 'City', value: 'address.city' },
    { label: 'State', value: 'address.state' },
    { label: 'Pincode', value: 'address.pincode' },
    { label: 'Registration Date', value: row => new Date(row.createdAt).toLocaleDateString() }
  ];
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(users);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.csv`);
  
  console.log('✅ CSV exported:', users.length, 'users');
  return res.send(csv);
});

// Export users as Excel
exports.exportAllUsersExcel = asyncHandler(async (req, res) => {
  const { role, isActive, startDate, endDate } = req.query;
  
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const users = await User.find(filter)
    .select('name email phone role isActive address createdAt emailVerified')
    .sort({ createdAt: -1 })
    .lean();
  
  if (!users || users.length === 0) {
    throw new AppError('No users found for export', 404, 'NO_DATA');
  }
  
  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');
  
  // Define columns
  worksheet.columns = [
    { header: 'User ID', key: '_id', width: 25 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Email Verified', key: 'emailVerified', width: 15 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Pincode', key: 'pincode', width: 12 },
    { header: 'Registration Date', key: 'createdAt', width: 20 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  
  // Add data rows
  users.forEach(user => {
    worksheet.addRow({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      role: user.role.toUpperCase(),
      status: user.isActive ? 'Active' : 'Inactive',
      emailVerified: user.emailVerified ? 'Yes' : 'No',
      city: user.address?.city || 'N/A',
      state: user.address?.state || 'N/A',
      pincode: user.address?.pincode || 'N/A',
      createdAt: new Date(user.createdAt).toLocaleDateString()
    });
  });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.xlsx`);
  
  await workbook.xlsx.write(res);
  console.log('✅ Excel exported:', users.length, 'users');
  res.end();
});

// ============ PATIENTS EXPORT ============
exports.exportPatientsCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  
  const filter = { role: 'patient' };
  if (status !== undefined) filter.isActive = status === 'active';
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const patients = await User.find(filter)
    .select('name email phone age address profile createdAt')
    .sort({ createdAt: -1 })
    .lean();
  
  if (!patients || patients.length === 0) {
    throw new AppError('No patients found for export', 404, 'NO_DATA');
  }
  
  const fields = [
    { label: 'Patient ID', value: '_id' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Age', value: 'profile.age' },
    { label: 'Gender', value: 'profile.gender' },
    { label: 'Blood Group', value: 'profile.bloodGroup' },
    { label: 'City', value: 'address.city' },
    { label: 'State', value: 'address.state' },
    { label: 'Registration Date', value: row => new Date(row.createdAt).toLocaleDateString() }
  ];
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(patients);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=patients_export_${Date.now()}.csv`);
  
  return res.send(csv);
});

// ============ DOCTORS EXPORT ============
exports.exportDoctorsCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, specialization } = req.query;
  
  const filter = { role: { $in: ['doctor', 'therapist'] } };
  if (status !== undefined) filter.isActive = status === 'active';
  if (specialization) filter['profile.specialization'] = specialization;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const doctors = await User.find(filter)
    .select('name email phone role profile address createdAt')
    .sort({ createdAt: -1 })
    .lean();
  
  if (!doctors || doctors.length === 0) {
    throw new AppError('No doctors found for export', 404, 'NO_DATA');
  }
  
  const fields = [
    { label: 'Doctor ID', value: '_id' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Role', value: 'role' },
    { label: 'Specialization', value: 'profile.specialization' },
    { label: 'Experience', value: 'profile.experience' },
    { label: 'Qualification', value: 'profile.qualification' },
    { label: 'License Number', value: 'profile.licenseNumber' },
    { label: 'City', value: 'address.city' },
    { label: 'State', value: 'address.state' },
    { label: 'Registration Date', value: row => new Date(row.createdAt).toLocaleDateString() }
  ];
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(doctors);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=doctors_export_${Date.now()}.csv`);
  
  return res.send(csv);
});

// ============ APPOINTMENTS EXPORT ============
exports.exportAppointmentsCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (startDate || endDate) {
    filter.scheduledAt = {};
    if (startDate) filter.scheduledAt.$gte = new Date(startDate);
    if (endDate) filter.scheduledAt.$lte = new Date(endDate);
  }
  
  const appointments = await Consultation.find(filter)
    .populate('patientId', 'name email phone')
    .populate('providerId', 'name email role')
    .sort({ scheduledAt: -1 })
    .lean();
  
  if (!appointments || appointments.length === 0) {
    throw new AppError('No appointments found for export', 404, 'NO_DATA');
  }
  
  const fields = [
    { label: 'Appointment ID', value: '_id' },
    { label: 'Patient Name', value: 'patientId.name' },
    { label: 'Patient Email', value: 'patientId.email' },
    { label: 'Patient Phone', value: 'patientId.phone' },
    { label: 'Provider Name', value: 'providerId.name' },
    { label: 'Provider Role', value: 'providerId.role' },
    { label: 'Appointment Date', value: row => new Date(row.scheduledAt).toLocaleString() },
    { label: 'Status', value: 'status' },
    { label: 'Consultation Type', value: 'consultationType' },
    { label: 'Created Date', value: row => new Date(row.createdAt).toLocaleDateString() }
  ];
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(appointments);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=appointments_export_${Date.now()}.csv`);
  
  return res.send(csv);
});
