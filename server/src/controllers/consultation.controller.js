const consultationService = require('../services/consultation.service');

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
  
      // 🔍 DEBUG LOGGING - ADD THIS
      console.log('====== AUTHORIZATION DEBUG ======');
      console.log('req.user:', req.user);
      console.log('User ID from token:', req.user?.id);
      console.log('User role from token:', req.user?.role);
      console.log('Consultation patientId:', consultation.patientId);
      console.log('Consultation patientId (string):', consultation.patientId?.toString());
      console.log('Consultation providerId:', consultation.providerId);
      console.log('Consultation providerId (string):', consultation.providerId?.toString());
      console.log('ID comparison (patient):', req.user?.id === consultation.patientId?.toString());
      console.log('ID comparison (provider):', req.user?.id === consultation.providerId?.toString());
      console.log('canAccessConsultation result:', this.canAccessConsultation(req.user, consultation));
      console.log('==================================');
  
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

  // ✅ AUTHORIZATION HELPER METHODS (As regular methods - they don't need 'this' binding)
  canAccessConsultation(user, consultation) {
    if (!user || !consultation) return false;
  
    // Handle admin access
    if (user.role === 'admin') return true;
  
    // Extract user ID safely
    const userId = user._id ? user._id.toString() : user.id;
  
    // ✅ FIXED: Extract IDs from populated objects
    const patientId = consultation.patientId && consultation.patientId._id ? 
      consultation.patientId._id.toString() : 
      consultation.patientId ? consultation.patientId.toString() : null;
      
    const providerId = consultation.providerId && consultation.providerId._id ? 
      consultation.providerId._id.toString() : 
      consultation.providerId ? consultation.providerId.toString() : null;
  
    // Debug logging (remove after testing)
    console.log('=== FIXED AUTHORIZATION ===');
    console.log('User ID:', userId);
    console.log('Patient ID:', patientId);
    console.log('Provider ID:', providerId);
    console.log('Is Patient:', userId === patientId);
    console.log('Is Provider:', userId === providerId);
    console.log('===========================');
  
    // Check if user matches patient or provider
    return userId === patientId || userId === providerId;
  }
  
  
  canModifyConsultation(user, consultation) {
    return user.role === 'admin' || 
           user.id === consultation.providerId.toString();
  }

  canCancelConsultation(user, consultation) {
    return user.role === 'admin' || 
           user.id === consultation.patientId.toString() || 
           user.id === consultation.providerId.toString();
  }

  canAccessPatientData(user, patientId) {
    return user.role === 'admin' || 
           (user.role === 'patient' && user.id === patientId);
  }

  canAccessProviderData(user, providerId) {
    return user.role === 'admin' || 
           ((user.role === 'doctor' || user.role === 'therapist') && user.id === providerId);
  }
}

// ✅ EXPORT INSTANCE
module.exports = new ConsultationController();
