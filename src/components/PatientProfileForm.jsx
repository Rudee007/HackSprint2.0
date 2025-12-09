import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Save,
  Loader2,
  PlusCircle,
  Trash2,
  Info,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import axios from "axios";
import { translations } from "../i18n/translations";

// 🔥 API Configuration (unchanged)
const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * PatientProfileForm with speech-to-text for every text field / textarea.
 *
 * Behaviour:
 * - A mic button is shown inside each text input / textarea.
 * - Tap mic to start/stop listening. Live interim text appears appended visually.
 * - When speech ends the final transcript is appended to the current field's value.
 * - Graceful fallback if SpeechRecognition is not supported.
 *
 * NOTE: This uses the browser Web Speech API (webkitSpeechRecognition on some browsers).
 * Permission prompt and microphone access are handled by the browser.
 */

const PatientProfileForm = ({ profile, onComplete, language = "en" }) => {
  const t = translations[language] || translations.en;
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    address: "",
    gender: "",
    bloodGroup: "",
    emergencyContact: "",
    medicalHistory: "",
    symptoms: [],
    dietHabits: "",
    sleepPattern: "",
    digestion: "",
    bowelHabits: "",
    stressLevel: "",
    exerciseHabits: "",
    allergies: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [symptomInput, setSymptomInput] = useState("");
  const symptomInputRef = useRef(null);

  // --- Speech recognition state ---
  const recognitionRef = useRef(null); // current SpeechRecognition instance
  const [isSupported, setIsSupported] = useState(false);
  const [listeningField, setListeningField] = useState(null); // name of active field
  const interimRef = useRef({}); // interim transcripts per field
  const [interimDisplay, setInterimDisplay] = useState({}); // used to trigger re-render
  const [speechError, setSpeechError] = useState(null);

  useEffect(() => {
    // Detect browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    setIsSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        if (profile) {
          setFormData((prev) => ({ ...prev, ...profile }));
        } else {
          const savedProfile = localStorage.getItem("patientProfile");
          if (savedProfile) {
            setFormData((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(t.failedToLoadProfile || "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profile]);

  // --- Utility: start/stop recognition for a field ---
  const startListening = (fieldName) => {
    setSpeechError(null);
    if (!isSupported) {
      setSpeechError("Speech recognition not supported in this browser.");
      return;
    }

    // Stop any active recognition first
    stopListening();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not supported.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false; // single utterance per activation (good UX)
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // polite default for India; change if needed

      // reset interim storage for this field
      interimRef.current[fieldName] = "";
      setInterimDisplay((prev) => ({ ...prev, [fieldName]: "" }));

      recognition.onstart = () => {
        setListeningField(fieldName);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
        setSpeechError(event.error || "Speech recognition error");
        setListeningField(null);
        recognition.stop && recognition.stop();
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        // update interim display
        interimRef.current[fieldName] = interim;
        setInterimDisplay((prev) => ({ ...prev, [fieldName]: interim }));

        if (final) {
          // commit final transcript to field (append + a space)
          commitSpeechResult(fieldName, final.trim());
          interimRef.current[fieldName] = "";
          setInterimDisplay((prev) => ({ ...prev, [fieldName]: "" }));
        }
      };

      recognition.onend = () => {
        // if still had interim text that never became final, commit that too
        const pending = interimRef.current[fieldName];
        if (pending && pending.trim()) {
          commitSpeechResult(fieldName, pending.trim());
          interimRef.current[fieldName] = "";
          setInterimDisplay((prev) => ({ ...prev, [fieldName]: "" }));
        }
        setListeningField(null);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setSpeechError("Unable to start speech recognition.");
      setListeningField(null);
    }
  };

  const stopListening = () => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.onresult = null;
        r.onend = null;
        r.onerror = null;
        r.stop && r.stop();
      } catch (err) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setListeningField(null);
  };

  const toggleListening = (fieldName) => {
    if (listeningField === fieldName) {
      stopListening();
    } else {
      startListening(fieldName);
    }
  };

  const commitSpeechResult = (fieldName, transcript) => {
    if (!transcript) return;
    setFormData((prev) => {
      const prevVal = prev[fieldName] ?? "";
      // for symptoms special field (symptomInput), just append text to current input value
      if (fieldName === "symptomInput" || fieldName === "symptom_input_local") {
        // we use symptomInput state for symptom field; this just handles ephemeral name
        setSymptomInput((s) => (s ? `${s} ${transcript}` : transcript));
        return prev;
      }

      // Append to existing content with a space if not empty
      const newVal = prevVal ? `${prevVal} ${transcript}` : transcript;
      return { ...prev, [fieldName]: newVal };
    });
  };

  // --- Form handling (unchanged semantics) ---
  const validateRequired = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = t.enterFullNameError || "Enter full name";
    if (!formData.age || Number(formData.age) <= 0)
      errs.age = t.enterValidAge || "Enter a valid age";
    if (!formData.phone || formData.phone.trim().length < 7)
      errs.phone = t.enterValidPhone || "Enter valid phone";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // keep compatibility: accepts comma-separated or tag-based
  const handleArrayInput = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    }));
  };

  // UX: add symptom as tag
  const addSymptom = (symptom) => {
    if (!symptom || !symptom.trim()) return;
    const s = symptom.trim();
    if (formData.symptoms.includes(s)) return;
    setFormData((prev) => ({ ...prev, symptoms: [...prev.symptoms, s] }));
    setSymptomInput("");
    symptomInputRef.current && symptomInputRef.current.focus();
  };

  const removeSymptom = (index) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const onSymptomKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSymptom(symptomInput);
    } else if (
      e.key === "Backspace" &&
      !symptomInput &&
      formData.symptoms.length
    ) {
      // quick remove last
      removeSymptom(formData.symptoms.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateRequired()) {
      setError(t.pleaseCorrectFields || "Please correct highlighted fields.");
      return;
    }

    setIsSaving(true);
    try {
      // unchanged: backend save
      const response = await api.put("/patients/profile", formData);

      if (response.data && response.data.success) {
        console.log("✅ Profile saved to backend");
        onComplete && onComplete(response.data.data.profile);
      } else {
        // unexpected but preserve fallback behavior
        throw new Error("Backend responded without success");
      }
    } catch (err) {
      console.error("❌ Backend save failed:", err);
      // fallback to localStorage exactly as original
      localStorage.setItem("patientProfile", JSON.stringify(formData));
      console.log("📱 Profile saved to localStorage");
      onComplete && onComplete(formData);
      setError("Saved locally (backend unavailable).");
    } finally {
      setIsSaving(false);
    }
  };

  // Small component for labelled field with icon
  const FieldLabel = ({ icon: Icon, label, hint }) => (
    <div className="flex items-center space-x-2">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-300 flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-800" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {hint && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-gray-400" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">{t.loadingProfile || "Loading profile..."}</span>
      </div>
    );
  }

  // Helper renders mic button placed inside inputs
  const MicButton = ({ fieldName, small = false }) => {
    const listening = listeningField === fieldName;
    return (
      <button
        type="button"
        onClick={() => toggleListening(fieldName)}
        className={`inline-flex items-center justify-center ${small ? "w-9 h-9" : "px-3 py-2"
          } rounded-lg border ${listening ? "bg-emerald-600 text-white" : "bg-white"
          } shadow-sm hover:opacity-90 focus:outline-none`}
        title={
          isSupported
            ? listening
              ? "Stop listening"
              : "Start speaking"
            : "Speech not supported"
        }
        aria-pressed={listening}
      >
        {isSupported ? (
          listening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )
        ) : (
          <Volume2 className="w-4 h-4 text-slate-400" />
        )}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Card */}
      <div className="relative rounded-2xl shadow-xl overflow-hidden border bg-gradient-to-b from-white via-emerald-50 to-emerald-100">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-cyan-500 flex items-center justify-center text-white shadow">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">{t.patientProfile || "Patient Profile"}</h2>
              <p className="text-sm opacity-90">
                {t.completeDetailsForAssessment || "Complete details for better Ayurvedic assessment"}
              </p>
            </div>
          </div>
          <div className="ml-auto text-sm text-white/90">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
              <Heart className="w-4 h-4 text-rose-200" />
              <span className="font-medium">{t.panchakarmaFriendly || "Panchakarma Friendly"}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-200 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 9v4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-sm text-red-700 font-semibold">{error}</div>
            </div>
          )}

          {/* Two-column grid for basic details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name with mic */}
            <div className="space-y-3">
              <FieldLabel
                icon={User}
                label={t.fullName || "Full Name *"}
                hint={t.asOnOfficialDocuments || "As on official documents"}
              />
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t.enterFullName || "Enter your full name"}
                  className={`w-full p-3 rounded-xl border ${fieldErrors.name
                      ? "border-red-300 bg-red-50"
                      : "border-transparent bg-white"
                    } shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition pr-12`}
                  disabled={isSaving}
                  required
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="name" small />
                </div>
                {/* interim display */}
                {interimDisplay["name"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["name"]}
                  </div>
                )}
              </div>
              {fieldErrors.name && (
                <div className="text-sm text-red-500">{fieldErrors.name}</div>
              )}
            </div>

            {/* Age with mic (works but may produce words) */}
            <div className="space-y-3">
              <FieldLabel icon={Calendar} label={t.ageLabel || "Age *"} hint={t.years || "Years"} />
              <div className="relative">
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder={t.ageLabel || "Age"}
                  min="1"
                  max="120"
                  className={`w-full p-3 rounded-xl border ${fieldErrors.age
                      ? "border-red-300 bg-red-50"
                      : "border-transparent bg-white"
                    } shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition pr-12`}
                  disabled={isSaving}
                  required
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="age" small />
                </div>
                {interimDisplay["age"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["age"]}
                  </div>
                )}
              </div>
              {fieldErrors.age && (
                <div className="text-sm text-red-500">{t.enterValidAge || fieldErrors.age}</div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-3">
              <FieldLabel
                icon={Phone}
                label={t.phoneNumber || "Phone Number *"}
                hint={t.usedForReminders || "Used for appointment reminders"}
              />
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t.enterPhoneNumber || "Enter phone number"}
                  className={`w-full p-3 rounded-xl border ${fieldErrors.phone
                      ? "border-red-300 bg-red-50"
                      : "border-transparent bg-white"
                    } shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition pr-12`}
                  disabled={isSaving}
                  required
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="phone" small />
                </div>
                {interimDisplay["phone"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["phone"]}
                  </div>
                )}
              </div>
              {fieldErrors.phone && (
                <div className="text-sm text-red-500">{t.enterValidPhone || fieldErrors.phone}</div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <FieldLabel icon={MapPin} label={t.genderLabel || "Gender"} />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                disabled={isSaving}
              >
                <option value="">{t.selectGenderOption || "Select gender"}</option>
                <option value="male">{t.male || "Male"}</option>
                <option value="female">{t.female || "Female"}</option>
                <option value="other">{t.other || "Other"}</option>
              </select>
            </div>

            {/* Blood group */}
            <div className="space-y-3">
              <FieldLabel icon={Heart} label={t.bloodGroup || "Blood Group"} />
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                disabled={isSaving}
              >
                <option value="">{t.selectBloodGroup || "Select blood group"}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <FieldLabel
                icon={Phone}
                label={t.emergencyContact || "Emergency Contact"}
                hint={t.urgentSituations || "Number we can call during urgent situations"}
              />
              <div className="relative">
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder={t.emergencyContactPlaceholder || "Emergency contact number"}
                  className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition pr-12"
                  disabled={isSaving}
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="emergencyContact" small />
                </div>
                {interimDisplay["emergencyContact"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["emergencyContact"]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ayurvedic Assessment Card */}
          <div className="rounded-xl p-5 border border-neutral-100 bg-gradient-to-b from-white to-emerald-50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 flex items-center justify-center text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2v6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 8v6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 8v6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t.ayurvedicHealthAssessment || "Ayurvedic Health Assessment"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t.quickSnapshot || "Quick snapshot of lifestyle & symptoms"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {t.helpsVaidyaGetStarted || "This section helps the vaidya get started"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Symptoms with tag input */}
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    {t.currentSymptoms || "Current Symptoms"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t.pressEnterToAdd || "Press Enter to add"}
                  </span>
                </label>

                <div className="flex gap-2 items-center">
                  <input
                    ref={symptomInputRef}
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={onSymptomKeyDown}
                    placeholder={t.symptomPlaceholder || "e.g., fatigue, indigestion"}
                    className="flex-1 p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition pr-12"
                    disabled={isSaving}
                    aria-label="Add symptom"
                  />
                  <div className="absolute right-[20rem] md:relative md:right-0 md:static"></div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addSymptom(symptomInput)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:opacity-95"
                      title={t.add || "Add symptom"}
                    >
                      <PlusCircle className="w-4 h-4" />
                      {t.add || "Add"}
                    </button>
                    <MicButton fieldName="symptom_input_local" />
                  </div>
                </div>

                {/* interim display for symptom input */}
                {interimDisplay["symptom_input_local"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["symptom_input_local"]}
                  </div>
                )}

                {/* Chip list */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.symptoms && formData.symptoms.length ? (
                    formData.symptoms.map((s, idx) => (
                      <span
                        key={s + idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm text-sm"
                      >
                        <span className="font-medium text-slate-700">{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSymptom(idx)}
                          className="p-1 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">
                      {t.noSymptomsAddedYet || "No symptoms added yet"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  {t.sleepPattern || "Sleep Pattern"}
                </label>
                <div className="relative">
                  <select
                    name="sleepPattern"
                    value={formData.sleepPattern}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                    disabled={isSaving}
                  >
                    <option value="">{t.selectSleepPattern || "Select sleep pattern"}</option>
                    <option value="excellent">
                      {t.excellent || "Excellent (7-8 hours, restful)"}
                    </option>
                    <option value="good">
                      {t.good || "Good (6-7 hours, mostly restful)"}
                    </option>
                    <option value="fair">
                      {t.fair || "Fair (5-6 hours, sometimes restless)"}
                    </option>
                    <option value="poor">
                      {t.poor || "Poor (less than 5 hours, often restless)"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  {t.digestion || "Digestion"}
                </label>
                <select
                  name="digestion"
                  value={formData.digestion}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                  disabled={isSaving}
                >
                  <option value="">{t.selectDigestionStatus || "Select digestion status"}</option>
                  <option value="strong">
                    {t.strong || "Strong (no issues, good appetite)"}
                  </option>
                  <option value="moderate">
                    {t.moderate || "Moderate (occasional discomfort)"}
                  </option>
                  <option value="weak">{t.weak || "Weak (frequent digestive issues)"}</option>
                  <option value="irregular">
                    {t.irregular || "Irregular (varies day to day)"}
                  </option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  {t.stressLevel || "Stress Level"}
                </label>
                <select
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                  disabled={isSaving}
                >
                  <option value="">{t.selectStressLevel || "Select stress level"}</option>
                  <option value="low">{t.low || "Low (calm, relaxed)"}</option>
                  <option value="moderate">{t.moderateStress || "Moderate (manageable stress)"}</option>
                  <option value="high">{t.high || "High (frequent stress/anxiety)"}</option>
                  <option value="severe">{t.severe || "Severe (overwhelming stress)"}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  {t.dietHabits || "Diet Habits"}
                </label>
                <div className="relative">
                  <textarea
                    name="dietHabits"
                    value={formData.dietHabits}
                    onChange={handleInputChange}
                    placeholder={t.dietPlaceholder || "Typical diet, preferences, food timing"}
                    rows="3"
                    className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none pr-12"
                    disabled={isSaving}
                  />
                  <div className="absolute right-2 top-2">
                    <MicButton fieldName="dietHabits" small />
                  </div>
                  {interimDisplay["dietHabits"] && (
                    <div className="mt-1 text-xs text-emerald-600 italic">
                      Listening: {interimDisplay["dietHabits"]}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.beSpecific || "Be specific: e.g., vegetarian, spicy food, oily food, meal timings"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  {t.exerciseHabits || "Exercise Habits"}
                </label>
                <div className="relative">
                  <textarea
                    name="exerciseHabits"
                    value={formData.exerciseHabits}
                    onChange={handleInputChange}
                    placeholder={t.exercisePlaceholder || "Your exercise routine, frequency"}
                    rows="2"
                    className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none pr-12"
                    disabled={isSaving}
                  />
                  <div className="absolute right-2 top-2">
                    <MicButton fieldName="exerciseHabits" small />
                  </div>
                  {interimDisplay["exerciseHabits"] && (
                    <div className="mt-1 text-xs text-emerald-600 italic">
                      Listening: {interimDisplay["exerciseHabits"]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address and Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                {t.address || "Address"}
              </label>
              <div className="relative">
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t.completeAddress || "Complete address"}
                  rows="3"
                  className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none pr-12"
                  disabled={isSaving}
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="address" small />
                </div>
                {interimDisplay["address"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["address"]}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                {t.medicalHistoryAllergies || "Medical History & Allergies"}
              </label>
              <div className="relative">
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder={t.medicalHistoryPlaceholder || "Existing conditions, medications, allergies"}
                  rows="5"
                  className="w-full p-3 rounded-xl border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none pr-12"
                  disabled={isSaving}
                />
                <div className="absolute right-2 top-2">
                  <MicButton fieldName="medicalHistory" small />
                </div>
                {interimDisplay["medicalHistory"] && (
                  <div className="mt-1 text-xs text-emerald-600 italic">
                    Listening: {interimDisplay["medicalHistory"]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-xl font-extrabold text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t.updatingProfile || "Updating Profile..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t.saveProfile || "Save Profile"}
                </>
              )}
            </button>

            <div className="text-xs text-slate-500 mt-2 text-center">
              {t.changesSavedInfo || "Changes are saved to backend when available; otherwise stored locally."}
            </div>

            {/* Speech status / errors */}
            <div className="mt-3 text-center">
              {!isSupported ? (
                <div className="text-xs text-rose-600">
                  {t.speechNotSupported || "Speech recognition not supported in this browser."}
                </div>
              ) : speechError ? (
                <div className="text-xs text-rose-600">{speechError}</div>
              ) : listeningField ? (
                <div className="text-xs text-emerald-700">
                  {t.listeningFor || "Listening for:"}{" "}
                  <span className="font-medium">{listeningField}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  {t.tapMicToDictate || "Tap any mic to dictate into that field."}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfileForm;
