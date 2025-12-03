// services/scheduling.consultation.js
// 💾 CONSULTATION CREATION & FINAL ASSEMBLY
// 🔥 FIXED: Proper day number calculation respecting requiredDay

const Consultation = require('../models/Consultation');
const TreatmentPlan = require('../models/TreatmentPlan');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getDateKey(date) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

function getTimeOfDay(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ═══════════════════════════════════════════════════════════
// MAIN CONSULTATION CREATION ENTRY POINT
// ═══════════════════════════════════════════════════════════

/**
 * Create draft consultations from scheduled sessions
 * 
 * 🔥 FIXED: Uses requiredDay for dayNumber to maintain phase sequencing
 * 
 * @param {Array} sessions - Array of session objects with scheduling info
 * @returns {Array} Created consultation IDs
 */
async function createDraftConsultations(sessions) {
  if (!sessions || sessions.length === 0) {
    logger.warn('⚠️ No sessions provided to createDraftConsultations');
    return [];
  }

  logger.info(`📋 Creating ${sessions.length} draft consultations...`);
  
  const createdConsultations = [];
  const failedSessions = [];

  // Therapy type mapping to valid enum values
  const therapyTypeMapping = {
    'general': 'other',
    'abhyanga': 'abhyanga',
    'shirodhara': 'shirodhara',
    'panchakarma': 'panchakarma',
    'swedana': 'swedana',
    'nasya': 'nasya',
    'virechana': 'virechana',
    'basti': 'basti',
    'vamana': 'other',
    'raktamokshana': 'other'
  };

  for (const session of sessions) {
    try {
      // Only create consultations for successfully scheduled sessions
      if (!session.isScheduled || !session.scheduledStartTime) {
        logger.debug(`⏭️ Skipping session ${session.sessionId}: Not fully scheduled`);
        continue;
      }

      // Validate required fields
      if (!session.patientId || !session.therapistId || !session.treatmentPlanId) {
        logger.warn(`⚠️ Skipping session ${session.sessionId}: Missing required IDs`);
        failedSessions.push({
          sessionId: session.sessionId,
          error: 'Missing required IDs (patient, therapist, or treatment plan)'
        });
        continue;
      }

      // scheduledStartTime is already a Date object
      const scheduledDate = new Date(session.scheduledStartTime);
      
      // Calculate end time
      const sessionEndTime = new Date(scheduledDate);
      sessionEndTime.setMinutes(sessionEndTime.getMinutes() + (session.totalMinutes || 60));
      
      // Extract time string for scheduledTime field (HH:MM format)
      const hours = String(scheduledDate.getHours()).padStart(2, '0');
      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
      const scheduledTimeString = `${hours}:${minutes}`;

      // Map therapy type to valid enum value
      const validTherapyType = therapyTypeMapping[session.therapyType?.toLowerCase()] || 'other';

      // 🔥 CRITICAL: Use requiredDay for dayNumber (not calculated from dates)
      // This ensures dayNumber reflects the treatment plan's intended sequence
      const dayNumber = session.requiredDay || calculateDayNumber(session);

      // Build consultation data
      const consultationData = {
        // Core required fields
        patientId: session.patientId,
        providerId: session.therapistId,
        providerModel: 'Therapist',
        providerType: 'therapist',
        
        // Scheduling
        scheduledAt: scheduledDate,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTimeString,
        sessionEndTime: sessionEndTime,
        
        // Type & Status
        type: 'in_person',
        status: 'scheduled',
        sessionType: 'therapy',
        sessionStatus: 'scheduled',
        
        // Duration
        estimatedDuration: session.durationMinutes || 60,
        actualDuration: null,
        
        // Fee (optional)
        fee: 0,
        
        // Therapy-specific data
        therapyData: {
          treatmentPlanId: session.treatmentPlanId,
          therapistId: session.therapistId,
          therapyName: session.therapyName || 'Unnamed Therapy',
          therapyType: validTherapyType,
          durationMinutes: session.durationMinutes || 60,
          
          // 🔥 CRITICAL: Use requiredDay as dayNumber
          dayNumber: dayNumber,
          totalDays: session.totalSessionsInTherapy || 0,
          
          // Phase info
          phaseName: session.phaseName || 'Unknown Phase',
          phaseSequence: session.phaseSequence,
          todayProcedure: session.therapyName || 'Therapy Session',
          
          // Session metadata
          sessionNumber: session.sessionNumber,
          sessionInTherapy: session.sessionInTherapy,
          totalSessionsInTherapy: session.totalSessionsInTherapy,
          
          // Empty structures for session tracking
          vitals: {},
          observations: {},
          adverseEffects: [],
          materialsUsed: [],
          progressUpdates: []
        },
        
        // Notes
        notes: `${session.phaseName || 'Phase'} - Day ${dayNumber} - ${session.therapyName || 'Therapy'} (Session ${session.sessionInTherapy}/${session.totalSessionsInTherapy})`,
        
        // Metadata
        sessionMetadata: {
          totalPauses: 0,
          pausedDuration: 0,
          connectionIssues: 0,
          lastActivity: new Date()
        }
      };

      // Create consultation
      const consultation = await Consultation.create(consultationData);
      
      createdConsultations.push(consultation._id);
      
      logger.debug(`✅ Created consultation ${consultation._id} for Day ${dayNumber} (${session.phaseName})`);
      
    } catch (error) {
      logger.error(`❌ Failed to create consultation for session ${session.sessionId}:`, error.message);
      failedSessions.push({
        sessionId: session.sessionId,
        error: error.message
      });
    }
  }

  // Summary
  logger.info(`📊 Consultation creation complete:`);
  logger.info(`   ✅ Created: ${createdConsultations.length}`);
  logger.info(`   ❌ Failed: ${failedSessions.length}`);
  
  if (failedSessions.length > 0) {
    logger.warn(`⚠️ Failed sessions:`, failedSessions.map(f => 
      `${f.sessionId}: ${f.error}`
    ).join(', '));
  }

  return createdConsultations;
}

// ═══════════════════════════════════════════════════════════
// STEP 6.1: CREATE CONSULTATION DOCUMENTS (BULK)
// ═══════════════════════════════════════════════════════════

/**
 * Create consultation documents in bulk
 * 
 * 🔥 FIXED: Uses requiredDay for dayNumber, fills doctorId and totalDays from plan
 */
async function createConsultationDocuments(allSessions, mongoSession, treatmentPlans) {
  logger.info('📝 Generating consultation documents...');
  
  const scheduledSessions = allSessions.filter(s => s.isScheduled && !s.hasConflict);
  
  if (scheduledSessions.length === 0) {
    logger.warn('⚠️ No scheduled sessions to create consultations for');
    return [];
  }
  
  // Create map of plan metadata
  const planMetaMap = {};
  treatmentPlans.forEach(plan => {
    planMetaMap[plan._id.toString()] = {
      doctorId: plan.assignedDoctorId || plan.doctorId || null,
      totalDays: plan.totalDays || calculatePlanTotalDays(plan)
    };
  });
  
  const consultationDocs = [];
  
  // Therapy type mapping
  const therapyTypeMapping = {
    'general': 'other',
    'abhyanga': 'abhyanga',
    'shirodhara': 'shirodhara',
    'panchakarma': 'panchakarma',
    'swedana': 'swedana',
    'nasya': 'nasya',
    'virechana': 'virechana',
    'basti': 'basti',
    'vamana': 'other',
    'raktamokshana': 'other'
  };
  
  for (const sessionData of scheduledSessions) {
    const planMeta = planMetaMap[sessionData.treatmentPlanId] || {};
    
    const validTherapyType = therapyTypeMapping[sessionData.therapyType?.toLowerCase()] || 'other';
    
    // 🔥 CRITICAL: Use requiredDay as dayNumber
    const dayNumber = sessionData.requiredDay || calculateDayNumber(sessionData);
    
    const consultationDoc = {
      // Basic identity
      patientId: sessionData.patientId,
      providerId: sessionData.therapistId,
      providerModel: 'Therapist',
      providerType: 'therapist',
      
      // Consultation type
      type: 'in_person',
      sessionType: 'therapy',
      
      // Scheduling details
      scheduledAt: sessionData.scheduledStartTime,
      scheduledDate: sessionData.scheduledDate,
      scheduledTime: sessionData.scheduledStartTime.toTimeString().slice(0, 5),
      sessionStartTime: sessionData.scheduledStartTime,
      sessionEndTime: sessionData.scheduledEndTime,
      estimatedDuration: sessionData.durationMinutes || 60,
      
      // Status
      status: 'scheduled',
      sessionStatus: 'scheduled',
      
      // Therapy-specific data
      therapyData: {
        treatmentPlanId: sessionData.treatmentPlanId,
        doctorId: planMeta.doctorId,
        therapistId: sessionData.therapistId,
        therapyName: sessionData.therapyName || 'Therapy Session',
        therapyType: validTherapyType,
        durationMinutes: sessionData.durationMinutes || 60,
        
        // 🔥 CRITICAL: Use requiredDay as dayNumber
        dayNumber: dayNumber,
        totalDays: planMeta.totalDays,
        
        todayProcedure: sessionData.therapyName || 'Therapy',
        
        // Session metadata
        phaseSequence: sessionData.phaseSequence,
        phaseName: sessionData.phaseName || 'Unknown Phase',
        sessionNumber: sessionData.sessionNumber,
        sessionInTherapy: sessionData.sessionInTherapy,
        totalSessionsInTherapy: sessionData.totalSessionsInTherapy,
        
        // Empty arrays for session tracking
        vitals: {},
        observations: {},
        adverseEffects: [],
        materialsUsed: [],
        progressUpdates: []
      },
      
      // Metadata
      notes: `Auto-scheduled: Day ${dayNumber} - ${sessionData.phaseName || 'Phase'} - ${sessionData.therapyName || 'Therapy'}`,
      sessionMetadata: {
        totalPauses: 0,
        pausedDuration: 0,
        connectionIssues: 0,
        lastActivity: new Date()
      },
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    consultationDocs.push(consultationDoc);
  }
  
  // Bulk insert
  const created = await Consultation.insertMany(consultationDocs, { session: mongoSession });
  
  // Map consultation IDs back to sessions
  created.forEach((consultation, index) => {
    scheduledSessions[index].consultationId = consultation._id;
  });
  
  logger.info(`✅ Created ${created.length} consultations`);
  
  return created;
}

/**
 * 🔥 FIXED: Calculate day number from requiredDay (preferred) or date difference
 */
function calculateDayNumber(session) {
  // PREFERRED: Use requiredDay if available
  if (session.requiredDay !== undefined && session.requiredDay !== null) {
    return session.requiredDay;
  }
  
  // FALLBACK: Calculate from dates
  if (!session.scheduledDate || !session.planStartDate) {
    logger.warn(`⚠️ Session ${session.sessionId} missing requiredDay and dates, using 1`);
    return 1;
  }
  
  // Normalize to date-only (midnight UTC)
  const scheduledDateOnly = new Date(session.scheduledDate);
  scheduledDateOnly.setUTCHours(0, 0, 0, 0);
  
  const startDateOnly = new Date(session.planStartDate);
  startDateOnly.setUTCHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor(
    (scheduledDateOnly - startDateOnly) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(1, daysDiff + 1);
}

/**
 * 🔥 NEW: Calculate total days from plan phases
 */
function calculatePlanTotalDays(plan) {
  if (!plan.phases || plan.phases.length === 0) return 0;
  
  return plan.phases.reduce((sum, phase) => {
    return sum + (phase.totalDays || 0);
  }, 0);
}

// ═══════════════════════════════════════════════════════════
// STEP 6.2: UPDATE TREATMENT PLANS
// ═══════════════════════════════════════════════════════════

/**
 * Update treatment plans with generated sessions and scheduling metadata
 */
async function updateTreatmentPlans(
  treatmentPlans,
  allSessions,
  consultations,
  startTime,
  mongoSession
) {
  logger.info('📋 Updating treatment plans...');
  
  const updatedPlans = [];
  
  for (const plan of treatmentPlans) {
    // Get sessions for this plan
    const planSessions = allSessions.filter(s => s.treatmentPlanId === plan._id.toString());
    
    if (planSessions.length === 0) {
      logger.warn(`⚠️ No sessions found for plan ${plan._id}`);
      continue;
    }
    
    // Count scheduled vs conflicted
    const scheduledCount = planSessions.filter(s => s.isScheduled && !s.hasConflict).length;
    const conflictCount = planSessions.filter(s => s.hasConflict).length;
    
    // Build generatedSessions array
    const generatedSessions = planSessions
      .filter(s => s.isScheduled || s.hasConflict)
      .map(s => ({
        consultationId: s.consultationId || null,
        
        // Phase info
        phaseSequence: s.phaseSequence,
        phaseName: s.phaseName || 'Unknown Phase',
        
        // Therapy info
        therapyId: s.therapyId,
        therapyName: s.therapyName || 'Therapy',
        
        // Session positioning
        sessionNumber: s.sessionNumber,
        dayNumber: s.requiredDay || calculateDayNumber(s),  // 🔥 Use requiredDay
        
        // Scheduling details
        scheduledDate: s.scheduledDate || null,
        scheduledStartTime: s.scheduledStartTime || null,
        scheduledEndTime: s.scheduledEndTime || null,
        
        // Status
        status: s.hasConflict ? 'conflict' : 'scheduled',
        
        // Dependencies
        dependsOn: s.dependsOn.map(depId => {
          const depSession = allSessions.find(ds => ds.sessionId === depId);
          return depSession?.consultationId || null;
        }).filter(id => id !== null),
        
        prerequisitesMet: !s.hasConflict,
        
        // Conflict info
        conflictReason: s.conflictReason || null
      }));
    
    // Calculate scheduling status
    let schedulingStatus;
    if (conflictCount === 0 && scheduledCount === planSessions.length) {
      schedulingStatus = 'scheduled';
    } else if (scheduledCount > 0) {
      schedulingStatus = 'partial';
    } else {
      schedulingStatus = 'failed';
    }
    
    // Build scheduling metadata
    const executionTimeMs = Date.now() - startTime;
    const optimizationScore = calculatePlanOptimizationScore(planSessions);
    
    const schedulingMetadata = {
      algorithmUsed: planSessions.length > 10 ? 'cp_mip_gals' : 'cp_mip',
      executionTimeMs: executionTimeMs,
      conflictsResolved: 0,
      optimizationScore: optimizationScore,
      warnings: conflictCount > 0 ? [`${conflictCount} sessions could not be scheduled`] : [],
      scheduledBy: null,
      scheduledAt: new Date()
    };
    
    // Update the TreatmentPlan document
    const updated = await TreatmentPlan.findByIdAndUpdate(
      plan._id,
      {
        $set: {
          generatedSessions: generatedSessions,
          autoScheduled: true,
          schedulingStatus: schedulingStatus,
          schedulingCompletedAt: new Date(),
          schedulingMetadata: schedulingMetadata,
          totalSessionsPlanned: planSessions.length,
          updatedAt: new Date()
        }
      },
      {
        new: true,
        session: mongoSession
      }
    );
    
    updatedPlans.push(updated);
    
    logger.info(`✅ Updated plan ${plan._id}: ${scheduledCount}/${planSessions.length} sessions scheduled`);
  }
  
  logger.info(`✅ Updated ${updatedPlans.length} treatment plans`);
  
  return updatedPlans;
}

/**
 * Calculate optimization score for a plan
 */
function calculatePlanOptimizationScore(planSessions) {
  const total = planSessions.length;
  if (total === 0) return 0;
  
  const scheduled = planSessions.filter(s => s.isScheduled && !s.hasConflict).length;
  const successRate = (scheduled / total) * 100;
  
  // Check preference matches
  const withPreferences = planSessions.filter(s => 
    s.isScheduled && 
    s.scheduledStartTime &&
    s.patientPreferredTimeSlot !== 'flexible'
  );
  
  let preferenceMatches = 0;
  
  for (const session of withPreferences) {
    if (!session.scheduledStartTime) continue;
    
    const hour = session.scheduledStartTime.getHours();
    const timeOfDay = getTimeOfDay(hour);
    if (timeOfDay === session.patientPreferredTimeSlot) {
      preferenceMatches++;
    }
  }
  
  const preferenceRate = withPreferences.length > 0 
    ? (preferenceMatches / withPreferences.length) * 100 
    : 100;
  
  // Weighted score
  return (successRate * 0.7) + (preferenceRate * 0.3);
}

// ═══════════════════════════════════════════════════════════
// STEP 6.3: COMPILE RESULTS
// ═══════════════════════════════════════════════════════════

/**
 * Compile final scheduling results with statistics
 */
function compileSchedulingResults(treatmentPlans, allSessions, consultations, startTime) {
  logger.info('📊 Compiling results...');
  
  const executionTimeMs = Date.now() - startTime;
  
  // Overall statistics
  const totalSessions = allSessions.length;
  const scheduledSessions = allSessions.filter(s => s.isScheduled && !s.hasConflict).length;
  const conflictedSessions = allSessions.filter(s => s.hasConflict).length;
  const successRate = totalSessions > 0 ? (scheduledSessions / totalSessions) * 100 : 0;
  
  // Per-plan breakdown
  const planBreakdown = treatmentPlans.map(plan => {
    const planSessions = allSessions.filter(s => s.treatmentPlanId === plan._id.toString());
    const scheduled = planSessions.filter(s => s.isScheduled && !s.hasConflict);
    const conflicts = planSessions.filter(s => s.hasConflict);
    
    // Calculate date range
    const scheduledDates = scheduled
      .map(s => s.scheduledDate)
      .filter(d => d != null)
      .sort((a, b) => a - b);
    
    const startDate = scheduledDates.length > 0 ? scheduledDates[0] : null;
    const endDate = scheduledDates.length > 0 ? scheduledDates[scheduledDates.length - 1] : null;
    const courseDurationDays = startDate && endDate 
      ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    
    // 🔥 NEW: Calculate planned duration from phases
    const plannedDurationDays = plan.totalDays || calculatePlanTotalDays(plan);
    
    return {
      treatmentPlanId: plan._id,
      patientId: plan.patientId?._id || plan.patientId,
      patientName: plan.patientId?.name || 'Unknown',
      therapistId: plan.assignedTherapistId?._id || plan.assignedTherapistId,
      therapistName: plan.assignedTherapistId?.name || 'Unknown',
      treatmentName: plan.treatmentName || 'Unnamed Treatment',
      
      totalSessions: planSessions.length,
      scheduledSessions: scheduled.length,
      conflictedSessions: conflicts.length,
      successRate: planSessions.length > 0 
        ? ((scheduled.length / planSessions.length) * 100).toFixed(1)
        : '0.0',
      
      startDate: startDate,
      endDate: endDate,
      courseDurationDays: courseDurationDays,
      plannedDurationDays: plannedDurationDays,
      
      status: plan.schedulingStatus || 'pending',
      optimizationScore: plan.schedulingMetadata?.optimizationScore || 0,
      
      conflicts: conflicts.map(c => ({
        sessionNumber: c.sessionNumber,
        therapyName: c.therapyName || 'Unknown',
        dayNumber: c.requiredDay,  // 🔥 Include requiredDay
        reason: c.conflictReason || 'Unknown'
      }))
    };
  });
  
  // Resource utilization
  const therapistUtilization = calculateTherapistUtilization(allSessions);
  
  // Quality metrics
  const avgOptimizationScore = planBreakdown.length > 0
    ? planBreakdown.reduce((sum, p) => sum + (p.optimizationScore || 0), 0) / planBreakdown.length
    : 0;
  
  const avgCourseDuration = planBreakdown.length > 0
    ? planBreakdown.reduce((sum, p) => sum + p.courseDurationDays, 0) / planBreakdown.length
    : 0;
  
  const onTimeCount = planBreakdown.filter(p => 
    p.courseDurationDays > 0 && p.courseDurationDays <= p.plannedDurationDays
  ).length;
  
  const onTimeRate = planBreakdown.length > 0
    ? (onTimeCount / planBreakdown.length) * 100
    : 0;
  
  const result = {
    success: true,
    message: `Successfully scheduled ${treatmentPlans.length} treatment plan(s)`,
    
    summary: {
      totalPlans: treatmentPlans.length,
      totalSessions: totalSessions,
      scheduledSessions: scheduledSessions,
      conflictedSessions: conflictedSessions,
      successRate: successRate.toFixed(1),
      executionTimeMs: executionTimeMs
    },
    
    plans: planBreakdown,
    
    resourceUtilization: {
      therapists: therapistUtilization
    },
    
    qualityMetrics: {
      averageOptimizationScore: avgOptimizationScore.toFixed(1),
      averageCourseDuration: avgCourseDuration.toFixed(1),
      onTimeCompletionRate: onTimeRate.toFixed(1)
    },
    
    consultationsCreated: consultations.length,
    
    algorithmUsed: totalSessions > 10 ? 'cp_mip_gals' : 'cp_mip'
  };
  
  logger.info('✅ Results compiled');
  logger.info(`   Success rate: ${result.summary.successRate}%`);
  logger.info(`   Execution time: ${executionTimeMs}ms`);
  logger.info(`   Optimization score: ${result.qualityMetrics.averageOptimizationScore}/100`);
  
  return result;
}

/**
 * Calculate therapist utilization statistics
 */
function calculateTherapistUtilization(allSessions) {
  const scheduledSessions = allSessions.filter(s => s.isScheduled && !s.hasConflict && s.scheduledDate);
  
  // Group by therapist and date
  const therapistDays = {};
  
  for (const session of scheduledSessions) {
    const dateKey = getDateKey(session.scheduledDate);
    const key = `${session.therapistId}_${dateKey}`;
    
    if (!therapistDays[key]) {
      therapistDays[key] = {
        therapistId: session.therapistId,
        date: session.scheduledDate,
        sessions: [],
        totalMinutes: 0
      };
    }
    
    therapistDays[key].sessions.push(session);
    therapistDays[key].totalMinutes += session.totalMinutes || 0;
  }
  
  // Calculate utilization per therapist
  const therapistStats = {};
  
  for (const day of Object.values(therapistDays)) {
    if (!therapistStats[day.therapistId]) {
      therapistStats[day.therapistId] = {
        totalDays: 0,
        totalMinutes: 0,
        totalSessions: 0
      };
    }
    
    therapistStats[day.therapistId].totalDays++;
    therapistStats[day.therapistId].totalMinutes += day.totalMinutes;
    therapistStats[day.therapistId].totalSessions += day.sessions.length;
  }
  
  // Calculate final stats
  const utilization = {};
  
  for (const [therapistId, stats] of Object.entries(therapistStats)) {
    const avgMinutesPerDay = stats.totalDays > 0 ? stats.totalMinutes / stats.totalDays : 0;
    const avgSessionsPerDay = stats.totalDays > 0 ? stats.totalSessions / stats.totalDays : 0;
    const avgUtilization = (avgMinutesPerDay / 480) * 100; // 8-hour workday
    
    utilization[therapistId] = {
      totalDays: stats.totalDays,
      totalSessions: stats.totalSessions,
      avgSessionsPerDay: avgSessionsPerDay.toFixed(1),
      avgMinutesPerDay: Math.round(avgMinutesPerDay),
      utilizationPercentage: Math.min(100, avgUtilization).toFixed(1)
    };
  }
  
  return utilization;
}

// ═══════════════════════════════════════════════════════════
// UPDATE TREATMENT PLAN WITH CONSULTATION IDs
// ═══════════════════════════════════════════════════════════

/**
 * Update treatment plan phases with consultation IDs
 */
async function updateTreatmentPlanSessions(treatmentPlanId, sessions) {
  try {
    const plan = await TreatmentPlan.findById(treatmentPlanId);
    
    if (!plan) {
      logger.error(`❌ Treatment plan ${treatmentPlanId} not found`);
      return;
    }

    // Update each phase's therapy sessions with consultation IDs
    for (const session of sessions) {
      if (!session.consultationId) continue;

      const phase = plan.phases.find(p => p.sequenceNumber === session.phaseSequence);
      if (!phase) {
        logger.warn(`⚠️ Phase ${session.phaseSequence} not found in plan ${treatmentPlanId}`);
        continue;
      }

      const therapySession = phase.therapySessions.find(ts => 
        ts.therapyId.toString() === session.therapyId
      );
      
      if (therapySession) {
        if (!therapySession.consultationIds) {
          therapySession.consultationIds = [];
        }
        therapySession.consultationIds.push(session.consultationId);
      }
    }

    await plan.save();
    logger.info(`✅ Updated treatment plan ${treatmentPlanId} with consultation IDs`);
    
  } catch (error) {
    logger.error(`❌ Failed to update treatment plan:`, error);
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
  createDraftConsultations,
  createConsultationDocuments,
  updateTreatmentPlans,
  updateTreatmentPlanSessions,
  compileSchedulingResults,
  calculateDayNumber,
  calculatePlanOptimizationScore,
  calculatePlanTotalDays
};