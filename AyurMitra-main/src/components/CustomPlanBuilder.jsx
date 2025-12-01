// src/components/CustomPlanBuilder.jsx
// 🔥 CUSTOM PANCHAKARMA PLAN BUILDER - ENHANCED UX

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, AlertCircle, Plus, Trash2, X, Check
} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';

const CustomPlanBuilder = ({
  consultations,
  availableTherapies,
  availableTherapists,
  onBack,
  onSuccess,
}) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [customForm, setCustomForm] = useState({
    patientId: '',
    consultationId: '',
    assignedTherapistId: '',
    panchakarmaType: '',
    treatmentName: '',
    duration: { value: '', unit: 'days' },
    phases: [],
    schedulingPreferences: {
      startDate: new Date().toISOString().split('T')[0],
      preferredTimeSlot: 'morning',
      specificTime: '08:00',
      skipWeekends: false,
      requireSameTherapist: true,
    },
    prePanchakarmaInstructions: '',
    postPanchakarmaInstructions: '',
    treatmentNotes: '',
    safetyNotes: '',
  });

  // ═══════════════════════════════════════════════════════════
  // PHASE/THERAPY MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  const addPhase = () => {
    setCustomForm(prev => ({
      ...prev,
      phases: [...prev.phases, {
        phaseName: '',
        sequenceNumber: prev.phases.length + 1,
        totalDays: '',
        therapySessions: [],
        phaseInstructions: '',
        dietPlan: '',
        lifestyleGuidelines: '',
        minGapDaysAfterPhase: 0,
        isCustom: true,
      }],
    }));
  };

  const removePhase = (idx) => {
    if (customForm.phases.length === 1) {
      alert('Treatment plan must have at least one phase');
      return;
    }
    setCustomForm(prev => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== idx),
    }));
  };

  const updatePhase = (phaseIdx, field, value) => {
    setCustomForm(prev => {
      const updated = [...prev.phases];
      updated[phaseIdx][field] = value;
      return { ...prev, phases: updated };
    });
  };

  const addTherapyToPhase = (phaseIdx) => {
    if (availableTherapies.length === 0) {
      alert('No therapies available. Please contact administrator.');
      return;
    }
    setCustomForm(prev => {
      const updated = [...prev.phases];
      updated[phaseIdx].therapySessions.push({
        therapyId: '',
        therapyName: '',
        therapyType: '',
        sessionCount: '',
        frequency: 'daily',
        durationMinutes: '',
        instructions: '',
        isCustom: true,
      });
      return { ...prev, phases: updated };
    });
  };

  const removeTherapy = (phaseIdx, tIdx) => {
    setCustomForm(prev => {
      const updated = [...prev.phases];
      updated[phaseIdx].therapySessions.splice(tIdx, 1);
      return { ...prev, phases: updated };
    });
  };

  const updateTherapy = (phaseIdx, tIdx, field, value) => {
    setCustomForm(prev => {
      const updated = [...prev.phases];
      const therapy = updated[phaseIdx].therapySessions[tIdx];
      if (field === 'therapyId' && value) {
        const found = availableTherapies.find(t => t._id === value);
        if (found) {
          therapy.therapyId = found._id;
          therapy.therapyName = found.therapyName;
          therapy.therapyType = found.therapyType;
          therapy.durationMinutes = found.standardDuration || '';
        }
      } else {
        therapy[field] = value;
      }
      return { ...prev, phases: updated };
    });
  };

  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════

  const validate = () => {
    const errors = [];
    if (wizardStep === 1) {
      if (!customForm.consultationId) errors.push('Please select a patient consultation');
      if (!customForm.assignedTherapistId) errors.push('Please assign a therapist');
      if (!customForm.treatmentName.trim()) errors.push('Please enter a treatment name');
      if (!customForm.panchakarmaType) errors.push('Please choose Panchakarma type');
      if (!(parseInt(customForm.duration.value) > 0)) errors.push('Treatment duration must be > 0');
    }
    if (wizardStep === 2) {
      if (customForm.phases.length === 0) errors.push('Please add at least one phase');
      customForm.phases.forEach((phase, i) => {
        if (!phase.phaseName) errors.push(`Phase ${i + 1}: Select phase type`);
        if (!(parseInt(phase.totalDays) > 0)) errors.push(`Phase ${i + 1}: Enter valid total days`);
        if (phase.therapySessions.length === 0) errors.push(`Phase ${i + 1}: Add at least one therapy`);
        phase.therapySessions.forEach((t, tIdx) => {
          if (!t.therapyId) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Select a therapy`);
          if (!(parseInt(t.sessionCount) > 0)) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Enter sessions`);
          if (!(parseInt(t.durationMinutes) > 0)) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Enter duration`);
        });
      });
    }
    if (wizardStep === 3) {
      if (!customForm.schedulingPreferences.startDate) errors.push('Please select a start date');
    }
    return errors;
  };

  // ═══════════════════════════════════════════════════════════
  // SUBMISSION
  // ═══════════════════════════════════════════════════════════

  const totalDays = customForm.phases.reduce((sum, phase) => sum + Number(phase.totalDays || 0), 0);
  const totalSessions = customForm.phases.reduce((sum, phase) =>
    sum + phase.therapySessions.reduce((s, t) => s + Number(t.sessionCount || 0), 0), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setValidationErrors([]);
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      alert('⚠️ Please fix the following errors:\n\n' + errors.join('\n'));
      setSubmitting(false);
      return;
    }

    const submissionData = {
      ...customForm,
      isCustomPlan: true,
      treatmentCategory: 'Panchakarma',
      totalDays: totalDays,
    };
    delete submissionData.courseTemplateId;

    try {
      const response = await doctorApiService.createTreatmentPlan(submissionData);
      if (response.data.success) {
        alert('✅ Custom plan created successfully!');
        onSuccess();
        onBack();
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error?.message || err.message;
      setValidationErrors([errorMsg]);
      alert(`Failed to create treatment plan:\n${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // WIZARD NAVIGATION
  // ═══════════════════════════════════════════════════════════

  const nextStep = () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      alert('⚠️ Please fix errors:\n' + errors.join('\n'));
      return;
    }
    setValidationErrors([]);
    setWizardStep(prev => prev + 1);
  };
  const prevStep = () => {
    setValidationErrors([]);
    setWizardStep(prev => prev - 1);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

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
            <button onClick={() => setValidationErrors([])} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Progress */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100/50 p-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                wizardStep >= step ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {wizardStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-20 h-1 mx-2 ${wizardStep > step ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {wizardStep === 1 && '👤 Patient & Basic Details'}
            {wizardStep === 2 && '🔧 Build Treatment Phases'}
            {wizardStep === 3 && '📅 Scheduling Preferences'}
            {wizardStep === 4 && '✅ Final Review & Submit'}
          </h3>
          <p className="text-slate-600">
            {wizardStep === 1 && 'Enter patient, therapist, and treatment details'}
            {wizardStep === 2 && 'Add phases and therapy sessions manually'}
            {wizardStep === 3 && 'Set treatment start date and preferences'}
            {wizardStep === 4 && 'Review all details before creating the plan'}
          </p>
        </div>

        {/* STEP 1: Basic Info */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Patient Consultation <span className="text-red-500">*</span>
                </label>
                <select
                  value={customForm.consultationId}
                  onChange={e => {
                    const sel = consultations.find(c => c._id === e.target.value);
                    setCustomForm(prev => ({
                      ...prev,
                      consultationId: e.target.value,
                      patientId: sel?.patientId?._id || sel?.patientId || ''
                    }));
                  }}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Consultation</option>
                  {consultations.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.patientId?.name} - {new Date(c.scheduledFor || c.scheduledAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Assign Therapist <span className="text-red-500">*</span>
                </label>
                <select
                  value={customForm.assignedTherapistId}
                  onChange={e => setCustomForm(prev => ({ ...prev, assignedTherapistId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Therapist</option>
                  {availableTherapists.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.userId?.name} - {t.specialization?.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Treatment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customForm.treatmentName}
                onChange={e => setCustomForm(prev => ({ ...prev, treatmentName: e.target.value }))}
                placeholder="e.g., Custom Vamana Protocol"
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Panchakarma Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={customForm.panchakarmaType}
                  onChange={e => setCustomForm(prev => ({ ...prev, panchakarmaType: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Type</option>
                  <option value="vamana">Vamana (Emesis)</option>
                  <option value="virechana">Virechana (Purgation)</option>
                  <option value="basti">Basti (Enema)</option>
                  <option value="nasya">Nasya (Nasal)</option>
                  <option value="raktamokshana">Raktamokshana (Bloodletting)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Treatment Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customForm.duration.value}
                    onChange={e => setCustomForm(prev => ({
                      ...prev,
                      duration: { ...prev.duration, value: e.target.value }
                    }))}
                    placeholder="21"
                    className="flex-1 px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={customForm.duration.unit}
                    onChange={e => setCustomForm(prev => ({
                      ...prev,
                      duration: { ...prev.duration, unit: e.target.value }
                    }))}
                    className="w-32 px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={onBack} className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={nextStep} className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
                Next: Add Phases
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Phases */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Build Your Phases</p>
                  <p>Add phases manually. Each phase must have at least one therapy session with all required details.</p>
                </div>
              </div>
            </div>

            {customForm.phases.map((phase, phaseIdx) => (
              <div
                key={phaseIdx}
                className={`border-2 rounded-xl p-6 ${
                  phase.therapySessions.length === 0 ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 capitalize">
                      Phase {phase.sequenceNumber}: {phase.phaseName || 'Unnamed Phase'}
                      {phase.therapySessions.length === 0 && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          ⚠️ Empty Phase
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-600">Duration: {phase.totalDays || 0} days</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addTherapyToPhase(phaseIdx)}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Therapy</span>
                    </button>
                    <button
                      onClick={() => removePhase(phaseIdx)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phase Name *</label>
                    <select
                      value={phase.phaseName}
                      onChange={e => updatePhase(phaseIdx, 'phaseName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select Phase</option>
                      <option value="purvakarma">Purvakarma (Preparation)</option>
                      <option value="pradhanakarma">Pradhanakarma (Main)</option>
                      <option value="paschatkarma">Paschatkarma (Post-care)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Total Days *</label>
                    <input
                      type="number"
                      min="1"
                      value={phase.totalDays}
                      onChange={e => updatePhase(phaseIdx, 'totalDays', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Sequence Number</label>
                    <input
                      type="number"
                      min="1"
                      value={phase.sequenceNumber}
                      onChange={e => updatePhase(phaseIdx, 'sequenceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Therapies */}
                <div className="space-y-3">
                  {phase.therapySessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                      <p className="font-medium">No therapies in this phase</p>
                      <p className="text-sm">Click "Add Therapy" to add sessions</p>
                    </div>
                  ) : (
                    phase.therapySessions.map((therapy, tIdx) => (
                      <div key={tIdx} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Therapy *</label>
                            <select
                              value={therapy.therapyId}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'therapyId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="">Select Therapy</option>
                              {availableTherapies.map(t => (
                                <option key={t._id} value={t._id}>
                                  {t.therapyName} - {t.therapyType}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sessions *</label>
                            <input
                              type="number"
                              min="1"
                              value={therapy.sessionCount}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'sessionCount', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                            <select
                              value={therapy.frequency}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="daily">Daily</option>
                              <option value="alternate">Alternate Days</option>
                              <option value="weekly">Weekly</option>
                              <option value="twice_daily">Twice Daily</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (mins) *</label>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={therapy.durationMinutes}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'durationMinutes', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeTherapy(phaseIdx, tIdx)}
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
                            onChange={e => updateTherapy(phaseIdx, tIdx, 'instructions', e.target.value)}
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

            <button
              type="button"
              onClick={addPhase}
              className="w-full px-6 py-3 border-2 border-emerald-300 text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all font-semibold flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Phase
            </button>

            <div className="flex justify-between pt-6">
              <button onClick={prevStep} className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Back
              </button>
              <button onClick={nextStep} className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
                Next: Scheduling
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Scheduling */}
        {wizardStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={customForm.schedulingPreferences.startDate}
                  onChange={e => setCustomForm(prev => ({
                    ...prev,
                    schedulingPreferences: { ...prev.schedulingPreferences, startDate: e.target.value }
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Preferred Time Slot
                </label>
                <select
                  value={customForm.schedulingPreferences.preferredTimeSlot}
                  onChange={e => setCustomForm(prev => ({
                    ...prev,
                    schedulingPreferences: { ...prev.schedulingPreferences, preferredTimeSlot: e.target.value }
                  }))}
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
                  value={customForm.schedulingPreferences.specificTime}
                  onChange={e => setCustomForm(prev => ({
                    ...prev,
                    schedulingPreferences: { ...prev.schedulingPreferences, specificTime: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="customSkipWeekends"
                  checked={customForm.schedulingPreferences.skipWeekends}
                  onChange={e => setCustomForm(prev => ({
                    ...prev,
                    schedulingPreferences: { ...prev.schedulingPreferences, skipWeekends: e.target.checked }
                  }))}
                  className="w-5 h-5"
                />
                <label htmlFor="customSkipWeekends" className="font-medium text-slate-700">
                  Skip Weekends
                </label>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="customSameTherapist"
                  checked={customForm.schedulingPreferences.requireSameTherapist}
                  onChange={e => setCustomForm(prev => ({
                    ...prev,
                    schedulingPreferences: { ...prev.schedulingPreferences, requireSameTherapist: e.target.checked }
                  }))}
                  className="w-5 h-5"
                />
                <label htmlFor="customSameTherapist" className="font-medium text-slate-700">
                  Require Same Therapist
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={prevStep} className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Back
              </button>
              <button onClick={nextStep} className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
                Review Plan
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {wizardStep === 4 && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h4 className="font-bold text-emerald-900 mb-4">Plan Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Treatment:</span>
                  <p className="font-semibold">{customForm.treatmentName || '--'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Panchakarma Type:</span>
                  <p className="font-semibold">{customForm.panchakarmaType || '--'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Total Phases:</span>
                  <p className="font-semibold">{customForm.phases.length}</p>
                </div>
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-semibold">{totalDays} days</p>
                </div>
                <div>
                  <span className="text-slate-600">Total Sessions:</span>
                  <p className="font-semibold">{totalSessions}</p>
                </div>
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-semibold">{new Date(customForm.schedulingPreferences.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Time Slot:</span>
                  <p className="font-semibold capitalize">{customForm.schedulingPreferences.preferredTimeSlot}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pre-Panchakarma Instructions
              </label>
              <textarea
                value={customForm.prePanchakarmaInstructions}
                onChange={e => setCustomForm(prev => ({ ...prev, prePanchakarmaInstructions: e.target.value }))}
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
                value={customForm.postPanchakarmaInstructions}
                onChange={e => setCustomForm(prev => ({ ...prev, postPanchakarmaInstructions: e.target.value }))}
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
                value={customForm.safetyNotes}
                onChange={e => setCustomForm(prev => ({ ...prev, safetyNotes: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows="2"
                placeholder="Safety precautions and contraindications..."
              />
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={prevStep} className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Back
              </button>
              <button
                onClick={handleSubmit}
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
                    <span>Create Custom Plan</span>
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

export default CustomPlanBuilder;
