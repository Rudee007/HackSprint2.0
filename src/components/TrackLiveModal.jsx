// src/components/TrackLiveModal.jsx
// 🔥 PRODUCTION-READY TRACK LIVE MODAL - 3 TABS: VITALS, PROGRESS, NOTES

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Activity, Heart, Droplet, Wind, Thermometer,
  Clock, TrendingUp, FileText, Save, Stethoscope, Loader2
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast } from 'react-hot-toast';

const TrackLiveModal = ({ sessionId, isOpen, onClose, onUpdate }) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vitals'); // vitals, progress, notes
  const [isSaving, setIsSaving] = useState(false);
  
  // Vitals State
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    notes: ''
  });
  
  // Progress State
  const [progress, setProgress] = useState({
    stage: '',
    percentage: 0,
    notes: ''
  });
  
  // Session Notes
  const [sessionNote, setSessionNote] = useState('');
  
  const mountedRef = useRef(true);

  // ═══════════════════════════════════════════════════════════
  // FETCH SESSION DATA
  // ═══════════════════════════════════════════════════════════
  const fetchSession = useCallback(async () => {
    if (!sessionId || !isOpen) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 [TRACK LIVE MODAL] Fetching session:', sessionId);
      
      const result = await therapistApiService.getRealtimeSessionDetails(sessionId);
      
      if (result.success && result.data) {
        setSession(result.data.consultation || result.data);
        console.log('✅ [TRACK LIVE MODAL] Session loaded');
      } else {
        toast.error('Failed to load session');
        onClose();
      }
    } catch (error) {
      console.error('❌ [TRACK LIVE MODAL] Error:', error);
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

  // ═══════════════════════════════════════════════════════════
  // ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  const handleSaveVitals = async () => {
    try {
      setIsSaving(true);
      console.log('💓 [VITALS] Saving vitals...');
      
      const result = await therapistApiService.updateVitalsRealtime(sessionId, vitals);
      
      if (result.success) {
        toast.success('✅ Vitals saved successfully!');
        
        // Reset form
        setVitals({
          bloodPressure: { systolic: '', diastolic: '' },
          heartRate: '',
          temperature: '',
          oxygenLevel: '',
          notes: ''
        });
        
        await fetchSession();
        if (onUpdate) onUpdate();
      } else {
        if (result.error?.includes('only be updated for therapy')) {
          toast.error('⚠️ Vitals can only be recorded for therapy sessions');
        } else {
          toast.error(result.error || 'Failed to save vitals');
        }
      }
    } catch (error) {
      console.error('❌ Save vitals error:', error);
      
      if (error.message?.includes('only be updated for therapy')) {
        toast.error('⚠️ This session type does not support vitals recording');
      } else {
        toast.error('Error saving vitals');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    try {
      setIsSaving(true);
      console.log('📈 [PROGRESS] Saving progress...');
      
      const result = await therapistApiService.updateProgressRealtime(
        sessionId,
        progress.stage,
        progress.notes,
        progress.percentage
      );
      
      if (result.success) {
        toast.success('✅ Progress saved successfully!');
        
        // Reset form
        setProgress({
          stage: '',
          percentage: 0,
          notes: ''
        });
        
        await fetchSession();
        if (onUpdate) onUpdate();
      } else {
        toast.error(result.error || 'Failed to save progress');
      }
    } catch (error) {
      console.error('❌ Save progress error:', error);
      toast.error('Error saving progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!sessionNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('📝 [NOTE] Adding note...');
      
      const result = await therapistApiService.addSessionNoteRealtime(sessionId, sessionNote, 'general');
      
      if (result.success) {
        toast.success('✅ Note added successfully!');
        setSessionNote('');
        await fetchSession();
        if (onUpdate) onUpdate();
      } else {
        toast.error(result.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('❌ Add note error:', error);
      toast.error('Error adding note');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Activity className="w-7 h-7 animate-pulse" />
                  Track Live Session
                </h2>
                {session && (
                  <p className="text-teal-100 mt-1">
                    Patient: {session.patientName || 'Unknown'} • Room: {session.roomNumber || 'N/A'}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading session...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex space-x-6">
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className={`py-4 px-2 font-medium transition-all ${
                      activeTab === 'vitals'
                        ? 'text-teal-600 border-b-2 border-teal-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Heart className="w-5 h-5 inline mr-2" />
                    Vitals
                  </button>
                  <button
                    onClick={() => setActiveTab('progress')}
                    className={`py-4 px-2 font-medium transition-all ${
                      activeTab === 'progress'
                        ? 'text-teal-600 border-b-2 border-teal-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Progress
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`py-4 px-2 font-medium transition-all ${
                      activeTab === 'notes'
                        ? 'text-teal-600 border-b-2 border-teal-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-5 h-5 inline mr-2" />
                    Notes
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* VITALS TAB */}
                {activeTab === 'vitals' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                      Record Vitals
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Blood Pressure */}
                      <div className="col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Pressure (mmHg)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Systolic"
                            value={vitals.bloodPressure.systolic}
                            onChange={(e) => setVitals({
                              ...vitals,
                              bloodPressure: { ...vitals.bloodPressure, systolic: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            placeholder="Diastolic"
                            value={vitals.bloodPressure.diastolic}
                            onChange={(e) => setVitals({
                              ...vitals,
                              bloodPressure: { ...vitals.bloodPressure, diastolic: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Heart Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Heart Rate (bpm)
                        </label>
                        <input
                          type="number"
                          placeholder="72"
                          value={vitals.heartRate}
                          onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Temperature */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-orange-500" />
                          Temperature (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="98.6"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Oxygen Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Wind className="w-4 h-4 text-blue-500" />
                          Oxygen Level (%)
                        </label>
                        <input
                          type="number"
                          placeholder="98"
                          value={vitals.oxygenLevel}
                          onChange={(e) => setVitals({ ...vitals, oxygenLevel: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          placeholder="Additional observations..."
                          value={vitals.notes}
                          onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveVitals}
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Vitals'}
                    </button>
                  </div>
                )}

                {/* PROGRESS TAB */}
                {activeTab === 'progress' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      Update Progress
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Stage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Stage
                        </label>
                        <select
                          value={progress.stage}
                          onChange={(e) => setProgress({ ...progress, stage: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Select stage...</option>
                          <option value="preparation">Preparation</option>
                          <option value="main_treatment">Main Treatment</option>
                          <option value="observation">Observation</option>
                          <option value="completion">Completion</option>
                        </select>
                      </div>

                      {/* Percentage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Progress: {progress.percentage}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress.percentage}
                          onChange={(e) => setProgress({ ...progress, percentage: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Progress Notes
                        </label>
                        <textarea
                          placeholder="Describe the progress..."
                          value={progress.notes}
                          onChange={(e) => setProgress({ ...progress, notes: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProgress}
                      disabled={isSaving}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Progress'}
                    </button>
                  </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      Session Notes
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Note
                        </label>
                        <textarea
                          placeholder="Enter session note..."
                          value={sessionNote}
                          onChange={(e) => setSessionNote(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        onClick={handleAddNote}
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {isSaving ? 'Adding...' : 'Add Note'}
                      </button>

                      {/* Display existing notes */}
                      {session?.therapyData?.sessionNotes?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Notes:</h4>
                          <div className="space-y-2">
                            {session.therapyData.sessionNotes.map((note, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-700">{note.note}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(note.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrackLiveModal;
