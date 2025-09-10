// src/services/alternativeSlots.service.js
const moment = require('moment');

class AlternativeSlotsService {
  
  /**
   * Dynamically fetch provider availability based on provider type
   */
  async getProviderAvailability(providerId) {
    try {
      console.log(`🔍 Fetching availability for provider: ${providerId}`);
      
      // Try to find as Therapist first
      const Therapist = require('../models/Therapist');
      let therapist = await Therapist.findOne({ userId: providerId });
      
      if (therapist && therapist.availability) {
        console.log(`✅ Found therapist availability`);
        return {
          type: 'therapist',
          workingDays: therapist.availability.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workingHours: therapist.availability.workingHours || { start: '09:00', end: '17:00' },
          sessionDuration: therapist.availability.sessionDuration || 60,
          maxPatientsPerDay: therapist.availability.maxPatientsPerDay || 10
        };
      }
      
      // If not found, try as Doctor
      const Doctor = require('../models/Doctor');
      let doctor = await Doctor.findOne({ userId: providerId });
      
      if (doctor && doctor.consultationSettings) {
        console.log(`✅ Found doctor availability`);
        const settings = doctor.consultationSettings;
        return {
          type: 'doctor',
          workingDays: settings.availability?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          workingHours: settings.availability?.workingHours || { start: '09:00', end: '18:00' },
          sessionDuration: settings.availability?.consultationDuration || 30,
          maxPatientsPerDay: settings.preferences?.maxPatientsPerDay || 20
        };
      }
      
      // Fallback to default availability
      console.log(`⚠️ Provider not found, using default availability`);
      return {
        type: 'unknown',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        sessionDuration: 60,
        maxPatientsPerDay: 10
      };
      
    } catch (error) {
      console.error(`❌ Error fetching provider availability:`, error);
      // Return default availability on error
      return {
        type: 'unknown',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        sessionDuration: 60,
        maxPatientsPerDay: 10
      };
    }
  }
  
  /**
   * Main method to find alternative appointment slots
   */
  async findAlternatives(providerId, requestedDateTime, duration, sessionType = 'consultation', maxSuggestions = 5) {
    console.log(`🔍 Finding alternatives for provider ${providerId}`);
    console.log(`🔍 Requested: ${requestedDateTime}, Duration: ${duration}, Type: ${sessionType}`);
    
    const alternatives = [];
    const requestedMoment = moment(requestedDateTime);
    
    try {
      // Get provider's real availability
      const availability = await this.getProviderAvailability(providerId);
      console.log(`📋 Provider type: ${availability.type}`);
      console.log(`📋 Working days:`, availability.workingDays);
      console.log(`📋 Working hours:`, availability.workingHours);
      console.log(`📋 Session duration: ${availability.sessionDuration} minutes`);
      
      // Strategy 1: Same day alternatives
      const sameDay = await this.findSameDayAlternatives(
        requestedMoment, 
        availability, 
        duration, 
        requestedDateTime
      );
      alternatives.push(...sameDay);
      console.log(`🔍 Same day alternatives found: ${sameDay.length}`);
      
      // Strategy 2: Next working days
      if (alternatives.length < maxSuggestions) {
        const nextDays = await this.findNextWorkingDays(
          requestedMoment, 
          availability, 
          duration, 
          requestedDateTime
        );
        alternatives.push(...nextDays);
        console.log(`🔍 Next days alternatives found: ${nextDays.length}`);
      }
      
      // Strategy 3: Flexible alternatives (if still not enough)
      if (alternatives.length < maxSuggestions) {
        const flexible = await this.findFlexibleAlternatives(
          requestedMoment, 
          availability, 
          duration, 
          requestedDateTime
        );
        alternatives.push(...flexible);
        console.log(`🔍 Flexible alternatives found: ${flexible.length}`);
      }
      
      const finalAlternatives = this.rankAndLimitAlternatives(alternatives, requestedMoment, maxSuggestions);
      console.log(`✨ Total alternatives generated: ${finalAlternatives.length}`);
      
      return finalAlternatives;
      
    } catch (error) {
      console.error('❌ Error finding alternatives:', error);
      return [];
    }
  }
  
  /**
   * Find same-day alternatives
   */
  async findSameDayAlternatives(requestedMoment, availability, duration, requestedDateTime) {
    const alternatives = [];
    const dayName = requestedMoment.format('dddd');
    
    // Normalize working days (handle both 'Monday' and 'monday' formats)
    const normalizedWorkingDays = availability.workingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
    );
    
