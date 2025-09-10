const schedulingService = require('../services/scheduling.service');
const { AppError, asyncHandler } = require('../middleware/error.middleware'); // Import asyncHandler
const moment = require('moment');

class SchedulingController {
  
  // Get available slots for provider
  getAvailableSlots = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { date, therapyType } = req.query;
    
    // Validation
    if (!date) {
      throw new AppError('Date is required (YYYY-MM-DD format)', 400, 'MISSING_DATE');
    }
    
    if (!therapyType) {
      throw new AppError('Therapy type is required', 400, 'MISSING_THERAPY_TYPE');
    }
    
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'INVALID_DATE_FORMAT');
    }
    
    console.log(`🗓️ Getting available slots for provider ${providerId} on ${date} for ${therapyType}`);
    
    const slots = await schedulingService.generateAvailableSlots(providerId, date, therapyType);
    
    return res.json({
      success: true,
      message: `Found ${slots.length} available slots`,
      data: {
        providerId,
        date,
        therapyType,
        slots,
        totalSlots: slots.length
      }
    });
  });
  
  // Get provider availability settings
  getProviderAvailability = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    
    const availability = await schedulingService.getProviderAvailability(providerId);
    
    if (!availability) {
      throw new AppError('Provider availability settings not found', 404, 'PROVIDER_NOT_FOUND');
    }
    
    return res.json({
      success: true,
      data: availability
    });
  });
  
  // Update provider availability settings
  updateProviderAvailability = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const availabilityData = req.body;
    
    // Add providerId to the data
    availabilityData.providerId = providerId;
    
    const availability = await schedulingService.updateProviderAvailability(providerId, availabilityData);
    
    return res.json({
      success: true,
      message: 'Provider availability updated successfully',
      data: availability
    });
  });
}

module.exports = new SchedulingController();
