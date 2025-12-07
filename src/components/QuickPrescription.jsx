// src/components/doctor/QuickPrescription.jsx
// 🔥 QUICK PRESCRIPTION WITH MEDICINE KNOWLEDGE BASE

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Loader2, Search, Plus, Trash2, Pill, AlertCircle,
  User, ShoppingBag, X, Info, BookOpen, Filter, ChevronRight,
  Package, Calendar, AlertTriangle, CheckCircle2, Eye
} from 'lucide-react';
import doctorApiService from '../services/doctorApiService';

const QuickPrescription = ({ 
  consultations, 
  onBack, 
  onSuccess 
}) => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [medicineInventory, setMedicineInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [error, setError] = useState(null);
  
  // 🔥 NEW: Knowledge Base States
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [selectedMedicineDetails, setSelectedMedicineDetails] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('search'); // 'search' or 'browse'

  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    consultationId: '',
    chiefComplaint: '',
    diagnosis: '',
    medicines: [],
    generalInstructions: '',
    dietInstructions: '',
    lifestyleInstructions: '',
    followUpDays: '7'
  });

  // ═══════════════════════════════════════════════════════════
  // MEDICINE CATEGORIES
  // ═══════════════════════════════════════════════════════════
  const medicineCategories = [
    { value: 'all', label: 'All Medicines', icon: '💊' },
    { value: 'Churna (Powder)', label: 'Churna (Powder)', icon: '🥄' },
    { value: 'Vati (Tablet)', label: 'Vati (Tablet)', icon: '💊' },
    { value: 'Kwath (Decoction)', label: 'Kwath (Decoction)', icon: '☕' },
    { value: 'Taila (Oil)', label: 'Taila (Oil)', icon: '🫗' },
    { value: 'Ghrita (Ghee)', label: 'Ghrita (Ghee)', icon: '🧈' },
    { value: 'Asava/Arishta (Fermented)', label: 'Asava/Arishta', icon: '🍶' },
    { value: 'Rasayana (Rejuvenation)', label: 'Rasayana', icon: '✨' },
  ];

  // ═══════════════════════════════════════════════════════════
  // LOAD MEDICINE INVENTORY
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadMedicineInventory();
  }, []);

  const loadMedicineInventory = async () => {
    try {
      const response = await doctorApiService.getMedicineInventory();
      if (response.data.success) {
        setMedicineInventory(response.data.data.medicines || []);
      }
    } catch (error) {
      console.error('❌ Failed to load medicines:', error);
      setError('Failed to load medicine inventory');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLE CONSULTATION CHANGE
  // ═══════════════════════════════════════════════════════════
  const handleConsultationChange = (e) => {
    const selectedId = e.target.value;
    const selectedConsultation = consultations.find(c => 
      (c._id || c.id) === selectedId
    );
    
    setPrescriptionForm({
      ...prescriptionForm,
      consultationId: selectedId,
      patientId: selectedConsultation?.patientId?._id || 
                 selectedConsultation?.patientId?.id || 
                 selectedConsultation?.patientId || ''
    });
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 NEW: MEDICINE FILTERING
  // ═══════════════════════════════════════════════════════════
  const filteredMedicines = medicineInventory.filter(med => {
    const matchesSearch = !searchQuery || 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.composition?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // ═══════════════════════════════════════════════════════════
  // 🔥 NEW: VIEW MEDICINE DETAILS
  // ═══════════════════════════════════════════════════════════
  const viewMedicineDetails = (medicine) => {
    setSelectedMedicineDetails(medicine);
    setShowKnowledgeBase(true);
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 NEW: QUICK PRESCRIBE FROM KNOWLEDGE BASE
  // ═══════════════════════════════════════════════════════════
  const quickPrescribeFromKB = (medicine) => {
    addMedicine(medicine);
    setShowKnowledgeBase(false);
    setSelectedMedicineDetails(null);
  };

  // ═══════════════════════════════════════════════════════════
  // ADD MEDICINE
  // ═══════════════════════════════════════════════════════════
  const addMedicine = (medicine) => {
    if (prescriptionForm.medicines.find(m => m.medicineId === medicine._id)) {
      alert('Medicine already added');
      return;
    }

    const newMedicine = {
      medicineId: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      dosage: medicine.defaultDosage || '1 tablet',
      frequency: 'Twice daily',
      timing: 'After meals',
      duration: '7 days',
      quantity: 14,
      stock: medicine.stock
    };

    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, newMedicine]
    });

    setSearchQuery('');
    setShowMedicineDropdown(false);
  };

  // ═══════════════════════════════════════════════════════════
  // UPDATE MEDICINE
  // ═══════════════════════════════════════════════════════════
  const updateMedicine = (index, field, value) => {
    const updatedMedicines = prescriptionForm.medicines.map((med, i) => {
      if (i === index) {
        const updated = { ...med, [field]: value };
        
        if (field === 'frequency' || field === 'duration') {
          const frequencyMap = {
            'Once daily': 1,
            'Twice daily': 2,
            'Thrice daily': 3,
            'Four times daily': 4,
            'As needed': 2
          };
          const daysMatch = updated.duration.match(/\d+/);
          const days = daysMatch ? parseInt(daysMatch[0]) : 7;
          const perDay = frequencyMap[updated.frequency] || 2;
          updated.quantity = days * perDay;
        }
        
        return updated;
      }
      return med;
    });

    setPrescriptionForm({
      ...prescriptionForm,
      medicines: updatedMedicines
    });
  };

  // ═══════════════════════════════════════════════════════════
  // REMOVE MEDICINE
  // ═══════════════════════════════════════════════════════════
  const removeMedicine = (index) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: prescriptionForm.medicines.filter((_, i) => i !== index)
    });
  };

  // ═══════════════════════════════════════════════════════════
  // SUBMIT PRESCRIPTION
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prescriptionForm.chiefComplaint.trim()) {
      setError('Please enter chief complaint');
      return;
    }

    if (prescriptionForm.medicines.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await doctorApiService.createPrescription(prescriptionForm);

      if (response.data.success) {
        alert('✅ Prescription created successfully!');
        onSuccess && onSuccess();
        onBack();
      }
    } catch (err) {
      console.error('❌ Error creating prescription:', err);
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERED CONSULTATIONS
  // ═══════════════════════════════════════════════════════════
  const filteredConsultations = consultations.filter((consultation) => {
    const status = consultation.status || consultation.sessionStatus;
    return status === 'completed' || status === 'scheduled';
  });

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="bg-white rounded-2xl shadow-xl border border-blue-100/50"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Pill className="w-6 h-6 mr-3 text-blue-600" />
                Quick Prescription
                <span className="ml-3 text-xs bg-blue-500 text-white px-3 py-1 rounded-full">First Visit / OPD</span>
              </h3>
              <p className="text-slate-600 mt-1 text-sm">Create prescription for first-time consultation patients</p>
            </div>
            
            {/* 🔥 NEW: Knowledge Base Button */}
            <button
              type="button"
              onClick={() => setShowKnowledgeBase(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Medicine Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Patient Selection */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Select Patient Consultation
            </h4>
            
            <select
              value={prescriptionForm.consultationId}
              onChange={handleConsultationChange}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">Select Patient Consultation</option>
              {filteredConsultations.map((consultation) => {
                const consultationId = consultation._id || consultation.id;
                const patientName = consultation.patientId?.name || 'Unknown';
                const consultationType = consultation.type || 'consultation';
                const scheduledDate = new Date(consultation.scheduledAt || consultation.scheduledFor).toLocaleDateString();
                
                return (
                  <option key={consultationId} value={consultationId}>
                    {patientName} - {consultationType} - {scheduledDate}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Chief Complaint & Diagnosis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prescriptionForm.chiefComplaint}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, chiefComplaint: e.target.value})}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter patient's complaints and symptoms..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Diagnosis
              </label>
              <textarea
                value={prescriptionForm.diagnosis}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter diagnosis..."
              />
            </div>
          </div>

          {/* Medicine Search & Add */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-emerald-600" />
                Quick Medicine Search
              </h4>
              <span className="text-xs text-slate-600">
                <span className="font-semibold text-emerald-600">{medicineInventory.length}</span> medicines available
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <div className="flex items-center space-x-2 bg-white border-2 border-emerald-200 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowMedicineDropdown(true);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 300)}
                  className="flex-1 outline-none"
                  placeholder="Search medicines from center inventory..."
                />
              </div>

              {/* 🔥 ENHANCED: Search Dropdown with View Details */}
              {showMedicineDropdown && searchQuery && filteredMedicines.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-emerald-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-10">
                  {filteredMedicines.slice(0, 10).map((medicine) => (
                    <div
                      key={medicine._id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="text-xs text-slate-600">{medicine.genericName} • {medicine.category}</p>
                        <p className={`text-xs font-semibold mt-1 ${medicine.stock > 10 ? 'text-emerald-600' : medicine.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          Stock: {medicine.stock || 0}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => viewMedicineDetails(medicine)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => addMedicine(medicine)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Added Medicines List */}
          {prescriptionForm.medicines.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">
                Prescribed Medicines ({prescriptionForm.medicines.length})
              </h4>
              <div className="space-y-4">
                {prescriptionForm.medicines.map((medicine, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-blue-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-bold text-slate-900">{medicine.name}</h5>
                        <p className="text-sm text-slate-600">{medicine.genericName} • {medicine.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                        <select
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option>Once daily</option>
                          <option>Twice daily</option>
                          <option>Thrice daily</option>
                          <option>Four times daily</option>
                          <option>As needed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Timing</label>
                        <select
                          value={medicine.timing}
                          onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option>Before meals</option>
                          <option>After meals</option>
                          <option>With meals</option>
                          <option>Empty stomach</option>
                          <option>Bedtime</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
                        <select
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option>3 days</option>
                          <option>5 days</option>
                          <option>7 days</option>
                          <option>10 days</option>
                          <option>14 days</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Quantity: <strong>{medicine.quantity}</strong></span>
                      <span className={medicine.stock >= medicine.quantity ? 'text-emerald-600' : 'text-red-600'}>
                        Stock: {medicine.stock} {medicine.stock < medicine.quantity && '(Insufficient!)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                General Instructions
              </label>
              <textarea
                value={prescriptionForm.generalInstructions}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, generalInstructions: e.target.value})}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="General care instructions..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Diet Instructions
              </label>
              <textarea
                value={prescriptionForm.dietInstructions}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, dietInstructions: e.target.value})}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Diet restrictions and recommendations..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lifestyle Instructions
              </label>
              <textarea
                value={prescriptionForm.lifestyleInstructions}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, lifestyleInstructions: e.target.value})}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Lifestyle advice and precautions..."
              />
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Follow-up After
            </label>
            <select
              value={prescriptionForm.followUpDays}
              onChange={(e) => setPrescriptionForm({...prescriptionForm, followUpDays: e.target.value})}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
              <option value="10">10 days</option>
              <option value="14">14 days</option>
            </select>
            <p className="text-xs text-slate-600 mt-2">
              💡 If patient doesn't improve, create full treatment plan on next visit
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || prescriptionForm.medicines.length === 0}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Prescription</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* 🔥 NEW: MEDICINE KNOWLEDGE BASE MODAL */}
      <AnimatePresence>
        {showKnowledgeBase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowKnowledgeBase(false);
              setSelectedMedicineDetails(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Medicine Knowledge Base</h2>
                      <p className="text-emerald-100 text-sm mt-1">
                        Browse and search {medicineInventory.length} medicines with detailed information
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowKnowledgeBase(false);
                      setSelectedMedicineDetails(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* View Mode Tabs */}
                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => setViewMode('search')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'search'
                        ? 'bg-white text-emerald-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Search className="w-4 h-4 inline mr-2" />
                    Search
                  </button>
                  <button
                    onClick={() => setViewMode('browse')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'browse'
                        ? 'bg-white text-emerald-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Filter className="w-4 h-4 inline mr-2" />
                    Browse by Category
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex h-[calc(90vh-180px)]">
                {/* Left Sidebar - Medicine List */}
                <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                  {/* Search/Filter Section */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    {viewMode === 'search' ? (
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          placeholder="Search medicines..."
                        />
                      </div>
                    ) : (
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        {medicineCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Medicine List */}
                  <div className="p-4 space-y-2">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.map((medicine) => (
                        <button
                          key={medicine._id}
                          onClick={() => setSelectedMedicineDetails(medicine)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedMedicineDetails?._id === medicine._id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900">{medicine.name}</h3>
                              <p className="text-xs text-slate-600 mt-1">{medicine.category}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  medicine.stock > 10
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : medicine.stock > 0
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {medicine.stock > 0 ? `${medicine.stock} in stock` : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No medicines found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Medicine Details */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedMedicineDetails ? (
                    <div className="space-y-6">
                      {/* Medicine Header */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                              {selectedMedicineDetails.name}
                            </h2>
                            <p className="text-lg text-slate-700">{selectedMedicineDetails.genericName}</p>
                            <div className="flex items-center space-x-3 mt-3">
                              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                                {selectedMedicineDetails.category}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                selectedMedicineDetails.stock > 10
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : selectedMedicineDetails.stock > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedMedicineDetails.stock > 0 
                                  ? `${selectedMedicineDetails.stock} units available`
                                  : 'Out of stock'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Prescribe Button */}
                        <button
                          onClick={() => quickPrescribeFromKB(selectedMedicineDetails)}
                          disabled={selectedMedicineDetails.stock === 0}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Quick Prescribe</span>
                        </button>
                      </div>

                      {/* Medicine Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Composition */}
                        {selectedMedicineDetails.composition && (
                          <div className="col-span-2 bg-white rounded-xl p-4 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                              <Package className="w-4 h-4 mr-2 text-blue-600" />
                              Composition
                            </h3>
                            <p className="text-slate-700">{selectedMedicineDetails.composition}</p>
                          </div>
                        )}

                        {/* Default Dosage */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <h3 className="font-bold text-slate-900 mb-2">Default Dosage</h3>
                          <p className="text-slate-700">{selectedMedicineDetails.defaultDosage || 'Not specified'}</p>
                        </div>

                        {/* Manufacturer */}
                        {selectedMedicineDetails.manufacturer && (
                          <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-2">Manufacturer</h3>
                            <p className="text-slate-700">{selectedMedicineDetails.manufacturer}</p>
                          </div>
                        )}

                        {/* Price */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <h3 className="font-bold text-slate-900 mb-2">Price</h3>
                          <p className="text-2xl font-bold text-emerald-600">₹{selectedMedicineDetails.price}</p>
                          {selectedMedicineDetails.mrp && (
                            <p className="text-sm text-slate-500 line-through">MRP: ₹{selectedMedicineDetails.mrp}</p>
                          )}
                        </div>

                        {/* Expiry Date */}
                        {selectedMedicineDetails.expiryDate && (
                          <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-amber-600" />
                              Expiry Date
                            </h3>
                            <p className="text-slate-700">
                              {new Date(selectedMedicineDetails.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Indications */}
                      {selectedMedicineDetails.indications && selectedMedicineDetails.indications.length > 0 && (
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                            Indications (What it treats)
                          </h3>
                          <ul className="space-y-2">
                            {selectedMedicineDetails.indications.map((indication, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span className="text-slate-700">{indication}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Usage Instructions */}
                      {selectedMedicineDetails.usageInstructions && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-600" />
                            Usage Instructions
                          </h3>
                          <p className="text-slate-700">{selectedMedicineDetails.usageInstructions}</p>
                        </div>
                      )}

                      {/* Contraindications */}
                      {selectedMedicineDetails.contraindications && selectedMedicineDetails.contraindications.length > 0 && (
                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                          <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                            Contraindications
                          </h3>
                          <ul className="space-y-2">
                            {selectedMedicineDetails.contraindications.map((contra, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-red-600 mt-1">⚠️</span>
                                <span className="text-slate-700">{contra}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Side Effects */}
                      {selectedMedicineDetails.sideEffects && selectedMedicineDetails.sideEffects.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                            Side Effects
                          </h3>
                          <ul className="space-y-2">
                            {selectedMedicineDetails.sideEffects.map((effect, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span className="text-slate-700">{effect}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <div className="text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Select a medicine to view details</p>
                        <p className="text-sm mt-2">Browse the list or search to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickPrescription;
