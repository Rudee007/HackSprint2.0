// services/autoScheduling.service.js
// 🔥 MULTI-PATIENT PANCHAKARMA SCHEDULING SERVICE
// Algorithm: Hybrid CP + MIP + GA-LS
// 🔥 FIXED: Proper phase sequencing with day offsets (purvakarma → pradhanakarma → paschatkarma)

const TreatmentPlan = require('../models/TreatmentPlan');
const Consultation = require('../models/Consultation');
const Therapist = require('../models/Therapist');
const Therapy = require('../models/Therapy');
const logger = require('../utils/logger');

const { applyConstraintProgramming } = require('./scheduling.cp');
const { applyMIPOptimization } = require('./scheduling.mip');
const { applyGeneticAlgorithm } = require('./scheduling.gals');
const { createDraftConsultations } = require('./scheduling.consultation');

// Algorithm weights for objective function
const WEIGHTS = {
  MAKESPAN: 0.3,           // Minimize total duration
  PATIENT_PREFERENCE: 0.25, // Match patient time preferences
  THERAPY_PREFERENCE: 0.15, // Match therapy time requirements
  IDLE_TIME: 0.15,         // Minimize therapist idle gaps
  WORKLOAD: 0.10,          // Balance daily workload
  FREQUENCY: 0.05          // Respect therapy frequency
};

// GA-LS parameters
const GA_CONFIG = {
  POPULATION_SIZE: 20,
  MAX_GENERATIONS: 100,
  MUTATION_RATE: 0.15,
  CROSSOVER_RATE: 0.8,
  ELITE_SIZE: 2,
  LOCAL_SEARCH_ITERATIONS: 50
};

// ═══════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════

/**
 * Generate draft schedule for single or multiple treatment plans
 * @param {Array|String} treatmentPlans - Array of plan IDs or single plan ID
 * @returns {Object} Scheduling result with statistics
 */
