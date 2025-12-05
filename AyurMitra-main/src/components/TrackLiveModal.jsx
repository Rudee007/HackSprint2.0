// src/components/TrackLiveModal.jsx
// 🔥 SCHEMA-ALIGNED TRACK LIVE MODAL (Vitals, Progress, Notes)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  Heart,
  Wind,
  Thermometer,
  Clock,
  TrendingUp,
  FileText,
  Save,
  Stethoscope,
  Loader2
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast } from 'react-hot-toast';

const TrackLiveModal = ({ sessionId, isOpen, onClose, onUpdate }) => {
  const [session, setSession] = useState(null);          // full consultation
  const [timing, setTiming] = useState(null);            // timing from controller
  const [therapyInfo, setTherapyInfo] = useState(null);  // therapyInfo object
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vitals');  // 'vitals' | 'progress' | 'notes'
  const [isSaving, setIsSaving] = useState(false);

  // Vitals: strictly match Consultation.therapyData.vitals
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    pulse: '',
    temperature: '',
    weight: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  });

  // Progress: match progressUpdates schema
  const [progress, setProgress] = useState({
    stage: '',
    percentage: 0,
    notes: ''
  });

  // Notes: sessionNotes (root-level array)
  const [sessionNote, setSessionNote] = useState('');

  // Fetch realtime session details from updated controller/service
  const fetchSession = useCallback(async () => {
    if (!sessionId || !isOpen) return;
    try {
      setIsLoading(true);
      const result = await therapistApiService.getRealtimeSessionDetails(sessionId);
      if (!result.success) {
        toast.error(result.error || 'Failed to load session');
        onClose();
        return;
      }

      const data = result.data;
      const consultation = data.consultation || null;

      setSession(consultation);
      setTiming(data.timing || null);
      setTherapyInfo(data.therapyInfo || null);

      // Pre-fill vitals if therapy and vitals exist
      if (
        consultation?.sessionType === 'therapy' &&
        consultation.therapyData?.vitals
      ) {
        const v = consultation.therapyData.vitals;
        setVitals({
          bloodPressure: {
            systolic: v.bloodPressure?.systolic || '',
            diastolic: v.bloodPressure?.diastolic || ''
          },
          pulse: v.pulse ?? '',
          temperature: v.temperature ?? '',
          weight: v.weight ?? '',
          respiratoryRate: v.respiratoryRate ?? '',
          oxygenSaturation: v.oxygenSaturation ?? ''
        });
      }

      console.log('✅ [TRACK LIVE] Session details loaded', {
        status: consultation?.sessionStatus,
        sessionType: consultation?.sessionType,
        therapyInfo: data.therapyInfo
      });
    } catch (err) {
      console.error('❌ [TRACK LIVE] Error fetching session details:', err);
      toast.error('Error loading session');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isOpen, onClose]);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSession();
    }
  }, [isOpen, sessionId, fetchSession]);

  const isTherapySession = session?.sessionType === 'therapy';

  // ─────────────────────────────────────────────────────────────
  // Save vitals (updateTherapyVitals in controller / updateVitalsRealtime in service)
  // ─────────────────────────────────────────────────────────────
  const handleSaveVitals = async () => {
    if (!isTherapySession) {
      toast.error('Vitals can only be recorded for therapy sessions');
      return;
    }

    try
    {
      setIsSaving(true);
      const payload = {
        bloodPressure: {
          systolic: vitals.bloodPressure.systolic || undefined,
          diastolic: vitals.bloodPressure.diastolic || undefined
        },
        pulse: vitals.pulse || undefined,
        temperature: vitals.temperature || undefined,
        weight: vitals.weight || undefined,
        respiratoryRate: vitals.respiratoryRate || undefined,
        oxygenSaturation: vitals.oxygenSaturation || undefined
      };

      const result = await therapistApiService.updateVitalsRealtime(
        sessionId,
        payload
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to save vitals');
        return;
      }

      toast.success('Vitals saved successfully');
      await fetchSession();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('❌ [VITALS] Error saving vitals:', err);
      toast.error('Error saving vitals');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Save therapy progress (addTherapyProgress in controller / updateProgressRealtime in service)
  // ─────────────────────────────────────────────────────────────
  const handleSaveProgress = async () => {
    if (!isTherapySession) {
      toast.error('Progress can only be updated for therapy sessions');
      return;
    }
    if (!progress.stage) {
      toast.error('Select a stage');
      return;
    }

    try {
      setIsSaving(true);
      const result = await therapistApiService.updateProgressRealtime(
        sessionId,
        progress.stage,
        progress.notes,
        progress.percentage
      );
      if (!result.success) {
        toast.error(result.error || 'Failed to save progress');
        return;
      }

      toast.success('Progress updated successfully');
      setProgress(prev => ({ ...prev, notes: '' }));
      await fetchSession();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('❌ [PROGRESS] Error saving progress:', err);
      toast.error('Error saving progress');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Add session note (addSessionNoteRealtime -> controller should push into sessionNotes)
  // ─────────────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!sessionNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setIsSaving(true);
      const result = await therapistApiService.addSessionNoteRealtime(
        sessionId,
        sessionNote,
        'general'
      );
      if (!result.success) {
        toast.error(result.error || 'Failed to add note');
        return;
      }

      toast.success('Note added successfully');
      setSessionNote('');
      await fetchSession();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('❌ [NOTES] Error adding note:', err);
      toast.error('Error adding note');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderVitalsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            Vitals
          </h3>
          {!isTherapySession && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Available only for therapy sessions
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blood pressure */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Blood Pressure (mmHg)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Systolic"
                value={vitals.bloodPressure.systolic}
                onChange={e =>
                  setVitals(prev => ({
                    ...prev,
                    bloodPressure: {
                      ...prev.bloodPressure,
                      systolic: e.target.value
                    }
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Diastolic"
                value={vitals.bloodPressure.diastolic}
                onChange={e =>
                  setVitals(prev => ({
                    ...prev,
                    bloodPressure: {
                      ...prev.bloodPressure,
                      diastolic: e.target.value
                    }
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pulse */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Pulse (bpm)
            </label>
            <input
              type="number"
              placeholder="72"
              value={vitals.pulse}
              onChange={e =>
                setVitals(prev => ({ ...prev, pulse: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Temperature
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={vitals.temperature}
              onChange={e =>
                setVitals(prev => ({ ...prev, temperature: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Oxygen saturation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-500" />
              Oxygen Saturation (%)
            </label>
            <input
              type="number"
              placeholder="98"
              value={vitals.oxygenSaturation}
              onChange={e =>
                setVitals(prev => ({
                  ...prev,
                  oxygenSaturation: e.target.value
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              placeholder="70"
              value={vitals.weight}
              onChange={e =>
                setVitals(prev => ({ ...prev, weight: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Respiratory rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Respiratory Rate (breaths/min)
            </label>
            <input
              type="number"
              placeholder="16"
              value={vitals.respiratoryRate}
              onChange={e =>
                setVitals(prev => ({
                  ...prev,
                  respiratoryRate: e.target.value
                }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSaveVitals}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Saving…' : 'Save Vitals'}
        </button>
      </div>
    );
  };

  const renderProgressTab = () => {
    const lastStage = therapyInfo?.currentStage;
    const lastPercent = therapyInfo?.progressPercentage ?? 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Therapy Progress
          </h3>
          {lastStage && (
            <span className="text-xs text-slate-500">
              Last stage: {lastStage} • {lastPercent}%
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stage
            </label>
            <select
              value={progress.stage}
              onChange={e =>
                setProgress(prev => ({ ...prev, stage: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select stage…</option>
              <option value="preparation">Preparation</option>
              <option value="massage">Massage</option>
              <option value="steam">Steam</option>
              <option value="rest">Rest</option>
              <option value="cleanup">Cleanup</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Progress: {progress.percentage}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress.percentage}
              onChange={e =>
                setProgress(prev => ({
                  ...prev,
                  percentage: parseInt(e.target.value, 10)
                }))
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              placeholder="Describe the current stage, patient response, etc."
              value={progress.notes}
              onChange={e =>
                setProgress(prev => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProgress}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Saving…' : 'Save Progress'}
        </button>
      </div>
    );
  };

  const renderNotesTab = () => {
    const sessionNotes = session?.sessionNotes || [];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Session Notes
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add note
            </label>
            <textarea
              rows={4}
              placeholder="Enter session note…"
              value={sessionNote}
              onChange={e => setSessionNote(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleAddNote}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Adding…' : 'Add Note'}
          </button>

          {sessionNotes.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Previous notes
              </h4>
              <div className="space-y-2">
                {sessionNotes
                  .slice()
                  .reverse()
                  .map((note, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                    >
                      <p className="text-sm text-slate-800">{note.note}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {note.timestamp
                          ? new Date(note.timestamp).toLocaleString()
                          : ''}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 animate-pulse" />
                    Track Live Session
                  </h2>
                  {session && (
                    <p className="text-xs text-emerald-100 mt-1">
                      Patient: {session.patientId?.name || session.patientName || 'Unknown'} •{' '}
                      {isTherapySession ? 'Therapy' : 'Consultation'} • Status:{' '}
                      {session.sessionStatus}
                    </p>
                  )}
                  {timing && (
                    <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Elapsed:{' '}
                      {timing.elapsedTime != null
                        ? `${Math.round(timing.elapsedTime / 60000)} min`
                        : 'N/A'}{' '}
                      • Progress: {timing.progressPercentage || 0}%
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-10">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Loading session…</p>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="border-b border-slate-200 px-6">
                  <div className="flex space-x-6">
                    <button
                      onClick={() => setActiveTab('vitals')}
                      className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'vitals'
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      Vitals
                    </button>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'progress'
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Progress
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'notes'
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Notes
                    </button>
                  </div>
                </div>

                {/* Tab body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {activeTab === 'vitals' && renderVitalsTab()}
                  {activeTab === 'progress' && renderProgressTab()}
                  {activeTab === 'notes' && renderNotesTab()}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrackLiveModal;
