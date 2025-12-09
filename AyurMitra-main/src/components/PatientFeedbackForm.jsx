import React, { useState } from 'react';
import { Star, Loader2, TrendingUp, TrendingDown, Minus, Heart, Zap, Activity, MessageSquare, ThumbsUp, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const MinimalPatientFeedback = ({
  sessionId = 'demo-session',
  providerId = 'demo-provider',
  therapyType = 'panchakarma',
  sessionType = 'therapy_session',
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    overallSatisfaction: 0,
    painBefore: 5,
    painAfter: 5,
    energyBefore: 5,
    energyAfter: 5,
    positiveAspects: '',
    concernsOrIssues: '',
    recommendationScore: 8,
    wouldReturnForTreatment: true,
    wouldRecommendToOthers: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalSteps = 5;

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return form.overallSatisfaction > 0;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return form.positiveAspects.trim() || form.concernsOrIssues.trim();
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (currentStep === 0) {
        showError('Please rate your overall experience');
      } else if (currentStep === 3) {
        showError('Please share at least one comment');
      }
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      showError('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showSuccess('Thank you for your valuable feedback!');
      if (onSuccess) onSuccess();
    } catch (err) {
      showError('Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }) => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-2 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-14 h-14 transition-all ${
                n <= value
                  ? 'text-amber-500 fill-amber-400 drop-shadow-lg'
                  : 'text-slate-300 hover:text-slate-400'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-900">
          {value === 0 ? 'Tap a star above' : 
           value === 1 ? 'Poor' :
           value === 2 ? 'Fair' :
           value === 3 ? 'Good' :
           value === 4 ? 'Very Good' : 'Excellent'}
        </p>
        {value > 0 && (
          <p className="text-sm text-slate-500 mt-1">{value} out of 5 stars</p>
        )}
      </div>
    </div>
  );

  const getChangeIcon = (before, after) => {
    const diff = after - before;
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    if (diff < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getChangeText = (before, after) => {
    const diff = after - before;
    if (diff > 0) return `Improved by ${diff}`;
    if (diff < 0) return `Increased by ${Math.abs(diff)}`;
    return 'No change';
  };

  const PhysiologicalCard = ({ label, beforeKey, afterKey, icon: Icon, inverse = false, description }) => {
    const diff = form[afterKey] - form[beforeKey];
    const improved = inverse ? diff < 0 : diff > 0;
    
    return (
      <div className="space-y-4 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900">{label} Level</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50">
          {getChangeIcon(form[beforeKey], form[afterKey])}
          <span className={`text-base font-semibold ${
            improved ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-500'
          }`}>
            {inverse ? getChangeText(form[afterKey], form[beforeKey]) : getChangeText(form[beforeKey], form[afterKey])}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Before Session
            </label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={form[beforeKey]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [beforeKey]: Number(e.target.value) }))
                }
                className="w-full h-3 rounded-full bg-slate-200 appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(form[beforeKey] - 1) * 11.11}%, #e2e8f0 ${(form[beforeKey] - 1) * 11.11}%, #e2e8f0 100%)`
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400 font-medium">Low</span>
                <span className="text-xs text-slate-400 font-medium">High</span>
              </div>
              <div className="mt-3 text-center">
                <span className="text-3xl font-bold text-blue-600">{form[beforeKey]}</span>
                <span className="text-slate-400 text-lg">/10</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              After Session
            </label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={form[afterKey]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [afterKey]: Number(e.target.value) }))
                }
                className="w-full h-3 rounded-full bg-slate-200 appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(form[afterKey] - 1) * 11.11}%, #e2e8f0 ${(form[afterKey] - 1) * 11.11}%, #e2e8f0 100%)`
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400 font-medium">Low</span>
                <span className="text-xs text-slate-400 font-medium">High</span>
              </div>
              <div className="mt-3 text-center">
                <span className="text-3xl font-bold text-emerald-600">{form[afterKey]}</span>
                <span className="text-slate-400 text-lg">/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getNPSCategory = (score) => {
    if (score >= 9) return { label: 'Promoter', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 7) return { label: 'Passive', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { label: 'Detractor', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const npsCategory = getNPSCategory(form.recommendationScore);

  const ProgressBar = () => (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <div
          key={idx}
          className={`h-2 rounded-full flex-1 transition-all duration-300 ${
            idx <= currentStep
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8 p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
                <Star className="w-10 h-10 text-white fill-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Overall Experience
              </h2>
              <p className="text-slate-600">
                How would you rate your session today?
              </p>
            </div>
            <StarRating
              value={form.overallSatisfaction}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, overallSatisfaction: v }))
              }
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-500 mb-4 shadow-lg">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Pain Assessment
              </h2>
              <p className="text-slate-600">
                Help us track your pain levels
              </p>
            </div>
            <PhysiologicalCard 
              label="Pain" 
              beforeKey="painBefore" 
              afterKey="painAfter" 
              icon={Activity}
              inverse={true}
              description="Rate your pain level before and after"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Energy Assessment
              </h2>
              <p className="text-slate-600">
                How are your energy levels?
              </p>
            </div>
            <PhysiologicalCard 
              label="Energy" 
              beforeKey="energyBefore" 
              afterKey="energyAfter" 
              icon={Zap}
              description="Rate your energy level before and after"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mb-4 shadow-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Your Feedback
              </h2>
              <p className="text-slate-600">
                Share your thoughts with us
              </p>
            </div>

            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-lg space-y-3">
                <label className="flex items-center gap-3 text-base font-semibold text-slate-900">
                  <div className="p-2 rounded-xl bg-emerald-100">
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  What worked well for you?
                </label>
                <textarea
                  value={form.positiveAspects}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      positiveAspects: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all resize-none"
                  placeholder="The therapist was attentive and professional. The environment was calming..."
                  rows="3"
                />
              </div>

              <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-lg space-y-3">
                <label className="flex items-center gap-3 text-base font-semibold text-slate-900">
                  <div className="p-2 rounded-xl bg-blue-100">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  What could we improve?
                </label>
                <textarea
                  value={form.concernsOrIssues}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      concernsOrIssues: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
                  placeholder="Any suggestions or areas for improvement..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 mb-4 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Final Step
              </h2>
              <p className="text-slate-600">
                Would you recommend us?
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-slate-900">
                    Likelihood to Recommend
                  </label>
                  <div className={`px-4 py-2 rounded-full border-2 ${npsCategory.border} ${npsCategory.bg}`}>
                    <span className={`text-sm font-bold ${npsCategory.color}`}>
                      {npsCategory.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 font-semibold">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={form.recommendationScore}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        recommendationScore: Number(e.target.value),
                      }))
                    }
                    className="flex-1 h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <span className="text-sm text-slate-500 font-semibold">10</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50">
                  <span className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {form.recommendationScore}
                  </span>
                  <span className="text-2xl text-slate-400">/10</span>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-slate-100 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Future Intentions
                </h3>
                <label className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group">
                  <span className="text-base font-medium text-slate-700 group-hover:text-emerald-700">
                    I would like to continue similar sessions
                  </span>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    form.wouldReturnForTreatment 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'border-slate-300'
                  }`}>
                    {form.wouldReturnForTreatment && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.wouldReturnForTreatment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        wouldReturnForTreatment: e.target.checked,
                      }))
                    }
                    className="hidden"
                  />
                </label>
                <label className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group">
                  <span className="text-base font-medium text-slate-700 group-hover:text-emerald-700">
                    I would recommend this center to others
                  </span>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    form.wouldRecommendToOthers 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'border-slate-300'
                  }`}>
                    {form.wouldRecommendToOthers && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.wouldRecommendToOthers}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        wouldRecommendToOthers: e.target.checked,
                      }))
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 px-6 py-4 text-base font-semibold text-emerald-800 shadow-lg flex items-center gap-3">
            <Check className="w-6 h-6" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-300 px-6 py-4 text-base font-semibold text-red-800 shadow-lg">
            ⚠ {error}
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Session Feedback</h1>
          <p className="text-slate-600">Step {currentStep + 1} of {totalSteps}</p>
        </div>

        <ProgressBar />

        <div className="mb-8">
          {renderStep()}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-4 rounded-2xl bg-white border-2 border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalPatientFeedback;