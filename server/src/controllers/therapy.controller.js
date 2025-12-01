// backend/controllers/therapy.controller.js
// 🌿 THERAPY MASTER CONTROLLER - READ-ONLY FOR DOCTORS

const mongoose = require('mongoose');
const Therapy = mongoose.model('Therapy');
const logger = require('../utils/logger');

/**
 * Get All Therapies (with filters)
 * GET /api/therapies
 */
exports.getAllTherapies = async (req, res) => {
  try {
    const {
      phase,
      type,
      category,
      skillLevel,
      search
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (phase) query.panchakarmaPhase = phase;
    if (type) query.panchakarmaType = type;
    if (category) query.category = category;
    if (skillLevel) query['resourceRequirements.skillLevel'] = skillLevel;

    // Search by name or code
    if (search) {
      query.$or = [
        { therapyName: { $regex: search, $options: 'i' } },
        { therapyCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Get therapies
    const therapies = await Therapy.find(query)
      .select('therapyCode therapyName panchakarmaPhase panchakarmaType standardDuration bufferTime category prerequisites constraints resourceRequirements')
      .sort({ panchakarmaPhase: 1, therapyName: 1 })
      .lean();

    logger.info(`Retrieved ${therapies.length} therapies`, { filters: req.query });

    return res.json({
      success: true,
      count: therapies.length,
      data: therapies
    });

  } catch (error) {
    logger.error('Get all therapies error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Therapies Grouped by Phase
 * GET /api/therapies/by-phase
 */
exports.getTherapiesByPhase = async (req, res) => {
  try {
    const therapies = await Therapy.find({ isActive: true })
      .select('therapyCode therapyName panchakarmaPhase panchakarmaType standardDuration')
      .sort({ therapyName: 1 })
      .lean();

    // Group by phase
    const grouped = {
      purvakarma: [],
      pradhanakarma: [],
      paschatkarma: [],
      standalone: []
    };

    therapies.forEach(therapy => {
      const phase = therapy.panchakarmaPhase;
      if (grouped[phase]) {
        grouped[phase].push(therapy);
      }
    });

    logger.info('Retrieved therapies grouped by phase');

    return res.json({
      success: true,
      data: grouped
    });

  } catch (error) {
    logger.error('Get therapies by phase error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Single Therapy by ID
 * GET /api/therapies/:id
 */
exports.getTherapyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid therapy ID'
      });
    }

    const therapy = await Therapy.findById(id)
      .select('-__v -createdBy -updatedBy')
      .lean();

    if (!therapy) {
      return res.status(404).json({
        success: false,
        message: 'Therapy not found'
      });
    }

    logger.info(`Retrieved therapy: ${therapy.therapyCode}`);

    return res.json({
      success: true,
      data: therapy
    });

  } catch (error) {
    logger.error('Get therapy by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Therapy by Code
 * GET /api/therapies/code/:code
 */
exports.getTherapyByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const therapy = await Therapy.findOne({
      therapyCode: code.toUpperCase(),
      isActive: true
    })
    .select('-__v -createdBy -updatedBy')
    .lean();

    if (!therapy) {
      return res.status(404).json({
        success: false,
        message: `Therapy with code "${code}" not found`
      });
    }

    logger.info(`Retrieved therapy by code: ${code}`);

    return res.json({
      success: true,
      data: therapy
    });

  } catch (error) {
    logger.error('Get therapy by code error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Therapies for Dropdown/Selection
 * GET /api/therapies/dropdown
 */
exports.getTherapiesForDropdown = async (req, res) => {
  try {
    const { phase, category } = req.query;

    let query = { isActive: true };
    if (phase) query.panchakarmaPhase = phase;
    if (category) query.category = category;

    const therapies = await Therapy.find(query)
      .select('therapyCode therapyName panchakarmaPhase panchakarmaType standardDuration')
      .sort({ therapyName: 1 })
      .lean();

    return res.json({
      success: true,
      count: therapies.length,
      data: therapies
    });

  } catch (error) {
    logger.error('Get therapies for dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
