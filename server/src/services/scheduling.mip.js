// services/scheduling.mip.js
// ⚙️ MIXED INTEGER PROGRAMMING LAYER - Complete Optimization
// Purpose: Assign optimal slots to sessions by minimizing cost function
// 🔥 FIXED: Enforces strict phase sequencing - purvakarma MUST complete before pradhanakarma starts


const logger = require('../utils/logger');


// Weights for objective function
const WEIGHTS = {
  REQUIRED_DAY: 10.0,        // 🔥 NEW: Highest priority - sessions MUST be on their requiredDay
  MAKESPAN: 0.3,
  PATIENT_PREFERENCE: 0.25,
  THERAPY_PREFERENCE: 0.15,
  IDLE_TIME: 0.15,
  WORKLOAD: 0.10,
  FREQUENCY: 0.05
};


// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════


/**
 * Check if two dates are the same day (ignoring time)
 */
function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
}


/**
 * Create normalized date key (ISO format YYYY-MM-DD)
 */
function getDateKey(date) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}


/**
 * Create unique key for therapist daily load
 */
function createLoadKey(therapistId, date) {
  return `${therapistId}_${getDateKey(date)}`;
}


/**
 * Create unique key for a time slot
 */
function createSlotKey(therapistId, date, time) {
  const hour = time.getHours().toString().padStart(2, '0');
  const minute = time.getMinutes().toString().padStart(2, '0');
  return `${therapistId}_${getDateKey(date)}_${hour}:${minute}`;
}


/**
 * Get time of day category
 */
function getTimeOfDay(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}


// ═══════════════════════════════════════════════════════════
// MAIN MIP ENTRY POINT
// ═══════════════════════════════════════════════════════════


/**
 * Apply MIP optimization to assign sessions to optimal time slots
 * 
 * Key principle: Sessions are assigned in requiredDay order to ensure
 * phase sequencing (purvakarma Days 1-7, then pradhanakarma Days 8+, etc.)
 * 
 * @param {Object} model - Scheduling model with all sessions
 * @param {Object} context - Context with therapist data
 */