async function generateDraftSchedule(treatmentPlans) {
  const startTime = Date.now();
  
  try {
    // Convert single plan to array
    if (!Array.isArray(treatmentPlans)) {
      treatmentPlans = [treatmentPlans];
    }
    
    logger.info(`🚀 Starting scheduling for ${treatmentPlans.length} treatment plan(s)`);
    
    // Choose algorithm based on number of plans
    if (treatmentPlans.length === 1) {
      return await singlePatientOptimize(treatmentPlans[0], startTime);
    } else {
      return await multiPatientOptimize(treatmentPlans, startTime);
    }
    
  } catch (error) {
    logger.error('❌ Scheduling failed:', error);
    throw new Error(`Scheduling failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLE PATIENT OPTIMIZATION (CP + MIP)
// ═══════════════════════════════════════════════════════════

async function singlePatientOptimize(treatmentPlanId, startTime) {
  logger.info('📋 Single patient mode: CP + MIP');
  
  // Step 1: Fetch data
  const context = await fetchSchedulingData([treatmentPlanId]);
  
  // Step 2: Build model
  const model = await buildSchedulingModel(context);
  
  // Step 3: CP Filter
  await applyConstraintProgramming(model, context);
  
  // Step 4: MIP Optimize
  await applyMIPOptimization(model, context);
  
  // Step 5: Create consultations
  logger.info('📋 Creating draft consultations...');
  const consultations = await createDraftConsultations(model.allSessions);
  
  // Step 6: Calculate result
  const scheduledSessions = model.allSessions.filter(s => s.isScheduled);
  const conflictSessions = model.allSessions.filter(s => s.hasConflict);
  
  const duration = Date.now() - startTime;
  
  return {
    success: scheduledSessions.length > 0,
    treatmentPlanId: treatmentPlanId,
    totalSessions: model.allSessions.length,
    scheduledCount: scheduledSessions.length,
    conflictCount: conflictSessions.length,
    successRate: (scheduledSessions.length / model.allSessions.length * 100).toFixed(1),
    consultationsCreated: consultations.length,
    duration: `${(duration / 1000).toFixed(2)}s`,
    algorithmUsed: 'cp_mip'
  };
}

// ═══════════════════════════════════════════════════════════
// MULTI-PATIENT OPTIMIZATION (CP + MIP + GA-LS)
// ═══════════════════════════════════════════════════════════

async function multiPatientOptimize(treatmentPlanIds, startTime) {
  logger.info(`🎯 Multi-patient mode: CP + MIP + GA-LS for ${treatmentPlanIds.length} plans`);
  
  // Step 1: Fetch data
  const context = await fetchSchedulingData(treatmentPlanIds);
  
  // Step 2: Build model
  const model = await buildSchedulingModel(context);
  
  // Step 3: CP Filter
  await applyConstraintProgramming(model, context);
  
  // Step 4: MIP Optimize (initial solution)
  await applyMIPOptimization(model, context);
  
  // Step 5: GA-LS Refinement (improve quality)
  await applyGeneticAlgorithm(model, context);
  
  // Step 6: Create consultations
  const consultations = await createDraftConsultations(model.allSessions);
  
  // Step 7: Calculate statistics
  const scheduledSessions = model.allSessions.filter(s => s.isScheduled);
  const conflictSessions = model.allSessions.filter(s => s.hasConflict);
  
  const duration = Date.now() - startTime;
  
  const result = {
    success: scheduledSessions.length > 0,
    treatmentPlanIds: treatmentPlanIds,
    totalSessions: model.allSessions.length,
    scheduledCount: scheduledSessions.length,
    conflictCount: conflictSessions.length,
    successRate: (scheduledSessions.length / model.allSessions.length * 100).toFixed(1),
    consultationsCreated: consultations.length,
    duration: `${(duration / 1000).toFixed(2)}s`,
    algorithmUsed: 'cp_mip_gals'
  };
  
  return result;
}

// ═══════════════════════════════════════════════════════════
// STEP 1: DATA COLLECTION
// ═══════════════════════════════════════════════════════════

async function fetchSchedulingData(treatmentPlanIds) {
  logger.info('📊 Fetching scheduling data...');
  
  // 1.1 Fetch treatment plans with populated data
  const treatmentPlans = await TreatmentPlan.find({
    _id: { $in: treatmentPlanIds }
  })
    .populate('assignedTherapistId', 'name email')
    .populate('patientId', 'name email profile')
    .populate('phases.therapySessions.therapyId')
    .lean();
  
  if (treatmentPlans.length === 0) {
    throw new Error('No treatment plans found');
  }
  
  // Validate that all therapies are populated
  treatmentPlans.forEach(plan => {
    plan.phases.forEach(phase => {
      phase.therapySessions.forEach(ts => {
        if (!ts.therapyId) {
          logger.warn(`⚠️ Therapy not populated for session in plan ${plan._id}`);
        }
      });
    });
  });
  
  // 1.2 Extract unique therapist and patient IDs
  const therapistIds = [...new Set(treatmentPlans.map(p => p.assignedTherapistId._id.toString()))];
  const patientIds = [...new Set(treatmentPlans.map(p => p.patientId._id.toString()))];
  
  logger.info(`🔍 Extracted ${therapistIds.length} unique therapist(s), ${patientIds.length} patient(s)`);
  
  // 1.3 Find earliest start date for query optimization
  const earliestStartDate = new Date(Math.min(
    ...treatmentPlans.map(p => new Date(p.schedulingPreferences.startDate))
  ));
  
  // 1.4 Fetch existing consultations (for conflict detection)
  const existingConsultations = await Consultation.find({
    $or: [
      { providerId: { $in: therapistIds } },
      { patientId: { $in: patientIds } }
    ],
    status: { $nin: ['cancelled', 'completed', 'no_show'] },
    scheduledAt: { $gte: earliestStartDate }
  })
    .select('providerId patientId scheduledAt sessionEndTime estimatedDuration status')
    .lean();
  
  // 1.5 Fetch therapist profiles with availability
  logger.info(`🔍 Fetching ${therapistIds.length} therapist profile(s) from database...`);
  
  const therapists = await Therapist.find({
    _id: { $in: therapistIds }
  }).lean();
  
  logger.info(`✅ Found ${therapists.length} therapist record(s) in database`);
  
  if (therapists.length === 0) {
    logger.error('❌ No therapists found in database!');
    throw new Error(`No therapists found for IDs: ${therapistIds.join(', ')}`);
  }
  
  // Build lookup maps
  const therapistMap = {};
  therapists.forEach(t => {
    therapistMap[t._id.toString()] = t;
    
    // Debug: Check availability structure
    const daysWithSlots = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .filter(day => t.availability?.[day]?.isAvailable && t.availability[day]?.slots?.length > 0);
    
    const totalSlots = daysWithSlots.reduce((sum, day) => 
      sum + (t.availability[day]?.slots?.length || 0), 0);
    
    logger.info(`   ✅ Therapist ${t._id}: ${totalSlots} availability slots across ${daysWithSlots.length} days`);
    
    if (totalSlots === 0) {
      logger.warn(`      ⚠️ WARNING: Therapist ${t._id} has NO availability slots configured!`);
    }
  });
  
  // Validate all therapists were found
  const missingTherapists = therapistIds.filter(id => !therapistMap[id]);
  if (missingTherapists.length > 0) {
    logger.error(`❌ Missing ${missingTherapists.length} therapist(s) from database!`);
    throw new Error(`Therapists not found in database: ${missingTherapists.join(', ')}`);
  }
  
  logger.info(`✅ All ${therapistIds.length} therapist(s) successfully loaded into therapistMap`);
  
  // 1.6 Build busy slots maps
  const { therapistBusySlots, patientBusySlots } = buildBusySlotsMap(existingConsultations);
  
  logger.info(`✅ Data fetched: ${treatmentPlans.length} plans, ${existingConsultations.length} existing bookings`);
  
  return {
    treatmentPlans,
    therapistMap,
    therapistBusySlots,
    patientBusySlots,
    earliestStartDate
  };
}

function buildBusySlotsMap(consultations) {
  const therapistBusySlots = {};
  const patientBusySlots = {};
  
  consultations.forEach(consult => {
    const therapistId = consult.providerId.toString();
    const patientId = consult.patientId.toString();
    
    const start = new Date(consult.scheduledAt);
    const end = consult.sessionEndTime 
      ? new Date(consult.sessionEndTime)
      : new Date(start.getTime() + (consult.estimatedDuration || 60) * 60000);
    
    // Add to therapist busy slots
    if (!therapistBusySlots[therapistId]) {
      therapistBusySlots[therapistId] = [];
    }
    therapistBusySlots[therapistId].push({ start, end });
    
    // Add to patient busy slots
    if (!patientBusySlots[patientId]) {
      patientBusySlots[patientId] = [];
    }
    patientBusySlots[patientId].push({ start, end });
  });
  
  return { therapistBusySlots, patientBusySlots };
}

// ═══════════════════════════════════════════════════════════
// STEP 2: BUILD SCHEDULING MODEL
// ═══════════════════════════════════════════════════════════

async function buildSchedulingModel(context) {
  logger.info('🏗️ Building scheduling model...');
  
  const allSessions = [];
  let globalSessionNumber = 1;
  
  for (const plan of context.treatmentPlans) {
    const planSessions = buildSessionsForPlan(plan, globalSessionNumber);
    allSessions.push(...planSessions);
    globalSessionNumber += planSessions.length;
  }
  
  // Build dependency graph
  buildDependencyGraph(allSessions);
  
  // Sort sessions by priority
  const sortedSessions = sortSessionsByPriority(allSessions);
  
  logger.info(`✅ Model built: ${allSessions.length} sessions across ${context.treatmentPlans.length} plans`);
  
  // Log phase distribution for debugging
  logPhaseDistribution(sortedSessions);
  
  return {
    allSessions: sortedSessions,
    sessionMap: createSessionMap(allSessions)
  };
}

/**
 * 🔥 CRITICAL FIX: Build sessions with proper requiredDay assignment
 * 
 * Key principle: Track day offset across phases so:
 * - Purvakarma (7 days) gets requiredDay 1-7
 * - Pradhanakarma (3 days) gets requiredDay 8-10
 * - Paschatkarma (18 days) gets requiredDay 11-28
 */
function buildSessionsForPlan(plan, startingSessionNumber) {
  const sessions = [];
  let sessionNumber = startingSessionNumber;
  
  // Sort phases by sequence
  const sortedPhases = [...plan.phases].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  // 🔥 CRITICAL: Track cumulative day offset across phases
  let cumulativeDayOffset = 0;
  
  logger.info(`📋 Building sessions for plan ${plan._id}`);
  
  for (let phaseIndex = 0; phaseIndex < sortedPhases.length; phaseIndex++) {
    const phase = sortedPhases[phaseIndex];
    
    // 🔥 NEW: Calculate phase boundaries
    const phaseStartDay = cumulativeDayOffset + 1;
    const phaseTotalDays = phase.totalDays || calculatePhaseDuration(phase);
    const phaseEndDay = cumulativeDayOffset + phaseTotalDays;
    
    logger.info(`   Phase ${phase.sequenceNumber} (${phase.phaseName}): Days ${phaseStartDay}-${phaseEndDay} (${phaseTotalDays} days)`);
    
    // 🔥 NEW: Track day within phase for requiredDay assignment
    let currentDayInPhase = phaseStartDay;
    
    for (const therapySession of phase.therapySessions) {
      const therapy = therapySession.therapyId;
      
      if (!therapy) {
        logger.warn(`⚠️ Skipping unpopulated therapy in plan ${plan._id}`);
        continue;
      }
      
      // 🔥 CRITICAL: Determine how to distribute sessions across phase days
      const sessionCount = therapySession.sessionCount;
      const frequency = therapySession.frequency || 'daily';
      
      // Calculate day increment based on frequency
      const dayIncrement = getFrequencyDayIncrement(frequency);
      
      logger.info(`      Therapy: ${therapy.therapyName}, Sessions: ${sessionCount}, Frequency: ${frequency}`);
      
      for (let i = 1; i <= sessionCount; i++) {
        // 🔥 CRITICAL: Calculate requiredDay for this session
        const requiredDay = currentDayInPhase;
        
        // Ensure requiredDay doesn't exceed phase boundaries
        const boundedRequiredDay = Math.min(requiredDay, phaseEndDay);
        
        const session = {
          // Identity
          sessionId: `${plan._id}_${sessionNumber}`,
          
          // Ownership
          treatmentPlanId: plan._id.toString(),
          patientId: plan.patientId._id.toString(),
          therapistId: plan.assignedTherapistId._id.toString(),
          
          // 🔥 CRITICAL: Phase boundaries and requiredDay
          phaseSequence: phase.sequenceNumber,
          phaseName: phase.phaseName,
          phaseIndex: phaseIndex,
          phaseStartDay: phaseStartDay,        // 🔥 NEW
          phaseEndDay: phaseEndDay,            // 🔥 NEW
          requiredDay: boundedRequiredDay,     // 🔥 NEW: THE KEY FIX
          
          // Therapy Details
          therapyId: therapy._id.toString(),
          therapyName: therapy.therapyName || therapySession.therapyName,
          therapyType: therapy.therapyType || therapySession.therapyType,
          
          // Session Details
          sessionNumber: sessionNumber,
          sessionInTherapy: i,
          totalSessionsInTherapy: sessionCount,
          
          // Duration
          durationMinutes: therapySession.durationMinutes || therapy.standardDuration || 60,
          bufferMinutes: therapy.bufferTime || 15,
          
          // Constraints from TreatmentPlan
          requiresPreviousPhaseComplete: therapySession.requiresPreviousPhaseComplete || false,
          minimumDaysSincePreviousSession: therapySession.minimumDaysSincePreviousSession || 0,
          allowsParallelSessions: therapySession.allowsParallelSessions || false,
          
          // Constraints from Therapy
          preferredTime: therapy.constraints?.preferredTime || null,
          specificTime: therapy.constraints?.specificTime || null,
          requiresFasting: therapy.constraints?.requiresFasting || false,
          requiredSkillLevel: therapy.resourceRequirements?.skillLevel || 'Beginner',
          
          // Scheduling Preferences
          patientPreferredTimeSlot: plan.schedulingPreferences.preferredTimeSlot || 'morning',
          skipWeekends: plan.schedulingPreferences.skipWeekends || false,
          flexibilityWindowDays: plan.schedulingPreferences.flexibilityWindowDays || 2,
          planStartDate: new Date(plan.schedulingPreferences.startDate),
          
          // Frequency
          frequency: frequency,
          
          // Scheduling State
          scheduledDate: null,
          scheduledStartTime: null,
          scheduledEndTime: null,
          isScheduled: false,
          hasConflict: false,
          conflictReason: null,
          
          // Dependencies
          dependsOn: [],
          blockedBy: [],
          
          // Feasibility
          feasibleSlots: [],
          assignedSlotCost: null
        };
        
        session.totalMinutes = session.durationMinutes + session.bufferMinutes;
        
        logger.info(`         Session ${i}/${sessionCount}: requiredDay=${boundedRequiredDay}`);
        
        sessions.push(session);
        sessionNumber++;
        
        // 🔥 NEW: Advance day counter based on frequency
        // BUT: Allow parallel sessions on the same day if configured
        if (!therapySession.allowsParallelSessions || i === sessionCount) {
          currentDayInPhase += dayIncrement;
        }
      }
    }
    
    // 🔥 CRITICAL: Update cumulative offset for next phase
    cumulativeDayOffset += phaseTotalDays;
    
    logger.info(`   ✅ Phase ${phase.sequenceNumber} complete. Next phase starts at Day ${cumulativeDayOffset + 1}`);
  }
  
  logger.info(`✅ Plan ${plan._id}: Created ${sessions.length} sessions spanning Days 1-${cumulativeDayOffset}`);
  
  return sessions;
}

/**
 * 🔥 NEW: Calculate phase duration if not explicitly set
 */
function calculatePhaseDuration(phase) {
  // If totalDays is set, use it
  if (phase.totalDays && phase.totalDays > 0) {
    return phase.totalDays;
  }
  
  // Otherwise, estimate based on therapy sessions
  let maxDays = 0;
  
  for (const ts of phase.therapySessions) {
    const sessionCount = ts.sessionCount || 1;
    const frequency = ts.frequency || 'daily';
    const dayIncrement = getFrequencyDayIncrement(frequency);
    
    const therapyDays = Math.ceil(sessionCount * dayIncrement);
    maxDays = Math.max(maxDays, therapyDays);
  }
  
  return Math.max(maxDays, 1); // At least 1 day
}

/**
 * 🔥 NEW: Get day increment based on therapy frequency
 */
function getFrequencyDayIncrement(frequency) {
  switch (frequency) {
    case 'daily': return 1;
    case 'alternate_days': return 2;
    case 'twice_daily': return 0; // Same day
    case 'once_weekly': return 7;
    case 'custom': return 1;
    default: return 1;
  }
}

/**
 * 🔥 NEW: Log phase distribution for debugging
 */
function logPhaseDistribution(sessions) {
  const phaseStats = {};
  
  sessions.forEach(s => {
    const phase = s.phaseName || 'Unknown';
    if (!phaseStats[phase]) {
      phaseStats[phase] = {
        count: 0,
        minDay: Infinity,
        maxDay: -Infinity
      };
    }
    phaseStats[phase].count++;
    phaseStats[phase].minDay = Math.min(phaseStats[phase].minDay, s.requiredDay);
    phaseStats[phase].maxDay = Math.max(phaseStats[phase].maxDay, s.requiredDay);
  });
  
  logger.info('📊 Phase distribution in model:');
  Object.entries(phaseStats).forEach(([phase, stats]) => {
    logger.info(`   ${phase}: ${stats.count} sessions, Days ${stats.minDay}-${stats.maxDay}`);
  });
}

function buildDependencyGraph(allSessions) {
  // Group sessions by treatment plan
  const sessionsByPlan = {};
  allSessions.forEach(session => {
    if (!sessionsByPlan[session.treatmentPlanId]) {
      sessionsByPlan[session.treatmentPlanId] = [];
    }
    sessionsByPlan[session.treatmentPlanId].push(session);
  });
  
  // For each session, build dependencies
  allSessions.forEach(session => {
    const planSessions = sessionsByPlan[session.treatmentPlanId];
    
    // Dependency 1: Previous phase must complete
    if (session.requiresPreviousPhaseComplete && session.phaseSequence > 1) {
      const previousPhaseSessions = planSessions.filter(s => 
        s.phaseSequence === session.phaseSequence - 1
      );
      session.dependsOn.push(...previousPhaseSessions.map(s => s.sessionId));
    }
    
    // Dependency 2: Previous session in same therapy
    if (session.sessionInTherapy > 1) {
      const previousSession = planSessions.find(s => 
        s.therapyId === session.therapyId && 
        s.sessionInTherapy === session.sessionInTherapy - 1
      );
      if (previousSession) {
        session.dependsOn.push(previousSession.sessionId);
      }
    }
  });
}

function sortSessionsByPriority(sessions) {
  return sessions.sort((a, b) => {
    // 🔥 PRIMARY: Sort by requiredDay (this is THE key for phase sequencing)
    if (a.requiredDay !== b.requiredDay) {
      return a.requiredDay - b.requiredDay;
    }
    
    // Secondary: Phase sequence
    if (a.phaseSequence !== b.phaseSequence) {
      return a.phaseSequence - b.phaseSequence;
    }
    
    // Tertiary: Dependency depth
    if (a.dependsOn.length !== b.dependsOn.length) {
      return a.dependsOn.length - b.dependsOn.length;
    }
    
    // Quaternary: Session number
    return a.sessionNumber - b.sessionNumber;
  });
}

function createSessionMap(sessions) {
  const map = {};
  sessions.forEach(s => {
    map[s.sessionId] = s;
  });
  return map;
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
  generateDraftSchedule,
  singlePatientOptimize,
  multiPatientOptimize,
  WEIGHTS,
  GA_CONFIG
};