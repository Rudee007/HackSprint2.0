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
 * Robust useSpeechRecognition hook
 * - Accepts localhost, 127.0.0.1, ::1 as secure origins
 * - Does a lightweight getUserMedia preflight to prompt mic permission
 * - Handles browsers with webkitSpeechRecognition
 * - Safe stop/abort usage and cleanup
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

  // safe function to stop any running recognition instance and remove handlers
  const _cleanupRecognition = (instance) => {
    if (!instance) return;
    try {
      if (typeof instance.stop === "function") instance.stop();
      else if (typeof instance.abort === "function") instance.abort();
    } catch (e) {
      // ignore
    }
    try {
      instance.onresult = null;
      instance.onerror = null;
      instance.onstart = null;
      instance.onend = null;
    } catch (e) {
      /* ignore */
    }
  };

  // start: returns a promise so we can run getUserMedia preflight
  const start = async (onResult) => {
    setError(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("SpeechRecognition API not available in this browser.");
      return;
    }

    // If not secure (and not localhost variants), refuse
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

    // If there is an existing instance, cleanup it
    if (recognitionRef.current) {
      _cleanupRecognition(recognitionRef.current);
      recognitionRef.current = null;
    }

    // Preflight: request mic permission via getUserMedia to ensure permission prompt happens
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // we don't need the stream — stop all tracks immediately
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
        // pick final results only; keep interim handling simple
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
      // keep instance reference until explicit stop() is called by us
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
      // cleanup attempt
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { supported, listening, start, stop, error };
}

/**
 * Speech-enabled textarea used twice in the form
 */
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
    // If speech recognition unsupported, show quick phrases
    if (!supported) {
      setShowQuickPhrases((s) => !s);
      return;
    }

    if (listening) {
      stop();
      return;
    }

    // start and append results
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
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          rows={rows}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y text-sm sm:text-base bg-white/90"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={handleToggle}
          className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors shadow-sm ${
            listening
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : supported
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
      </div>

      {showQuickPhrases && !supported && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-600 mb-2">Quick phrases:</p>
          <div className="space-y-1">
            {quickPhrases.map((phrase, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addQuickPhrase(phrase)}
                className="block w-full text-left text-xs p-2 rounded-lg hover:bg-emerald-50 text-slate-700"
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

/**
 * Main patient feedback form component
 */
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

      // Replace with your API call (axios/fetch) if needed
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
    <div className="min-h-[calc(100vh-80px)] py-8 px-4 bg-gradient-to-b from-emerald-50 to-teal-50">
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-gradient-to-br from-emerald-300/30 to-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-tr from-green-300/20 to-emerald-400/10 rounded-full blur-2xl"></div>

          <div className="relative p-6 sm:p-8 border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Patient Feedback
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">
                  Your well-being matters. Please take a minute to share how
                  you're feeling today.
                </p>
              </div>
            </div>
          </div>

          {(success || error) && (
            <div className="px-6 sm:px-8 pt-4">
              {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{success}</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{error}</span>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="relative p-6 sm:p-8 space-y-8"
          >
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> How do you
                feel today?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "better", label: "Better" },
                  { key: "same", label: "Same" },
                  { key: "worse", label: "Worse" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`cursor-pointer p-4 rounded-xl border text-center transition-all select-none ${
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
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Rate your symptoms
              </h2>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Scale:</span>
                    <span className="text-xs text-slate-500">
                      1 (best) – 10 (worst)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 font-semibold ${ratingColor}`}
                  >
                    <span className="text-lg">{symptomRating}</span>
                    <RatingIcon className="w-5 h-5" />
                  </div>
                </div>
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
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </section>

            
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Any side effects after this session?
              </h2>
              <div className="flex items-center gap-3">
                {[
                  { key: "yes", label: "Yes" },
                  { key: "no", label: "No" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`cursor-pointer px-4 py-2 rounded-xl border transition-all select-none ${
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

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
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