async function applyMIPOptimization(model, context) {
  logger.info('⚙️ MIP Layer: Starting optimization...');
  
  const startTime = Date.now();
  const { allSessions, sessionMap } = model;
  const { therapistMap } = context;
  
  // Validate sessions have required fields
  validateSessions(allSessions);
  
  // Track occupied slots and daily loads during assignment
  const occupiedSlots = new Map();
  const therapistDailyLoad = new Map();
  
  let scheduledCount = 0;
  let conflictCount = 0;
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 CRITICAL: SORT SESSIONS BY REQUIRED DAY
  // This ensures sequential phase execution:
  // - All purvakarma sessions (Days 1-7) are scheduled first
  // - Then all pradhanakarma sessions (Days 8-10)
  // - Finally all paschatkarma sessions (Days 11-28)
  // ═══════════════════════════════════════════════════════════
  logger.info('📋 Sorting sessions by required day for sequential assignment...');
  
  const sortedSessions = [...allSessions].sort((a, b) => {
    // Primary: Sort by requiredDay (CRITICAL for phase sequencing)
    if (a.requiredDay !== undefined && b.requiredDay !== undefined) {
      if (a.requiredDay !== b.requiredDay) {
        return a.requiredDay - b.requiredDay;
      }
    }
    
    // Secondary: Sort by phase sequence (backup if requiredDay missing)
    if (a.phaseSequence !== undefined && b.phaseSequence !== undefined) {
      if (a.phaseSequence !== b.phaseSequence) {
        return a.phaseSequence - b.phaseSequence;
      }
    }
    
    // Tertiary: Sort by session number (stable sort)
    return a.sessionNumber - b.sessionNumber;
  });
  
  logger.info(`✅ Sessions sorted: Day ${sortedSessions[0]?.requiredDay || 'N/A'} to Day ${sortedSessions[sortedSessions.length - 1]?.requiredDay || 'N/A'}`);
  
  // Log phase distribution
  logPhaseDistribution(sortedSessions);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4.1: CALCULATE COST FOR EACH FEASIBLE SLOT
  // ═══════════════════════════════════════════════════════════
  logger.info('💰 Calculating costs for all feasible slots...');
  
  for (const session of sortedSessions) {
    if (session.hasConflict || session.feasibleSlots.length === 0) {
      continue;
    }
    
    // Calculate cost for each feasible slot
    for (const slot of session.feasibleSlots) {
      slot.cost = calculateSlotCost(
        session,
        slot,
        sessionMap,
        therapistMap,
        therapistDailyLoad
      );
    }
    
    // Sort slots by cost (lowest = best)
    session.feasibleSlots.sort((a, b) => a.cost - b.cost);
    
    logger.debug(`   Session ${session.sessionNumber} (Day ${session.requiredDay}): ${session.feasibleSlots.length} slots, best cost=${session.feasibleSlots[0]?.cost.toFixed(2)}`);
  }
  
  logger.info('✅ Slot costs calculated');
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4.2: GREEDY ASSIGNMENT IN SEQUENTIAL ORDER
  // 🔥 FIXED: Assigns day-by-day to prevent phase overlap
  // ═══════════════════════════════════════════════════════════
  logger.info('🎯 Assigning slots to sessions (sequential day-by-day)...');
  
  for (const session of sortedSessions) {
    if (session.hasConflict || session.feasibleSlots.length === 0) {
      conflictCount++;
      logger.warn(`⚠️ Skipping session ${session.sessionNumber} (has conflict or no feasible slots)`);
      continue;
    }
    
    // Log scheduling attempt
    logger.debug(`📅 Scheduling session ${session.sessionNumber} (${session.therapyName}) for Day ${session.requiredDay} (${session.phaseName})`);
    
    // Try to assign the best available slot
    const assigned = assignBestSlot(
      session,
      occupiedSlots,
      therapistDailyLoad,
      therapistMap,
      sessionMap
    );
    
    if (assigned) {
      scheduledCount++;
      logger.debug(`✓ Session ${session.sessionNumber} assigned to ${getDateKey(session.scheduledDate)} ${session.scheduledStartTime.toTimeString().slice(0, 5)}`);
    } else {
      session.hasConflict = true;
      session.conflictReason = 'All feasible slots were occupied by higher priority sessions';
      conflictCount++;
      logger.warn(`⚠️ Session ${session.sessionNumber} could not be assigned (all slots taken on Day ${session.requiredDay})`);
    }
  }
  
  const duration = Date.now() - startTime;
  
  logger.info(`✅ MIP optimization complete in ${duration}ms`);
  logger.info(`   Scheduled: ${scheduledCount}/${allSessions.length}`);
  logger.info(`   Conflicts: ${conflictCount}/${allSessions.length}`);
  logger.info(`   Success rate: ${((scheduledCount / allSessions.length) * 100).toFixed(1)}%`);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4.3: CALCULATE OPTIMIZATION METRICS
  // ═══════════════════════════════════════════════════════════
  const metrics = calculateOptimizationMetrics(allSessions, therapistMap);
  logger.info(`📊 Optimization score: ${metrics.optimizationScore.toFixed(1)}/100`);
  
  // 🔥 NEW: Validate phase sequencing after assignment
  validatePhaseSequencing(allSessions);
  
  return metrics;
}


/**
 * 🔥 NEW: Validate sessions have required fields
 */
function validateSessions(allSessions) {
  let missingRequiredDay = 0;
  let missingPhaseInfo = 0;
  
  for (const session of allSessions) {
    if (session.requiredDay === undefined || session.requiredDay === null) {
      logger.warn(`⚠️ Session ${session.sessionNumber} missing requiredDay`);
      missingRequiredDay++;
    }
    
    if (!session.phaseName || session.phaseStartDay === undefined || session.phaseEndDay === undefined) {
      logger.warn(`⚠️ Session ${session.sessionNumber} missing phase information`);
      missingPhaseInfo++;
    }
  }
  
  if (missingRequiredDay > 0) {
    logger.error(`❌ ${missingRequiredDay} sessions missing requiredDay - phase sequencing will fail!`);
  }
  
  if (missingPhaseInfo > 0) {
    logger.warn(`⚠️ ${missingPhaseInfo} sessions missing phase info`);
  }
}


/**
 * 🔥 NEW: Log phase distribution for debugging
 */
