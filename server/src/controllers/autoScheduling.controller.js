// controllers/autoscheduling.controller.js
// 🎮 SCHEDULING CONTROLLER - API Endpoints

const mongoose = require('mongoose');
const SchedulingService = require('../services/scheduling.service');
const TreatmentPlan = require('../models/TreatmentPlan');
const Consultation = require('../models/Consultation');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// ═══════════════════════════════════════════════════════════
// SINGLE TREATMENT PLAN SCHEDULING
// ═══════════════════════════════════════════════════════════

/**
 * Schedule a single treatment plan
 * POST /api/scheduling/treatment-plans/:planId/schedule
 */
const scheduleSinglePlan = async (req, res) => {  // ✅ CHANGED: const instead of exports.
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    
    logger.info(`📅 Scheduling request for treatment plan: ${planId} by user: ${userId}`);
    
    // STEP 1: Validate treatment plan
    const treatmentPlan = await TreatmentPlan.findById(planId)
      .populate('assignedTherapistId patientId doctorId');
    
    if (!treatmentPlan) {
      return res.status(404).json({
        success: false,
        message: 'Treatment plan not found'
      });
    }
    
    // Check ownership
    if (treatmentPlan.doctorId._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only schedule your own treatment plans'
      });
    }
    
    // Check if ready
    if (!treatmentPlan.isReadyForScheduling()) {
      return res.status(400).json({
        success: false,
        message: 'Treatment plan is not ready for scheduling',
        details: {
          hasPhases: treatmentPlan.phases && treatmentPlan.phases.length > 0,
          hasStartDate: !!treatmentPlan.schedulingPreferences?.startDate,
          hasTherapist: !!treatmentPlan.assignedTherapistId
        }
      });
    }
    
    // Check if already scheduled
    if (treatmentPlan.schedulingStatus === 'scheduled' && !req.body.forceReschedule) {
      return res.status(400).json({
        success: false,
        message: 'Treatment plan is already scheduled. Use forceReschedule=true to reschedule.',
        currentStatus: treatmentPlan.schedulingStatus,
        scheduledAt: treatmentPlan.schedulingCompletedAt
      });
    }
    
    // STEP 2: Call scheduling service
    logger.info('🚀 Calling scheduling service...');
    
    const result = await SchedulingService.generateDraftSchedule(planId);
    
    // STEP 3: Return results
    logger.info(`✅ Scheduling completed: ${result.summary.successRate}% success`);
    
    res.status(200).json({
      success: true,
      message: 'Treatment plan scheduled successfully',
      data: result
    });
    
  } catch (error) {
    logger.error('❌ Scheduling failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Scheduling failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ═══════════════════════════════════════════════════════════
// BATCH TREATMENT PLAN SCHEDULING
// ═══════════════════════════════════════════════════════════

/**
 * Schedule multiple treatment plans together
 * POST /api/scheduling/treatment-plans/batch-schedule
 */
const batchSchedulePlans = async (req, res) => {  // ✅ CHANGED
  try {
    const { treatmentPlanIds } = req.body;
    const userId = req.user.id;
    
    logger.info(`📅 Batch scheduling request for ${treatmentPlanIds.length} plans by user: ${userId}`);
    
    // STEP 1: Validate input
    if (!Array.isArray(treatmentPlanIds) || treatmentPlanIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'treatmentPlanIds must be a non-empty array'
      });
    }
    
    if (treatmentPlanIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 treatment plans can be scheduled at once'
      });
    }
    
    // STEP 2: Fetch and validate all treatment plans
    const treatmentPlans = await TreatmentPlan.find({
      _id: { $in: treatmentPlanIds }
    }).populate('assignedTherapistId patientId doctorId');
    
    if (treatmentPlans.length !== treatmentPlanIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some treatment plans not found',
        found: treatmentPlans.length,
        requested: treatmentPlanIds.length
      });
    }
    
    // Check ownership
    if (req.user.role !== 'admin') {
      const unauthorized = treatmentPlans.filter(
        plan => plan.doctorId._id.toString() !== userId
      );
      
      if (unauthorized.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only schedule your own treatment plans',
          unauthorizedPlans: unauthorized.map(p => p._id)
        });
      }
    }
    
    // Check if all plans are ready
    const notReady = treatmentPlans.filter(plan => !plan.isReadyForScheduling());
    
    if (notReady.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some treatment plans are not ready for scheduling',
        notReadyPlans: notReady.map(p => ({
          planId: p._id,
          patientName: p.patientId.name,
          issues: {
            hasPhases: p.phases && p.phases.length > 0,
            hasStartDate: !!p.schedulingPreferences?.startDate,
            hasTherapist: !!p.assignedTherapistId
          }
        }))
      });
    }
    
    // STEP 3: Call batch scheduling service
    logger.info('🚀 Calling batch scheduling service...');
    
    const result = await SchedulingService.generateDraftSchedule(treatmentPlanIds);
    
    // STEP 4: Return results
    logger.info(`✅ Batch scheduling completed: ${result.summary.successRate}% success`);
    
    res.status(200).json({
      success: true,
      message: `Successfully scheduled ${treatmentPlanIds.length} treatment plan(s)`,
      data: result
    });
    
  } catch (error) {
    logger.error('❌ Batch scheduling failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Batch scheduling failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET SCHEDULING STATUS
// ═══════════════════════════════════════════════════════════

/**
 * Get scheduling status for a treatment plan
 * GET /api/scheduling/treatment-plans/:planId/status
 */
const getSchedulingStatus = async (req, res) => {  // ✅ CHANGED
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    
    const treatmentPlan = await TreatmentPlan.findById(planId)
      .populate('assignedTherapistId patientId doctorId')
      .select('schedulingStatus schedulingMetadata generatedSessions autoScheduled schedulingCompletedAt totalSessionsPlanned');
    
    if (!treatmentPlan) {
      return res.status(404).json({
        success: false,
        message: 'Treatment plan not found'
      });
    }
    
    // Check access
    if (treatmentPlan.doctorId._id.toString() !== userId && 
        treatmentPlan.assignedTherapistId._id.toString() !== userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        treatmentPlanId: treatmentPlan._id,
        schedulingStatus: treatmentPlan.schedulingStatus,
        autoScheduled: treatmentPlan.autoScheduled,
        scheduledAt: treatmentPlan.schedulingCompletedAt,
        
        totalSessions: treatmentPlan.totalSessionsPlanned,
        scheduledSessions: treatmentPlan.generatedSessions?.filter(s => s.status === 'draft' || s.status === 'scheduled').length || 0,
        conflictedSessions: treatmentPlan.generatedSessions?.filter(s => s.status === 'conflict').length || 0,
        
        metadata: treatmentPlan.schedulingMetadata,
        
        sessions: treatmentPlan.generatedSessions
      }
    });
    
  } catch (error) {
    logger.error('❌ Get status failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduling status',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET PENDING SCHEDULES
// ═══════════════════════════════════════════════════════════

/**
 * Get all treatment plans pending therapist approval
 * GET /api/scheduling/pending
 */
const getPendingSchedules = async (req, res) => {  // ✅ CHANGED
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query = {
      schedulingStatus: { $in: ['scheduled', 'partial'] },
      autoScheduled: true
    };
    
    // If therapist, only show plans assigned to them
    if (userRole === 'therapist') {
      query.assignedTherapistId = userId;
    }
    
    const pendingPlans = await TreatmentPlan.find(query)
      .populate('patientId', 'name email phone profile')
      .populate('assignedTherapistId', 'name email')
      .populate('doctorId', 'name email')
      .select('treatmentName panchakarmaType totalDays schedulingStatus schedulingMetadata generatedSessions totalSessionsPlanned schedulingPreferences')
      .sort({ schedulingCompletedAt: -1 })
      .limit(50);
    
    const formatted = pendingPlans.map(plan => ({
      treatmentPlanId: plan._id,
      treatmentName: plan.treatmentName,
      
      patient: {
        id: plan.patientId._id,
        name: plan.patientId.name,
        email: plan.patientId.email,
        phone: plan.patientId.phone
      },
      
      therapist: {
        id: plan.assignedTherapistId._id,
        name: plan.assignedTherapistId.name
      },
      
      doctor: {
        id: plan.doctorId._id,
        name: plan.doctorId.name
      },
      
      totalSessions: plan.totalSessionsPlanned,
      scheduledSessions: plan.generatedSessions?.filter(s => s.status !== 'conflict').length || 0,
      conflictedSessions: plan.generatedSessions?.filter(s => s.status === 'conflict').length || 0,
      
      startDate: plan.schedulingPreferences?.startDate,
      schedulingStatus: plan.schedulingStatus,
      optimizationScore: plan.schedulingMetadata?.optimizationScore,
      
      scheduledAt: plan.schedulingCompletedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
    
  } catch (error) {
    logger.error('❌ Get pending schedules failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get pending schedules',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// APPROVE SCHEDULE
// ═══════════════════════════════════════════════════════════

/**
 * Approve a scheduled treatment plan
 * POST /api/scheduling/treatment-plans/:planId/approve
 */
const approveSchedule = async (req, res) => {  // ✅ CHANGED
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const treatmentPlan = await TreatmentPlan.findById(planId).session(mongoSession);
    
    if (!treatmentPlan) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(404).json({
        success: false,
        message: 'Treatment plan not found'
      });
    }
    
    // Only assigned therapist or admin can approve
    if (userRole !== 'admin' && treatmentPlan.assignedTherapistId.toString() !== userId) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the assigned therapist can approve'
      });
    }
    
    if (treatmentPlan.schedulingStatus !== 'scheduled' && treatmentPlan.schedulingStatus !== 'partial') {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(400).json({
        success: false,
        message: 'Treatment plan is not in scheduled/partial status',
        currentStatus: treatmentPlan.schedulingStatus
      });
    }
    
    // Get consultation IDs
    const consultationIds = treatmentPlan.generatedSessions
      .filter(s => s.status === 'draft' && s.consultationId)
      .map(s => s.consultationId);
    
    // Update consultations
    await Consultation.updateMany(
      { _id: { $in: consultationIds } },
      { $set: { status: 'scheduled' } },
      { session: mongoSession }
    );
    
    // Update treatment plan
    treatmentPlan.schedulingStatus = 'scheduled';
    treatmentPlan.generatedSessions.forEach(session => {
      if (session.status === 'draft') {
        session.status = 'scheduled';
      }
    });
    
    await treatmentPlan.save({ session: mongoSession });
    
    // Commit transaction
    await mongoSession.commitTransaction();
    mongoSession.endSession();
    
    logger.info(`✅ Schedule approved for plan ${planId} by user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Schedule approved successfully',
      data: {
        treatmentPlanId: planId,
        consultationsUpdated: consultationIds.length
      }
    });
    
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    
    logger.error('❌ Approve schedule failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to approve schedule',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET THERAPIST DAILY SCHEDULE
// ═══════════════════════════════════════════════════════════

/**
 * Get therapist's schedule for a specific date or date range
 * GET /api/scheduling/my-schedule?date=2025-12-10
 * GET /api/scheduling/my-schedule?startDate=2025-12-10&endDate=2025-12-20
 * GET /api/scheduling/my-schedule (defaults to next 7 days)
 */
const getMySchedule = async (req, res) => {  // ✅ CHANGED
  try {
    const userId = req.user.id;
    const { date, startDate, endDate } = req.query;
    
    let query = {
      providerId: userId,
      providerType: 'therapist',
      status: { $in: ['draft', 'scheduled'] },
      sessionType: 'therapy'
    };
    
    // OPTION 1: Single date
    if (date) {
      const requestedDate = new Date(date);
      requestedDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(requestedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.scheduledAt = {
        $gte: requestedDate,
        $lt: nextDay
      };
    }
    // OPTION 2: Date range
    else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.scheduledAt = {
        $gte: start,
        $lte: end
      };
    }
    // OPTION 3: Default to next 7 days
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      query.scheduledAt = {
        $gte: today,
        $lt: nextWeek
      };
    }
    
    // FETCH CONSULTATIONS
    const consultations = await Consultation.find(query)
      .populate('patientId', 'name email phone profile')
      .populate('therapyData.treatmentPlanId', 'treatmentName panchakarmaType')
      .populate('therapyData.doctorId', 'name email')
      .sort({ scheduledAt: 1 })
      .lean();
    
    // GROUP BY DATE
    const scheduleByDate = {};
    
    consultations.forEach(consultation => {
      const dateKey = consultation.scheduledAt.toISOString().split('T')[0];
      
      if (!scheduleByDate[dateKey]) {
        scheduleByDate[dateKey] = {
          date: dateKey,
          dayOfWeek: getDayName(new Date(consultation.scheduledAt)),
          sessions: [],
          totalSessions: 0,
          pendingApproval: 0,
          confirmed: 0
        };
      }
      
      const sessionData = {
        consultationId: consultation._id,
        
        patient: {
          id: consultation.patientId?._id,
          name: consultation.patientId?.name,
          email: consultation.patientId?.email,
          phone: consultation.patientId?.phone,
          age: consultation.patientId?.profile?.age,
          gender: consultation.patientId?.profile?.gender
        },
        
        therapy: {
          type: consultation.therapyData?.therapyType,
          procedure: consultation.therapyData?.todayProcedure,
          dayNumber: consultation.therapyData?.dayNumber,
          totalDays: consultation.therapyData?.totalDays,
          sessionNumber: consultation.therapyData?.sessionNumber,
          phase: consultation.therapyData?.phaseName
        },
        
        treatmentPlan: {
          id: consultation.therapyData?.treatmentPlanId?._id,
          name: consultation.therapyData?.treatmentPlanId?.treatmentName,
          type: consultation.therapyData?.treatmentPlanId?.panchakarmaType
        },
        
        doctor: {
          id: consultation.therapyData?.doctorId?._id,
          name: consultation.therapyData?.doctorId?.name
        },
        
        scheduledStartTime: consultation.scheduledAt,
        scheduledEndTime: consultation.sessionEndTime,
        duration: consultation.estimatedDuration,
        
        status: consultation.status,
        needsApproval: consultation.status === 'draft',
        
        notes: consultation.notes,
        specialInstructions: consultation.therapyData?.specialInstructions
      };
      
      scheduleByDate[dateKey].sessions.push(sessionData);
      scheduleByDate[dateKey].totalSessions++;
      
      if (consultation.status === 'draft') {
        scheduleByDate[dateKey].pendingApproval++;
      } else {
        scheduleByDate[dateKey].confirmed++;
      }
    });
    
    // CONVERT TO ARRAY AND SORT
    const schedule = Object.values(scheduleByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // SUMMARY STATISTICS
    const summary = {
      totalDays: schedule.length,
      totalSessions: consultations.length,
      pendingApproval: consultations.filter(c => c.status === 'draft').length,
      confirmed: consultations.filter(c => c.status === 'scheduled').length,
      uniquePatients: [...new Set(consultations.map(c => c.patientId?._id?.toString()).filter(id => id))].length
    };
    
    res.status(200).json({
      success: true,
      summary: summary,
      schedule: schedule
    });
    
  } catch (error) {
    logger.error('❌ Get my schedule failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
  scheduleSinglePlan,
  batchSchedulePlans,
  getSchedulingStatus,
  getPendingSchedules,
  approveSchedule,
  getMySchedule
};
