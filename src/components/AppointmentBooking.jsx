/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Calendar, Search, Loader2,
  AlertCircle, Clock, Star, X, User, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import DoctorRecommendations from "./DoctorRecommendations";

/* ───────── API  ─────────────────────────────────────────────── */
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

/* ───────── constants ───────────────────────────────────────── */
const SEVERITY=[
  { value:"always",    label:"Severe / Constant"},
  { value:"often",     label:"Moderate / Frequent"},
  { value:"sometimes", label:"Mild / Occasional"}
];

/* ───────── Slot-picker modal ───────────────────────────────── */
const SlotPicker=({provider,onClose,onBooked})=>{
  const { user } = useAuth();
  const [slots,setSlots]=useState([]);
  const [busy,setBusy]=useState(true);
  const today=new Date().toISOString().slice(0,10);

  useEffect(()=>{
    // Simulate loading fake slots for development
    setTimeout(() => {
      const fakeSlots = [
        { startTime: "09:00", start: "9:00 AM", end: "9:30 AM" },
        { startTime: "10:00", start: "10:00 AM", end: "10:30 AM" },
        { startTime: "11:30", start: "11:30 AM", end: "12:00 PM" },
        { startTime: "14:00", start: "2:00 PM", end: "2:30 PM" },
        { startTime: "15:30", start: "3:30 PM", end: "4:00 PM" },
        { startTime: "16:00", start: "4:00 PM", end: "4:30 PM" }
      ];
      setSlots(fakeSlots);
      setBusy(false);
    }, 800);
    
    // Original API call (commented out for development)
    /*
    fetchSlots(provider.doctorId,today)
      .then(setSlots)
      .finally(()=>setBusy(false));
    */
  },[provider]);

  const handleBook=async(slot)=>{
    // Simulate booking for development
    setTimeout(() => {
      onBooked(slot);
    }, 500);
    
    // Original API call (commented out for development)
    /*
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
    */
  };

  return (
    <motion.div
      initial={{opacity:0,backdropFilter:"blur(0px)"}}
      animate={{opacity:1,backdropFilter:"blur(4px)"}}
      exit={{opacity:0,backdropFilter:"blur(0px)"}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <motion.div
        initial={{scale:.9}} animate={{scale:1}} exit={{scale:.9}}
        className="bg-white rounded-2xl shadow-xl w-96 p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-emerald-800">
          Available Slots • {new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h2>
        <p className="text-sm text-gray-600 mb-4">Dr. {provider.name} - {provider.speciality}</p>

        {busy ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
        ): slots.length===0 ? (
          <p className="text-center text-sm text-gray-600">No slots today.</p>
        ): (
          <div className="space-y-2">
            {slots.map(s=>(
              <button
                key={s.startTime}
                onClick={()=>handleBook(s)}
                className="w-full px-4 py-2 border rounded-lg text-left
                           hover:bg-emerald-50 active:scale-[.98]
                           transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {s.start} – {s.end}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ───────── Main component ─────────────────────────────────── */
export default function AppointmentBooking({ onBack }){
  const [form,setForm]=useState({
    age:"28",
    gender:"female",
    symptoms:"persistent headache, nausea, and fatigue for the past week. Also experiencing difficulty sleeping and mild joint pain.",
    severity:"often"
  });
  const [loading,setLoading]=useState(false);
  const [doctors,setDoctors]=useState([]);
  const [error,setError]=useState("");
  const [selectedDoc,setSelectedDoc]=useState(null);
  const [showRecommendations,setShowRecommendations]=useState(false);

  const change=(k,v)=>{ setForm({...form,[k]:v}); setError(""); };

  const submit=async e=>{
    e.preventDefault();
    if(!form.age||!form.gender||!form.symptoms.trim()){
      setError("Fill age, gender and at least one symptom"); return;
    }
    setLoading(true); setDoctors([]); setError("");
    
    // Simulate API delay
    setTimeout(() => {
      // Fake doctor data for development
      const fakeDoctors = [
        {
          doctorId: "doc_001",
          name: "Priya Sharma",
          speciality: "Ayurvedic Neurologist",
          rating: "4.8",
          experience: "12 years",
          location: "Mumbai"
        },
        {
          doctorId: "doc_002", 
          name: "Rajesh Kumar",
          speciality: "Panchakarma Specialist",
          rating: "4.6",
          experience: "8 years",
          location: "Delhi"
        },
        {
          doctorId: "doc_003",
          name: "Anita Patel",
          speciality: "Ayurvedic General Medicine",
          rating: "4.7",
          experience: "15 years",
          location: "Bangalore"
        }
      ];
      
      setDoctors(fakeDoctors);
      setShowRecommendations(true);
      setLoading(false);
    }, 1500);
    
    // Original API call (commented out for development)
    /*
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
      if(!docs.length) setError("No doctors matched these symptoms");
    }catch{
      setError("Server returned 422 – payload mismatch");
    }finally{ setLoading(false); }
    */
  };

  /* ───────── JSX ─────────────────────────────────────────── */
  
  // Show recommendations if doctors are found
  if (showRecommendations && doctors.length > 0) {
    return (
      <DoctorRecommendations
        doctors={doctors}
        onBack={() => {
          setShowRecommendations(false);
          setDoctors([]);
        }}
        onSchedule={(doctor) => {
          setSelectedDoc(doctor);
        }}
      />
    );
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Page Header */}
      <header
        className="bg-gradient-to-br from-[#009784] to-teal-700 text-white py-8 relative overflow-hidden"
      >
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          {onBack && (
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </motion.button>
          )}

          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 shadow-lg backdrop-blur-md"
            >
              <Search className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Quick Appointment
              </h1>
              <p className="text-lg text-white/80 max-w-md mx-auto">
                Find your perfect Ayurvedic doctor in just a few clicks.
              </p>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Enhanced Content */}
      <main className="max-w-lg mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{opacity:0,y:30}} 
          animate={{opacity:1,y:0}}
          transition={{delay:0.4, duration:0.8}}
          className="text-center mb-10"
        >
          <motion.div 
            whileHover={{scale:1.1, rotate:5}}
            className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white/50"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3">
            Tell us about yourself
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            Help us find the <span className="text-emerald-600 font-semibold">perfect Ayurvedic specialist</span> for your unique needs
          </p>
        </motion.div>

        {/* Enhanced Form Card */}
        <motion.form
          initial={{opacity:0,y:30}} 
          animate={{opacity:1,y:0}} 
          transition={{delay:0.2}}
          onSubmit={submit}
          className="space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20"
        >
          {/* Age Field */}
          <motion.div whileHover={{scale:1.02}} transition={{type:"spring",stiffness:300}}>
            <EnhancedInput 
              label="Age" 
              type="number" 
              value={form.age}
              onChange={e=>change("age",e.target.value)}
              icon={<User className="w-5 h-5" />}
              required
            />
          </motion.div>

          {/* Gender Field */}
          <motion.div whileHover={{scale:1.02}} transition={{type:"spring",stiffness:300}}>
            <EnhancedSelect 
              label="Gender" 
              value={form.gender}
              onChange={e=>change("gender",e.target.value)}
              options={[["","Select your gender"],["male","Male"],["female","Female"],["other","Other"]]}
              required
            />
          </motion.div>

          {/* Symptoms Field */}
          <motion.div whileHover={{scale:1.02}} transition={{type:"spring",stiffness:300}}>
            <EnhancedTextarea 
              label="Describe Your Symptoms" 
              rows={4} 
              value={form.symptoms}
              onChange={e=>change("symptoms",e.target.value)}
              placeholder="Please describe your symptoms in detail (e.g., persistent headache, nausea, fatigue...)"
              required
            />
          </motion.div>

          {/* Severity Field */}
          <motion.div whileHover={{scale:1.02}} transition={{type:"spring",stiffness:300}}>
            <EnhancedSelect 
              label="Symptom Severity" 
              value={form.severity}
              onChange={e=>change("severity",e.target.value)}
              options={SEVERITY.map(o=>[o.value,o.label])}
              required
            />
          </motion.div>

          {/* Enhanced Submit Button */}
          <motion.button
            whileHover={{scale:1.02,boxShadow:"0 20px 40px rgba(16,185,129,0.3)"}}
            whileTap={{scale:0.98}}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-2xl disabled:opacity-60 flex items-center justify-center gap-3 transition-all duration-300 border-2 border-transparent hover:border-emerald-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Finding Doctors...</span>
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                <span>Get Recommendation</span>
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Enhanced Error Alert */}
        <AnimatePresence>
          {error&&(
            <motion.div
              initial={{opacity:0,y:-20,scale:0.9}} 
              animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:-20,scale:0.9}}
              className="mt-6 flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl shadow-lg backdrop-blur-sm"
            >
              <div className="p-1 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Slot Picker */}
        {selectedDoc&&(
          <EnhancedSlotPicker
            provider={selectedDoc}
            onClose={()=>setSelectedDoc(null)}
            onBooked={slot=>{
              alert(`Booked • ${slot.start}`);
              setSelectedDoc(null);
              setShowRecommendations(false);
              setDoctors([]);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ───────── Enhanced field components ─────────────────────── */
function EnhancedInput({label,icon,required,...rest}){
  return(
    <div className="space-y-2">
      <label className="font-semibold text-gray-700 flex items-center gap-2">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          {...rest}
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400"
        />
      </div>
    </div>
  );
}

function EnhancedTextarea({label,required,...rest}){
  return(
    <div className="space-y-2">
      <label className="font-semibold text-gray-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        {...rest}
        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 resize-none"
      />
    </div>
  );
}

function EnhancedSelect({label,options,required,...rest}){
  return(
    <div className="space-y-2">
      <label className="font-semibold text-gray-700 flex items-center gap-2">
        <ChevronDown className="w-5 h-5" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          {...rest}
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-300 text-gray-800 appearance-none cursor-pointer"
        >
          {options.map(([value,text])=>(
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

/* ───────── Enhanced Slot Picker ─────────────────────── */
function EnhancedSlotPicker({provider,onClose,onBooked}){
  const [slots,setSlots]=useState([]);
  const [busy,setBusy]=useState(true);
  const today=new Date().toISOString().slice(0,10);

  useEffect(()=>{
    setTimeout(() => {
      const fakeSlots = [
        { startTime: "09:00", start: "9:00 AM", end: "9:30 AM" },
        { startTime: "10:00", start: "10:00 AM", end: "10:30 AM" },
        { startTime: "11:30", start: "11:30 AM", end: "12:00 PM" },
        { startTime: "14:00", start: "2:00 PM", end: "2:30 PM" },
        { startTime: "15:30", start: "3:30 PM", end: "4:00 PM" },
        { startTime: "16:00", start: "4:00 PM", end: "4:30 PM" }
      ];
      setSlots(fakeSlots);
      setBusy(false);
    }, 800);
  },[provider]);

  const handleBook=async(slot)=>{
    setTimeout(() => onBooked(slot), 500);
  };

  return (
    <motion.div
      initial={{opacity:0,backdropFilter:"blur(0px)"}}
      animate={{opacity:1,backdropFilter:"blur(8px)"}}
      exit={{opacity:0,backdropFilter:"blur(0px)"}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{scale:.8,y:50}} 
        animate={{scale:1,y:0}} 
        exit={{scale:.8,y:50}}
        className="bg-white rounded-3xl shadow-2xl w-96 p-8 relative border border-gray-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-2 hover:bg-gray-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Available Slots
          </h2>
          <p className="text-gray-600">
            {new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-sm text-emerald-600 font-medium mt-1">
            Dr. {provider.name} - {provider.speciality}
          </p>
        </div>

        {busy ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-4" />
            <p className="text-gray-600">Loading available slots...</p>
          </div>
        ): slots.length===0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No slots available today.</p>
          </div>
        ): (
          <div className="space-y-3">
            {slots.map(s=>(
              <motion.button
                key={s.startTime}
                whileHover={{scale:1.02,backgroundColor:"rgb(16 185 129 / 0.1)"}}
                whileTap={{scale:0.98}}
                onClick={()=>handleBook(s)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-left hover:border-emerald-300 transition-all duration-300 bg-white/50 backdrop-blur-sm group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 group-hover:text-emerald-700">
                    {s.start} – {s.end}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
