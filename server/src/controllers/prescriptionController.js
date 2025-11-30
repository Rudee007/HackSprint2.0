// backend/controllers/prescriptionController.js
// 🔥 PRESCRIPTION CONTROLLER - FOLLOWING CONSULTATION PATTERN

const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// ═══════════════════════════════════════════════════════════
// CREATE PRESCRIPTION
// ═══════════════════════════════════════════════════════════
// backend/controllers/prescriptionController.js

exports.createPrescription = async (req, res) => {
    try {
      const {
        patientId,
        consultationId,
        chiefComplaint,
        diagnosis,
        medicines,
        generalInstructions,
        dietInstructions,
        lifestyleInstructions,
        followUpDays
      } = req.body;
  
      // Validation
      if (!patientId || !chiefComplaint || !medicines || medicines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Patient, chief complaint, and at least one medicine are required'
        });
      }
  
      // Calculate follow-up date
      const followUpDate = followUpDays 
        ? new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
      // 🔥 RETRY LOGIC FOR DUPLICATE KEY ERRORS
      let prescription;
      let retries = 3;
      let created = false;
  
      while (retries > 0 && !created) {
        try {
          // Create prescription
          prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id,
            centerId: req.user.centerId,
            consultationId,
            chiefComplaint,
            diagnosis,
            medicines,
            generalInstructions,
            dietInstructions,
            lifestyleInstructions,
            followUpDate,
            status: 'active'
          });
  
          created = true;
  
        } catch (createError) {
          if (createError.code === 11000 && retries > 1) {
            // Duplicate key error, retry
            console.log(`Duplicate prescription number, retrying... (${retries - 1} attempts left)`);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          } else {
            throw createError;
          }
        }
      }
  
      if (!created) {
        throw new Error('Failed to create prescription after multiple attempts');
      }
  
      // Update medicine stock
      for (const med of medicines) {
        await Medicine.findByIdAndUpdate(
          med.medicineId,
          { $inc: { stock: -med.quantity } },
          { new: true }
        );
      }
  
      // Populate prescription
      await prescription.populate([
        { path: 'patientId', select: 'name email phone' },
        { path: 'doctorId', select: 'name email phone' },
        { path: 'medicines.medicineId', select: 'name genericName category price' }
      ]);
  
      res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: prescription
      });
  
    } catch (error) {
      console.error('❌ Error creating prescription:', error);
      
      // Better error message for duplicate key
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Prescription number conflict. Please try again.',
          error: 'Duplicate prescription number'
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create prescription',
        error: error.message
      });
    }
  };
  
