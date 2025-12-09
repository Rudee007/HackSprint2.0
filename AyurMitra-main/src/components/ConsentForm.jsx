import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, FileText, CheckCircle, XCircle } from 'lucide-react';

const ConsentForm = ({ consultation, onDecision }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [readChecked, setReadChecked] = useState(false);

  const consentText = `Panchakarma Treatment – Informed Consent Form

This document is an official informed consent for Panchakarma therapy as per Ayurvedic clinical practice standards. Please read each section carefully before giving your consent.

INTRODUCTION
This consent form outlines the nature, purpose, expected benefits, limitations, and potential risks associated with Panchakarma therapy. You are encouraged to ask questions and seek clarification before proceeding. Your participation is voluntary, and you may withdraw consent at any time.

DESCRIPTION OF PANCHAKARMA
Panchakarma is a classical Ayurvedic cleansing and rejuvenation procedure aimed at removing accumulated toxins (ama), improving systemic balance, and supporting overall health. Treatment protocols are individualized based on your Prakriti (constitution), Vikriti (imbalance), medical evaluation, and current health condition.

PROCEDURES INCLUDED
Depending on your case, the Panchakarma program may include one or more of the following interventions:

1. Purva Karma (Preparatory Procedures)
   • Snehana – Internal or external oleation  
   • Swedana – Therapeutic sweating/steam procedures  

2. Pradhana Karma (Main Detoxification Procedures)
   • Vamana – Medically induced emesis  
   • Virechana – Medicated purgation  
   • Basti – Medicated enema therapy (Niruha and/or Anuvasana)  
   • Nasya – Nasal cleansing and medication  
   • Raktamokshana – Bloodletting using leech therapy or other approved methods  

3. Paschat Karma (Post-Care Procedures)
   • Samsarjana Krama – Gradual dietary progression  
   • Lifestyle and behavioral guidance  
   • Follow-up therapies and supportive medicines  

EXPECTED BENEFITS
Potential benefits vary by individual and may include:
• Detoxification and improved metabolic function  
• Reduction of symptoms related to chronic conditions  
• Enhanced digestive capacity and immune function  
• Pain relief and improved joint mobility  
• Hormonal and neurological balance  
• Mental clarity and emotional stability  
Clinical outcomes are not guaranteed and depend on adherence to instructions, individual physiology, and underlying medical conditions.

POSSIBLE RISKS AND SIDE EFFECTS
Although Panchakarma is generally safe when administered by trained practitioners, potential risks and temporary side effects may include:
• Fatigue, weakness, dizziness, or dehydration  
• Nausea, vomiting, diarrhea, or abdominal discomfort  
• Fever, headaches, or body aches  
• Temporary flare-up of pre-existing symptoms  
• Skin irritation or allergic reactions to oils or herbs  
• Emotional hypersensitivity during detoxification  
Rare but serious complications can occur, especially if instructions are not followed.

CONTRAINDICATIONS
Panchakarma may not be recommended in the following conditions:
• Pregnancy or breastfeeding  
• Uncontrolled hypertension or severe cardiac disorders  
• Active infections, fever, or acute inflammatory conditions  
• Recent surgeries, trauma, or fractures  
• Severe diabetes or metabolic instability  
• Autoimmune diseases requiring immunosuppressants  
• Cancer or ongoing chemotherapy/radiation therapy  
• Severe psychiatric disorders  
It is your responsibility to provide accurate and complete medical information.

PATIENT RESPONSIBILITIES
By consenting, you acknowledge that you will:
• Follow all pre-treatment and post-treatment instructions  
• Provide complete and truthful medical history  
• Avoid alcohol, smoking, recreational drugs, and restricted foods  
• Report any discomfort, adverse reaction, or unusual symptoms immediately  
• Attend scheduled sessions and follow-up appointments  
• Adhere to the prescribed rest, diet, and medication guidelines  

LIMITATIONS OF TREATMENT
• Panchakarma is a holistic wellness therapy and is NOT a substitute for emergency medical care.  
• Results vary among individuals and NO outcome is guaranteed.  
• Failure to follow instructions may reduce effectiveness or increase risks.

CONFIDENTIALITY
All personal and medical information will be handled confidentially in accordance with healthcare privacy laws and institutional policies.

VOLUNTARY CONSENT
I hereby confirm that:
• I have read and understood the information provided in this consent form.  
• I have had the opportunity to ask questions, and all my queries have been satisfactorily answered.  
• I understand the nature, objectives, procedures, benefits, and potential risks of Panchakarma therapy.  
• I understand that I may decline or discontinue treatment at any time.  
• I voluntarily agree to undergo Panchakarma therapy under the supervision of qualified Ayurvedic practitioners.

By selecting "I Accept," I confirm my informed and voluntary consent to proceed with the treatment.`;

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(consentText);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
    
    // Select Indian English female voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(voice => 
      voice.lang === 'en-IN' ||
      voice.name.includes('India') ||
      voice.name.includes('Indian') ||
      voice.name.includes('Raveena') ||
      voice.name.includes('Aditi') ||
      voice.name.includes('Google हिन्दी') ||
      voice.name.includes('Google UK English Female')
    );
    if (indianVoice) utterance.voice = indianVoice;
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Panchakarma Treatment Consent
              </h2>
              <p className="text-emerald-50 text-sm mt-1">
                Please review carefully before proceeding
              </p>
            </div>
          </div>
          <button
            onClick={isPlaying ? stopSpeech : speak}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all text-white font-medium"
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-5 h-5" />
                <span className="hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span className="hidden sm:inline">Read Aloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-line text-gray-700 leading-relaxed">
            {consentText}
          </div>
        </div>
      </div>

      {/* Agreement Section */}
      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-3 mb-6">
          <input
            id={`consent-checkbox-${consultation?._id ?? "no-id"}`}
            type="checkbox"
            checked={readChecked}
            onChange={(e) => setReadChecked(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 mt-0.5"
          />
          <label
            htmlFor={`consent-checkbox-${consultation?._id ?? "no-id"}`}
            className="text-sm text-gray-700 font-medium cursor-pointer select-none"
          >
            I have read and understood the information about my Panchakarma
            therapy, including its benefits, risks and required precautions, and
            I voluntarily agree to proceed with this treatment.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            disabled={!readChecked}
            onClick={() => onDecision(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              readChecked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Yes, I Accept
          </button>

          <button
            onClick={() => onDecision(false)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl font-semibold transition-all"
          >
            <XCircle className="w-5 h-5" />
            No, I Decline
          </button>
        </div>

        {!readChecked && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Please read and check the agreement box to accept the consent
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ConsentForm;