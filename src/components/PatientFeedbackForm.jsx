import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, CheckCircle, Clock, Heart, Brain, 
  Utensils, Moon, Activity, Phone, Send, Loader2,
  Star, MessageSquare, Shield, TrendingUp, ChevronRight,
  User, Calendar, Stethoscope, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PatientFeedbackForm = ({ 
  patientId, 
  session = {}, 
  onUrgent, 
  useMock = false 
}) => {
  const [formData, setFormData] = useState({
    overallFeeling: '',
    symptomRatings: {
      pain: 3,
      energy: 3,
      sleep: 3,
      appetite: 3,
      mood: 3,
      mainComplaintSeverity: 3
    },
    mainComplaint: '',
    sideEffects: {
      dizziness: false,
      nausea: false,
      headache: false,
      chestPain: false,
      fever: false,
      other: { present: false, text: '' }
    },
    adherence: {
      diet: '',
      medicines: '',
      avoidedWork: ''
    },
    beforeAfter: {
      before: null,
      after: null
    },
    satisfaction: '',
    comments: '',
    consent: false
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [urgent, setUrgent] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [showTooltip, setShowTooltip] = useState(null);

  const extractFeedbackPayload = (state) => {
    const isUrgent = state.sideEffects.chestPain || 
                    (state.sideEffects.nausea && state.symptomRatings.pain >= 4) ||
                    state.sideEffects.fever;
    
    return {
      patientId,
      sessionId: session.sessionId || null,
      therapyType: session.therapyType || null,
      date: session.date || new Date().toISOString().split('T')[0],
      overallFeeling: state.overallFeeling,
      symptomRatings: state.symptomRatings,
      mainComplaint: state.mainComplaint,
      sideEffects: state.sideEffects,
      adherence: state.adherence,
      beforeAfter: state.beforeAfter,
      satisfaction: state.satisfaction,
      comments: state.comments,
      urgent: isUrgent,
      createdAt: new Date().toISOString()
    };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.overallFeeling) newErrors.overallFeeling = 'Required';
    if (!formData.consent) newErrors.consent = 'Must confirm accuracy';
    if (formData.mainComplaint && !formData.symptomRatings.mainComplaintSeverity) {
      newErrors.mainComplaintSeverity = 'Rate severity if complaint provided';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = extractFeedbackPayload(formData);
    
    if (payload.urgent) {
      setUrgent(true);
      onUrgent?.(payload);
    }

    setLoading(true);
    try {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 600));
        console.log('Mock submission:', payload);
      } else {
        await axios.post('/api/feedback', payload, {
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${token}`
          }
        });
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const RatingScale = ({ label, icon: Icon, value, onChange, error }) => (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
    >
      <label className="flex items-center gap-3 font-medium text-gray-700 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        {label}
      </label>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(num => (
          <motion.button
            key={num}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${
              value === num 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg' 
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 bg-white'
            }`}
          >
            {num}
          </motion.button>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}
    </motion.div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border border-green-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-green-800 mb-3">Feedback Submitted Successfully!</h2>
            <p className="text-green-700 text-lg mb-6">Thank you for helping us improve your treatment experience.</p>
            <div className="w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="absolute left-0 top-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-200 text-gray-700 hover:text-emerald-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>
          
          {/* Header Content */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
              Session Feedback
            </h1>
            <p className="text-gray-600 text-lg mb-6">Help us improve your Ayurvedic treatment experience</p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-600">Progress</span>
                <span className="text-sm font-medium text-emerald-600">{Math.round((completedSections.size / 6) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSections.size / 6) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Urgent Alert */}
        <AnimatePresence>
          {urgent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Urgent: Contact Your Healthcare Provider</h3>
                  <p className="text-red-100">Based on your symptoms, please contact the center immediately.</p>
                </div>
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="tel:+1234567890" 
                  className="bg-white text-red-600 px-6 py-3 rounded-xl hover:bg-red-50 flex items-center gap-2 font-semibold shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 space-y-8 border-r border-gray-100">
              {/* Overall Feeling */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`space-y-4 p-6 rounded-2xl border-2 transition-all ${completedSections.has('overall') ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Heart className="w-5 h-5 text-emerald-600" />
                    </div>
                    <label className="text-lg font-semibold text-gray-800">Overall Feeling *</label>
                  </div>
                  {completedSections.has('overall') && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">💡 How do you feel compared to before your treatment?</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'much_better', label: '🌟 Much better', desc: 'Significant improvement' },
                    { value: 'slightly_better', label: '😊 Slightly better', desc: 'Some improvement' },
                    { value: 'same', label: '😐 Same as before', desc: 'No change' },
                    { value: 'slightly_worse', label: '😕 Slightly worse', desc: 'Some decline' },
                    { value: 'much_worse', label: '😰 Much worse', desc: 'Significant decline' }
                  ].map(option => (
                    <motion.label 
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.overallFeeling === option.value 
                          ? 'border-emerald-400 bg-emerald-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-25'
                      }`}
                    >
                      <input
                        type="radio"
                        name="overallFeeling"
                        value={option.value}
                        checked={formData.overallFeeling === option.value}
                        onChange={(e) => {
                          updateFormData('overallFeeling', e.target.value);
                          setCompletedSections(prev => new Set([...prev, 'overall']));
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </div>
                      {formData.overallFeeling === option.value && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    </motion.label>
                  ))}
                </div>
                {errors.overallFeeling && <p className="text-red-500 text-sm font-medium">{errors.overallFeeling}</p>}
              </motion.div>

              {/* Symptom Ratings */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Rate Your Symptoms</h3>
                </div>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">Rate each aspect from 1 (Poor) to 5 (Excellent)</p>
                <RatingScale 
                  label="Pain/Discomfort" 
                  icon={AlertTriangle}
                  value={formData.symptomRatings.pain}
                  onChange={(v) => updateFormData('symptomRatings.pain', v)}
                />
                <RatingScale 
                  label="Energy/Fatigue" 
                  icon={Activity}
                  value={formData.symptomRatings.energy}
                  onChange={(v) => updateFormData('symptomRatings.energy', v)}
                />
                <RatingScale 
                  label="Sleep Quality" 
                  icon={Moon}
                  value={formData.symptomRatings.sleep}
                  onChange={(v) => updateFormData('symptomRatings.sleep', v)}
                />
                <RatingScale 
                  label="Appetite/Digestion" 
                  icon={Utensils}
                  value={formData.symptomRatings.appetite}
                  onChange={(v) => updateFormData('symptomRatings.appetite', v)}
                />
                <RatingScale 
                  label="Mood/Stress" 
                  icon={Brain}
                  value={formData.symptomRatings.mood}
                  onChange={(v) => updateFormData('symptomRatings.mood', v)}
                />
              </div>

              {/* Main Complaint */}
              <div className="space-y-3">
                <label className="font-medium text-gray-700">Main Complaint</label>
                <input
                  type="text"
                  value={formData.mainComplaint}
                  onChange={(e) => updateFormData('mainComplaint', e.target.value)}
                  placeholder="e.g., Lower back pain"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                {formData.mainComplaint && (
                  <RatingScale 
                    label="Main Complaint Severity" 
                    icon={TrendingUp}
                    value={formData.symptomRatings.mainComplaintSeverity}
                    onChange={(v) => updateFormData('symptomRatings.mainComplaintSeverity', v)}
                    error={errors.mainComplaintSeverity}
                  />
                )}
              </div>

              {/* Side Effects */}
              <motion.div 
                className={`space-y-4 p-6 rounded-2xl border-2 transition-all ${completedSections.has('sideEffects') ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Side Effects / Warning Signs</h3>
                  </div>
                  {completedSections.has('sideEffects') && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">⚠️ Please check any symptoms you experienced during or after treatment</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'dizziness', label: '🌀 Dizziness', severity: 'normal' },
                    { key: 'nausea', label: '🤢 Nausea/Vomiting', severity: 'normal' },
                    { key: 'headache', label: '🤕 Severe headache', severity: 'normal' },
                    { key: 'chestPain', label: '💔 Chest pain/Breathing difficulty', severity: 'urgent' },
                    { key: 'fever', label: '🌡️ Fever/Chills', severity: 'urgent' }
                  ].map(({ key, label, severity }) => (
                    <motion.label 
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.sideEffects[key] 
                          ? severity === 'urgent' ? 'border-red-400 bg-red-50' : 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.sideEffects[key]}
                        onChange={(e) => {
                          updateFormData(`sideEffects.${key}`, e.target.checked);
                          setCompletedSections(prev => new Set([...prev, 'sideEffects']));
                        }}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className={`ml-3 font-medium ${
                        severity === 'urgent' ? 'text-red-700' : 'text-gray-700'
                      }`}>{label}</span>
                      {severity === 'urgent' && formData.sideEffects[key] && (
                        <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">URGENT</span>
                      )}
                    </motion.label>
                  ))}
                  
                  <motion.label 
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.sideEffects.other.present 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.sideEffects.other.present}
                      onChange={(e) => updateFormData('sideEffects.other.present', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-3 font-medium text-gray-700">📝 Other symptoms</span>
                  </motion.label>
                  
                  <AnimatePresence>
                    {formData.sideEffects.other.present && (
                      <motion.input
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        type="text"
                        value={formData.sideEffects.other.text}
                        onChange={(e) => updateFormData('sideEffects.other.text', e.target.value)}
                        placeholder="Please describe any other symptoms you experienced..."
                        className="w-full p-4 border-2 border-blue-200 rounded-xl bg-blue-50 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white">
              {/* Adherence */}
              <motion.div 
                className={`space-y-6 p-6 rounded-2xl border-2 transition-all ${completedSections.has('adherence') ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Treatment Adherence</h3>
                  </div>
                  {completedSections.has('adherence') && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">📋 How well did you follow the prescribed guidelines?</p>
                
                {[
                  { key: 'diet', label: '🥗 Followed prescribed diet?', icon: '🍽️' },
                  { key: 'medicines', label: '💊 Took prescribed medicines?', icon: '💉' },
                  { key: 'avoidedWork', label: '🛌 Avoided heavy work/exercise?', icon: '🏃‍♂️' }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-3">
                    <label className="flex items-center gap-2 font-medium text-gray-700">
                      <span className="text-lg">{icon}</span>
                      {label}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'yes', label: '✅ Yes', color: 'green' },
                        { value: 'partly', label: '⚠️ Partly', color: 'yellow' },
                        { value: 'no', label: '❌ No', color: 'red' }
                      ].map(option => (
                        <motion.label 
                          key={option.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.adherence[key] === option.value
                              ? `border-${option.color}-400 bg-${option.color}-50 shadow-md`
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={key}
                            value={option.value}
                            checked={formData.adherence[key] === option.value}
                            onChange={(e) => {
                              updateFormData(`adherence.${key}`, e.target.value);
                              const allAnswered = ['diet', 'medicines', 'avoidedWork'].every(k => 
                                k === key ? e.target.value : formData.adherence[k]
                              );
                              if (allAnswered) setCompletedSections(prev => new Set([...prev, 'adherence']));
                            }}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-center">{option.label}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Before/After */}
              {formData.mainComplaint && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Improvement in Main Problem (0-10)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Before Treatment</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.beforeAfter.before || ''}
                        onChange={(e) => updateFormData('beforeAfter.before', parseInt(e.target.value) || null)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">After Treatment</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.beforeAfter.after || ''}
                        onChange={(e) => updateFormData('beforeAfter.after', parseInt(e.target.value) || null)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Satisfaction */}
              <div className="space-y-3">
                <label className="font-medium text-gray-700">Session Satisfaction</label>
                <select
                  value={formData.satisfaction}
                  onChange={(e) => updateFormData('satisfaction', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="very_satisfied">Very satisfied</option>
                  <option value="satisfied">Satisfied</option>
                  <option value="neutral">Neutral</option>
                  <option value="unsatisfied">Unsatisfied</option>
                </select>
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <label className="font-medium text-gray-700">Additional Comments</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => updateFormData('comments', e.target.value)}
                  rows={4}
                  placeholder="Any additional feedback or concerns..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Consent */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-2xl border-2 transition-all ${formData.consent ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <motion.label 
                  className="flex items-start gap-4 cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => updateFormData('consent', e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">📝 Accuracy Confirmation *</span>
                    <p className="text-sm text-gray-600 mt-1">I confirm that all the information provided in this feedback is accurate and reflects my actual experience during the treatment session.</p>
                  </div>
                  {formData.consent && <CheckCircle className="w-6 h-6 text-green-500 mt-1" />}
                </motion.label>
                {errors.consent && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm font-medium mt-2 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.consent}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-8 rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-3 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <span>Submit Feedback</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PatientFeedbackForm;