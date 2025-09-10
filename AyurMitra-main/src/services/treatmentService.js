// Shared treatment planning service
export const treatmentService = {
  // Save treatment plan from doctor
  saveTreatmentPlan(treatmentData) {
    try {
      const existingPlans = this.getAllTreatmentPlans();
      const newPlan = {
        id: Date.now().toString(),
        ...treatmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      existingPlans.push(newPlan);
      localStorage.setItem('treatmentPlans', JSON.stringify(existingPlans));
      return { success: true, plan: newPlan };
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      return { success: false, error: 'Failed to save treatment plan' };
    }
  },

  // Get treatment plans for a specific patient by name (case-insensitive)
  getPatientTreatments(patientName) {
    try {
      if (!patientName || typeof patientName !== 'string') {
        return [];
      }
      const allPlans = this.getAllTreatmentPlans();
      const normalized = patientName.trim().toLowerCase();
      return allPlans.filter(plan => {
        const planPatient = (plan.patientName || '').toString().trim().toLowerCase();
        return planPatient === normalized;
      });
    } catch (error) {
      console.error('Error getting patient treatments:', error);
      return [];
    }
  },

  // Get all treatment plans
  getAllTreatmentPlans() {
    try {
      const plans = localStorage.getItem('treatmentPlans');
      return plans ? JSON.parse(plans) : [];
    } catch (error) {
      console.error('Error getting treatment plans:', error);
      return [];
    }
  },

  // Get treatment plans for a specific therapist
  getTreatmentPlansForTherapist(therapistName) {
    try {
      const allPlans = this.getAllTreatmentPlans();
      return allPlans.filter(plan => plan.assignedTherapist === therapistName);
    } catch (error) {
      console.error('Error getting therapist plans:', error);
      return [];
    }
  },

  // Get treatment plans created by a specific doctor
  getTreatmentPlansByDoctor(doctorName) {
    try {
      const allPlans = this.getAllTreatmentPlans();
      return allPlans.filter(plan => plan.doctorName === doctorName);
    } catch (error) {
      console.error('Error getting doctor plans:', error);
      return [];
    }
  },

  // Update treatment progress (used by therapists)
  updateTreatmentProgress(planId, progressData) {
    try {
      const allPlans = this.getAllTreatmentPlans();
      const planIndex = allPlans.findIndex(plan => plan.id === planId);
      
      if (planIndex === -1) {
        return { success: false, error: 'Treatment plan not found' };
      }

      allPlans[planIndex] = {
        ...allPlans[planIndex],
        ...progressData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('treatmentPlans', JSON.stringify(allPlans));
      return { success: true, plan: allPlans[planIndex] };
    } catch (error) {
      console.error('Error updating treatment progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  },

  // Get doctor-therapist associations from CSV
  async getDoctorTherapistAssociations() {
    try {
      const response = await fetch('/panchakarma_doctor2.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const associations = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        if (values.length >= 9) {
          associations.push({
            patientId: values[0]?.replace(/"/g, '').trim(),
            symptoms: values[1]?.replace(/"/g, '').trim(),
            doctorName: values[2]?.replace(/"/g, '').trim(),
            treatmentType: values[3]?.replace(/"/g, '').trim(),
            doctorUsername: values[4]?.replace(/"/g, '').trim(),
            doctorDescription: values[6]?.replace(/"/g, '').trim(),
            therapistName: values[7]?.replace(/"/g, '').trim()
          });
        }
      }

      return associations;
    } catch (error) {
      console.error('Error getting associations:', error);
      return [];
    }
  },

  // Get patients for a specific doctor
  async getPatientsForDoctor(doctorName) {
    try {
      const associations = await this.getDoctorTherapistAssociations();
      return associations.filter(assoc => assoc.doctorName === doctorName);
    } catch (error) {
      console.error('Error getting doctor patients:', error);
      return [];
    }
  },

  // Get therapist assigned to a doctor
  async getTherapistForDoctor(doctorName) {
    try {
      const associations = await this.getDoctorTherapistAssociations();
      const association = associations.find(assoc => assoc.doctorName === doctorName);
      return association ? association.therapistName : null;
    } catch (error) {
      console.error('Error getting therapist for doctor:', error);
      return null;
    }
  },

  // Fix treatment plans that are missing assignedTherapist field
  async fixMissingTherapistAssignments() {
    try {
      const allPlans = this.getAllTreatmentPlans();
      const associations = await this.getDoctorTherapistAssociations();
      
      let updated = false;
      const fixedPlans = allPlans.map(plan => {
        if (!plan.assignedTherapist && plan.doctorName) {
          const association = associations.find(assoc => assoc.doctorName === plan.doctorName);
          if (association && association.therapistName) {
            updated = true;
            return { ...plan, assignedTherapist: association.therapistName };
          }
        }
        return plan;
      });
      
      if (updated) {
        localStorage.setItem('treatmentPlans', JSON.stringify(fixedPlans));
        console.log('Fixed missing therapist assignments for', fixedPlans.filter(p => p.assignedTherapist).length, 'plans');
        return { success: true, fixedCount: fixedPlans.filter(p => p.assignedTherapist).length };
      }
      
      return { success: true, fixedCount: 0 };
    } catch (error) {
      console.error('Error fixing therapist assignments:', error);
      return { success: false, error: error.message };
    }
  }
};