    // Check if requested day is a working day
    if (!normalizedWorkingDays.includes(dayName)) {
      console.log(`⚠️ ${dayName} is not a working day`);
      return alternatives;
    }
    
    const date = requestedMoment.format('YYYY-MM-DD');
    const requestedHour = requestedMoment.hour();
    const requestedMinute = requestedMoment.minute();
    
    // Parse working hours
    const startHour = parseInt(availability.workingHours.start.split(':')[0]);
    const startMinute = parseInt(availability.workingHours.start.split(':')[1] || '0');
    const endHour = parseInt(availability.workingHours.end.split(':')[0]);
    const endMinute = parseInt(availability.workingHours.end.split(':')[1] || '0');
    
    // Generate time slots with 30-minute intervals
    const sessionDurationMinutes = availability.sessionDuration;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const startMinuteForHour = (hour === startHour) ? startMinute : 0;
      const endMinuteForHour = (hour === endHour) ? endMinute : 60;
      
      for (let minute = startMinuteForHour; minute < endMinuteForHour; minute += 30) {
        // Skip if this is the requested slot
        if (hour === requestedHour && minute === requestedMinute) {
          continue;
        }
        
        // Calculate slot end time
        const slotEndMoment = moment().hour(hour).minute(minute).add(sessionDurationMinutes, 'minutes');
        
        // Check if slot fits within working hours
        if (slotEndMoment.hour() < endHour || 
           (slotEndMoment.hour() === endHour && slotEndMoment.minute() <= endMinute)) {
          
          const timeDiff = Math.abs((hour * 60 + minute) - (requestedHour * 60 + requestedMinute));
          
          // Only suggest slots within 3 hours of requested time
          if (timeDiff <= 180) {
            alternatives.push({
              startTime: `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`,
              endTime: `${date}T${slotEndMoment.hour().toString().padStart(2, '0')}:${slotEndMoment.minute().toString().padStart(2, '0')}:00.000Z`,
              date: date,
              start: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              end: `${slotEndMoment.hour().toString().padStart(2, '0')}:${slotEndMoment.minute().toString().padStart(2, '0')}`,
              reason: `Same day alternative, ${this.formatTimeDifference(timeDiff)} from requested time`,
              strategy: 'same_day',
              confidence: Math.max(0.5, 1 - (timeDiff / 180)),
              dayDifference: 0,
              timeDifference: timeDiff
            });
          }
        }
      }
    }
    
    // Sort by time difference and return best options
    return alternatives
      .sort((a, b) => a.timeDifference - b.timeDifference)
      .slice(0, 3);
  }
  
  /**
   * Find next working days alternatives
   */
  async findNextWorkingDays(requestedMoment, availability, duration, requestedDateTime) {
    const alternatives = [];
    const requestedHour = requestedMoment.hour();
    const requestedMinute = requestedMoment.minute();
    
    // Normalize working days
    const normalizedWorkingDays = availability.workingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
    );
    
    // Check next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const targetDate = requestedMoment.clone().add(dayOffset, 'days');
      const dayName = targetDate.format('dddd');
      
      // Skip non-working days
      if (!normalizedWorkingDays.includes(dayName)) {
        continue;
      }
      
      const date = targetDate.format('YYYY-MM-DD');
      
      // Generate slots around the requested time
      const timeVariations = [
        { hour: requestedHour, minute: requestedMinute }, // Same time
        { hour: requestedHour + 1, minute: requestedMinute }, // 1 hour later
        { hour: requestedHour - 1, minute: requestedMinute }, // 1 hour earlier
        { hour: requestedHour, minute: requestedMinute + 30 }, // 30 min later
        { hour: requestedHour, minute: requestedMinute - 30 }, // 30 min earlier
      ];
      
      const startHour = parseInt(availability.workingHours.start.split(':')[0]);
      const endHour = parseInt(availability.workingHours.end.split(':')[0]);
      const sessionDurationMinutes = availability.sessionDuration;
      
      for (const timeVar of timeVariations) {
        if (timeVar.hour >= startHour && timeVar.hour <= endHour && 
            timeVar.minute >= 0 && timeVar.minute < 60) {
          
          const slotEnd = moment().hour(timeVar.hour).minute(timeVar.minute).add(sessionDurationMinutes, 'minutes');
          
          // Check if slot fits within working hours
          if (slotEnd.hour() <= endHour) {
            alternatives.push({
              startTime: `${date}T${timeVar.hour.toString().padStart(2, '0')}:${timeVar.minute.toString().padStart(2, '0')}:00.000Z`,
              endTime: `${date}T${slotEnd.hour().toString().padStart(2, '0')}:${slotEnd.minute().toString().padStart(2, '0')}:00.000Z`,
              date: date,
              start: `${timeVar.hour.toString().padStart(2, '0')}:${timeVar.minute.toString().padStart(2, '0')}`,
              end: `${slotEnd.hour().toString().padStart(2, '0')}:${slotEnd.minute().toString().padStart(2, '0')}`,
              reason: `${this.getDayName(date)}, ${timeVar.hour === requestedHour && timeVar.minute === requestedMinute ? 'same time' : 'nearby time'}`,
              strategy: 'next_days',
              confidence: Math.max(0.6, 1 - (dayOffset * 0.1)),
              dayDifference: dayOffset,
              timeDifference: Math.abs((timeVar.hour * 60 + timeVar.minute) - (requestedHour * 60 + requestedMinute))
            });
          }
        }
      }
      
      if (alternatives.length >= 3) break; // Enough alternatives
    }
    
    return alternatives
      .sort((a, b) => a.dayDifference - b.dayDifference)
      .slice(0, 2);
  }
  
  /**
   * Find flexible alternatives
   */
  async findFlexibleAlternatives(requestedMoment, availability, duration, requestedDateTime) {
    const alternatives = [];
    const isOriginalMorning = requestedMoment.hour() < 12;
    
    // Normalize working days
    const normalizedWorkingDays = availability.workingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
    );
    
    const startHour = parseInt(availability.workingHours.start.split(':')[0]);
    const endHour = parseInt(availability.workingHours.end.split(':')[0]);
    const sessionDurationMinutes = availability.sessionDuration;
    
    // Check next 5 days
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const targetDate = requestedMoment.clone().add(dayOffset, 'days');
      const dayName = targetDate.format('dddd');
      
      // Skip non-working days
      if (!normalizedWorkingDays.includes(dayName)) {
        continue;
      }
      
      const date = targetDate.format('YYYY-MM-DD');
      
      // Generate morning and afternoon slots
      const morningHour = Math.max(startHour, 9);
      const afternoonHour = Math.min(14, endHour - 2);
      
      const flexibleSlots = [
        { hour: morningHour, minute: 0, period: 'morning' },
        { hour: morningHour, minute: 30, period: 'morning' },
        { hour: afternoonHour, minute: 0, period: 'afternoon' },
        { hour: afternoonHour, minute: 30, period: 'afternoon' },
      ];
      
      for (const slot of flexibleSlots) {
        const slotEnd = moment().hour(slot.hour).minute(slot.minute).add(sessionDurationMinutes, 'minutes');
        
        if (slotEnd.hour() <= endHour) {
          const isSlotMorning = slot.hour < 12;
          const timePreferenceMatch = isOriginalMorning === isSlotMorning;
          
          alternatives.push({
            startTime: `${date}T${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}:00.000Z`,
            endTime: `${date}T${slotEnd.hour().toString().padStart(2, '0')}:${slotEnd.minute().toString().padStart(2, '0')}:00.000Z`,
            date: date,
            start: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`,
            end: `${slotEnd.hour().toString().padStart(2, '0')}:${slotEnd.minute().toString().padStart(2, '0')}`,
            reason: `${this.getDayName(date)}, ${slot.period} slot`,
            strategy: 'flexible',
            confidence: (timePreferenceMatch ? 0.7 : 0.5) - (dayOffset * 0.05),
            dayDifference: dayOffset,
            timeDifference: Math.abs(slot.hour - requestedMoment.hour()) * 60
          });
        }
      }
      
      if (alternatives.length >= 2) break;
    }
    
    return alternatives
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);
  }
  
  /**
   * Rank and limit alternatives
   */
  rankAndLimitAlternatives(alternatives, requestedMoment, maxSuggestions) {
    return alternatives
      .sort((a, b) => {
        // Primary sort: by confidence score (higher is better)
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        
        // Secondary sort: by day difference (closer is better)
        if (a.dayDifference !== b.dayDifference) {
          return a.dayDifference - b.dayDifference;
        }
        
        // Tertiary sort: by time difference (closer is better)
        return a.timeDifference - b.timeDifference;
      })
      .slice(0, maxSuggestions)
      .map((alt, index) => ({
        ...alt,
        rank: index + 1
      }));
  }
  
  // Helper methods
  formatTimeDifference(minutes) {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  getDayName(dateString) {
    return moment(dateString).format('dddd');
  }
}

module.exports = new AlternativeSlotsService();
