import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Heart,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Smile,
  Meh,
  Frown,
} from "lucide-react";

/**
 * NOTE: This file focuses only on UI/UX polish. No feature, logic, or API
 * behavior was changed. I improved visual hierarchy, spacing, accessibility
 * hints, and subtle motion for a more modern feel.
 */

function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const isSecure = window.location.protocol === "https:" || isLocalhost;
    setSupported(!!SpeechRecognition && isSecure);
  }, []);

  const _cleanupRecognition = (instance) => {
    if (!instance) return;
    try {
      if (typeof instance.stop === "function") instance.stop();
      else if (typeof instance.abort === "function") instance.abort();
    } catch (e) {}
    try {
      instance.onresult = null;
      instance.onerror = null;
      instance.onstart = null;
      instance.onend = null;
    } catch (e) {}
  };

  const start = async (onResult) => {
    setError(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("SpeechRecognition API not available in this browser.");
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const isSecure = window.location.protocol === "https:" || isLocalhost;
    if (!isSecure) {
      setError("Speech recognition requires HTTPS or localhost.");
      return;
    }

    if (recognitionRef.current) {
      _cleanupRecognition(recognitionRef.current);
      recognitionRef.current = null;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err) {
      console.error("getUserMedia preflight failed:", err);
      setError(
        err && err.name === "NotAllowedError"
          ? "Microphone permission denied. Allow microphone access and try again."
          : "Microphone permission check failed. Make sure your browser supports getUserMedia and allow access."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript && typeof onResult === "function") {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      const code = event && event.error ? event.error : "unknown";
      console.error("Speech recognition error:", code, event);

      if (code === "not-allowed" || code === "permission_denied") {
        setError(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (code === "service-not-allowed") {
        setError(
          "Speech service is blocked. Check browser settings or extensions."
        );
      } else if (code === "network") {
        setError("Network error with speech recognition service.");
      } else if (code === "no-speech") {
        setError("No speech detected. Try speaking more clearly.");
      } else {
        setError(`Speech error: ${code}`);
      }

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError(
        err && err.message
          ? `Failed to start microphone: ${err.message}`
          : "Failed to start microphone. Check permissions and try again."
      );
      setListening(false);
      _cleanupRecognition(recognition);
      recognitionRef.current = null;
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      _cleanupRecognition(recognitionRef.current);
      recognitionRef.current = null;
    }
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        _cleanupRecognition(recognitionRef.current);
        recognitionRef.current = null;
      }
    };
  }, []);

  return { supported, listening, start, stop, error };
}

