// src/services/doctorApiService.js
// 🔥 PRODUCTION-READY DOCTOR API SERVICE - DOCTOR-CENTRIC OPERATIONS ONLY
// READ-ONLY for therapies/templates, FULL CRUD for treatment plans & prescriptions

import axios from "axios";

const API_BASE_URL = "http://localhost:3003/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ═══════════════════════════════════════════════════════════
// 🔒 REQUEST/RESPONSE INTERCEPTORS
// ═══════════════════════════════════════════════════════════

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 API Request:", {
      method: config.method.toUpperCase(),
      url: config.url,
      hasAuth: !!token,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/doctor-login";
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// 🔥 DOCTOR API SERVICE
// ═══════════════════════════════════════════════════════════

export const doctorApiService = {
  
  // ═══════════════════════════════════════════════════════════
  // 📊 PROFILE & DASHBOARD
  // ═══════════════════════════════════════════════════════════

  getDoctorProfile: () => {
    console.log("🔄 Fetching doctor profile");
    return apiClient.get("/doctors/profile");
  },

  getDoctorStats: async (period = "30d") => {
    try {
      console.log("🔄 Fetching doctor stats");
      const profileResponse = await apiClient.get("/doctors/profile");
      const doctor = profileResponse.data.data.doctor;

      return {
        data: {
          data: {
            totalConsultations: doctor.metrics?.totalConsultations || 0,
            totalPatients: doctor.metrics?.totalPatients || 0,
            completionRate: doctor.metrics?.successRate || 0,
            totalRevenue:
              doctor.consultationSettings?.fees?.videoConsultation *
                (doctor.metrics?.totalConsultations || 0) || 0,
            averageRating: doctor.metrics?.averageRating || 0,
            patientSatisfaction: doctor.metrics?.patientSatisfactionScore || 0,
          },
        },
      };
    } catch (error) {
      console.error("❌ Get Doctor Stats error:", error);
      throw error;
    }
  },

  updateDoctorProfile: async (profileData) => {
    try {
      console.log("🔄 Updating doctor profile");

      const cleanData = {
        specializations: profileData.specializations || [],
        experience: {
          totalYears: parseInt(profileData.totalExperience) || 0,
        },
        qualifications: {
          bams: {
            degree: "BAMS",
            university: profileData.bamsUniversity || "",
            yearOfCompletion:
              parseInt(profileData.bamsYear) || new Date().getFullYear(),
          },
          additionalCertifications: profileData.additionalCertifications || [],
        },
        consultationSettings: {
          fees: {
            videoConsultation: parseInt(profileData.videoFee) || 0,
            inPersonConsultation: parseInt(profileData.inPersonFee) || 0,
            followUpConsultation: parseInt(profileData.followUpFee) || 0,
          },
          availability: {
            workingHours: {
              start: profileData.workingHours?.start || "09:00",
              end: profileData.workingHours?.end || "17:00",
            },
            workingDays: profileData.workingDays || [],
            consultationDuration:
              parseInt(profileData.consultationDuration) || 30,
          },
          preferences: {
            languages: (profileData.languages || []).map((lang) =>
              lang.toLowerCase()
            ),
            maxPatientsPerDay: parseInt(profileData.maxPatientsPerDay) || 20,
          },
        },
        professionalInfo: {
          bio: profileData.bio || "",
          achievements: [],
        },
      };

      return apiClient.put("/doctors/profile", cleanData);
    } catch (error) {
      console.error("❌ Update Doctor Profile error:", error);
      throw error;
    }
  },

  updateAvailability: (availabilityData) => {
    console.log("🔄 Updating availability");
    return apiClient.put("/doctors/availability", availabilityData);
  },

  getAvailableSlots: (doctorId, date) => {
    console.log("🔄 Fetching available slots");
    return apiClient.get(`/doctors/${doctorId}/availability/${date}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 📅 CONSULTATIONS & APPOINTMENTS
  // ═══════════════════════════════════════════════════════════

  getDoctorConsultations: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    });
    console.log("🔄 Fetching consultations");
    return apiClient.get(`/doctors/consultations?${queryParams}`);
  },

  updateConsultationStatus: (consultationId, status) => {
    console.log("🔄 Updating consultation status");
    return apiClient.put(`/consultations/${consultationId}/status`, { status });
  },

  // ═══════════════════════════════════════════════════════════
  // 👥 PATIENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  addPatient: async (patientData) => {
    try {
      console.log("🔄 Adding patient");
      return apiClient.post("/doctors/patients/add", patientData);
    } catch (error) {
      console.error("❌ Add Patient error:", error);
      throw error;
    }
  },

  getPatientDetails: (patientId) => {
    console.log("🔄 Fetching patient details");
    return apiClient.get(`/doctors/patients/${patientId}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 🌿 THERAPIES CATALOG (READ-ONLY)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all therapies (master catalog)
   * READ-ONLY - For dropdown selection
   */
  getAllTherapies: (filters = {}) => {
    const queryParams = new URLSearchParams({
      ...(filters.phase && { phase: filters.phase }),
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.search && { search: filters.search }),
    });
    console.log("🔄 Fetching therapies catalog");
    return apiClient.get(`/therapies${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  /**
   * Get therapies grouped by phase
   * READ-ONLY - For UI organization
   */
  getTherapiesByPhase: () => {
    console.log("🔄 Fetching therapies by phase");
    return apiClient.get("/therapies/by-phase");
  },

  /**
   * Get therapy details by ID
   * READ-ONLY
   */
  getTherapyDetails: (therapyId) => {
    console.log("🔄 Fetching therapy details:", therapyId);
    return apiClient.get(`/therapies/${therapyId}`);
  },

  /**
   * Get therapies for dropdown (minimal data)
   * READ-ONLY
   */
  getTherapiesForDropdown: (filters = {}) => {
    const queryParams = new URLSearchParams({
      ...(filters.phase && { phase: filters.phase }),
      ...(filters.category && { category: filters.category }),
    });
    console.log("🔄 Fetching therapies for dropdown");
    return apiClient.get(`/therapies/dropdown${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 📋 COURSE TEMPLATES (READ-ONLY)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all course templates
   * READ-ONLY - For treatment plan creation
   */
  getAllCourseTemplates: (filters = {}) => {
    const queryParams = new URLSearchParams({
      ...(filters.category && { category: filters.category }),
      ...(filters.panchakarmaType && { panchakarmaType: filters.panchakarmaType }),
      ...(filters.isFeatured && { isFeatured: filters.isFeatured }),
    });
    console.log("🔄 Fetching course templates");
    return apiClient.get(`/course-templates${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  /**
   * Get featured templates
   * READ-ONLY
   */
  getFeaturedTemplates: () => {
    console.log("🔄 Fetching featured templates");
    return apiClient.get("/course-templates/featured");
  },

  /**
   * Get course template details (with full therapy data)
   * READ-ONLY
   */
  getCourseTemplateDetails: (templateId) => {
    console.log("🔄 Fetching template details:", templateId);
    return apiClient.get(`/course-templates/${templateId}`);
  },

  /**
   * Get template summary
   * READ-ONLY
   */
  getTemplateSummary: (templateId) => {
    console.log("🔄 Fetching template summary:", templateId);
    return apiClient.get(`/course-templates/${templateId}/summary`);
  },

  /**
   * Get templates for dropdown
   * READ-ONLY
   */
  getTemplatesForDropdown: (filters = {}) => {
    const queryParams = new URLSearchParams({
      ...(filters.panchakarmaType && { panchakarmaType: filters.panchakarmaType }),
    });
    console.log("🔄 Fetching templates for dropdown");
    return apiClient.get(`/course-templates/dropdown${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  /**
   * Increment template usage
   * (Tracking only - doctor can trigger)
   */
  incrementTemplateUsage: (templateId) => {
    console.log("🔄 Incrementing template usage");
    return apiClient.post(`/course-templates/${templateId}/increment-usage`);
  },

  // ═══════════════════════════════════════════════════════════
  // 🏥 TREATMENT PLANS (FULL CRUD)
  // ═══════════════════════════════════════════════════════════

  /**
   * Create Panchakarma treatment plan
   * DOCTOR CREATES - Full write access
   */
  createTreatmentPlan: async (treatmentData) => {
    try {
      console.log("🔄 Creating treatment plan");
      
      // Increment template usage if template was used
      if (treatmentData.courseTemplateId) {
        await apiClient.post(`/course-templates/${treatmentData.courseTemplateId}/increment-usage`);
      }

      return apiClient.post("/doctors/treatment-plans", treatmentData);
    } catch (error) {
      console.error("❌ Create Treatment Plan error:", error);
      throw error;
    }
  },

  /**
   * Get doctor's treatment plans
   */
  getTreatmentPlans: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.patientId && { patientId: params.patientId }),
      ...(params.panchakarmaType && { panchakarmaType: params.panchakarmaType }),
      ...(params.schedulingStatus && { schedulingStatus: params.schedulingStatus }),
    });
    console.log("🔄 Fetching treatment plans");
    return apiClient.get(`/doctors/treatment-plans?${queryParams}`);
  },

  /**
   * Get treatment plan details
   */
  getTreatmentPlanDetails: async (planId) => {
    try {
      console.log("🔄 Fetching treatment plan details:", planId);
      return apiClient.get(`/doctors/treatment-plans/${planId}`);
    } catch (error) {
      console.error("❌ Get Treatment Plan Details error:", error);
      throw error;
    }
  },

  /**
   * Update treatment plan
   */
  updateTreatmentPlan: async (planId, updateData) => {
    try {
      console.log("🔄 Updating treatment plan:", planId);
      return apiClient.put(`/doctors/treatment-plans/${planId}`, updateData);
    } catch (error) {
      console.error("❌ Update Treatment Plan error:", error);
      throw error;
    }
  },

  /**
   * Delete treatment plan
   */
  deleteTreatmentPlan: async (planId) => {
    try {
      console.log("🔄 Deleting treatment plan:", planId);
      return apiClient.delete(`/doctors/treatment-plans/${planId}`);
    } catch (error) {
      console.error("❌ Delete Treatment Plan error:", error);
      throw error;
    }
  },

  /**
   * Trigger auto-scheduling for treatment plan
   */
  triggerAutoScheduling: async (planId) => {
    try {
      console.log("🔄 Triggering auto-scheduling:", planId);
      return apiClient.post(`/doctors/treatment-plans/${planId}/schedule`);
    } catch (error) {
      console.error("❌ Trigger Auto-Scheduling error:", error);
      throw error;
    }
  },

  /**
   * Validate treatment plan before submission
   * Client-side validation helper
   */
  validateTreatmentPlan: async (planData) => {
    try {
      console.log("🔄 Validating treatment plan data");
      
      // Required fields
      const requiredFields = [
        'patientId',
        'consultationId', 
        'assignedTherapistId',
        'panchakarmaType',
        'duration',
        'phases',
        'schedulingPreferences'
      ];

      const missingFields = requiredFields.filter(field => !planData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate phases
      if (!planData.phases || planData.phases.length === 0) {
        throw new Error('Treatment plan must have at least one phase');
      }

      // Validate phase sequence
      const sequences = planData.phases.map(p => p.sequenceNumber).sort();
      const hasDuplicates = sequences.some((val, idx) => sequences.indexOf(val) !== idx);
      if (hasDuplicates) {
        throw new Error('Phase sequence numbers must be unique');
      }

      // Validate therapy sessions in each phase
      for (const phase of planData.phases) {
        if (!phase.therapySessions || phase.therapySessions.length === 0) {
          throw new Error(`Phase ${phase.phaseName} must have at least one therapy session`);
        }
      }

      console.log("✅ Treatment plan validation passed");
      return { valid: true };
      
    } catch (error) {
      console.error("❌ Treatment plan validation failed:", error);
      return { valid: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 👨‍⚕️ THERAPIST MANAGEMENT (READ-ONLY)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get available therapists for assignment
   * READ-ONLY - For therapist selection
   */
  getAvailableTherapists: (filters = {}) => {
    const queryParams = new URLSearchParams({
      ...(filters.specialization && { specialization: filters.specialization }),
      ...(filters.date && { date: filters.date }),
      ...(filters.skillLevel && { skillLevel: filters.skillLevel }),
    });
    console.log("🔄 Fetching available therapists");
    return apiClient.get(`/therapists/available${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 💊 PRESCRIPTIONS (FULL CRUD)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get medicine inventory
   * READ-ONLY - For prescription creation
   */
  getMedicineInventory: (params = {}) => {
    const queryParams = new URLSearchParams({
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.inStock && { inStock: params.inStock }),
    });
    console.log("🔄 Fetching medicine inventory");
    return apiClient.get(`/prescriptions/medicines/inventory${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  /**
   * Search medicines
   * READ-ONLY
   */
  searchMedicines: (searchQuery, limit = 10) => {
    const queryParams = new URLSearchParams({
      q: searchQuery,
      limit: limit,
    });
    console.log("🔄 Searching medicines:", searchQuery);
    return apiClient.get(`/prescriptions/medicines/search?${queryParams}`);
  },

  /**
   * Create prescription
   */
  createPrescription: async (prescriptionData) => {
    try {
      console.log("🔄 Creating prescription");
      return apiClient.post("/prescriptions", prescriptionData);
    } catch (error) {
      console.error("❌ Create Prescription error:", error);
      throw error;
    }
  },

  /**
   * Get prescriptions
   */
  getPrescriptions: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.patientId && { patientId: params.patientId }),
    });
    console.log("🔄 Fetching prescriptions");
    return apiClient.get(`/prescriptions?${queryParams}`);
  },

  /**
   * Get prescription details
   */
  getPrescriptionDetails: (prescriptionId) => {
    console.log("🔄 Fetching prescription details");
    return apiClient.get(`/prescriptions/${prescriptionId}`);
  },

  /**
   * Download prescription PDF
   */
  downloadPrescriptionPDF: (prescriptionId) => {
    console.log("🔄 Downloading prescription PDF");
    return apiClient.get(`/prescriptions/${prescriptionId}/download`, {
      responseType: 'blob'
    });
  },

  /**
   * Update prescription
   */
  updatePrescription: async (prescriptionId, updateData) => {
    try {
      console.log("🔄 Updating prescription");
      return apiClient.put(`/prescriptions/${prescriptionId}`, updateData);
    } catch (error) {
      console.error("❌ Update Prescription error:", error);
      throw error;
    }
  },

  /**
   * Delete prescription
   */
  deletePrescription: async (prescriptionId) => {
    try {
      console.log("🔄 Deleting prescription");
      return apiClient.delete(`/prescriptions/${prescriptionId}`);
    } catch (error) {
      console.error("❌ Delete Prescription error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔴 REAL-TIME SESSION MONITORING (READ-ONLY)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get therapy tracking dashboard
   * READ-ONLY - For monitoring therapy progress
   */
  getTherapyTrackingDashboard: () => {
    console.log("🔄 Fetching therapy tracking dashboard");
    return apiClient.get("/realtime/tracking/dashboard");
  },

  /**
   * Get upcoming therapy sessions
   * READ-ONLY
   */
  getUpcomingTherapySessions: () => {
    console.log("🔄 Fetching upcoming therapy sessions");
    return apiClient.get("/realtime/tracking/sessions/upcoming");
  },

  /**
   * Get real-time session details
   * READ-ONLY
   */
  getRealtimeSessionDetails: (sessionId) => {
    console.log("🔄 Fetching real-time session details");
    return apiClient.get(`/realtime/sessions/${sessionId}/details`);
  },

  /**
   * Join session as observer
   */
  joinSessionAsObserver: (sessionId) => {
    console.log("🔄 Joining session as observer");
    return apiClient.post(`/realtime/sessions/${sessionId}/join`);
  },

  /**
   * Leave session
   */
  leaveSession: (sessionId) => {
    console.log("🔄 Leaving session");
    return apiClient.post(`/realtime/sessions/${sessionId}/leave`);
  },

  /**
   * Get patient milestones
   * READ-ONLY
   */
  getPatientMilestones: (patientId) => {
    console.log("🔄 Fetching patient milestones");
    return apiClient.get(`/realtime/tracking/patients/${patientId}/milestones`);
  },

  // ═══════════════════════════════════════════════════════════
  // 📧 NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Send pre-therapy instructions
   */
  sendPreTherapyInstructions: async (notificationData) => {
    try {
      console.log("🔄 Sending pre-therapy instructions");
      return apiClient.post("/notifications/therapy/pre-instructions", notificationData);
    } catch (error) {
      console.error("❌ Send Pre-Therapy Instructions error:", error);
      throw error;
    }
  },

  /**
   * Send post-therapy instructions
   */
  sendPostTherapyInstructions: async (notificationData) => {
    try {
      console.log("🔄 Sending post-therapy instructions");
      return apiClient.post("/notifications/therapy/post-care", notificationData);
    } catch (error) {
      console.error("❌ Send Post-Therapy Instructions error:", error);
      throw error;
    }
  },

  /**
   * Send appointment confirmation
   */
  sendAppointmentConfirmation: async (consultationId) => {
    try {
      console.log("🔄 Sending appointment confirmation");
      return apiClient.post(`/notifications/appointment/${consultationId}/confirmation`);
    } catch (error) {
      console.error("❌ Send Appointment Confirmation error:", error);
      throw error;
    }
  },

  /**
   * Send appointment reminder
   */
  sendAppointmentReminder: async (consultationId) => {
    try {
      console.log("🔄 Sending appointment reminder");
      return apiClient.post(`/notifications/appointment/${consultationId}/reminder`);
    } catch (error) {
      console.error("❌ Send Appointment Reminder error:", error);
      throw error;
    }
  },

  /**
   * Get notification preferences
   */
  getNotificationPreferences: () => {
    console.log("🔄 Fetching notification preferences");
    return apiClient.get("/notifications/preferences");
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (preferences) => {
    try {
      console.log("🔄 Updating notification preferences");
      return apiClient.put("/notifications/preferences", preferences);
    } catch (error) {
      console.error("❌ Update Notification Preferences error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🛠 UTILITY
  // ═══════════════════════════════════════════════════════════

  /**
   * Test API connection
   */
  testConnection: async () => {
    try {
      console.log("🔄 Testing API connection");
      return apiClient.get("/health");
    } catch (error) {
      console.error("❌ API Connection test failed:", error);
      throw error;
    }
  },
};

export default doctorApiService;
