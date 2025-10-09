/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Calendar, Search, Loader2,
  AlertCircle, Clock, Star, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
          Select a slot • {today}
        </h2>

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
  const [form,setForm]=useState({age:"",gender:"",symptoms:"",severity:"sometimes"});
  const [loading,setLoading]=useState(false);
  const [doctors,setDoctors]=useState([]);
  const [error,setError]=useState("");
  const [selectedDoc,setSelectedDoc]=useState(null);

  const change=(k,v)=>{ setForm({...form,[k]:v}); setError(""); };

  const submit=async e=>{
    e.preventDefault();
    if(!form.age||!form.gender||!form.symptoms.trim()){
      setError("Fill age, gender and at least one symptom"); return;
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
      if(!docs.length) setError("No doctors matched these symptoms");
    }catch{
      setError("Server returned 422 – payload mismatch");
    }finally{ setLoading(false); }
  };

  /* ───────── JSX ─────────────────────────────────────────── */
  return(
    <div className="min-h-screen bg-emerald-50/40">
      {/* header */}
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-4">
          {onBack&&(
            <button onClick={onBack} className="hover:text-emerald-200 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          )}
          <Calendar className="w-5 h-5" />
          <h1 className="font-bold tracking-wide">Quick Appointment</h1>
        </div>
      </header>

      {/* content */}
      <main className="max-w-lg mx-auto px-6 py-10">
        {/* form card */}
        <form
          onSubmit={submit}
          className="space-y-6 bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
        >
          {/* Age */}
          <Input label="Age *" type="number" value={form.age}
                 onChange={e=>change("age",e.target.value)} />

          {/* Gender */}
          <Select label="Gender *" value={form.gender}
                  onChange={e=>change("gender",e.target.value)}
                  options={[["","Select"],["male","Male"],["female","Female"],["other","Other"]]} />

          {/* Symptoms */}
          <Textarea label="Describe Symptoms *" rows={3} value={form.symptoms}
                    onChange={e=>change("symptoms",e.target.value)}
                    placeholder="e.g. persistent headache and nausea" />

          {/* Severity */}
          <Select label="Severity *" value={form.severity}
                  onChange={e=>change("severity",e.target.value)}
                  options={SEVERITY.map(o=>[o.value,o.label])} />

          {/* Submit */}
          <motion.button
            whileTap={{scale: loading?1:.97}}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-emerald-600 text-white
                       hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? "Requesting…" : "Get Recommendation"}
          </motion.button>
        </form>

        {/* alerts */}
        <AnimatePresence>
          {error&&(
            <motion.div
              initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-8}}
              className="mt-6 flex items-center gap-2 bg-red-100 border border-red-300
                         text-red-700 p-4 rounded-lg"
            >
              <AlertCircle className="w-5 h-5" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* doctor cards */}
        {doctors.length>0&&(
          <div className="mt-8 space-y-4">
            {doctors.map((d,i)=>(
              <div key={i}
                   className="bg-white p-6 rounded-xl shadow flex items-center justify-between
                              hover:-translate-y-1 hover:shadow-xl transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center
                                  text-white font-bold text-lg">
                    {d.name?.[0]?.toUpperCase()||"U"}
                  </div>
                  <div>
                    <h3 className="font-semibold">Dr. {d.name||"Name"}</h3>
                    <p className="text-sm text-gray-600">{d.speciality||"Specialist"}</p>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-500" /> {d.rating||"4.5"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={()=>setSelectedDoc(d)}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700
                             text-white text-sm rounded-lg transition-colors focus:outline-none
                             focus:ring-2 focus:ring-emerald-500"
                >
                  <Clock className="w-4 h-4" /> Schedule
                </button>
              </div>
            ))}
          </div>
        )}

        {/* slot-picker */}
        {selectedDoc&&(
          <SlotPicker
            provider={selectedDoc}
            onClose={()=>setSelectedDoc(null)}
            onBooked={slot=>{
              alert(`Booked • ${slot.start}`);
              setSelectedDoc(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ───────── Reusable field components ─────────────────────── */
function Input({label,...rest}){
  return(
    <div>
      <label className="font-medium block mb-1">{label}</label>
      <input
        {...rest}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-300 focus:outline-none"
      />
    </div>
  );
}
function Textarea({label,...rest}){
  return(
    <div>
      <label className="font-medium block mb-1">{label}</label>
      <textarea
        {...rest}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-300 focus:outline-none"
      />
    </div>
  );
}
function Select({label,options,...rest}){
  return(
    <div>
      <label className="font-medium block mb-1">{label}</label>
      <select
        {...rest}
        className="w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
      >
        {options.map(([value,text])=>(
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </div>
  );
}