// ═══════════════════════════════════════════════════════════
// GET SINGLE PRESCRIPTION (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .populate('medicines.medicineId', 'name genericName category composition manufacturer');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const totalCost = await prescription.calculateTotalCost();

    res.status(200).json({
      success: true,
      data: {
        prescription,
        totalCost
      }
    });

  } catch (error) {
    console.error('❌ Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// UPDATE PRESCRIPTION (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone')
     .populate('doctorId', 'name email phone');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });

  } catch (error) {
    console.error('❌ Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// DELETE PRESCRIPTION (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByIdAndDelete(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET PATIENT PRESCRIPTIONS (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query = { patientId };
    
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'name email phone')
      .populate('medicines.medicineId', 'name genericName category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPrescriptions: count
      }
    });

  } catch (error) {
    console.error('❌ Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET DOCTOR PRESCRIPTIONS (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    const query = { doctorId };

    if (status) {
      query.status = status;
    }

    // Search by patient name or prescription number
    if (search) {
      const patients = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { patientId: { $in: patients.map(p => p._id) } }
      ];
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPrescriptions: count
      }
    });

  } catch (error) {
    console.error('❌ Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET DOCTOR STATS (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.getDoctorStats = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const [statusStats, totalPrescriptions, followUpDue, todayPrescriptions] = await Promise.all([
      // Group by status
      Prescription.aggregate([
        { $match: { doctorId: mongoose.Types.ObjectId(doctorId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Total prescriptions
      Prescription.countDocuments({ doctorId }),
      
      // Follow-ups due
      Prescription.countDocuments({
        doctorId,
        followUpDate: { $lte: new Date() },
        status: 'active'
      }),
      
      // Today's prescriptions
      Prescription.countDocuments({
        doctorId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Format status stats
    const stats = {
      total: totalPrescriptions,
      followUpDue,
      today: todayPrescriptions,
      byStatus: {}
    };

    statusStats.forEach(stat => {
      stats.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching doctor stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET UPCOMING FOLLOW-UPS (Following Consultation Pattern)
// ═══════════════════════════════════════════════════════════
exports.getUpcomingFollowups = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { days = 7 } = req.query;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const followups = await Prescription.find({
      doctorId,
      status: 'active',
      followUpDate: {
        $gte: new Date(),
        $lte: endDate
      }
    })
    .populate('patientId', 'name email phone')
    .sort({ followUpDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        followups,
        count: followups.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// UPDATE PRESCRIPTION STATUS
// ═══════════════════════════════════════════════════════════
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, outcome, outcomeNotes } = req.body;

    const updateData = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (outcome) {
      updateData.outcome = outcome;
    }

    if (outcomeNotes) {
      updateData.outcomeNotes = outcomeNotes;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// COMPLETE PRESCRIPTION
// ═══════════════════════════════════════════════════════════
exports.completePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, outcomeNotes } = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date(),
        outcome,
        outcomeNotes
      },
      { new: true, runValidators: true }
    ).populate('patientId', 'name email phone');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription marked as completed',
      data: prescription
    });

  } catch (error) {
    console.error('❌ Error completing prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET MEDICINE INVENTORY (WITH SEARCH)
// ═══════════════════════════════════════════════════════════
exports.getMedicineInventory = async (req, res) => {
  try {
    const { search, category, inStock } = req.query;

    const query = {
      centerId: req.user.centerId,
      isActive: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    const medicines = await Medicine.find(query)
      .select('name genericName category stock minStockLevel price mrp defaultDosage manufacturer expiryDate')
      .sort({ name: 1 });

    const medicinesWithStatus = medicines.map(med => ({
      ...med.toObject(),
      isLowStock: med.stock <= med.minStockLevel,
      isExpired: med.expiryDate && new Date() > med.expiryDate,
      stockStatus: med.stock === 0 ? 'out_of_stock' : 
                   med.stock <= med.minStockLevel ? 'low_stock' : 'in_stock'
    }));

    res.status(200).json({
      success: true,
      data: {
        medicines: medicinesWithStatus,
        count: medicinesWithStatus.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// SEARCH MEDICINES (Autocomplete)
// ═══════════════════════════════════════════════════════════
exports.searchMedicines = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const medicines = await Medicine.find({
      centerId: req.user.centerId,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name genericName category stock price defaultDosage')
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: medicines
    });

  } catch (error) {
    console.error('❌ Error searching medicines:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Add this import at the top

// Add this method at the end before module.exports
// ═══════════════════════════════════════════════════════════
// DOWNLOAD PRESCRIPTION PDF
// ═══════════════════════════════════════════════════════════
exports.downloadPrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch prescription with all populated data
    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone age gender')
      .populate('doctorId', 'name email phone specializations qualifications registrationNumber')
      .populate('centerId', 'name address contactInfo')
      .populate('medicines.medicineId', 'name genericName category');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Get doctor and center info
    const doctor = prescription.doctorId;
    const center = prescription.centerId;

    // Generate PDF
    const pdfBuffer = await generatePrescriptionPDF(prescription, doctor, center);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Prescription_${prescription.prescriptionNumber || prescription._id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error generating prescription PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate prescription PDF'
    });
  }
};


// ═══════════════════════════════════════════════════════════
// GET PRESCRIPTION BY CONSULTATION
// ═══════════════════════════════════════════════════════════
exports.getPrescriptionByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const prescription = await Prescription.findOne({ consultationId })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .populate('medicines.medicineId', 'name genericName category');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'No prescription found for this consultation'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('❌ Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
