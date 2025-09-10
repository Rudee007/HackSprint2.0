const moment = require('moment-timezone');
const Availability = require('../models/Availability');
const Consultation = require('../models/Consultation');

class SchedulingService {

    async checkConflicts(providerId, requestedStartTime, duration, excludeConsultationId = null) {
        try {
          const startTime = moment(requestedStartTime);
          const endTime = startTime.clone().add(duration, 'minutes');
          
          console.log(`🔍 Checking conflicts for provider ${providerId}`);
          console.log(`📅 Requested slot: ${startTime.format()} - ${endTime.format()}`);
          
          // Build query to find overlapping consultations
          const query = {
            providerId: providerId,
            status: { $nin: ['cancelled', 'completed', 'no_show'] },
            $or: [
              // Case 1: Existing session starts before requested ends AND ends after requested starts
              {
                scheduledAt: { $lt: endTime.toDate() },
                $expr: {
                  $gt: [
                    { $add: ['$scheduledAt', { $multiply: [{ $ifNull: ['$duration', 30] }, 60000] }] },
                    startTime.toDate()
                  ]
                }
              }
            ]
          };
          
          // Exclude current consultation if updating
          if (excludeConsultationId) {
            query._id = { $ne: excludeConsultationId };
          }
          
          const conflicts = await Consultation.find(query)
            .populate('patientId', 'name')
            .select('scheduledAt duration type status patientId');
          
          if (conflicts.length > 0) {
            console.log(`❌ Found ${conflicts.length} conflicts:`, conflicts);
            return {
              hasConflict: true,
              conflicts: conflicts.map(c => ({
                consultationId: c._id,
                patientName: c.patientId?.name || 'Unknown',
                scheduledAt: c.scheduledAt,
                duration: c.duration,
                type: c.type,
                status: c.status
              }))
            };
          }
          
          console.log(`✅ No conflicts found for the requested time slot`);
          return {
            hasConflict: false,
            conflicts: []
          };
          
        } catch (error) {
          console.error('Error checking conflicts:', error);
          throw new Error(`Failed to check conflicts: ${error.message}`);
        }
      }


      async isSlotAvailable(providerId, requestedStartTime, duration = 30) {
        try {
          // First check if slot exists in generated availability
          const date = moment(requestedStartTime).format('YYYY-MM-DD');
          const time = moment(requestedStartTime).format('HH:mm');
          
          const availability = await this.generateAvailableSlots(providerId, date, 'consultation');
          const requestedSlot = availability.find(slot => slot.start === time);
          
          if (!requestedSlot) {
            return {
              available: false,
              reason: 'Slot not in provider working hours or already blocked'
            };
          }
          
          // Then check for conflicts with existing bookings
          const conflictCheck = await this.checkConflicts(providerId, requestedStartTime, duration);
          
          return {
            available: !conflictCheck.hasConflict,
            reason: conflictCheck.hasConflict ? 'Slot conflicts with existing booking' : 'Available',
            conflicts: conflictCheck.conflicts
          };
          
        } catch (error) {
          throw new Error(`Failed to check slot availability: ${error.message}`);
        }
      }

  // Generate available time slots for a provider
  async generateAvailableSlots(providerId, date, therapyType) {
    try {
      // Get provider availability settings
      const availability = await Availability.findOne({ providerId });
      if (!availability) {
        throw new Error('Provider availability settings not found');
      }
      
      // Check if provider works on this day
      const dayOfWeek = moment(date).format('dddd').toLowerCase();
      if (!availability.workingDays.includes(dayOfWeek)) {
        return [];
      }
      
      // Check for holidays
      if (availability.holidays.includes(date)) {
        return [];
      }
      
      // Get therapy duration and buffer
      const sessionDuration = availability.sessionDurations[therapyType] || 30;
      const bufferTime = availability.bufferTimes[therapyType] || 10;
      const totalSlotTime = sessionDuration + bufferTime;
      
      // Calculate working hours for the date
      const workStart = moment.tz(`${date}T${availability.workingHours.start}`, availability.timezone);
      const workEnd = moment.tz(`${date}T${availability.workingHours.end}`, availability.timezone);
      
      // Get existing bookings for the day
      const existingBookings = await this.getExistingBookings(providerId, date);
      
      // Generate all possible slots
      const slots = [];
      let currentTime = workStart.clone();
      
      while (currentTime.clone().add(totalSlotTime, 'minutes').isSameOrBefore(workEnd)) {
        const slotStart = currentTime.clone();
        const slotEnd = currentTime.clone().add(sessionDuration, 'minutes');
        
        // Check if slot conflicts with breaks
        if (!this.conflictsWithBreaks(slotStart, slotEnd, availability.breaks)) {
          // Check if slot conflicts with existing bookings
          if (!this.conflictsWithBookings(slotStart, slotEnd, existingBookings)) {
            slots.push({
              start: slotStart.format('HH:mm'),
              end: slotEnd.format('HH:mm'),
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              available: true
            });
          }
        }
        
        currentTime.add(totalSlotTime, 'minutes');
      }
      
      return slots;
      
    } catch (error) {
      throw new Error(`Failed to generate slots: ${error.message}`);
    }
  }
  
  // Get existing bookings for provider on specific date
  async getExistingBookings(providerId, date) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    
    return await Consultation.find({
      providerId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled', 'completed'] }
    }).select('scheduledAt type');
  }
  
  // Check if slot conflicts with break times
  conflictsWithBreaks(slotStart, slotEnd, breaks) {
    for (const breakTime of breaks) {
      const breakStart = moment(slotStart.format('YYYY-MM-DD') + 'T' + breakTime.start);
      const breakEnd = moment(slotStart.format('YYYY-MM-DD') + 'T' + breakTime.end);
      
      if (this.timeOverlap(slotStart, slotEnd, breakStart, breakEnd)) {
        return true;
      }
    }
    return false;
  }
  
  // Check if slot conflicts with existing bookings
  conflictsWithBookings(slotStart, slotEnd, bookings) {
    for (const booking of bookings) {
      const bookingStart = moment(booking.scheduledAt);
      const bookingEnd = moment(booking.scheduledAt).add(30, 'minutes'); // Default session duration
      
      if (this.timeOverlap(slotStart, slotEnd, bookingStart, bookingEnd)) {
        return true;
      }
    }
    return false;
  }
  
  // Check if two time periods overlap
  timeOverlap(start1, end1, start2, end2) {
    return start1.isBefore(end2) && start2.isBefore(end1);
  }
  
  // Get provider availability settings
  async getProviderAvailability(providerId) {
    return await Availability.findOne({ providerId });
  }
  
  // Update provider availability
  async updateProviderAvailability(providerId, availabilityData) {
    return await Availability.findOneAndUpdate(
      { providerId },
      availabilityData,
      { new: true, upsert: true }
    );
  }
}


module.exports = new SchedulingService();
