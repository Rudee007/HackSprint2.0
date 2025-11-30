// src/services/doctorApiService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3003/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
// Enhanced debugging version
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "🔍 Token from localStorage:",
      token ? `Present (${token.substring(0, 20)}...)` : "Missing"
    );
    console.log("🔍 All localStorage keys:", Object.keys(localStorage));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "✅ Authorization header set:",
        config.headers.Authorization.substring(0, 30) + "..."
      );
    } else {
      console.log("❌ No token to set - checking if user is logged in");
      // Check if user data exists
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

// Response interceptor for error handling
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

export const doctorApiService = {
  // 🔥 Dashboard Overview APIs
  getDoctorProfile: () => apiClient.get("/doctors/profile"),

  // 🔥 Create stats from profile data since no separate stats endpoint
  getDoctorStats: async (period = "30d") => {
    try {
      const profileResponse = await apiClient.get("/doctors/profile");
      const doctor = profileResponse.data.data.doctor;

      // Extract stats from doctor profile
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
      throw error;
    }
  },

  // 🔥 Consultation/Appointment APIs
  getDoctorConsultations: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    });
    return apiClient.get(`/doctors/consultations?${queryParams}`);
  },

  // 🔥 Patient Management APIs
  addPatient: async (patientData) => {
    try {
      console.log("🔄 Adding patient via API:", patientData);
      return apiClient.post("/doctors/patients/add", patientData);
    } catch (error) {
      console.error("❌ Add patient API error:", error);
      throw error;
    }
  },

  // 🔥 Update consultation status
  updateConsultationStatus: (consultationId, status) =>
    apiClient.put(`/consultations/${consultationId}/status`, { status }),

  // 🔥 Profile Management APIs - Updated to match backend structure
  updateDoctorProfile: async (profileData) => {
    try {
      console.log("🔍 Frontend sending:", JSON.stringify(profileData, null, 2));

      // 🛡️ NUCLEAR OPTION: Create completely clean object
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

      // 🛡️ DOUBLE CHECK: Ensure NO verification fields
      delete cleanData.verificationStatus;
      delete cleanData.verification;

      console.log(
        "🚀 Clean data being sent:",
        JSON.stringify(cleanData, null, 2)
      );

      return apiClient.put("/doctors/profile", cleanData);
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  },

  // 🔥 Availability APIs
  updateAvailability: (availabilityData) =>
    apiClient.put("/doctors/availability", availabilityData),

  getAvailableSlots: (doctorId, date) =>
    apiClient.get(`/doctors/${doctorId}/availability/${date}`),

  // 🔥 Search APIs
  searchDoctorsBySpecialization: (specialization, options = {}) => {
    const queryParams = new URLSearchParams({
      specialization,
      page: options.page || 1,
      limit: options.limit || 10,
      sortBy: options.sortBy || "createdAt",
    });
    return apiClient.get(`/doctors/search/specialization?${queryParams}`);
  },

  searchDoctors: (searchCriteria) =>
    apiClient.post("/doctors/search", searchCriteria),

  // ═══════════════════════════════════════════════════════════
  // 🔥 TREATMENT PLAN APIs
  // ═══════════════════════════════════════════════════════════

  createTreatmentPlan: async (treatmentData) => {
    try {
      console.log("🔄 Creating treatment plan via API:", treatmentData);
      return apiClient.post("/doctors/treatment-plans", treatmentData);
    } catch (error) {
      console.error("❌ Create Treatment Plan API error:", error);
      throw error;
    }
  },

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

  getTreatmentPlanDetails: async (planId) => {
    try {
      console.log("🔄 Fetching treatment plan details for ID:", planId);
      return apiClient.get(`/doctors/treatment-plans/${planId}`);
    } catch (error) {
      console.error("❌ Get Treatment Plan Details API error:", error);
      throw error;
    }
  },

  updateTreatmentPlan: async (planId, updateData) => {
    try {
      console.log("🔄 Updating treatment plan:", planId, updateData);
      return apiClient.put(`/doctors/treatment-plans/${planId}`, updateData);
    } catch (error) {
      console.error("❌ Update Treatment Plan API error:", error);
      throw error;
    }
  },

  deleteTreatmentPlan: async (planId) => {
    try {
      console.log("🔄 Deleting treatment plan:", planId);
      return apiClient.delete(`/doctors/treatment-plans/${planId}`);
    } catch (error) {
      console.error("❌ Delete Treatment Plan API error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 THERAPY PLAN APIs (Different from Treatment Plan)
  // ═══════════════════════════════════════════════════════════

  createTherapyPlan: async (therapyData) => {
    try {
      console.log("🔄 Creating therapy plan via API:", therapyData);
      return apiClient.post("/therapy-plans", therapyData);
    } catch (error) {
      console.error("❌ Create Therapy Plan API error:", error);
      throw error;
    }
  },

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

  getTherapyPlanDetails: async (planId) => {
    try {
      console.log("🔄 Fetching therapy plan details for ID:", planId);
      return apiClient.get(`/therapy-plans/${planId}`);
    } catch (error) {
      console.error("❌ Get Therapy Plan Details API error:", error);
      throw error;
    }
  },

  updateTherapyPlan: async (planId, updateData) => {
    try {
      console.log("🔄 Updating therapy plan:", planId, updateData);
      return apiClient.put(`/therapy-plans/${planId}`, updateData);
    } catch (error) {
      console.error("❌ Update Therapy Plan API error:", error);
      throw error;
    }
  },

  completeTherapySession: async (planId, sessionData) => {
    try {
      console.log("🔄 Completing therapy session:", planId, sessionData);
      return apiClient.post(`/therapy-plans/${planId}/sessions`, sessionData);
    } catch (error) {
      console.error("❌ Complete Session API error:", error);
      throw error;
    }
  },

  updateTherapyMilestone: async (planId, milestoneId, achieved) => {
    try {
      console.log(
        "🔄 Updating therapy milestone:",
        planId,
        milestoneId,
        achieved
      );
      return apiClient.put(
        `/therapy-plans/${planId}/milestones/${milestoneId}`,
        { achieved }
      );
    } catch (error) {
      console.error("❌ Update Milestone API error:", error);
      throw error;
    }
  },

  addTherapyPrescription: async (planId, prescriptionData) => {
    try {
      console.log("🔄 Adding therapy prescription:", planId, prescriptionData);
      return apiClient.post(
        `/therapy-plans/${planId}/prescriptions`,
        prescriptionData
      );
    } catch (error) {
      console.error("❌ Add Prescription API error:", error);
      throw error;
    }
  },

  updateTherapyDietaryRecommendations: async (planId, dietaryData) => {
    try {
      console.log("🔄 Updating dietary recommendations:", planId, dietaryData);
      return apiClient.put(`/therapy-plans/${planId}/dietary`, dietaryData);
    } catch (error) {
      console.error("❌ Update Dietary API error:", error);
      throw error;
    }
  },

  getTherapyAnalytics: (period = "30d") => {
    const queryParams = new URLSearchParams({ period });
    console.log("🔄 Fetching therapy analytics for period:", period);
    return apiClient.get(`/therapy-plans/analytics?${queryParams}`);
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 NOTIFICATION APIs (For Treatment Plans)
  // ═══════════════════════════════════════════════════════════

  sendPreTherapyInstructions: async (notificationData) => {
    try {
      console.log("🔄 Sending pre-therapy instructions:", notificationData);
      return apiClient.post(
        "/notifications/therapy/pre-instructions",
        notificationData
      );
    } catch (error) {
      console.error("❌ Send Pre-Therapy Instructions API error:", error);
      throw error;
    }
  },

  sendPostTherapyInstructions: async (notificationData) => {
    try {
      console.log("🔄 Sending post-therapy instructions:", notificationData);
      return apiClient.post(
        "/notifications/therapy/post-care",
        notificationData
      );
    } catch (error) {
      console.error("❌ Send Post-Therapy Instructions API error:", error);
      throw error;
    }
  },

  sendAppointmentConfirmation: async (consultationId) => {
    try {
      console.log("🔄 Sending appointment confirmation:", consultationId);
      return apiClient.post(
        `/notifications/appointment/${consultationId}/confirmation`
      );
    } catch (error) {
      console.error("❌ Send Appointment Confirmation API error:", error);
      throw error;
    }
  },

  sendAppointmentReminder: async (consultationId) => {
    try {
      console.log("🔄 Sending appointment reminder:", consultationId);
      return apiClient.post(
        `/notifications/appointment/${consultationId}/reminder`
      );
    } catch (error) {
      console.error("❌ Send Appointment Reminder API error:", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 UTILITY APIs
  // ═══════════════════════════════════════════════════════════

  // Test API connection
  testConnection: async () => {
    try {
      console.log("🔄 Testing API connection...");
      return apiClient.get("/health");
    } catch (error) {
      console.error("❌ API Connection test failed:", error);
      throw error;
    }
  },

  // Get notification preferences
  getNotificationPreferences: () => {
    console.log("🔄 Fetching notification preferences");
    return apiClient.get("/notifications/preferences");
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      console.log("🔄 Updating notification preferences:", preferences);
      return apiClient.put("/notifications/preferences", preferences);
    } catch (error) {
      console.error("❌ Update Notification Preferences API error:", error);
      throw error;
    }
  },
};

export default doctorApiService;
