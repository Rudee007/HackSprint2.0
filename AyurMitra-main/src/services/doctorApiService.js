// src/services/doctorApiService.js
// 🔥 COMPLETE PRODUCTION-READY DOCTOR API SERVICE

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
    console.log(
      "🔍 Token from localStorage:",
      token ? `Present (${token.substring(0, 20)}...)` : "Missing"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "✅ Authorization header set:",
        config.headers.Authorization.substring(0, 30) + "..."
      );
    } else {
      console.log("❌ No token to set - checking if user is logged in");
      const userData = localStorage.getItem("user");
      console.log("👤 User data:", userData ? "Present" : "Missing");
    }

    console.log("🚀 Request config:", {
      method: config.method.toUpperCase(),
      url: config.url,
      hasAuthHeader: !!config.headers.Authorization,
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
  // 📊 DASHBOARD & PROFILE APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Get doctor profile
   */
  getDoctorProfile: () => {
    console.log("🔄 Fetching doctor profile");
    return apiClient.get("/doctors/profile");
  },

  /**
   * Get doctor stats (derived from profile)
   */
  getDoctorStats: async (period = "30d") => {
    try {
      console.log("🔄 Fetching doctor stats for period:", period);
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

  // Add this in the "PATIENT MANAGEMENT APIs" section
// Around line 160 (after addPatient method)

/**
 * Get patient details by ID
 * 🔥 NEW - Get comprehensive patient information
 */
getPatientDetails: (patientId) => {
  console.log("🔄 Fetching patient details for ID:", patientId);
  return apiClient.get(`/doctors/patients/${patientId}`);
},

  /**
   * Update doctor profile
   */
  updateDoctorProfile: async (profileData) => {
    try {
      console.log("🔄 Updating doctor profile:", JSON.stringify(profileData, null, 2));

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

      delete cleanData.verificationStatus;
      delete cleanData.verification;

      console.log("✅ Sending clean data:", JSON.stringify(cleanData, null, 2));

      return apiClient.put("/doctors/profile", cleanData);
    } catch (error) {
      console.error("❌ Update Doctor Profile error:", error);
      throw error;
    }
  },

  /**
   * Update availability
   */
  updateAvailability: (availabilityData) => {
    console.log("🔄 Updating availability:", availabilityData);
    return apiClient.put("/doctors/availability", availabilityData);
  },

  /**
   * Get available slots
   */
  getAvailableSlots: (doctorId, date) => {
    console.log("🔄 Fetching available slots for:", doctorId, date);
    return apiClient.get(`/doctors/${doctorId}/availability/${date}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 📅 CONSULTATION & APPOINTMENT APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Get doctor consultations
   */
  getDoctorConsultations: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    });
    console.log("🔄 Fetching consultations with params:", params);
    return apiClient.get(`/doctors/consultations?${queryParams}`);
  },

  // Add these methods to your doctorApiService.js
  // ═══════════════════════════════════════════════════════════
  // 💊 MEDICINE & PRESCRIPTION APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Get medicine inventory
   */
  getMedicineInventory: (params = {}) => {
    const queryParams = new URLSearchParams({
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.inStock && { inStock: params.inStock }),
    });
    console.log("🔄 Fetching medicine inventory with params:", params);
    return apiClient.get(`/prescriptions/medicines/inventory${queryParams.toString() ? '?' + queryParams : ''}`);
  },

  /**
   * Create prescription
   */
  createPrescription: async (prescriptionData) => {
    try {
      console.log("🔄 Creating prescription:", prescriptionData);
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
    console.log("🔄 Fetching prescriptions with params:", params);
    return apiClient.get(`/prescriptions?${queryParams}`);
  },

  /**
   * Get prescription details
   */
  getPrescriptionDetails: (prescriptionId) => {
    console.log("🔄 Fetching prescription details:", prescriptionId);
    return apiClient.get(`/prescriptions/${prescriptionId}`);
  },

  /**
 * Download prescription as PDF
 */
downloadPrescriptionPDF: (prescriptionId) => {
  console.log("🔄 Downloading prescription PDF:", prescriptionId);
  return apiClient.get(`/prescriptions/${prescriptionId}/download`, {
    responseType: 'blob' // Important for file download
  });
},

  /**
   * Update prescription
   */
  updatePrescription: async (prescriptionId, updateData) => {
    try {
      console.log("🔄 Updating prescription:", prescriptionId, updateData);
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
      console.log("🔄 Deleting prescription:", prescriptionId);
      return apiClient.delete(`/prescriptions/${prescriptionId}`);
    } catch (error) {
      console.error("❌ Delete Prescription error:", error);
      throw error;
    }
  },

  /**
   * Search medicines (autocomplete)
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
   * Update consultation status
   */
  updateConsultationStatus: (consultationId, status) => {
    console.log("🔄 Updating consultation status:", consultationId, status);
    return apiClient.put(`/consultations/${consultationId}/status`, { status });
  },

  // ═══════════════════════════════════════════════════════════
  // 👥 PATIENT MANAGEMENT APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Add patient
   */
  addPatient: async (patientData) => {
    try {
      console.log("🔄 Adding patient:", patientData);
      return apiClient.post("/doctors/patients/add", patientData);
    } catch (error) {
      console.error("❌ Add Patient error:", error);
      throw error;
    }
  },

  /**
   * Get patient list
   */
  createTreatmentPlan: async (treatmentData) => {
    try {
      console.log("🔄 Creating treatment plan:", treatmentData);
      return apiClient.post("/doctors/treatment-plans", treatmentData);
    } catch (error) {
      console.error("❌ Create Treatment Plan error:", error);
      throw error;
    }
  },

  /**
   * Get treatment plans
   */
  getTreatmentPlans: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.patientId && { patientId: params.patientId }),
    });
    console.log("🔄 Fetching treatment plans with params:", params);
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
      console.log("🔄 Updating treatment plan:", planId, updateData);
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

  // ═══════════════════════════════════════════════════════════
  // 🧘 THERAPY PLAN APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Create therapy plan
   */
  createTherapyPlan: async (therapyData) => {
    try {
      console.log("🔄 Creating therapy plan:", therapyData);
      return apiClient.post("/therapy-plans", therapyData);
    } catch (error) {
      console.error("❌ Create Therapy Plan error:", error);
      throw error;
    }
  },

  /**
   * Get therapy plans
   */
  getTherapyPlans: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.patientId && { patientId: params.patientId }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    });
    console.log("🔄 Fetching therapy plans with params:", params);
    return apiClient.get(`/therapy-plans?${queryParams}`);
  },

  /**
   * Get therapy plan details
   */
  getTherapyPlanDetails: async (planId) => {
    try {
      console.log("🔄 Fetching therapy plan details:", planId);
      return apiClient.get(`/therapy-plans/${planId}`);
    } catch (error) {
      console.error("❌ Get Therapy Plan Details error:", error);
      throw error;
    }
  },

  /**
   * Update therapy plan
   */
  updateTherapyPlan: async (planId, updateData) => {
    try {
      console.log("🔄 Updating therapy plan:", planId, updateData);
      return apiClient.put(`/therapy-plans/${planId}`, updateData);
    } catch (error) {
      console.error("❌ Update Therapy Plan error:", error);
      throw error;
    }
  },

  /**
   * Complete therapy session
   */
  completeTherapySession: async (planId, sessionData) => {
    try {
      console.log("🔄 Completing therapy session:", planId, sessionData);
      return apiClient.post(`/therapy-plans/${planId}/sessions`, sessionData);
    } catch (error) {
      console.error("❌ Complete Therapy Session error:", error);
      throw error;
    }
  },

  /**
   * Update therapy milestone
   */
  updateTherapyMilestone: async (planId, milestoneId, achieved) => {
    try {
      console.log("🔄 Updating therapy milestone:", planId, milestoneId, achieved);
      return apiClient.put(
        `/therapy-plans/${planId}/milestones/${milestoneId}`,
        { achieved }
      );
    } catch (error) {
      console.error("❌ Update Therapy Milestone error:", error);
      throw error;
    }
  },

  /**
   * Add therapy prescription
   */
  addTherapyPrescription: async (planId, prescriptionData) => {
    try {
      console.log("🔄 Adding therapy prescription:", planId, prescriptionData);
      return apiClient.post(
        `/therapy-plans/${planId}/prescriptions`,
        prescriptionData
      );
    } catch (error) {
      console.error("❌ Add Therapy Prescription error:", error);
      throw error;
    }
  },

  /**
   * Update dietary recommendations
   */
  updateTherapyDietaryRecommendations: async (planId, dietaryData) => {
    try {
      console.log("🔄 Updating dietary recommendations:", planId, dietaryData);
      return apiClient.put(`/therapy-plans/${planId}/dietary`, dietaryData);
    } catch (error) {
      console.error("❌ Update Dietary Recommendations error:", error);
      throw error;
    }
  },

  /**
   * Get therapy analytics
   */
  getTherapyAnalytics: (period = "30d") => {
    const queryParams = new URLSearchParams({ period });
    console.log("🔄 Fetching therapy analytics for period:", period);
    return apiClient.get(`/therapy-plans/analytics?${queryParams}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 🔴 REAL-TIME SESSION MONITORING APIs (Doctor View)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get therapy tracking dashboard
   * Shows ALL active, upcoming, completed sessions
   */
  getTherapyTrackingDashboard: () => {
    console.log("🔄 Fetching therapy tracking dashboard");
    return apiClient.get("/realtime/tracking/dashboard");
  },

  getUpcomingTherapySessions: () => {
    console.log("🔄 Fetching upcoming therapy sessions");
    return apiClient.get("/realtime/tracking/sessions/upcoming");
  },

  getRealtimeSessionDetails: (sessionId) => {
    console.log("🔄 Fetching real-time session details:", sessionId);
    return apiClient.get(`/realtime/sessions/${sessionId}/details`);
  },

  joinSessionAsObserver: (sessionId) => {
    console.log("🔄 Joining session as observer:", sessionId);
    return apiClient.post(`/realtime/sessions/${sessionId}/join`);
  },

  leaveSession: (sessionId) => {
    console.log("🔄 Leaving session:", sessionId);
    return apiClient.post(`/realtime/sessions/${sessionId}/leave`);
  },

  getPatientMilestones: (patientId) => {
    console.log("🔄 Fetching patient milestones:", patientId);
    return apiClient.get(`/realtime/tracking/patients/${patientId}/milestones`);
  },
  
  sendPreTherapyInstructions: async (notificationData) => {
    try {
      console.log("🔄 Sending pre-therapy instructions:", notificationData);
      return apiClient.post(
        "/notifications/therapy/pre-instructions",
        notificationData
      );
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
      console.log("🔄 Sending post-therapy instructions:", notificationData);
      return apiClient.post(
        "/notifications/therapy/post-care",
        notificationData
      );
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
      console.log("🔄 Sending appointment confirmation:", consultationId);
      return apiClient.post(
        `/notifications/appointment/${consultationId}/confirmation`
      );
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
      console.log("🔄 Sending appointment reminder:", consultationId);
      return apiClient.post(
        `/notifications/appointment/${consultationId}/reminder`
      );
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
      console.log("🔄 Updating notification preferences:", preferences);
      return apiClient.put("/notifications/preferences", preferences);
    } catch (error) {
      console.error("❌ Update Notification Preferences error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔍 SEARCH APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Search doctors by specialization
   */
  searchDoctorsBySpecialization: (specialization, options = {}) => {
    const queryParams = new URLSearchParams({
      specialization,
      page: options.page || 1,
      limit: options.limit || 10,
      sortBy: options.sortBy || "createdAt",
    });
    console.log("🔄 Searching doctors by specialization:", specialization);
    return apiClient.get(`/doctors/search/specialization?${queryParams}`);
  },

  /**
   * Search doctors
   */
  searchDoctors: (searchCriteria) => {
    console.log("🔄 Searching doctors:", searchCriteria);
    return apiClient.post("/doctors/search", searchCriteria);
  },

  // ═══════════════════════════════════════════════════════════
  // 🛠 UTILITY APIs
  // ═══════════════════════════════════════════════════════════

  /**
   * Test API connection
   */
  testConnection: async () => {
    try {
      console.log("🔄 Testing API connection...");
      return apiClient.get("/health");
    } catch (error) {
      console.error("❌ API Connection test failed:", error);
      throw error;
    }
  },
};

export default doctorApiService;