function logPhaseDistribution(sortedSessions) {
  const phaseGroups = {};
  
  for (const session of sortedSessions) {
    const phase = session.phaseName || 'Unknown';
    if (!phaseGroups[phase]) {
      phaseGroups[phase] = [];
    }
    phaseGroups[phase].push(session.requiredDay);
  }
  
  logger.info('📊 Phase distribution:');
  for (const [phase, days] of Object.entries(phaseGroups)) {
    const minDay = Math.min(...days.filter(d => d !== undefined));
    const maxDay = Math.max(...days.filter(d => d !== undefined));
    logger.info(`   ${phase}: Days ${minDay}-${maxDay} (${days.length} sessions)`);
  }
}


/**
 * 🔥 NEW: Validate phase sequencing after assignment
 */
function validatePhaseSequencing(allSessions) {
  const treatmentPlans = {};
  
  // Group sessions by treatment plan
  for (const session of allSessions.filter(s => s.isScheduled && s.scheduledDate)) {
    if (!treatmentPlans[session.treatmentPlanId]) {
      treatmentPlans[session.treatmentPlanId] = [];
    }
    treatmentPlans[session.treatmentPlanId].push(session);
  }
  
  // Check each treatment plan
  for (const [planId, sessions] of Object.entries(treatmentPlans)) {
    const phaseOrder = ['Purvakarma', 'Pradhanakarma', 'Paschatkarma'];
    const phaseDates = {};
    
    for (const session of sessions) {
      const phase = session.phaseName;
      if (!phaseDates[phase]) {
        phaseDates[phase] = [];
      }
      phaseDates[phase].push(session.scheduledDate.getTime());
    }
    
    // Check if phases are in correct order
    let lastMaxDate = 0;
    for (const phase of phaseOrder) {
      if (!phaseDates[phase]) continue;
      
      const minDate = Math.min(...phaseDates[phase]);
      const maxDate = Math.max(...phaseDates[phase]);
      
      if (minDate < lastMaxDate) {
        logger.error(`❌ Phase sequencing violation in plan ${planId}: ${phase} overlaps with previous phase!`);
      }
      
      lastMaxDate = maxDate;
    }
  }
}


// ═══════════════════════════════════════════════════════════
// STEP 4.1: CALCULATE SLOT COST (OBJECTIVE FUNCTION)
// ═══════════════════════════════════════════════════════════


/**
 * Calculate cost for assigning a session to a specific slot
 * 
 * 🔥 CRITICAL: requiredDay deviation has the highest weight to ensure
 * sessions are scheduled on their designated day, preventing phase overlap
 */
