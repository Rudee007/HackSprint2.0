// backend/src/controllers/consultation.controller.js

const consultationService = require('../services/consultation.service');
const notificationService = require('../services/notification.service');

// ✅ EXTERNAL ERROR HANDLER (Prevents binding issues)
const handleError = (res, error) => {
  console.error('Consultation Controller Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

class ConsultationController {

  // ✅ ALL METHODS AS ARROW FUNCTIONS (Preserves 'this' binding)

  createConsultation = async (req, res) => {
    try {
      const { patientId, providerId, providerType, type, scheduledAt, fee, notes, meetingLink, sessionType } = req.body;
      
      // Comprehensive validation
      const requiredFields = { patientId, providerId, providerType, type, scheduledAt };
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingFields.length > 0 || fee === undefined) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}${fee === undefined ? ', fee' : ''}`
        });
      }
      
      if (!['doctor', 'therapist'].includes(providerType)) {
        return res.status(400).json({
          success: false,
          message: 'providerType must be either doctor or therapist'
        });
      }
      
      // Authorization check
      if (req.user.role === 'patient' && req.user.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Patients can only book consultations for themselves'
        });
      }
      
      const consultationData = {
        patientId,
        providerId,
        providerType,
        type,
        scheduledAt,
        fee,
        notes,
        meetingLink,
        sessionType
      };
      
      console.log('📋 Creating consultation:', consultationData);
      
      const consultation = await consultationService.createConsultation(consultationData);
      
      // ✅ POPULATE FIELDS FOR NOTIFICATIONS
      const populatedConsultation = await consultationService.getConsultationById(consultation._id);
      
      // ✅ TRIGGER ADMIN NOTIFICATION: New Appointment Booked
      try {
        console.log('📧 Sending new appointment notification to admin...');
        await notificationService.sendNewAppointmentAlert({
          _id: populatedConsultation._id,
          patientName: populatedConsultation.patientId?.name || 'Unknown Patient',
          therapyType: populatedConsultation.sessionType || populatedConsultation.type || 'General Consultation',
          scheduledAt: populatedConsultation.scheduledAt,
          therapistName: populatedConsultation.providerId?.name || 'Not assigned yet',
          fee: populatedConsultation.fee
        });
        console.log('✅ Admin notification sent successfully');
      } catch (notifError) {
        console.error('⚠️ Admin notification failed:', notifError.message);
        // Don't fail the request if notification fails
      }

      // ✅ TRIGGER PATIENT CONFIRMATION EMAIL
      try {
        console.log('📧 Sending appointment confirmation to patient...');
        await notificationService.sendAppointmentConfirmation({
          patientEmail: populatedConsultation.patientId?.email,
          patientName: populatedConsultation.patientId?.name,
          therapyType: populatedConsultation.sessionType || populatedConsultation.type,
          scheduledAt: populatedConsultation.scheduledAt,
          centerName: 'AyurSutra Wellness Center'
        });
        console.log('✅ Patient confirmation sent successfully');
      } catch (notifError) {
        console.error('⚠️ Patient confirmation failed:', notifError.message);
      }

      // ✅ TRIGGER WEBSOCKET NOTIFICATION (if available)
      try {
        const io = req.app.get('io');
        if (io) {
          io.to('admin-room').emit('new_appointment_booked', {
            appointmentId: populatedConsultation._id,
            patientName: populatedConsultation.patientId?.name,
            therapyType: populatedConsultation.sessionType || populatedConsultation.type,
            scheduledAt: populatedConsultation.scheduledAt,
            fee: populatedConsultation.fee,
            timestamp: new Date()
          });
          console.log('✅ WebSocket notification sent to admins');
        }
      } catch (wsError) {
        console.error('⚠️ WebSocket notification failed:', wsError.message);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: consultation
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  getConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Consultation ID is required'
        });
      }
      
      console.log('🔍 Getting consultation:', id);
      
      const consultation = await consultationService.getConsultationById(id);
      
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }
  
      // Authorization check
      if (!this.canAccessConsultation(req.user, consultation)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
  
      return res.json({
        success: true,
        data: consultation
      });
  
    } catch (error) {
      return handleError(res, error);
    }
  };
  
  getPatientConsultations = async (req, res) => {
    try {
      const { patientId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
      
      // Authorization check
      if (req.user.role === 'patient' && req.user.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const options = {
        status,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      // Parallel execution for better performance
      const [consultations, total] = await Promise.all([
        consultationService.getConsultationsByPatient(patientId, options),
        consultationService.countConsultationsByPatient(patientId, status ? { status } : {})
      ]);
      
      return res.json({
        success: true,
        message: `Found ${consultations.length} consultations`,
        data: consultations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  getProviderConsultations = async (req, res) => {
    try {
      const { providerId } = req.params;
      const { providerType, status, page = 1, limit = 20 } = req.query;
      
      if (!providerId) {
        return res.status(400).json({
          success: false,
          message: 'Provider ID is required'
        });
      }
      
      // Authorization check
      if ((req.user.role === 'doctor' || req.user.role === 'therapist') && req.user.id !== providerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const options = {
        providerType,
        status,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      const [consultations, total] = await Promise.all([
        consultationService.getConsultationsByProvider(providerId, options),
        consultationService.countConsultationsByProvider(providerId, { 
          ...(providerType && { providerType }), 
          ...(status && { status }) 
        })
      ]);
      
      return res.json({
        success: true,
        message: `Found ${consultations.length} consultations`,
        data: consultations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total
        }
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  getUpcomingConsultations = async (req, res) => {
    try {
      const { providerId } = req.params;
      
      if ((req.user.role === 'doctor' || req.user.role === 'therapist') && req.user.id !== providerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const consultations = await consultationService.getUpcomingConsultations(providerId);
      
      return res.json({
        success: true,
        message: `Found ${consultations.length} upcoming consultations`,
        data: consultations
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  updateConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Consultation ID is required'
        });
      }

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      // Check permissions
      if (!this.canModifyConsultation(req.user, consultation)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      console.log('📝 Updating consultation:', id, updateData);

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);
      
      // ✅ TRIGGER ADMIN NOTIFICATION: Session Status Update
      if (updateData.status || updateData.sessionStatus) {
        try {
          const newStatus = updateData.status || updateData.sessionStatus;
          console.log(`📧 Sending session status notification: ${newStatus}`);
          
          await notificationService.sendSessionStatusAlert({
            _id: updatedConsultation._id,
            status: newStatus,
            patientName: updatedConsultation.patientId?.name || 'Unknown Patient',
            therapyType: updatedConsultation.sessionType || updatedConsultation.type || 'General',
            therapistName: updatedConsultation.providerId?.name || 'Unassigned',
            sessionStartTime: updatedConsultation.sessionStartTime,
            sessionEndTime: updatedConsultation.sessionEndTime,
            actualDuration: updatedConsultation.actualDuration,
            estimatedDuration: updatedConsultation.estimatedDuration
          });
          console.log('✅ Status update notification sent');
        } catch (notifError) {
          console.error('⚠️ Status notification failed:', notifError.message);
        }

        // ✅ WEBSOCKET NOTIFICATION
        try {
          const io = req.app.get('io');
          if (io) {
            io.to('admin-room').emit('session_status_update', {
              sessionId: updatedConsultation._id,
              status: updateData.status || updateData.sessionStatus,
              patientName: updatedConsultation.patientId?.name,
              therapyType: updatedConsultation.sessionType || updatedConsultation.type,
              timestamp: new Date()
            });
            console.log('✅ WebSocket status update sent');
          }
        } catch (wsError) {
          console.error('⚠️ WebSocket notification failed:', wsError.message);
        }
      }

      // ✅ TRIGGER POST-THERAPY CARE EMAIL (when session completed)
      if ((updateData.status === 'completed' || updateData.sessionStatus === 'completed') && 
          consultation.status !== 'completed') {
        try {
          console.log('📧 Sending post-therapy care instructions...');
          await notificationService.sendPostTherapyCare({
            patientEmail: updatedConsultation.patientId?.email,
            patientName: updatedConsultation.patientId?.name,
            therapyType: updatedConsultation.sessionType || updatedConsultation.type
          });
          console.log('✅ Post-therapy care sent');
        } catch (notifError) {
          console.error('⚠️ Post-therapy care notification failed:', notifError.message);
        }

        // ✅ TRIGGER FEEDBACK REQUEST
        try {
          console.log('📧 Sending feedback request...');
          await notificationService.sendFeedbackRequest({
            patientEmail: updatedConsultation.patientId?.email,
            patientName: updatedConsultation.patientId?.name,
            therapyType: updatedConsultation.sessionType || updatedConsultation.type,
            sessionId: updatedConsultation._id,
            centerName: 'AyurSutra Wellness Center'
          });
          console.log('✅ Feedback request sent');
        } catch (notifError) {
          console.error('⚠️ Feedback request failed:', notifError.message);
        }
      }
      
      return res.json({
        success: true,
        message: 'Consultation updated successfully',
        data: updatedConsultation
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  cancelConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Consultation ID is required'
        });
      }

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      // Check permissions
      if (!this.canCancelConsultation(req.user, consultation)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      console.log('❌ Cancelling consultation:', id);

      const cancelledConsultation = await consultationService.cancelConsultation(id, reason);
      
      // ✅ TRIGGER ADMIN NOTIFICATION: Appointment Cancelled
      try {
        console.log('📧 Sending cancellation notification to admin...');
        await notificationService.sendCancellationAlert({
          _id: cancelledConsultation._id,
          patientName: cancelledConsultation.patientId?.name || 'Unknown Patient',
          therapyType: cancelledConsultation.sessionType || cancelledConsultation.type || 'General',
          scheduledAt: cancelledConsultation.scheduledAt,
          reason: reason || 'No reason provided',
          cancelledBy: req.user.role === 'admin' ? 'Admin' : req.user.role === 'patient' ? 'Patient' : 'Provider',
          refundAmount: cancelledConsultation.fee * 0.8 // 80% refund policy (example)
        });
        console.log('✅ Cancellation notification sent');
      } catch (notifError) {
        console.error('⚠️ Cancellation notification failed:', notifError.message);
      }

      // ✅ TRIGGER PATIENT CANCELLATION EMAIL
      try {
        console.log('📧 Sending cancellation email to patient...');
        await notificationService.sendAppointmentCancellation({
          patientEmail: cancelledConsultation.patientId?.email,
          patientName: cancelledConsultation.patientId?.name,
          therapyType: cancelledConsultation.sessionType || cancelledConsultation.type,
          scheduledAt: cancelledConsultation.scheduledAt,
          reason: reason || 'unavoidable circumstances'
        });
        console.log('✅ Patient cancellation email sent');
      } catch (notifError) {
        console.error('⚠️ Patient cancellation email failed:', notifError.message);
      }

      // ✅ WEBSOCKET NOTIFICATION
      try {
        const io = req.app.get('io');
        if (io) {
          io.to('admin-room').emit('appointment_cancelled', {
            appointmentId: cancelledConsultation._id,
            patientName: cancelledConsultation.patientId?.name,
            therapyType: cancelledConsultation.sessionType || cancelledConsultation.type,
            reason: reason,
            timestamp: new Date()
          });
          console.log('✅ WebSocket cancellation notification sent');
        }
      } catch (wsError) {
        console.error('⚠️ WebSocket notification failed:', wsError.message);
      }
      
      return res.json({
        success: true,
        message: 'Consultation cancelled successfully',
        data: cancelledConsultation
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  getProviderStats = async (req, res) => {
    try {
      const { providerId } = req.params;
      const { startDate, endDate } = req.query;
      
      if ((req.user.role === 'doctor' || req.user.role === 'therapist') && req.user.id !== providerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const stats = await consultationService.getConsultationStats(providerId, startDate, endDate);
      
      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      return handleError(res, error);
    }
  };

  // ✅ BACKWARD COMPATIBILITY METHODS
  getDoctorConsultations = async (req, res) => {
    req.query.providerType = 'doctor';
    req.params.providerId = req.params.doctorId;
    return this.getProviderConsultations(req, res);
  };

  getTherapistConsultations = async (req, res) => {
    req.query.providerType = 'therapist';
    req.params.providerId = req.params.therapistId;
    return this.getProviderConsultations(req, res);
  };

  // ✅ ADMIN: ASSIGN PROVIDER
  adminAssignProvider = async (req, res) => {
    try {
      console.log('🔍 Assign Provider Request:', {
        params: req.params,
        body: req.body,
        user: { role: req.user?.role, type: req.user?.type }
      });

      // Check admin permission
      if (!['admin', 'super_admin', 'moderator'].includes(req.user?.role) && req.user?.type !== 'admin') {
        console.log('❌ Access denied - not admin');
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { id } = req.params;
      const { providerId, providerType, reason } = req.body;

      // Validation
      if (!providerId) {
        return res.status(400).json({
          success: false,
          message: 'Provider ID is required'
        });
      }

      if (!providerType) {
        return res.status(400).json({
          success: false,
          message: 'Provider type is required'
        });
      }

      if (!['doctor', 'therapist'].includes(providerType)) {
        return res.status(400).json({
          success: false,
          message: 'Provider type must be either doctor or therapist'
        });
      }

      console.log('🔍 Fetching appointment:', id);
      const consultation = await consultationService.getConsultationById(id);
      
      if (!consultation) {
        console.log('❌ Appointment not found:', id);
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      console.log('✅ Current appointment found');
      console.log('👨‍⚕️ Assigning new provider:', { providerId, providerType });

      const updateData = {
        providerId,
        providerType,
        notes: consultation.notes 
          ? `${consultation.notes}\n\n[Admin Reassigned Provider - ${new Date().toISOString()}]\n${reason || 'Provider changed by admin'}`
          : `[Admin Assigned Provider - ${new Date().toISOString()}]\n${reason || 'Provider assigned by admin'}`
      };

      console.log('📝 Updating with data:', updateData);

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);
      
      console.log('✅ Provider assigned successfully');

      // ✅ TRIGGER THERAPIST ASSIGNMENT NOTIFICATION
      try {
        console.log('📧 Sending therapist assignment notification...');
        await notificationService.sendTherapistAssignment({
          therapistEmail: updatedConsultation.providerId?.email,
          therapistName: updatedConsultation.providerId?.name,
          patientName: updatedConsultation.patientId?.name,
          therapyType: updatedConsultation.sessionType || updatedConsultation.type,
          scheduledAt: updatedConsultation.scheduledAt
        });
        console.log('✅ Therapist assignment notification sent');
      } catch (notifError) {
        console.error('⚠️ Therapist assignment notification failed:', notifError.message);
      }

      return res.json({
        success: true,
        message: 'Provider assigned successfully',
        data: { appointment: updatedConsultation }
      });

    } catch (error) {
      console.error('❌ Assign provider error:', error);
      return handleError(res, error);
    }
  };

  // ✅ AUTHORIZATION HELPER METHODS
  canAccessConsultation(user, consultation) {
    if (!user || !consultation) return false;
  
    // Handle admin access
    if (user.role === 'admin' || user.role === 'super_admin') return true;
  
    // Extract user ID safely
    const userId = user._id ? user._id.toString() : user.id;
  
    // Extract IDs from populated objects
    const patientId = consultation.patientId && consultation.patientId._id ? 
      consultation.patientId._id.toString() : 
      consultation.patientId ? consultation.patientId.toString() : null;
      
    const providerId = consultation.providerId && consultation.providerId._id ? 
      consultation.providerId._id.toString() : 
      consultation.providerId ? consultation.providerId.toString() : null;
  
    // Check if user matches patient or provider
    return userId === patientId || userId === providerId;
  }
  
  canModifyConsultation(user, consultation) {
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    
    const providerId = consultation.providerId && consultation.providerId._id ?
      consultation.providerId._id.toString() :
      consultation.providerId ? consultation.providerId.toString() : null;
    
    return user.id === providerId;
  }

  canCancelConsultation(user, consultation) {
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    
    const patientId = consultation.patientId && consultation.patientId._id ?
      consultation.patientId._id.toString() :
      consultation.patientId ? consultation.patientId.toString() : null;
      
    const providerId = consultation.providerId && consultation.providerId._id ?
      consultation.providerId._id.toString() :
      consultation.providerId ? consultation.providerId.toString() : null;
    
    return user.id === patientId || user.id === providerId;
  }

  canAccessPatientData(user, patientId) {
    return user.role === 'admin' || user.role === 'super_admin' ||
           (user.role === 'patient' && user.id === patientId);
  }

  canAccessProviderData(user, providerId) {
    return user.role === 'admin' || user.role === 'super_admin' ||
           ((user.role === 'doctor' || user.role === 'therapist') && user.id === providerId);
  }
}

// ✅ EXPORT INSTANCE
module.exports = new ConsultationController();
