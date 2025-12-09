import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Star, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Heart,
  Activity,
  Smile,
  Frown,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

const api = axios.create({
  baseURL: 'http://localhost:3003/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PatientFeedbackForm = ({ 
  sessionId, 
  providerId, 
  therapyType = 'panchakarma',
  sessionType = 'therapy_session',
  onSuccess 
}) => {
  const [form, setForm] = useState({
    // Ratings (1-5)
    overallSatisfaction: 0,
    treatmentEffectiveness: 0,
    patientCare: 0,
    facilityQuality: 0,
    therapistProfessionalism: 0,
    communicationQuality: 0,

    // Health Metrics (1-10 before/after)
    painBefore: 5,
    painAfter: 5,
    energyBefore: 5,
    energyAfter: 5,
    stressBefore: 5,
    stressAfter: 5,
    sleepBefore: 5,
    sleepAfter: 5,

    // Side Effects
    hasSideEffects: false,
    selectedSideEffects: [],

    // Text Feedback
    positiveAspects: '',
    concernsOrIssues: '',
    suggestions: '',

    // Recommendation
    recommendationScore: 8,
    wouldReturnForTreatment: true,
    wouldRecommendToOthers: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sideEffectOptions = [
    { value: 'fatigue', label: 'Fatigue' },
    { value: 'nausea', label: 'Nausea' },
    { value: 'headache', label: 'Headache' },
    { value: 'skin_irritation', label: 'Skin Irritation' },
    { value: 'dizziness', label: 'Dizziness' },
    { value: 'muscle_soreness', label: 'Muscle Soreness' },
    { value: 'other', label: 'Other' },
  ];

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  useEffect(() => {
    loadMyFeedback();
  }, []);

  const loadMyFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback/me');
      if (res.data.success) {
        setFeedbackList(res.data.data || []);
      }
    } catch (err) {
      console.error('Load feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!sessionId) {
      showError('Session information is missing');
      return false;
    }
    if (!providerId) {
      showError('Provider information is missing');
      return false;
    }
    if (form.overallSatisfaction === 0) {
      showError('Please rate your overall experience');
      return false;
    }
    if (!form.positiveAspects && !form.concernsOrIssues) {
      showError('Please share at least one comment about your experience');
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    return {
      sessionId,
      sessionType,
      providerId,
      therapyType,
      
      ratings: {
        overallSatisfaction: form.overallSatisfaction,
        treatmentEffectiveness: form.treatmentEffectiveness,
        patientCare: form.patientCare,
        facilityQuality: form.facilityQuality,
        therapistProfessionalism: form.therapistProfessionalism,
        communicationQuality: form.communicationQuality,
      },

      healthMetrics: {
        painLevel: { before: form.painBefore, after: form.painAfter },
        energyLevel: { before: form.energyBefore, after: form.energyAfter },
        stressLevel: { before: form.stressBefore, after: form.stressAfter },
        sleepQuality: { before: form.sleepBefore, after: form.sleepAfter },
      },

      sideEffects: form.hasSideEffects
        ? form.selectedSideEffects.map((type) => ({
            type,
            severity: 3,
            durationUnit: 'hours',
            description: '',
            resolved: false,
          }))
        : [],

      textFeedback: {
        positiveAspects: form.positiveAspects,
        concernsOrIssues: form.concernsOrIssues,
        suggestions: form.suggestions,
      },

      recommendationScore: form.recommendationScore,
      wouldReturnForTreatment: form.wouldReturnForTreatment,
      wouldRecommendToOthers: form.wouldRecommendToOthers,
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await api.post('/feedback', payload);
      
      if (res.data.success) {
        showSuccess('Thank you! Your feedback has been submitted successfully.');
        await loadMyFeedback();
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
      showError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      overallSatisfaction: 0,
      treatmentEffectiveness: 0,
      patientCare: 0,
      facilityQuality: 0,
      therapistProfessionalism: 0,
      communicationQuality: 0,
      painBefore: 5,
      painAfter: 5,
      energyBefore: 5,
      energyAfter: 5,
      stressBefore: 5,
      stressAfter: 5,
      sleepBefore: 5,
      sleepAfter: 5,
      hasSideEffects: false,
      selectedSideEffects: [],
      positiveAspects: '',
      concernsOrIssues: '',
      suggestions: '',
      recommendationScore: 8,
      wouldReturnForTreatment: true,
      wouldRecommendToOthers: true,
    });
  };

  const toggleSideEffect = (type) => {
    setForm((prev) => ({
      ...prev,
      selectedSideEffects: prev.selectedSideEffects.includes(type)
        ? prev.selectedSideEffects.filter((t) => t !== type)
        : [...prev.selectedSideEffects, type],
    }));
  };

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-7 h-7 ${
                n <= value
                  ? 'text-amber-500 fill-amber-400'
                  : 'text-gray-300 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {value === 0
          ? 'Not rated'
          : value === 1
          ? 'Poor'
          : value === 2
          ? 'Fair'
          : value === 3
          ? 'Good'
          : value === 4
          ? 'Very Good'
          : 'Excellent'}
      </p>
    </div>
  );

  const SliderMetric = ({ label, beforeValue, afterValue, onBeforeChange, onAfterChange, icon: Icon }) => (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-5 h-5 text-emerald-600" />}
        <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Before Session</span>
            <span className="text-sm font-bold text-gray-800">{beforeValue}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={beforeValue}
            onChange={(e) => onBeforeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">After Session</span>
            <span className="text-sm font-bold text-emerald-700">{afterValue}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={afterValue}
            onChange={(e) => onAfterChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Improvement indicator */}
        {afterValue !== beforeValue && (
          <div className="flex items-center gap-1 text-xs">
            {afterValue > beforeValue ? (
              <>
                <Smile className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Improved by {afterValue - beforeValue} points
                </span>
              </>
            ) : (
              <>
                <Frown className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  Decreased by {beforeValue - afterValue} points
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Alert Messages */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Feedback</h1>
              <p className="text-sm text-gray-600">Help us improve your care</p>
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Overall Experience</h2>
          <StarRating
            label="How satisfied are you with today's session?"
            value={form.overallSatisfaction}
            onChange={(v) => setForm({ ...form, overallSatisfaction: v })}
          />
        </div>

        {/* Detailed Ratings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Rate Your Experience</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <StarRating
              label="Treatment Effectiveness"
              value={form.treatmentEffectiveness}
              onChange={(v) => setForm({ ...form, treatmentEffectiveness: v })}
            />
            <StarRating
              label="Patient Care"
              value={form.patientCare}
              onChange={(v) => setForm({ ...form, patientCare: v })}
            />
            <StarRating
              label="Facility Quality"
              value={form.facilityQuality}
              onChange={(v) => setForm({ ...form, facilityQuality: v })}
            />
            <StarRating
              label="Therapist Professionalism"
              value={form.therapistProfessionalism}
              onChange={(v) => setForm({ ...form, therapistProfessionalism: v })}
            />
            <StarRating
              label="Communication Quality"
              value={form.communicationQuality}
              onChange={(v) => setForm({ ...form, communicationQuality: v })}
            />
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">How Do You Feel?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <SliderMetric
              label="Pain Level"
              icon={Heart}
              beforeValue={form.painBefore}
              afterValue={form.painAfter}
              onBeforeChange={(v) => setForm({ ...form, painBefore: v })}
              onAfterChange={(v) => setForm({ ...form, painAfter: v })}
            />
            <SliderMetric
              label="Energy Level"
              icon={Activity}
              beforeValue={form.energyBefore}
              afterValue={form.energyAfter}
              onBeforeChange={(v) => setForm({ ...form, energyBefore: v })}
              onAfterChange={(v) => setForm({ ...form, energyAfter: v })}
            />
            <SliderMetric
              label="Stress Level"
              beforeValue={form.stressBefore}
              afterValue={form.stressAfter}
              onBeforeChange={(v) => setForm({ ...form, stressBefore: v })}
              onAfterChange={(v) => setForm({ ...form, stressAfter: v })}
            />
            <SliderMetric
              label="Sleep Quality"
              beforeValue={form.sleepBefore}
              afterValue={form.sleepAfter}
              onBeforeChange={(v) => setForm({ ...form, sleepBefore: v })}
              onAfterChange={(v) => setForm({ ...form, sleepAfter: v })}
            />
          </div>
        </div>

        {/* Side Effects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Side Effects</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3">Did you experience any side effects?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, hasSideEffects: false, selectedSideEffects: [] })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  !form.hasSideEffects
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                No Side Effects
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, hasSideEffects: true })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.hasSideEffects
                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Yes, I experienced side effects
              </button>
            </div>
          </div>

          {form.hasSideEffects && (
            <div>
              <p className="text-sm text-gray-700 mb-3">Select all that apply:</p>
              <div className="flex flex-wrap gap-2">
                {sideEffectOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSideEffect(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.selectedSideEffects.includes(option.value)
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Feedback */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Share Your Thoughts</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What went well? What improvements did you notice?
              </label>
              <textarea
                rows={3}
                value={form.positiveAspects}
                onChange={(e) => setForm({ ...form, positiveAspects: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                placeholder="E.g., Pain reduced significantly, felt more relaxed, better sleep..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any concerns or areas for improvement?
              </label>
              <textarea
                rows={3}
                value={form.concernsOrIssues}
                onChange={(e) => setForm({ ...form, concernsOrIssues: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                placeholder="E.g., Waiting time, room temperature, treatment explanation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggestions (optional)
              </label>
              <textarea
                rows={2}
                value={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                placeholder="Any suggestions to help us serve you better..."
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-800">
                Would you return for further treatment?
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wouldReturnForTreatment}
                  onChange={(e) => setForm({ ...form, wouldReturnForTreatment: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-800">
                Would you recommend us to others?
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wouldRecommendToOthers}
                  onChange={(e) => setForm({ ...form, wouldRecommendToOthers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How likely are you to recommend us? (0-10)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={form.recommendationScore}
                  onChange={(e) => setForm({ ...form, recommendationScore: Number(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-2xl font-bold text-emerald-700 w-12 text-center">
                  {form.recommendationScore}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not Likely</span>
                <span>Very Likely</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>

      {/* Previous Feedback */}
      {feedbackList.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Previous Feedback</h2>
          <div className="space-y-3">
            {feedbackList.slice(0, 5).map((fb) => (
              <div
                key={fb._id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 capitalize">
                        {fb.therapyType?.replace('_', ' ')}
                      </span>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="text-sm font-bold text-gray-700">
                          {fb.ratings?.overallSatisfaction || 0}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(fb.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {fb.wouldRecommendToOthers && (
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      fb.status === 'reviewed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {fb.status || 'submitted'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientFeedbackForm;