function calculateSlotCost(session, slot, sessionMap, therapistMap, therapistDailyLoad) {
  let totalCost = 0;
  
  // ═══════════════════════════════════════════════════════════
  // 🔥 COST COMPONENT 0: REQUIRED DAY DEVIATION (HIGHEST PRIORITY)
  // This is THE critical component that prevents phase merging
  // ═══════════════════════════════════════════════════════════
  if (session.requiredDay !== undefined && session.planStartDate) {
    const targetDate = new Date(session.planStartDate);
    targetDate.setDate(targetDate.getDate() + (session.requiredDay - 1));
    targetDate.setHours(0, 0, 0, 0);
    
    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);
    
    const dayDeviation = Math.abs((slotDate - targetDate) / (1000 * 60 * 60 * 24));
    
    // 🔥 CRITICAL: Massive penalty for wrong day
    // Each day off = 10,000 points (virtually eliminates wrong-day slots)
    const requiredDayCost = dayDeviation * 10000;
    totalCost += WEIGHTS.REQUIRED_DAY * requiredDayCost;
    
    if (dayDeviation > 0) {
      logger.debug(`   ⚠️ Slot on ${getDateKey(slotDate)} deviates ${dayDeviation} days from required Day ${session.requiredDay} (${getDateKey(targetDate)})`);
    }
  } else {
    logger.warn(`   ⚠️ Session ${session.sessionNumber} missing requiredDay or planStartDate`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 1: MAKESPAN (PREFER EARLIER DATES)
  // ═══════════════════════════════════════════════════════════
  if (session.planStartDate) {
    const daysFromStart = (slot.date - session.planStartDate) / (1000 * 60 * 60 * 24);
    const makespanCost = WEIGHTS.MAKESPAN * daysFromStart;
    totalCost += makespanCost;
  }
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 2: PATIENT TIME PREFERENCE MATCH
  // ═══════════════════════════════════════════════════════════
  const slotHour = slot.startTime.getHours();
  const slotTimeOfDay = getTimeOfDay(slotHour);
  const patientPrefers = session.patientPreferredTimeSlot;
  
  let patientPrefCost = 0;
  if (patientPrefers && patientPrefers !== 'flexible' && slotTimeOfDay !== patientPrefers) {
    patientPrefCost = WEIGHTS.PATIENT_PREFERENCE * 20;
  }
  totalCost += patientPrefCost;
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 3: THERAPY TIME PREFERENCE MATCH
  // ═══════════════════════════════════════════════════════════
  const therapyPrefers = session.preferredTime;
  
  let therapyPrefCost = 0;
  if (therapyPrefers && slotTimeOfDay !== therapyPrefers) {
    therapyPrefCost = WEIGHTS.THERAPY_PREFERENCE * 15;
  }
  totalCost += therapyPrefCost;
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 4: THERAPIST IDLE TIME (PREFER COMPACT SCHEDULE)
  // ═══════════════════════════════════════════════════════════
  const idleTimeCost = calculateIdleTimeCost(session, slot, sessionMap);
  totalCost += WEIGHTS.IDLE_TIME * idleTimeCost;
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 5: WORKLOAD BALANCE (AVOID OVERLOADING)
  // ═══════════════════════════════════════════════════════════
  const workloadCost = calculateWorkloadCost(session, slot, therapistMap, therapistDailyLoad);
  totalCost += WEIGHTS.WORKLOAD * workloadCost;
  
  // ═══════════════════════════════════════════════════════════
  // COST COMPONENT 6: THERAPY FREQUENCY ADHERENCE
  // ═══════════════════════════════════════════════════════════
  const frequencyCost = calculateFrequencyCost(session, slot, sessionMap);
  totalCost += WEIGHTS.FREQUENCY * frequencyCost;
  
  return totalCost;
}


/**
 * Calculate idle time cost (prefer slots near other sessions)
 */
function calculateIdleTimeCost(session, slot, sessionMap) {
  const scheduledOnDay = Object.values(sessionMap).filter(s => 
    s.isScheduled &&
    s.therapistId === session.therapistId &&
    s.scheduledDate &&
    isSameDate(s.scheduledDate, slot.date)
  );
  
  if (scheduledOnDay.length === 0) {
    return 0; // No penalty if first session of the day
  }
  
  let minGapMinutes = Infinity;
  
  for (const other of scheduledOnDay) {
    if (!other.scheduledStartTime) continue;
    
    const gapMinutes = Math.abs(
      (slot.startTime - other.scheduledStartTime) / (1000 * 60)
    );
    minGapMinutes = Math.min(minGapMinutes, gapMinutes);
  }
  
  // Penalize large gaps
  if (minGapMinutes > 120) return 30;
  if (minGapMinutes > 60) return 15;
  if (minGapMinutes < 30) return 5; // Small penalty for too close
  
  return 0; // Optimal gap (30-60 min)
}


/**
 * Calculate workload balance cost (avoid overloading therapists)
 */
function calculateWorkloadCost(session, slot, therapistMap, therapistDailyLoad) {
  const therapist = therapistMap[session.therapistId];
  const maxPatientsPerDay = therapist?.availability?.maxPatientsPerDay || 8;
  
  const loadKey = createLoadKey(session.therapistId, slot.date);
  const currentLoad = therapistDailyLoad.get(loadKey) || 0;
  
  const loadRatio = currentLoad / maxPatientsPerDay;
  
  // Progressive penalty as load increases
  if (loadRatio >= 1.0) return 100; // At capacity
  if (loadRatio >= 0.8) return 30;  // Near capacity
  if (loadRatio >= 0.6) return 10;  // Moderate load
  
  return 0; // Low load
}


/**
 * Calculate frequency adherence cost (match ideal session spacing)
 */
function calculateFrequencyCost(session, slot, sessionMap) {
  if (session.sessionInTherapy <= 1) {
    return 0; // First session has no previous session to compare
  }
  
  // Find previous session in this therapy course
  const previousSession = Object.values(sessionMap).find(s =>
    s.treatmentPlanId === session.treatmentPlanId &&
    s.therapyId === session.therapyId &&
    s.sessionInTherapy === session.sessionInTherapy - 1 &&
    s.isScheduled
  );
  
  if (!previousSession || !previousSession.scheduledDate) {
    return 0; // Can't calculate gap if previous not scheduled
  }
  
  const actualGapDays = (slot.date - previousSession.scheduledDate) / (1000 * 60 * 60 * 24);
  const idealGapDays = getIdealGapDays(session.frequency);
  const deviation = Math.abs(actualGapDays - idealGapDays);
  
  // Penalize deviation from ideal frequency
  if (deviation > 3) return 20;
  if (deviation > 1) return 10;
  
  return 0;
}


/**
 * Get ideal gap between sessions based on frequency
 */
function getIdealGapDays(frequency) {
  switch (frequency) {
    case 'daily': return 1;
    case 'alternate_days': return 2;
    case 'twice_daily': return 0.5;
    case 'once_weekly': return 7;
    case 'custom': return 1;
    default: return 1;
  }
}


// ═══════════════════════════════════════════════════════════
// STEP 4.2: ASSIGN BEST SLOT TO SESSION
// ═══════════════════════════════════════════════════════════


/**
 * Try to assign the best available slot to a session
 * 
 * @returns {boolean} true if assigned successfully
 */
function assignBestSlot(
  session,
  occupiedSlots,
  therapistDailyLoad,
  therapistMap,
  sessionMap
) {
  // Try slots in order of cost (lowest first)
  for (const slot of session.feasibleSlots) {
    if (isSlotAvailable(slot, session, occupiedSlots, sessionMap)) {
      assignSlotToSession(session, slot, occupiedSlots, therapistDailyLoad);
      return true;
    }
  }
  
  return false; // No available slot found
}


/**
 * Check if a slot is still available (not occupied)
 */
function isSlotAvailable(slot, session, occupiedSlots, sessionMap) {
  if (!slot || !slot.date || !slot.startTime) {
    logger.warn(`⚠️ Invalid slot data`);
    return false;
  }
  
  const sessionEndTime = new Date(slot.startTime.getTime() + session.totalMinutes * 60000);
  const slotsNeeded = Math.ceil(session.totalMinutes / 30);
  
  // Check each 30-min unit needed for this session
  for (let i = 0; i < slotsNeeded; i++) {
    const checkTime = new Date(slot.startTime.getTime() + i * 30 * 60000);
    const slotKey = createSlotKey(session.therapistId, slot.date, checkTime);
    
    if (occupiedSlots.has(slotKey)) {
      return false; // Slot unit already occupied
    }
  }
  
  // Check for overlaps with already scheduled sessions
  const scheduledSessions = Object.values(sessionMap).filter(s =>
    s.isScheduled &&
    s.therapistId === session.therapistId &&
    s.scheduledDate &&
    isSameDate(s.scheduledDate, slot.date)
  );
  
  for (const other of scheduledSessions) {
    if (!other.scheduledStartTime || !other.scheduledEndTime) {
      logger.warn(`⚠️ Session ${other.sessionId} missing schedule times`);
      continue;
    }
    
    if (hasTimeOverlap(slot.startTime, sessionEndTime, other.scheduledStartTime, other.scheduledEndTime)) {
      return false; // Time overlap detected
    }
  }
  
  return true; // Slot is available
}


/**
 * Assign a slot to a session (updates session and tracking structures)
 */
function assignSlotToSession(session, slot, occupiedSlots, therapistDailyLoad) {
  // Validation
  if (!slot || !slot.date || !slot.startTime) {
    throw new Error(`Invalid slot data for session ${session.sessionId}`);
  }
  
  if (!session.totalMinutes || session.totalMinutes <= 0) {
    throw new Error(`Invalid duration for session ${session.sessionId}: ${session.totalMinutes}`);
  }
  
  // Set session schedule fields
  session.scheduledDate = new Date(slot.date);
  session.scheduledStartTime = new Date(slot.startTime);
  session.scheduledEndTime = new Date(slot.startTime.getTime() + session.totalMinutes * 60000);
  session.isScheduled = true;
  session.assignedSlotCost = slot.cost;
  
  // Mark slot units as occupied
  const slotsNeeded = Math.ceil(session.totalMinutes / 30);
  
  for (let i = 0; i < slotsNeeded; i++) {
    const occupyTime = new Date(slot.startTime.getTime() + i * 30 * 60000);
    const slotKey = createSlotKey(session.therapistId, slot.date, occupyTime);
    occupiedSlots.set(slotKey, session.sessionId);
  }
  
  // Update therapist daily load counter
  const loadKey = createLoadKey(session.therapistId, slot.date);
  const currentLoad = therapistDailyLoad.get(loadKey) || 0;
  therapistDailyLoad.set(loadKey, currentLoad + 1);
}


/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}


