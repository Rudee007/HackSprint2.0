const Patient = require('../models/Patient');
const { generateCSV, generateExcel } = require('../utils/csvExporter');

exports.exportPatientsCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const patients = await Patient.find({ userId });
    
    const csv = generateCSV(patients);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
};

exports.exportPatientsExcel = async (req, res) => {
  try {
    const userId = req.user.id;
    const patients = await Patient.find({ userId });
    
    const workbook = generateExcel(patients);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
};
