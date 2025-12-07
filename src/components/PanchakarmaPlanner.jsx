// src/components/PanchakarmaPlanner.jsx
// 🔥 PANCHAKARMA TREATMENT WIZARD v2.0 - WITH PHASE VALIDATION

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Loader2, CheckCircle, Sparkles, Clipboard, FileText, ChevronRight,
  AlertCircle, Plus, Trash2, Edit3, X
} from "lucide-react";
import doctorApiService from "../services/doctorApiService";
import CustomPlanBuilder from "./CustomPlanBuilder";

const PanchakarmaPlanner = ({ consultations, onBack, onSuccess }) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  const [wizardStep, setWizardStep] = useState(1);
  const [planType, setPlanType] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableTherapies, setAvailableTherapies] = useState([]);
  const [availableTherapists, setAvailableTherapists] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const [panchakarmaForm, setPanchakarmaForm] = useState({
    patientId: '',
    consultationId: '',
    assignedTherapistId: '',
    courseTemplateId: null,
    panchakarmaType: 'vamana',
    treatmentName: '',
    treatmentCategory: 'Panchakarma',
    isCustomPlan: false,
    isTemplateModified: false,
    duration: { value: 21, unit: 'days' },
    totalDays: 21,
    phases: [],
    schedulingPreferences: {
      startDate: new Date().toISOString().split('T')[0],
      preferredTimeSlot: 'morning',
      specificTime: '08:00',
      skipWeekends: false,
      skipHolidays: false,
      requireSameTherapist: true,
      flexibilityWindowDays: 2,
      preferredRoom: ''
    },
    prePanchakarmaInstructions: '',
    postPanchakarmaInstructions: '',
    treatmentNotes: '',
    safetyNotes: ''
  });

  // ═══════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════

  const fetchWizardData = useCallback(async () => {
    try {
      const [templatesRes, therapiesRes, therapistsRes] = await Promise.all([
        doctorApiService.getAllCourseTemplates(),
        doctorApiService.getAllTherapies(),
        doctorApiService.getAvailableTherapists()
      ]);

      if (templatesRes.data.success) {
        setAvailableTemplates(templatesRes.data.data || []);
      }
      if (therapiesRes.data.success) {
        setAvailableTherapies(therapiesRes.data.data || []);
      }
      if (therapistsRes.data.success) {
        setAvailableTherapists(therapistsRes.data.data || []);
      }
    } catch (err) {
      console.error('❌ Error fetching wizard data:', err);
    }
  }, []);

  useEffect(() => {
    fetchWizardData();
  }, [fetchWizardData]);

  // ═══════════════════════════════════════════════════════════
  // PHASE VALIDATION
  // ═══════════════════════════════════════════════════════════

  const validatePhases = () => {
    const errors = [];
    
    if (!panchakarmaForm.phases || panchakarmaForm.phases.length === 0) {
      errors.push('Treatment plan must have at least one phase');
      return errors;
    }

    panchakarmaForm.phases.forEach((phase, index) => {
      if (!phase.therapySessions || phase.therapySessions.length === 0) {
        errors.push(`Phase "${phase.phaseName}" must have at least one therapy session`);
      }
      
      if (phase.totalDays <= 0) {
        errors.push(`Phase "${phase.phaseName}" must have duration greater than 0 days`);
      }
    });

    return errors;
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleSelectTemplate = async (template) => {
    try {
      setSelectedTemplate(template);
      
      const detailsRes = await doctorApiService.getCourseTemplateDetails(template._id);
      const fullTemplate = detailsRes.data.data;
      
      console.log('📋 Template Details:', fullTemplate);

      // Map phases with validation
      const mappedPhases = fullTemplate.phases.map(phase => {
        const therapySessions = (phase.therapies || []).map(therapy => ({
          therapyId: therapy.therapyId?._id || therapy.therapyId,
          therapyName: therapy.therapyId?.therapyName || therapy.therapyName || 'Unknown Therapy',
          therapyType: therapy.therapyId?.therapyType || therapy.therapyType || 'general',
          sessionCount: therapy.sessionCount || 1,
          frequency: therapy.frequency || 'daily',
          durationMinutes: therapy.therapyId?.standardDuration || therapy.durationMinutes || 60,
          durationDays: therapy.durationDays || 1,
          requiresPreviousPhaseComplete: false,
          minimumDaysSincePreviousSession: 0,
          allowsParallelSessions: false,
          materials: [],
          instructions: therapy.notes || '',
          preConditions: '',
          stopCriteria: '',
          isCustom: false
        }));

        return {
          phaseName: phase.phaseName || phase.name,
          sequenceNumber: phase.sequence || 0,
          totalDays: phase.totalDays || phase.duration || 7,
          therapySessions: therapySessions,
          phaseInstructions: phase.phaseInstructions || phase.instructions || '',
          dietPlan: phase.dietGuidelines || phase.diet || '',
          lifestyleGuidelines: '',
          minGapDaysAfterPhase: phase.minimumGapToNext || 0,
          isCustom: false
        };
      });

      setPanchakarmaForm(prev => ({
        ...prev,
        courseTemplateId: template._id,
        panchakarmaType: template.panchakarmaType,
        treatmentName: template.displayName,
        treatmentCategory: template.category || 'Panchakarma',
        duration: {
          value: template.totalDuration,
          unit: 'days'
        },
        totalDays: template.totalDuration,
        phases: mappedPhases,
        prePanchakarmaInstructions: fullTemplate.preTreatmentInstructions || '',
        postPanchakarmaInstructions: fullTemplate.postTreatmentInstructions || '',
        isCustomPlan: false,
        isTemplateModified: false
      }));
      
      setWizardStep(2);
    } catch (error) {
      console.error('❌ Error loading template details:', error);
      alert('Failed to load template details: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddTherapyToPhase = (phaseIndex) => {
    if (availableTherapies.length === 0) {
      alert('No therapies available. Please contact administrator.');
      return;
    }

    const firstTherapy = availableTherapies[0];
    const newTherapy = {
      therapyId: firstTherapy._id,
      therapyName: firstTherapy.therapyName,
      therapyType: firstTherapy.therapyType || 'general',
      sessionCount: 1,
      frequency: 'daily',
      durationMinutes: firstTherapy.standardDuration || 60,
      durationDays: 1,
      requiresPreviousPhaseComplete: false,
      minimumDaysSincePreviousSession: 0,
      allowsParallelSessions: false,
      materials: [],
      instructions: '',
      preConditions: '',
      stopCriteria: '',
      isCustom: true
    };

    setPanchakarmaForm(prev => {
      const updatedPhases = [...prev.phases];
      updatedPhases[phaseIndex].therapySessions.push(newTherapy);
      return {
        ...prev,
        phases: updatedPhases,
        isTemplateModified: true
      };
    });
  };

  const handleRemoveTherapyFromPhase = (phaseIndex, therapyIndex) => {
    setPanchakarmaForm(prev => {
      const updatedPhases = [...prev.phases];
      updatedPhases[phaseIndex].therapySessions.splice(therapyIndex, 1);
      return {
        ...prev,
        phases: updatedPhases,
        isTemplateModified: true
      };
    });
  };

  const handleUpdateTherapy = (phaseIndex, therapyIndex, field, value) => {
    setPanchakarmaForm(prev => {
      const updatedPhases = [...prev.phases];
      const therapy = updatedPhases[phaseIndex].therapySessions[therapyIndex];
      
      // If changing therapy, update related fields
      if (field === 'therapyId') {
        const selectedTherapy = availableTherapies.find(t => t._id === value);
        if (selectedTherapy) {
          therapy.therapyId = value;
          therapy.therapyName = selectedTherapy.therapyName;
          therapy.therapyType = selectedTherapy.therapyType || 'general';
          therapy.durationMinutes = selectedTherapy.standardDuration || 60;
        }
      } else {
        therapy[field] = value;
      }
      
      return {
        ...prev,
        phases: updatedPhases,
        isTemplateModified: true
      };
    });
  };

  const handleSubmitPanchakarma = async () => {
    try {
      setSubmitting(true);
      setValidationErrors([]);

      // Client-side validation
      const errors = validatePhases();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setSubmitting(false);
        alert('⚠️ Validation Errors:\n' + errors.join('\n'));
        return;
      }

      console.log('📋 Submitting treatment plan:', JSON.stringify(panchakarmaForm, null, 2));

      // Validate with backend
      const validation = await doctorApiService.validateTreatmentPlan(panchakarmaForm);
      if (!validation.valid) {
        setValidationErrors([validation.error]);
        alert(`❌ Validation Error: ${validation.error}`);
        setSubmitting(false);
        return;
      }

      // Submit treatment plan
      const response = await doctorApiService.createTreatmentPlan(panchakarmaForm);
      
      if (response.data.success) {
        alert('✅ Panchakarma treatment plan created successfully!');
        onSuccess();
        onBack();
      }
    } catch (err) {
      console.error('❌ Error creating treatment plan:', err);
      const errorMsg = err.response?.data?.error?.message || err.message;
      setValidationErrors([errorMsg]);
      alert(`Failed to create treatment plan: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // 🔥 IF CUSTOM PLAN SELECTED, SHOW CUSTOM BUILDER INSTEAD
  if (planType === 'custom') {
    return (
      <CustomPlanBuilder
        consultations={consultations}
        availableTherapies={availableTherapies}
        availableTherapists={availableTherapists}
        onBack={() => setPlanType('template')}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-2">Validation Errors</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setValidationErrors([])}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Progress */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                wizardStep >= step 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {wizardStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 5 && (
                <div className={`w-20 h-1 mx-2 ${
                  wizardStep > step ? 'bg-emerald-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {wizardStep === 1 && '🌿 Select Template or Custom Plan'}
            {wizardStep === 2 && '👤 Patient & Therapist Selection'}
            {wizardStep === 3 && '🔧 Review & Customize Phases'}
            {wizardStep === 4 && '📅 Scheduling Preferences'}
            {wizardStep === 5 && '✅ Final Review & Submit'}
          </h3>
          <p className="text-slate-600">
            {wizardStep === 1 && 'Choose a pre-built protocol or create custom treatment plan'}
            {wizardStep === 2 && 'Assign patient consultation and therapist'}
            {wizardStep === 3 && 'Review and customize treatment phases and therapies'}
            {wizardStep === 4 && 'Set treatment start date and preferences'}
            {wizardStep === 5 && 'Review all details before creating the plan'}
          </p>
        </div>

        {/* STEP 1: Template Selection */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPlanType('template')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  planType === 'template'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <Clipboard className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                <h4 className="font-bold text-lg mb-2">Use Template</h4>
                <p className="text-sm text-slate-600">Select from pre-built Panchakarma protocols</p>
              </button>

              <button
                onClick={() => setPlanType('custom')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  planType === 'custom'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h4 className="font-bold text-lg mb-2">Custom Plan</h4>
                <p className="text-sm text-slate-600">Build your own treatment protocol</p>
              </button>
            </div>

            {planType === 'template' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTemplates.map((template) => (
                  <motion.div
                    key={template._id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleSelectTemplate(template)}
                    className="border-2 border-slate-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800 truncate">{template.displayName}</h4>
                      {template.isFeatured && (
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{template.totalDuration} days</span>
                      <span>{template.estimatedSessionCount} sessions</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                        {template.panchakarmaType}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Patient & Therapist */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Patient Consultation <span className="text-red-500">*</span>
                </label>
                <select
                  value={panchakarmaForm.consultationId}
                  onChange={(e) => {
                    const selectedConsult = consultations.find(c => c._id === e.target.value);
                    setPanchakarmaForm({
                      ...panchakarmaForm,
                      consultationId: e.target.value,
                      patientId: selectedConsult?.patientId?._id || selectedConsult?.patientId || ''
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Consultation</option>
                  {consultations.map((consultation) => (
                    <option key={consultation._id} value={consultation._id}>
                      {consultation.patientId?.name} - {new Date(consultation.scheduledFor || consultation.scheduledAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Assign Therapist <span className="text-red-500">*</span>
                </label>
                <select
                  value={panchakarmaForm.assignedTherapistId}
                  onChange={(e) => setPanchakarmaForm({...panchakarmaForm, assignedTherapistId: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Therapist</option>
                  {availableTherapists.map((therapist) => (
                    <option key={therapist._id} value={therapist._id}>
                      {therapist.userId?.name} - {therapist.specialization?.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Treatment Name (Optional)
              </label>
              <input
                type="text"
                value={panchakarmaForm.treatmentName}
                onChange={(e) => setPanchakarmaForm({...panchakarmaForm, treatmentName: e.target.value})}
                placeholder={selectedTemplate?.displayName || 'Enter custom treatment name'}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setWizardStep(1)}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!panchakarmaForm.consultationId || !panchakarmaForm.assignedTherapistId) {
                    alert('Please select both patient consultation and therapist');
                    return;
                  }
                  setWizardStep(3);
                }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
              >
                Next: Review Phases
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 🔥 PHASE REVIEW & CUSTOMIZATION */}
        {wizardStep === 3 && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Review Required Phases</p>
                  <p>Each phase must have at least one therapy session. Add therapies to empty phases or remove empty phases.</p>
                </div>
              </div>
            </div>

            {panchakarmaForm.phases.map((phase, phaseIndex) => (
              <div 
                key={phaseIndex} 
                className={`border-2 rounded-xl p-6 ${
                  phase.therapySessions.length === 0 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 capitalize">
                      {phase.phaseName}
                      {phase.therapySessions.length === 0 && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          ⚠️ Empty Phase
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-600">Duration: {phase.totalDays} days</p>
                  </div>
                  <button
                    onClick={() => handleAddTherapyToPhase(phaseIndex)}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Therapy</span>
                  </button>
                </div>

                {/* Therapies in this phase */}
                <div className="space-y-3">
                  {phase.therapySessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                      <p className="font-medium">No therapies in this phase</p>
                      <p className="text-sm">Click "Add Therapy" to add sessions</p>
                    </div>
                  ) : (
                    phase.therapySessions.map((therapy, therapyIndex) => (
                      <div key={therapyIndex} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Therapy</label>
                            <select
                              value={therapy.therapyId}
                              onChange={(e) => handleUpdateTherapy(phaseIndex, therapyIndex, 'therapyId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              {availableTherapies.map(t => (
                                <option key={t._id} value={t._id}>
                                  {t.therapyName} - {t.therapyType}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sessions</label>
                            <input
                              type="number"
                              min="1"
                              value={therapy.sessionCount}
                              onChange={(e) => handleUpdateTherapy(phaseIndex, therapyIndex, 'sessionCount', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                            <select
                              value={therapy.frequency}
                              onChange={(e) => handleUpdateTherapy(phaseIndex, therapyIndex, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="daily">Daily</option>
                              <option value="alternate_days">Alternate Days</option>
                              <option value="weekly">Weekly</option>
                              <option value="twice_daily">Twice Daily</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (mins)</label>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={therapy.durationMinutes}
                              onChange={(e) => handleUpdateTherapy(phaseIndex, therapyIndex, 'durationMinutes', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              onClick={() => handleRemoveTherapyFromPhase(phaseIndex, therapyIndex)}
                              className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4 inline mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions (Optional)</label>
                          <textarea
                            value={therapy.instructions}
                            onChange={(e) => handleUpdateTherapy(phaseIndex, therapyIndex, 'instructions', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            rows="2"
                            placeholder="Special instructions for this therapy..."
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setWizardStep(2)}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => {
                  const errors = validatePhases();
                  if (errors.length > 0) {
                    setValidationErrors(errors);
                    alert('⚠️ Please fix phase errors:\n' + errors.join('\n'));
                    return;
                  }
                  setValidationErrors([]);
                  setWizardStep(4);
                }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
              >
                Next: Scheduling
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Scheduling */}
        {wizardStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={panchakarmaForm.schedulingPreferences.startDate}
                  onChange={(e) => setPanchakarmaForm({
                    ...panchakarmaForm,
                    schedulingPreferences: {
                      ...panchakarmaForm.schedulingPreferences,
                      startDate: e.target.value
                    }
                  })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Preferred Time Slot
                </label>
                <select
                  value={panchakarmaForm.schedulingPreferences.preferredTimeSlot}
                  onChange={(e) => setPanchakarmaForm({
                    ...panchakarmaForm,
                    schedulingPreferences: {
                      ...panchakarmaForm.schedulingPreferences,
                      preferredTimeSlot: e.target.value
                    }
                  })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 9 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Specific Start Time
                </label>
                <input
                  type="time"
                  value={panchakarmaForm.schedulingPreferences.specificTime}
                  onChange={(e) => setPanchakarmaForm({
                    ...panchakarmaForm,
                    schedulingPreferences: {
                      ...panchakarmaForm.schedulingPreferences,
                      specificTime: e.target.value
                    }
                  })}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="skipWeekends"
                  checked={panchakarmaForm.schedulingPreferences.skipWeekends}
                  onChange={(e) => setPanchakarmaForm({
                    ...panchakarmaForm,
                    schedulingPreferences: {
                      ...panchakarmaForm.schedulingPreferences,
                      skipWeekends: e.target.checked
                    }
                  })}
                  className="w-5 h-5"
                />
                <label htmlFor="skipWeekends" className="font-medium text-slate-700">
                  Skip Weekends
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="sameTherapist"
                  checked={panchakarmaForm.schedulingPreferences.requireSameTherapist}
                  onChange={(e) => setPanchakarmaForm({
                    ...panchakarmaForm,
                    schedulingPreferences: {
                      ...panchakarmaForm.schedulingPreferences,
                      requireSameTherapist: e.target.checked
                    }
                  })}
                  className="w-5 h-5"
                />
                <label htmlFor="sameTherapist" className="font-medium text-slate-700">
                  Require Same Therapist
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setWizardStep(3)}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setWizardStep(5)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
              >
                Review Plan
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {wizardStep === 5 && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h4 className="font-bold text-emerald-900 mb-4">Plan Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Template:</span>
                  <p className="font-semibold">{selectedTemplate?.displayName || 'Custom'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Total Phases:</span>
                  <p className="font-semibold">{panchakarmaForm.phases.length}</p>
                </div>
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-semibold">{panchakarmaForm.totalDays} days</p>
                </div>
                <div>
                  <span className="text-slate-600">Total Sessions:</span>
                  <p className="font-semibold">
                    {panchakarmaForm.phases.reduce((sum, phase) => 
                      sum + phase.therapySessions.reduce((s, t) => s + (t.sessionCount || 0), 0), 0
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-semibold">{new Date(panchakarmaForm.schedulingPreferences.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Time Slot:</span>
                  <p className="font-semibold capitalize">{panchakarmaForm.schedulingPreferences.preferredTimeSlot}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pre-Panchakarma Instructions
              </label>
              <textarea
                value={panchakarmaForm.prePanchakarmaInstructions}
                onChange={(e) => setPanchakarmaForm({...panchakarmaForm, prePanchakarmaInstructions: e.target.value})}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows="3"
                placeholder="Instructions before starting treatment..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Post-Panchakarma Instructions
              </label>
              <textarea
                value={panchakarmaForm.postPanchakarmaInstructions}
                onChange={(e) => setPanchakarmaForm({...panchakarmaForm, postPanchakarmaInstructions: e.target.value})}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows="3"
                placeholder="Instructions after completing treatment..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Safety Notes & Precautions
              </label>
              <textarea
                value={panchakarmaForm.safetyNotes}
                onChange={(e) => setPanchakarmaForm({...panchakarmaForm, safetyNotes: e.target.value})}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows="2"
                placeholder="Safety precautions and contraindications..."
              />
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setWizardStep(4)}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmitPanchakarma}
                disabled={submitting}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Create Treatment Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PanchakarmaPlanner;
