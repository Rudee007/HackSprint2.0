// src/components/CustomPlanBuilder.jsx
// 🔥 SMART CUSTOM PANCHAKARMA PLAN BUILDER - FIXED 21-DAY SCHEDULING
// ✅ BUG FIX: Corrected durationDays calculation to respect phase boundaries

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, AlertCircle, Plus, Trash2, X, Check, Calculator, Info
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
  // 🧮 SMART AUTO-CALCULATIONS
  // ═══════════════════════════════════════════════════════════

  // Calculate total days from all phases
  const totalDays = customForm.phases.reduce((sum, phase) => sum + Number(phase.totalDays || 0), 0);

  // Calculate total sessions from all therapies
  const totalSessions = customForm.phases.reduce((sum, phase) =>
    sum + phase.therapySessions.reduce((s, t) => s + Number(t.sessionCount || 0), 0), 0);

  // Calculate estimated total minutes
  const totalMinutes = customForm.phases.reduce((sum, phase) =>
    sum + phase.therapySessions.reduce((s, t) => 
      s + (Number(t.sessionCount || 0) * Number(t.durationMinutes || 0)), 0), 0);

  // ═══════════════════════════════════════════════════════════
  // ✅ FIXED: Smart calculation respects phase boundaries
  // ═══════════════════════════════════════════════════════════
  
  /**
   * 🔥 CRITICAL FIX: Calculate durationDays for parallel scheduling
   * 
   * BEFORE (BUGGY): If 5 daily sessions in 7-day phase → returned 5 days
   * AFTER (FIXED): If 5 daily sessions in 7-day phase → returns 7 days
   * 
   * WHY: For parallel therapies, durationDays should span the full phase.
   * The backend scheduler distributes sessions across these days based on frequency.
   * 
   * @param {number} sessionCount - Number of therapy sessions
   * @param {string} frequency - Session frequency (daily, alternate, etc.)
   * @param {number} phaseTotalDays - Total days in the phase
   * @returns {number} Duration in days for this therapy
   */
  const calculateDurationDays = (sessionCount, frequency, phaseTotalDays) => {
    const sessions = Number(sessionCount) || 1;
    const maxDays = Number(phaseTotalDays) || 7;

    switch (frequency) {
      case 'daily':
        // ✅ FIX: Use full phase duration for parallel scheduling
        // Sessions will be distributed: Day 1, 2, 3, 4, 5 (remaining days available for other therapies)
        return maxDays;
        
      case 'alternate':
        // ✅ FIX: Use full phase duration, backend handles alternate-day spacing
        return maxDays;
        
      case 'weekly':
        // Weekly: calculate minimum required days, cap at phase duration
        const minWeeklyDays = sessions * 7;
        return Math.min(minWeeklyDays, maxDays);
        
      case 'twice_daily':
        // Twice daily: calculate minimum required days, cap at phase duration
        const minTwiceDailyDays = Math.ceil(sessions / 2);
        return Math.min(minTwiceDailyDays, maxDays);
        
      default:
        // ✅ FIX: Default to full phase duration
        return maxDays;
    }
  };

  // Auto-sync treatment duration with phase total
  useEffect(() => {
    if (totalDays > 0 && customForm.duration.unit === 'days') {
      setCustomForm(prev => ({
        ...prev,
        duration: { ...prev.duration, value: totalDays }
      }));
      console.log(`✅ Auto-calculated total duration: ${totalDays} days across ${customForm.phases.length} phase(s)`);
    }
  }, [totalDays]);

  // ═══════════════════════════════════════════════════════════
  // PHASE/THERAPY MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  const addPhase = () => {
    setCustomForm(prev => {
      const newPhases = [...prev.phases, {
        phaseName: '',
        sequenceNumber: prev.phases.length + 1,
        totalDays: 7, // Default 7 days
        therapySessions: [],
        phaseInstructions: '',
        dietPlan: '',
        lifestyleGuidelines: '',
        minGapDaysAfterPhase: 0,
        isCustom: true,
      }];
      return { ...prev, phases: newPhases };
    });
  };

  const removePhase = (idx) => {
    if (customForm.phases.length === 1) {
      alert('Treatment plan must have at least one phase');
      return;
    }
    setCustomForm(prev => {
      const updated = prev.phases
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, sequenceNumber: i + 1 })); // Auto-renumber
      return { ...prev, phases: updated };
    });
  };

  const updatePhase = (phaseIdx, field, value) => {
    setCustomForm(prev => {
      const updated = [...prev.phases];
      updated[phaseIdx][field] = value;

      // ✅ Smart update: recalculate therapy durationDays when phase totalDays changes
      if (field === 'totalDays') {
        console.log(`📅 Phase ${phaseIdx + 1} duration changed to ${value} days - recalculating therapy durations...`);
        updated[phaseIdx].therapySessions = updated[phaseIdx].therapySessions.map(therapy => {
          const newDuration = calculateDurationDays(therapy.sessionCount, therapy.frequency, value);
          console.log(`  ✅ ${therapy.therapyName || 'Therapy'}: ${therapy.durationDays} → ${newDuration} days`);
          return {
            ...therapy,
            durationDays: newDuration
          };
        });
      }

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
      const phaseTotalDays = updated[phaseIdx].totalDays || 7;
      
      // ✅ New therapy defaults to full phase duration
      updated[phaseIdx].therapySessions.push({
        therapyId: '',
        therapyName: '',
        therapyType: '',
        sessionCount: 1,
        frequency: 'daily',
        durationMinutes: 60,
        durationDays: phaseTotalDays, // ✅ FIX: Default to phase duration
        instructions: '',
        isCustom: true,
        requiresPreviousPhaseComplete: false,
        minimumDaysSincePreviousSession: 0,
        allowsParallelSessions: true, // ✅ Enable parallel scheduling
        materials: [],
        preConditions: '',
        stopCriteria: '',
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
      const phaseTotalDays = updated[phaseIdx].totalDays || 7;

      if (field === 'therapyId' && value) {
        const found = availableTherapies.find(t => t._id === value);
        if (found) {
          therapy.therapyId = found._id;
          therapy.therapyName = found.therapyName;
          therapy.therapyType = found.therapyType;
          therapy.durationMinutes = found.standardDuration || 60;
          // ✅ FIX: Auto-calculate using corrected function
          therapy.durationDays = calculateDurationDays(therapy.sessionCount, therapy.frequency, phaseTotalDays);
          console.log(`✅ Selected ${found.therapyName}: ${therapy.durationDays} days in ${phaseTotalDays}-day phase`);
        }
      } else {
        therapy[field] = value;

        // ✅ Smart recalculation: update durationDays when sessionCount or frequency changes
        if (field === 'sessionCount' || field === 'frequency') {
          const oldDuration = therapy.durationDays;
          therapy.durationDays = calculateDurationDays(
            field === 'sessionCount' ? value : therapy.sessionCount,
            field === 'frequency' ? value : therapy.frequency,
            phaseTotalDays
          );
          console.log(`🔄 ${therapy.therapyName || 'Therapy'} ${field} changed: ${oldDuration} → ${therapy.durationDays} days`);
        }
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
    }
    if (wizardStep === 2) {
      if (customForm.phases.length === 0) errors.push('Please add at least one phase');
      customForm.phases.forEach((phase, i) => {
        if (!phase.phaseName) errors.push(`Phase ${i + 1}: Select phase type`);
        if (!(Number(phase.totalDays) > 0)) errors.push(`Phase ${i + 1}: Enter valid total days`);
        if (phase.therapySessions.length === 0) errors.push(`Phase ${i + 1}: Add at least one therapy`);
        phase.therapySessions.forEach((t, tIdx) => {
          if (!t.therapyId) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Select a therapy`);
          if (!(Number(t.sessionCount) > 0)) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Enter sessions`);
          if (!(Number(t.durationMinutes) > 0)) errors.push(`Phase ${i + 1} Therapy ${tIdx + 1}: Enter duration minutes`);
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
      duration: { value: totalDays, unit: 'days' },
    };
    delete submissionData.courseTemplateId;

    console.log('📤 Submitting treatment plan:', {
      totalDays,
      totalSessions,
      phases: submissionData.phases.map(p => ({
        name: p.phaseName,
        days: p.totalDays,
        therapies: p.therapySessions.map(t => ({
          name: t.therapyName,
          sessions: t.sessionCount,
          durationDays: t.durationDays, // ✅ Now correct!
          frequency: t.frequency
        }))
      }))
    });

    try {
      const response = await doctorApiService.createTreatmentPlan(submissionData);
      if (response.data.success) {
        alert('✅ Custom plan created successfully!\n\n🎯 Treatment will span ' + totalDays + ' days with ' + totalSessions + ' sessions.');
        onSuccess();
        onBack();
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message;
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
      {/* Smart Stats Bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span className="font-semibold">✅ Smart Calculations (Fixed)</span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="opacity-80">Total Days:</span>
              <span className="ml-2 font-bold text-lg">{totalDays}</span>
            </div>
            <div>
              <span className="opacity-80">Sessions:</span>
              <span className="ml-2 font-bold text-lg">{totalSessions}</span>
            </div>
            <div>
              <span className="opacity-80">Est. Time:</span>
              <span className="ml-2 font-bold text-lg">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
            {wizardStep === 2 && 'Add phases and therapies - sessions auto-schedule across full phase duration'}
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
                placeholder="e.g., Custom Vamana Protocol - 21 Days"
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

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

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Calculator className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">✅ Smart Auto-Calculation Enabled</p>
                  <p className="mb-2">Treatment duration is calculated from phase totals. Therapies automatically spread across full phase days based on frequency.</p>
                  <p className="font-bold text-blue-900">
                    Currently: <span className="text-xl">{totalDays || 0} days</span> across {customForm.phases.length} phase(s)
                  </p>
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
            {/* ✅ Updated Helper Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-2">🎯 How 21-Day Scheduling Works (FIXED)</p>
                  <ul className="list-disc list-inside space-y-1 mb-2">
                    <li><strong>Phase Days:</strong> Total duration for this phase (e.g., 7 days for Purvakarma)</li>
                    <li><strong>Therapy Sessions:</strong> Number of therapy sessions to schedule</li>
                    <li><strong>Duration Days:</strong> Auto-set to full phase duration (therapies run in parallel)</li>
                    <li><strong>Frequency:</strong> How often sessions occur (daily, alternate days, etc.)</li>
                  </ul>
                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mt-2">
                    <p className="font-bold text-amber-900 mb-1">✅ Example (FIXED):</p>
                    <p className="text-xs">7-day Purvakarma with 5 daily Snehapana + 5 daily Abhyanga:</p>
                    <p className="text-xs mt-1">
                      • Day 1: Snehapana 1/5 + Abhyanga 1/5<br />
                      • Day 2: Snehapana 2/5 + Abhyanga 2/5<br />
                      • ...<br />
                      • Day 5: Snehapana 5/5 + Abhyanga 5/5<br />
                      • Days 6-7: Rest or other therapies ✅
                    </p>
                  </div>
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
                          ⚠️ Empty
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-600">
                      Duration: <strong>{phase.totalDays || 0} days</strong> | 
                      Sessions: <strong>{phase.therapySessions.reduce((s, t) => s + Number(t.sessionCount || 0), 0)}</strong> | 
                      Therapies: <strong>{phase.therapySessions.length}</strong>
                    </p>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Total Days * 
                      <span className="ml-2 text-emerald-600 font-normal">✅ (therapies spread across these days)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={phase.totalDays}
                      onChange={e => updatePhase(phaseIdx, 'totalDays', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Therapies */}
                <div className="space-y-3">
                  {phase.therapySessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                      <p className="font-medium">No therapies in this phase</p>
                      <p className="text-sm">Click "Add Therapy" to add sessions</p>
                    </div>
                  ) : (
                    phase.therapySessions.map((therapy, tIdx) => (
                      <div key={tIdx} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Therapy * <span className="text-emerald-600">✅ (auto-fills details)</span>
                            </label>
                            <select
                              value={therapy.therapyId}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'therapyId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="">Select Therapy</option>
                              {availableTherapies.map(t => (
                                <option key={t._id} value={t._id}>
                                  {t.therapyName} ({t.therapyType})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Sessions * <span className="text-blue-600">✅ (updates duration)</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={therapy.sessionCount}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'sessionCount', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Frequency <span className="text-blue-600">✅ (updates duration)</span>
                            </label>
                            <select
                              value={therapy.frequency}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="daily">Daily</option>
                              <option value="alternate">Alternate</option>
                              <option value="weekly">Weekly</option>
                              <option value="twice_daily">Twice Daily</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (min) *</label>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={therapy.durationMinutes}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'durationMinutes', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* ✅ Enhanced Duration Days Display */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-emerald-700">✅ Duration Days (FIXED)</span>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-900">{therapy.durationDays || 0} days</div>
                            <div className="text-xs text-emerald-700 mt-1">
                              {therapy.durationDays === phase.totalDays ? 
                                '✅ Full phase span (parallel OK)' : 
                                `⚠️ ${therapy.durationDays}/${phase.totalDays} days used`
                              }
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions (Optional)</label>
                            <textarea
                              value={therapy.instructions}
                              onChange={e => updateTherapy(phaseIdx, tIdx, 'instructions', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              rows="2"
                              placeholder="Special instructions..."
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => removeTherapy(phaseIdx, tIdx)}
                          className="mt-3 w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Remove Therapy
                        </button>
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
            {/* ✅ Enhanced Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
              <h4 className="font-bold text-emerald-900 mb-4 flex items-center text-lg">
                <CheckCircle className="w-6 h-6 mr-2" />
                ✅ Fixed Plan Summary - Correct 21-Day Scheduling
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Treatment:</span>
                  <p className="font-semibold text-slate-900">{customForm.treatmentName || '--'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Panchakarma Type:</span>
                  <p className="font-semibold text-slate-900 capitalize">{customForm.panchakarmaType || '--'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Total Phases:</span>
                  <p className="font-semibold text-slate-900">{customForm.phases.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-300">
                  <span className="text-slate-600">Total Days:</span>
                  <p className="font-bold text-2xl text-emerald-600">{totalDays}</p>
                  <p className="text-xs text-emerald-700">✅ Auto-calculated</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-300">
                  <span className="text-slate-600">Total Sessions:</span>
                  <p className="font-bold text-2xl text-emerald-600">{totalSessions}</p>
                  <p className="text-xs text-emerald-700">✅ Auto-calculated</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-300">
                  <span className="text-slate-600">Est. Total Time:</span>
                  <p className="font-bold text-2xl text-emerald-600">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</p>
                  <p className="text-xs text-emerald-700">✅ Auto-calculated</p>
                </div>
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-semibold text-slate-900">{new Date(customForm.schedulingPreferences.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Estimated End:</span>
                  <p className="font-semibold text-slate-900">
                    {new Date(new Date(customForm.schedulingPreferences.startDate).getTime() + (totalDays - 1) * 86400000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Time Slot:</span>
                  <p className="font-semibold text-slate-900 capitalize">{customForm.schedulingPreferences.preferredTimeSlot}</p>
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
                    <span>✅ Create Fixed Plan ({totalDays} Days)</span>
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