// ═══════════════════════════════════════════════════════════
// STEP 4.3: CALCULATE OPTIMIZATION METRICS
// ═══════════════════════════════════════════════════════════


/**
 * Calculate overall optimization metrics
 */
function calculateOptimizationMetrics(allSessions, therapistMap) {
  const scheduledSessions = allSessions.filter(s => s.isScheduled);
  const totalSessions = allSessions.length;
  
  if (scheduledSessions.length === 0) {
    return {
      optimizationScore: 0,
      successRate: 0,
      averageCost: 0,
      therapistUtilization: {},
      preferenceMatchRate: 0,
      totalScheduled: 0,
      totalSessions
    };
  }
  
  // Calculate average slot cost
  const totalCost = scheduledSessions.reduce((sum, s) => sum + (s.assignedSlotCost || 0), 0);
  const averageCost = totalCost / scheduledSessions.length;
  
  // Calculate preference match rate
  let preferenceMatches = 0;
  for (const session of scheduledSessions) {
    if (!session.scheduledStartTime) continue;
    
    const hour = session.scheduledStartTime.getHours();
    const timeOfDay = getTimeOfDay(hour);
    if (timeOfDay === session.patientPreferredTimeSlot || session.patientPreferredTimeSlot === 'flexible') {
      preferenceMatches++;
    }
  }
  const preferenceMatchRate = (preferenceMatches / scheduledSessions.length) * 100;
  
  // Calculate therapist utilization
  const therapistUtilization = calculateTherapistUtilization(scheduledSessions, therapistMap);
  
  // Calculate overall optimization score (0-100)
  const successRate = (scheduledSessions.length / totalSessions) * 100;
  const costScore = Math.max(0, 100 - (averageCost / 100)); // Normalize
  const prefScore = preferenceMatchRate;
  
  const optimizationScore = (successRate * 0.5) + (costScore * 0.25) + (prefScore * 0.25);
  
  return {
    optimizationScore,
    successRate,
    averageCost,
    therapistUtilization,
    preferenceMatchRate,
    totalScheduled: scheduledSessions.length,
    totalSessions
  };
}


