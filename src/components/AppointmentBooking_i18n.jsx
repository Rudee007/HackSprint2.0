/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Calendar, Search, Loader2,
  AlertCircle, Clock, Star, X, CheckCircle,
  User, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { translations } from "../i18n/translations";

const api = axios.create({ baseURL:"http://localhost:3003/api" });
api.interceptors.request.use((c)=>{
  const t = localStorage.getItem("accessToken");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const fetchSlots = (pid,date)=>
  api.get(`/scheduling/providers/${pid}/availability`,
    { params:{ date,therapyType:"consultation" } }
  ).then(r=>r.data.data.slots);

const bookSlot = (data)=>api.post("/booking/create",data);

const SEVERITY=[
  { value:"always",    label:"severeSevere", desc:"severeDesc", color:"red"},
  { value:"often",     label:"moderate", desc:"moderateDesc", color:"amber"},
  { value:"sometimes", label:"mild", desc:"mildDesc", color:"green"}
];

const SlotPicker=({provider,onClose,onBooked,language})=>{
  const { user } = useAuth();
  const [slots,setSlots]=useState([]);
  const [busy,setBusy]=useState(true);
  const today=new Date().toISOString().slice(0,10);
  const t = translations[language] || translations.en;

  useEffect(()=>{
    fetchSlots(provider.doctorId,today)
      .then(setSlots)
      .finally(()=>setBusy(false));
  },[provider]);

  const handleBook=async(slot)=>{
    try{
      await bookSlot({
        providerId:provider.doctorId,
        patientId :user.id,
        startTime :slot.startTime,
        duration  :30,
        type      :"in_person",
        providerType:"doctor",
        fee       :1500,
        sessionType:"therapy",
        meetingLink:"",
        notes     :""
      });
      onBooked(slot);
    }catch(e){
      alert(e.response?.data?.message||"Booking failed");
    }
  };

  return (
    <motion.div
      initial={{opacity:0}}
      animate={{opacity:1}}
      exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{scale:.9, y:20}} 
        animate={{scale:1, y:0}} 
        exit={{scale:.9, y:20}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.availableSlots}</h2>
              <p className="text-emerald-100 text-sm">{today}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {busy ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-gray-600">{t.loadingSlots}</p>
            </div>
          ): slots.length===0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">{t.noSlotsToday}</p>
              <p className="text-sm text-gray-500 mt-1">{t.tryAnotherDate}</p>
            </div>
          ): (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {slots.map(s=>(
                <motion.button
                  key={s.startTime}
                  whileHover={{ scale:1.02, x:4 }}
                  whileTap={{ scale:0.98 }}
                  onClick={()=>handleBook(s)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-left
                             hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md
                             transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500
                             group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center
                                      group-hover:bg-emerald-200 transition-colors">
                        <Clock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{s.start} – {s.end}</div>
                        <div className="text-sm text-gray-500">30 {t.minutesSession}</div>
                      </div>
                    </div>
                    <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function AppointmentBooking({ onBack, language = 'en' }){
  const [form,setForm]=useState({age:"",gender:"",symptoms:"",severity:"sometimes"});
  const [loading,setLoading]=useState(false);
  const [doctors,setDoctors]=useState([]);
  const [error,setError]=useState("");
  const [selectedDoc,setSelectedDoc]=useState(null);
  
  const t = translations[language] || translations.en;

  const change=(k,v)=>{ setForm({...form,[k]:v}); setError(""); };

  const submit=async e=>{
    e.preventDefault();
    if(!form.age||!form.gender||!form.symptoms.trim()){
      setError(t.fillRequired); return;
    }
    setLoading(true); setDoctors([]); setError("");
    try{
      const body={
        age:+form.age, gender:form.gender,
        symptoms:form.symptoms.trim().toLowerCase(),
        severity:form.severity
      };
      const { data }=await axios.post("http://127.0.0.1:8000/recommend",body);
      const docs=data?.doctors||data?.data?.doctors||
                 data?.recommendations?.[0]?.doctors||[];
      setDoctors(docs);
      if(!docs.length) setError(t.noDoctorsMatched);
    }catch{
      setError(t.serverError);
    }finally{ setLoading(false); }
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack&&(
                <motion.button 
                  whileHover={{ x:-4 }}
                  onClick={onBack} 
                  className="flex items-center gap-2 text-white/90 hover:text-white
                             px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">{t.back}</span>
                </motion.button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t.bookAppointment}</h1>
                  <p className="text-emerald-100 text-sm">{t.aiPoweredRecommendations}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <motion.form
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          onSubmit={submit}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl 
                              flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t.patientInformation}</h2>
            </div>
            <p className="text-gray-600 ml-13">{t.tellUsSymptoms}</p>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <EnhancedInput 
                label={`${t.age} *`}
                type="number" 
                value={form.age}
                onChange={e=>change("age",e.target.value)}
                placeholder={t.enterAge}
                icon="📅"
              />
              <EnhancedSelect 
                label={`${t.gender} *`}
                value={form.gender}
                onChange={e=>change("gender",e.target.value)}
                options={[["",t.selectGender],["male",t.male],["female",t.female],["other",t.other]]}
                icon="👤"
              />
            </div>

            <EnhancedTextarea 
              label={`${t.describeSymptoms} *`}
              rows={4} 
              value={form.symptoms}
              onChange={e=>change("symptoms",e.target.value)}
              placeholder={t.symptomsPlaceholder}
              icon="🩺"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.severityLevel} *
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {SEVERITY.map(sev=>(
                  <motion.button
                    key={sev.value}
                    type="button"
                    whileHover={{ scale:1.02 }}
                    whileTap={{ scale:0.98 }}
                    onClick={()=>change("severity",sev.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      form.severity===sev.value
                        ? `border-${sev.color}-500 bg-${sev.color}-50 shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-${sev.color}-700`}>{t[sev.label]}</span>
                      {form.severity===sev.value && (
                        <CheckCircle className={`w-5 h-5 text-${sev.color}-600`} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{t[sev.desc]}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale:1.01 }}
              whileTap={{ scale:0.99 }}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-lg
                         bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600
                         text-white shadow-lg hover:shadow-xl
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-3 transition-all
                         relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 
                              opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{t.findingBestDoctors}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>{t.getAIRecommendations}</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>
        </motion.form>

        <AnimatePresence>
          {error&&(
            <motion.div
              initial={{opacity:0, y:-10, scale:0.95}} 
              animate={{opacity:1, y:0, scale:1}}
              exit={{opacity:0, y:-10, scale:0.95}}
              className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">{t.oopsSomethingWrong}</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={()=>setError("")}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {doctors.length>0&&(
          <motion.div
            initial={{opacity:0, y:20}}
            animate={{opacity:1, y:0}}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl 
                              flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t.recommendedSpecialists}</h2>
                <p className="text-gray-600">{t.basedOnSymptoms}</p>
              </div>
            </div>

            {doctors.map((d,i)=>(
              <motion.div 
                key={i}
                initial={{opacity:0, x:-20}}
                animate={{opacity:1, x:0}}
                transition={{delay: i*0.1}}
                whileHover={{ y:-4, shadow:"0 20px 40px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent
                           hover:border-emerald-500 transition-all cursor-pointer
                           group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 
                                    flex items-center justify-center text-white font-bold text-xl
                                    shadow-lg group-hover:scale-110 transition-transform">
                      {d.name?.[0]?.toUpperCase()||"D"}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Dr. {d.name||"Specialist"}
                      </h3>
                      <p className="text-emerald-600 font-medium mb-2">
                        {d.speciality||"Ayurvedic Specialist"}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{d.rating||"4.5"}</span>
                          <span className="text-gray-400">({d.reviews||"50+"})</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {d.experience||"10"}+ {t.yearsExp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale:1.05 }}
                    whileTap={{ scale:0.95 }}
                    onClick={()=>setSelectedDoc(d)}
                    className="flex items-center gap-2 px-6 py-3
                               bg-gradient-to-r from-emerald-600 to-teal-600
                               text-white font-semibold rounded-xl
                               shadow-lg hover:shadow-xl
                               transition-all"
                  >
                    <Clock className="w-5 h-5" />
                    <span>{t.schedule}</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <AnimatePresence>
          {selectedDoc&&(
            <SlotPicker
              provider={selectedDoc}
              onClose={()=>setSelectedDoc(null)}
              onBooked={slot=>{
                alert(`✅ ${t.bookingConfirmed}\n${t.time}: ${slot.start}`);
                setSelectedDoc(null);
              }}
              language={language}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function EnhancedInput({label, icon, ...rest}){
  return(
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
            {icon}
          </span>
        )}
        <input
          {...rest}
          className={`w-full ${icon?'pl-14':'pl-4'} pr-4 py-3.5 border-2 border-gray-200 rounded-xl
                     focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                     transition-all outline-none bg-white/50 backdrop-blur-sm
                     hover:border-gray-300 font-medium`}
        />
      </div>
    </div>
  );
}

function EnhancedTextarea({label, icon, ...rest}){
  return(
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-4 text-xl">
            {icon}
          </span>
        )}
        <textarea
          {...rest}
          className={`w-full ${icon?'pl-14':'pl-4'} pr-4 py-3.5 border-2 border-gray-200 rounded-xl
                     focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                     transition-all outline-none resize-none bg-white/50 backdrop-blur-sm
                     hover:border-gray-300 font-medium`}
        />
      </div>
    </div>
  );
}

function EnhancedSelect({label, icon, options, ...rest}){
  return(
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl z-10">
            {icon}
          </span>
        )}
        <select
          {...rest}
          className={`w-full ${icon?'pl-14':'pl-4'} pr-4 py-3.5 border-2 border-gray-200 rounded-xl
                     focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                     transition-all outline-none appearance-none bg-white/50 backdrop-blur-sm
                     hover:border-gray-300 font-medium cursor-pointer`}
        >
          {options.map(([value,text])=>(<option key={value} value={value}>{text}</option>))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
