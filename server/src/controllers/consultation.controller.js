// backend/controllers/consultation.controller.js - ENHANCED VERSION
const consultationService = require('../services/consultation.service');
const notificationService = require('../services/notification.service');
const websocketService = require('../services/websocket.service');
const therapistService = require('../services/therapist.service')


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


  createConsultation = async (req, res) => {
    try {
      const { 
        patientId, 
        providerId, 
        providerType, 
        type, 
        scheduledAt, 
        fee, 
        notes, 
        meetingLink, 
        sessionType,
        therapyData 
      } = req.body;
      
      // === VALIDATION ===
      const requiredFields = { patientId, providerId, providerType, type, scheduledAt };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
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
        sessionType: sessionType || (providerType === 'therapist' ? 'therapy' : 'consultation'),
        ...(therapyData && { therapyData })
      };
      
      console.log('📋 Creating consultation (admin):', consultationData);
      
      // Create + populate
      const consultation = await consultationService.createConsultation(consultationData);
      const populatedConsultation = await consultationService.getConsultationById(consultation._id);
  
      // === NOTIFICATIONS: patient + doctor ===
      try {
        const patient = populatedConsultation.patientId;
        const doctor = populatedConsultation.providerId;
  
        if (patient && doctor) {
          await notificationService.notifyConsultationBooked({
            consultation: populatedConsultation,
            patient,
            doctor
          });
        }
      } catch (notifError) {
        console.error('⚠️ Consultation notifications failed (admin create):', notifError.message);
      }
  
      // === OPTIONAL: WebSocket broadcast (unchanged) ===
      try {
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('new_appointment_booked', {
            appointmentId: populatedConsultation._id,
            patientName: populatedConsultation.patientId?.name,
            therapyType: populatedConsultation.sessionType || populatedConsultation.type,
            scheduledAt: populatedConsultation.scheduledAt,
            fee: populatedConsultation.fee,
            providerType: populatedConsultation.providerType,
            timestamp: new Date()
          });
  
          if (populatedConsultation.providerType === 'therapist') {
            wsService.emitToUser(populatedConsultation.providerId, 'new_session_assigned', {
              sessionId: populatedConsultation._id,
              patientName: populatedConsultation.patientId?.name,
              therapyType: populatedConsultation.therapyData?.therapyType || 'General Therapy',
              scheduledAt: populatedConsultation.scheduledAt
            });
          }
  
          console.log('✅ WebSocket notifications sent (admin create)');
        }
      } catch (wsError) {
        console.error('⚠️ WebSocket notification failed (admin create):', wsError.message);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: populatedConsultation
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
      
      // 🔥 NEW: Real-time WebSocket for therapy sessions
      const wsService = req.app.get('wsService');
      
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

        // ✅ ENHANCED WEBSOCKET NOTIFICATION
        try {
          if (wsService) {
            wsService.emit('session_status_update', {
              sessionId: updatedConsultation._id,
              status: updateData.status || updateData.sessionStatus,
              patientName: updatedConsultation.patientId?.name,
              therapyType: updatedConsultation.sessionType || updatedConsultation.type,
              timestamp: new Date()
            });
            
            // 🔥 NEW: Real-time updates for therapy sessions
            if (updatedConsultation.sessionType === 'therapy') {
              // Emit to doctor for monitoring
              if (updatedConsultation.therapyData?.doctorId) {
                wsService.emitToUser(updatedConsultation.therapyData.doctorId, 'therapy_session_update', {
                  sessionId: updatedConsultation._id,
                  status: updateData.status || updateData.sessionStatus,
                  patientName: updatedConsultation.patientId?.name,
                  therapyType: updatedConsultation.therapyData?.therapyType,
                  vitals: updatedConsultation.therapyData?.vitals,
                  observations: updatedConsultation.therapyData?.observations,
                  timestamp: new Date()
                });
              }
              
              // Emit to patient
              wsService.emitToUser(updatedConsultation.patientId, 'my_session_update', {
                sessionId: updatedConsultation._id,
                status: updateData.status || updateData.sessionStatus,
                timestamp: new Date()
              });
            }
            
            console.log('✅ WebSocket status updates sent');
          }
        } catch (wsError) {
          console.error('⚠️ WebSocket notification failed:', wsError.message);
        }
      }

      // 🔥 NEW: Handle therapy-specific updates
      if (updateData.therapyData) {
        try {
          if (wsService) {
            // Real-time therapy data updates
            wsService.emit('therapy_data_update', {
              sessionId: updatedConsultation._id,
              therapyData: updateData.therapyData,
              timestamp: new Date()
            });
            
            // Send vitals to doctor for monitoring
            if (updateData.therapyData.vitals && updatedConsultation.therapyData?.doctorId) {
              wsService.emitToUser(updatedConsultation.therapyData.doctorId, 'patient_vitals_update', {
                sessionId: updatedConsultation._id,
                patientId: updatedConsultation.patientId,
                vitals: updateData.therapyData.vitals,
                timestamp: new Date()
              });
            }
            
            // Send adverse effects alert if critical
            if (updateData.therapyData.adverseEffects && updateData.therapyData.adverseEffects.some(ae => ae.severity === 'critical')) {
              wsService.emit('critical_adverse_effect', {
                sessionId: updatedConsultation._id,
                patientName: updatedConsultation.patientId?.name,
                adverseEffects: updateData.therapyData.adverseEffects.filter(ae => ae.severity === 'critical'),
                timestamp: new Date()
              });
            }
          }
        } catch (wsError) {
          console.error('⚠️ Therapy WebSocket updates failed:', wsError.message);
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

        // 🔥 NEW: Session completion WebSocket notification
        try {
          if (wsService) {
            wsService.emit('session_completed', {
              sessionId: updatedConsultation._id,
              patientName: updatedConsultation.patientId?.name,
              therapyType: updatedConsultation.sessionType || updatedConsultation.type,
              duration: updatedConsultation.actualDuration,
              timestamp: new Date()
            });
          }
        } catch (wsError) {
          console.error('⚠️ Session completion WebSocket failed:', wsError.message);
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

  // ═══════════════════════════════════════════════════════════
  // 🔥 NEW THERAPY SESSION METHODS
  // ═══════════════════════════════════════════════════════════

  // Start therapy session with real-time tracking
  startTherapySession = async (req, res) => {
    try {
      const { id } = req.params;
      const { startNotes } = req.body;
      const therapistId = req.user._id || req.user.id;

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Authorization check
      if (consultation.providerId.toString() !== therapistId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to start this session'
        });
      }

      const updateData = {
        status: 'in_progress',
        sessionStatus: 'in_progress',
        sessionStartTime: new Date(),
        sessionNotes: consultation.sessionNotes || []
      };

      // Add start note
      updateData.sessionNotes.push({
        timestamp: new Date(),
        note: startNotes || 'Session started',
        addedBy: therapistId,
        type: 'progress'
      });

      // Add to status history
      if (!consultation.statusHistory) {
        updateData.statusHistory = [];
      } else {
        updateData.statusHistory = [...consultation.statusHistory];
      }
      
      updateData.statusHistory.push({
        status: 'in_progress',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session started',
        previousStatus: consultation.status
      });

      // Add therapist to active participants
      if (!consultation.activeParticipants) {
        updateData.activeParticipants = [];
      } else {
        updateData.activeParticipants = [...consultation.activeParticipants];
      }

      const therapistExists = updateData.activeParticipants.some(
        p => p.userId.toString() === therapistId.toString()
      );
      
      if (!therapistExists) {
        updateData.activeParticipants.push({
          userId: therapistId,
          joinedAt: new Date(),
          role: 'therapist',
          isActive: true
        });
      }

      // Update session metadata
      updateData.sessionMetadata = {
        ...consultation.sessionMetadata,
        lastActivity: new Date()
      };

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);

      // ✅ Real-time WebSocket broadcast
      try {
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('session:started', {
            sessionId: updatedConsultation._id,
            patientId: updatedConsultation.patientId._id || updatedConsultation.patientId,
            therapistId,
            doctorId: updatedConsultation.therapyData?.doctorId,
            timestamp: new Date(),
            sessionData: {
              therapyType: updatedConsultation.therapyData?.therapyType,
              patientName: updatedConsultation.patientId?.name,
              startTime: updatedConsultation.sessionStartTime
            }
          });
          console.log('✅ Session start WebSocket broadcast sent');
        }
      } catch (wsError) {
        console.error('⚠️ Session start WebSocket failed:', wsError.message);
      }

      return res.json({
        success: true,
        message: 'Session started successfully',
        data: updatedConsultation
      });

    } catch (error) {
      console.error('Start therapy session error:', error);
      return handleError(res, error);
    }
  };

  // Complete therapy session with vitals and observations
  completeTherapySession = async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        vitals, 
        observations, 
        adverseEffects, 
        materialsUsed, 
        sessionNotes, 
        patientFeedback, 
        nextSessionPrep 
      } = req.body;
      const therapistId = req.user._id || req.user.id;

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Authorization check
      if (consultation.providerId.toString() !== therapistId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to complete this session'
        });
      }

      const duration = consultation.sessionStartTime 
        ? Math.floor((new Date() - new Date(consultation.sessionStartTime)) / 60000)
        : 0;

      const updateData = {
        status: 'completed',
        sessionStatus: 'completed',
        sessionEndTime: new Date(),
        actualDuration: duration,
        therapyData: {
          ...consultation.therapyData,
          vitals: vitals || consultation.therapyData?.vitals,
          observations: observations || consultation.therapyData?.observations,
          adverseEffects: adverseEffects || consultation.therapyData?.adverseEffects || [],
          materialsUsed: materialsUsed || consultation.therapyData?.materialsUsed || [],
          patientFeedback: patientFeedback || consultation.therapyData?.patientFeedback,
          nextSessionPrep: nextSessionPrep || consultation.therapyData?.nextSessionPrep
        },
        sessionNotes: [...(consultation.sessionNotes || [])],
        statusHistory: [...(consultation.statusHistory || [])],
        sessionMetadata: {
          ...consultation.sessionMetadata,
          lastActivity: new Date()
        }
      };

      // Add completion note
      if (sessionNotes) {
        updateData.sessionNotes.push({
          timestamp: new Date(),
          note: sessionNotes,
          addedBy: therapistId,
          type: 'progress'
        });
      }

      // Add to status history
      updateData.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        updatedBy: therapistId,
        reason: 'Session completed',
        previousStatus: 'in_progress'
      });

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);

      // ✅ Real-time WebSocket broadcast
      try {
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('session:completed', {
            sessionId: updatedConsultation._id,
            patientId: updatedConsultation.patientId._id || updatedConsultation.patientId,
            therapistId,
            doctorId: updatedConsultation.therapyData?.doctorId,
            vitals,
            observations,
            adverseEffects,
            duration,
            timestamp: new Date()
          });
          console.log('✅ Session completion WebSocket broadcast sent');
        }
      } catch (wsError) {
        console.error('⚠️ Session completion WebSocket failed:', wsError.message);
      }

      // ✅ Send completion notifications
      try {
        await Promise.all([
          notificationService.sendSessionCompletionNotification({
            patientEmail: updatedConsultation.patientId?.email,
            patientName: updatedConsultation.patientId?.name,
            therapyType: updatedConsultation.therapyData?.therapyType,
            duration,
            observations
          }),
          notificationService.sendSessionReportToDoctor({
            doctorEmail: updatedConsultation.therapyData?.doctorId?.email,
            patientName: updatedConsultation.patientId?.name,
            therapyType: updatedConsultation.therapyData?.therapyType,
            vitals,
            observations,
            adverseEffects
          })
        ]);
        console.log('✅ Session completion notifications sent');
      } catch (notifError) {
        console.error('⚠️ Session completion notifications failed:', notifError.message);
      }

      return res.json({
        success: true,
        message: 'Session completed successfully',
        data: updatedConsultation
      });

    } catch (error) {
      console.error('Complete therapy session error:', error);
      return handleError(res, error);
    }
  };

  // Update therapy vitals in real-time
  updateTherapyVitals = async (req, res) => {
    try {
      const { id } = req.params;
      const vitals = req.body;
      const therapistId = req.user._id || req.user.id;

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Authorization check
      if (consultation.providerId.toString() !== therapistId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this session'
        });
      }

      const updateData = {
        therapyData: {
          ...consultation.therapyData,
          vitals: {
            ...consultation.therapyData?.vitals,
            ...vitals,
            measuredAt: new Date()
          }
        },
        sessionMetadata: {
          ...consultation.sessionMetadata,
          lastActivity: new Date()
        }
      };

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);

      // ✅ Real-time WebSocket broadcast
      try {
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('session:vitals', {
            sessionId: updatedConsultation._id,
            patientId: updatedConsultation.patientId._id || updatedConsultation.patientId,
            vitals: updateData.therapyData.vitals,
            timestamp: new Date()
          });
          
          // Send to doctor for monitoring
          if (updatedConsultation.therapyData?.doctorId) {
            wsService.emitToUser(updatedConsultation.therapyData.doctorId, 'patient_vitals_update', {
              sessionId: updatedConsultation._id,
              patientId: updatedConsultation.patientId,
              patientName: updatedConsultation.patientId?.name,
              vitals: updateData.therapyData.vitals,
              timestamp: new Date()
            });
          }
        }
      } catch (wsError) {
        console.error('⚠️ Vitals WebSocket failed:', wsError.message);
      }

      return res.json({
        success: true,
        message: 'Vitals updated successfully',
        data: updatedConsultation
      });

    } catch (error) {
      console.error('Update therapy vitals error:', error);
      return handleError(res, error);
    }
  };

  // Add therapy observation in real-time
  addTherapyObservation = async (req, res) => {
    try {
      const { id } = req.params;
      const { observation, type = 'observation' } = req.body;
      const therapistId = req.user._id || req.user.id;

      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Authorization check
      if (consultation.providerId.toString() !== therapistId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this session'
        });
      }

      const updateData = {
        sessionNotes: [
          ...(consultation.sessionNotes || []),
          {
            timestamp: new Date(),
            note: observation,
            addedBy: therapistId,
            type
          }
        ],
        sessionMetadata: {
          ...consultation.sessionMetadata,
          lastActivity: new Date()
        }
      };

      const updatedConsultation = await consultationService.updateConsultation(id, updateData);

      // ✅ Real-time WebSocket broadcast
      try {
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('session:observation', {
            sessionId: updatedConsultation._id,
            observation: observation,
            type: type,
            timestamp: new Date()
          });
        }
      } catch (wsError) {
        console.error('⚠️ Observation WebSocket failed:', wsError.message);
      }

      return res.json({
        success: true,
        message: 'Observation added successfully',
        data: updatedConsultation
      });

    } catch (error) {
      console.error('Add therapy observation error:', error);
      return handleError(res, error);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EXISTING METHODS (Keep all as-is)
  // ═══════════════════════════════════════════════════════════

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
      
      const therapistProfile = await therapistService.getTherapistByUserId(providerId);

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
        consultationService.getConsultationsByProvider(therapistProfile._id, options),
        consultationService.countConsultationsByProvider(therapistProfile._id, { 
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
      const therapistProfile = await therapistService.getTherapistByUserId(providerId);

      if ((req.user.role === 'doctor' || req.user.role === 'therapist') && req.user.id !== providerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const consultations = await consultationService.getUpcomingConsultations(therapistProfile._id);
      
      return res.json({
        success: true,
        message: `Found ${consultations.length} upcoming consultations`,
        data: consultations
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
        const wsService = req.app.get('wsService');
        if (wsService) {
          wsService.emit('appointment_cancelled', {
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
        sessionType: providerType === 'therapist' ? 'therapy' : consultation.sessionType,
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