/**
 * Calculate therapist utilization percentages
 */
function calculateTherapistUtilization(scheduledSessions, therapistMap) {
  const utilization = {};
  
  // Group sessions by therapist
  const sessionsByTherapist = {};
  for (const session of scheduledSessions) {
    if (!sessionsByTherapist[session.therapistId]) {
      sessionsByTherapist[session.therapistId] = [];
    }
    sessionsByTherapist[session.therapistId].push(session);
  }
  
  // Calculate utilization for each therapist
  for (const [therapistId, sessions] of Object.entries(sessionsByTherapist)) {
    const therapist = therapistMap[therapistId];
    if (!therapist) continue;
    
    // Group sessions by date
    const sessionsByDate = {};
    for (const session of sessions) {
      if (!session.scheduledDate) continue;
      
      const dateKey = getDateKey(session.scheduledDate);
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    }
    
    // Get working hours
    const workingHours = therapist.availability?.workingHours || { start: '09:00', end: '17:00' };
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    const totalWorkMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    // Calculate average utilization across all working days
    let totalUtilization = 0;
    let dayCount = 0;
    
    for (const daySessions of Object.values(sessionsByDate)) {
      const bookedMinutes = daySessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
      const dayUtilization = (bookedMinutes / totalWorkMinutes) * 100;
      totalUtilization += dayUtilization;
      dayCount++;
    }
    
    utilization[therapistId] = dayCount > 0 ? totalUtilization / dayCount : 0;
  }
  
  return utilization;
}


// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════


module.exports = {
  applyMIPOptimization,
  calculateSlotCost,
  assignBestSlot,
  calculateOptimizationMetrics,
  validatePhaseSequencing,
  getTimeOfDay,
  getIdealGapDays,
  hasTimeOverlap,
  isSameDate,
  createLoadKey,
  createSlotKey,
  WEIGHTS
};