function SpeechTextArea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  helper,
}) {
  const { supported, listening, start, stop, error } = useSpeechRecognition();
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);

  const quickPhrases = [
    "I feel much better today",
    "The pain has reduced significantly",
    "I experienced some mild discomfort",
    "The treatment was very effective",
    "I had trouble sleeping",
    "My energy levels have improved",
  ];

  const handleToggle = async () => {
    if (!supported) {
      setShowQuickPhrases((s) => !s);
      return;
    }

    if (listening) {
      stop();
      return;
    }

    await start((transcript) => {
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue);
    });
  };

  const addQuickPhrase = (phrase) => {
    const newValue = value ? `${value} ${phrase}` : phrase;
    onChange(newValue);
    setShowQuickPhrases(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-800">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          rows={rows}
          className="w-full border rounded-2xl px-4 py-3 pr-14 resize-y text-sm sm:text-base bg-white/95 shadow-sm border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            aria-pressed={listening}
            aria-label={
              supported
                ? listening
                  ? "Stop voice input"
                  : "Start voice input"
                : "Quick phrases"
            }
            className={`p-2 rounded-md shadow-sm transition-transform transform ${
              listening
                ? "scale-105 bg-red-50 text-red-600"
                : supported
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
            }`}
            title={
              supported
                ? listening
                  ? "Stop voice input"
                  : "Start voice input"
                : "Quick phrases"
            }
          >
            {listening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQuickPhrases((s) => !s)}
            className="hidden sm:inline-block text-xs px-3 py-2 rounded-md bg-slate-50 border border-slate-100 shadow-sm hover:bg-slate-100"
          >
            Phrases
          </button>
        </div>
      </div>

      {showQuickPhrases && !supported && (
        <div className="mt-2 bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-slate-600 mb-2">Quick phrases</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPhrases.map((phrase, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addQuickPhrase(phrase)}
                className="text-xs text-left p-2 rounded-md hover:bg-emerald-50"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {helper && <p className="text-xs text-slate-500">{helper}</p>}

      {!supported && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Click microphone for quick phrases
          (Speech recognition requires HTTPS or localhost)
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {String(error)}
        </p>
      )}
    </div>
  );
}

export default function PatientFeedbackForm() {
  const [feel, setFeel] = useState("");
  const [symptomRating, setSymptomRating] = useState(5);
  const [sideEffectYN, setSideEffectYN] = useState("");
  const [sideEffects, setSideEffects] = useState([]);
  const [sideEffectDetails, setSideEffectDetails] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sideEffectYN !== "yes") {
      setSideEffects([]);
      setSideEffectDetails("");
    }
  }, [sideEffectYN]);

  const toggleSideEffect = (name) => {
    setSideEffects((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!feel) {
      setError("Please select how you feel today.");
      return;
    }
    if (!symptomRating) {
      setError("Please rate your symptoms.");
      return;
    }
    if (!sideEffectYN) {
      setError("Please let us know if you had any side effects.");
      return;
    }
    if (
      sideEffectYN === "yes" &&
      sideEffects.length === 0 &&
      sideEffectDetails.trim().length === 0
    ) {
      setError("Please select at least one side effect or describe it.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        feel,
        symptomRating: Number(symptomRating),
        sideEffectYN,
        sideEffects,
        sideEffectDetails: sideEffectDetails.trim(),
        additionalNotes: additionalNotes.trim(),
        submittedAt: new Date().toISOString(),
      };

      console.log("Patient Feedback Submitted:", payload);

      setSuccess(
        "Thank you for your feedback. We appreciate your time and will use this to improve your care."
      );
      setFeel("");
      setSymptomRating(5);
      setSideEffectYN("");
      setSideEffects([]);
      setSideEffectDetails("");
      setAdditionalNotes("");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong while submitting your feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingColor = useMemo(() => {
    if (symptomRating <= 3) return "text-emerald-600";
    if (symptomRating <= 7) return "text-amber-600";
    return "text-rose-600";
  }, [symptomRating]);

  const RatingIcon = useMemo(() => {
    if (symptomRating <= 3) return Smile;
    if (symptomRating <= 7) return Meh;
    return Frown;
  }, [symptomRating]);

  return (
    <div className="min-h-[calc(100vh-80px)] py-10 px-4 bg-gradient-to-b from-emerald-50 to-teal-50">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/50 bg-white/80 backdrop-blur-sm">
          <header className="relative p-6 sm:p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  Patient Feedback
                </h1>
                <p className="text-sm text-slate-600">
                  Tell us how you’re feeling — quick, private, and used only to
                  improve care.
                </p>
              </div>
            </div>

            <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-400/10 blur-2xl"></div>
          </header>

          {(success || error) && (
            <div className="px-6 sm:px-8 pt-4">
              {success && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
                  <CheckCircle className="w-5 h-5 mt-1" />
                  <div className="text-sm">{success}</div>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 mt-1" />
                  <div className="text-sm">{error}</div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            <section aria-labelledby="feel-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="feel-heading"
                  className="text-lg font-semibold text-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" /> How do you
                  feel today?
                </h2>
                <span className="text-xs text-slate-500">
                  Choose the option that best matches
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {[
                  {
                    key: "better",
                    label: "Better",
                    hint: "Improved since last session",
                  },
                  { key: "same", label: "Same", hint: "No major change" },
                  { key: "worse", label: "Worse", hint: "Feeling worse" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all select-none flex flex-col items-start gap-1 ${
                      feel === opt.key
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="feel"
                      value={opt.key}
                      checked={feel === opt.key}
                      onChange={(e) => setFeel(e.target.value)}
                      className="hidden"
                    />
                    <span className="font-medium text-base">{opt.label}</span>
                    <span className="text-xs text-slate-500">{opt.hint}</span>
                  </label>
                ))}
              </div>
            </section>

            <section aria-labelledby="rating-heading">
              <h2
                id="rating-heading"
                className="text-lg font-semibold text-slate-800"
              >
                Rate your symptoms
              </h2>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Scale</span>
                    <span className="text-xs text-slate-400">
                      1 (best) — 10 (worst)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 font-semibold ${ratingColor}`}
                  >
                    <span className="text-lg">{symptomRating}</span>
                    <RatingIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={symptomRating}
                    onChange={(e) =>
                      setSymptomRating(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-emerald-600"
                    aria-label="Symptom severity"
                  />
                  {/* <div className="hidden sm:flex flex-col text-xs text-slate-500 w-14 items-end">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div> */}
                </div>
              </div>
            </section>

            <section aria-labelledby="sideeffects-heading">
              <h2
                id="sideeffects-heading"
                className="text-lg font-semibold text-slate-800"
              >
                Any side effects after this session?
              </h2>

              <div className="flex items-center gap-3 mt-3">
                {[
                  { key: "yes", label: "Yes" },
                  { key: "no", label: "No" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`cursor-pointer px-4 py-2 rounded-2xl border transition-all select-none ${
                      sideEffectYN === opt.key
                        ? opt.key === "yes"
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sideEffectYN"
                      value={opt.key}
                      checked={sideEffectYN === opt.key}
                      onChange={(e) => setSideEffectYN(e.target.value)}
                      className="hidden"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {sideEffectYN === "yes" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Side effects (select all that apply)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "headache", label: "Headache" },
                        { key: "vomiting", label: "Vomiting" },
                        { key: "fatigue", label: "Fatigue" },
                        { key: "other", label: "Other" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            sideEffects.includes(item.key)
                              ? "bg-emerald-50 border-emerald-300"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={sideEffects.includes(item.key)}
                            onChange={() => toggleSideEffect(item.key)}
                            className="w-4 h-4 accent-emerald-600"
                          />
                          <span className="text-sm text-slate-700">
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <SpeechTextArea
                    label="Describe the side effects (optional)"
                    placeholder="e.g., When did it start, how intense is it, anything that helps or worsens it..."
                    value={sideEffectDetails}
                    onChange={setSideEffectDetails}
                    helper="Use the microphone for voice input or quick phrases."
                  />
                </div>
              )}
            </section>

            <section>
              <SpeechTextArea
                label="Anything else you want to share? (optional)"
                placeholder="Share any thoughts, concerns, or feedback about your session or overall well-being."
                value={additionalNotes}
                onChange={setAdditionalNotes}
                rows={5}
                helper="You can type, use voice input, or select quick phrases."
              />
            </section>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:from-emerald-600 hover:to-teal-700 transition-transform transform hover:-translate-y-0.5 duration-200 font-semibold shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeel("");
                  setSymptomRating(5);
                  setSideEffectYN("");
                  setSideEffects([]);
                  setSideEffectDetails("");
                  setAdditionalNotes("");
                  setSuccess("");
                  setError("");
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:bg-slate-50 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
