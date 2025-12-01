// backend/controllers/courseTemplate.controller.js
// 📋 COURSE TEMPLATE CONTROLLER - READ-ONLY FOR DOCTORS

const mongoose = require('mongoose');
const CourseTemplate = require('../models/CourseTemplate')
const logger = require('../config/logger');

/**
 * Get All Course Templates (with filters)
 * GET /api/course-templates
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const {
      category,
      panchakarmaType,
      isFeatured
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (category) query.category = category;
    if (panchakarmaType) query.panchakarmaType = panchakarmaType;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    // Get templates
    const templates = await CourseTemplate.find(query)
      .select('templateName displayName templateCode panchakarmaType totalDuration estimatedSessionCount description pricing popularityRank isFeatured')
      .sort({ popularityRank: -1, templateName: 1 })
      .lean();

    logger.info(`Retrieved ${templates.length} course templates`, { filters: req.query });

    return res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    logger.error('Get all templates error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Featured Templates
 * GET /api/course-templates/featured
 */
exports.getFeaturedTemplates = async (req, res) => {
  try {
    const templates = await CourseTemplate.find({
      isActive: true,
      isFeatured: true
    })
    .select('templateName displayName templateCode panchakarmaType totalDuration estimatedSessionCount description pricing.basePrice')
    .sort({ popularityRank: -1 })
    .limit(5)
    .lean();

    logger.info(`Retrieved ${templates.length} featured templates`);

    return res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    logger.error('Get featured templates error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Single Template by ID (with full details)
 * GET /api/course-templates/:id
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await CourseTemplate.findOne({
      _id: id,
      isActive: true
    })
    .populate({
      path: 'phases.therapies.therapyId',
      select: 'therapyName therapyCode standardDuration bufferTime panchakarmaPhase panchakarmaType prerequisites constraints resourceRequirements'
    })
    .select('-__v -createdBy -updatedBy')
    .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    logger.info(`Retrieved template: ${template.templateCode}`);

    return res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Get template by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Template by Code
 * GET /api/course-templates/code/:code
 */
exports.getTemplateByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const template = await CourseTemplate.findOne({
      templateCode: code.toUpperCase(),
      isActive: true
    })
    .populate({
      path: 'phases.therapies.therapyId',
      select: 'therapyName therapyCode standardDuration panchakarmaPhase panchakarmaType prerequisites'
    })
    .select('-__v -createdBy -updatedBy')
    .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template with code "${code}" not found`
      });
    }

    logger.info(`Retrieved template by code: ${code}`);

    return res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Get template by code error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Template Summary
 * GET /api/course-templates/:id/summary
 */
exports.getTemplateSummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await CourseTemplate.findOne({
      _id: id,
      isActive: true
    })
    .select('templateName displayName totalDuration estimatedSessionCount phases')
    .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Build phase breakdown without populating
    const phaseBreakdown = template.phases.map(phase => {
      const sessionCount = phase.therapies.reduce((sum, therapy) => sum + therapy.sessionCount, 0);
      
      return {
        phaseName: phase.phaseName,
        sessionCount: sessionCount,
        totalDays: phase.totalDays,
        therapyCount: phase.therapies.length
      };
    });

    const summary = {
      templateName: template.templateName,
      displayName: template.displayName,
      totalDuration: template.totalDuration,
      estimatedSessionCount: template.estimatedSessionCount,
      phaseBreakdown: phaseBreakdown
    };

    logger.info(`Retrieved template summary: ${template.templateName}`);

    return res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Get template summary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Increment Template Usage Count
 * POST /api/course-templates/:id/increment-usage
 */
exports.incrementUsage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await CourseTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.incrementUsage();

    logger.info(`Incremented usage count for template: ${template.templateCode}`, {
      newCount: template.usageCount,
      doctorId: req.user?._id
    });

    return res.json({
      success: true,
      data: {
        templateCode: template.templateCode,
        usageCount: template.usageCount
      }
    });

  } catch (error) {
    logger.error('Increment template usage error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Templates for Dropdown/Selection
 * GET /api/course-templates/dropdown
 */
exports.getTemplatesForDropdown = async (req, res) => {
  try {
    const { panchakarmaType } = req.query;

    let query = { isActive: true };
    if (panchakarmaType) query.panchakarmaType = panchakarmaType;

    const templates = await CourseTemplate.find(query)
      .select('templateName displayName templateCode panchakarmaType totalDuration estimatedSessionCount')
      .sort({ popularityRank: -1, templateName: 1 })
      .lean();

    return res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    logger.error('Get templates for dropdown error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
