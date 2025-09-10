import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, FileText, Award, Stethoscope, Clock, DollarSign, 
  Upload, X, CheckCircle, AlertCircle, ArrowLeft, ArrowRight,
  Calendar, MapPin, Phone, Mail, Languages, Star, Target,
  Briefcase, GraduationCap, Shield, Heart, Activity, Zap,
  Plus, Trash2, Eye, EyeOff, Save, RefreshCw, Camera,
  Download, Paperclip, Info, Loader2, Check, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const EnhancedDoctorRegistrationForm = () => {
  const navigate = useNavigate();
  const fileInputRefs = useRef({});
  const [mounted, setMounted] = useState(false);

  // Enhanced Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [stepValidation, setStepValidation] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Form Data State with enhanced structure
  const [formData, setFormData] = useState({
    qualifications: {
      bams: {
        degree: '',
        university: '',
        yearOfCompletion: '',
        certificateUrl: '',
        certificateFile: null
      },
      postGraduation: {
        degree: '',
        specialization: '',
        university: '',
        yearOfCompletion: '',
        certificateUrl: '',
        certificateFile: null
      },
      additionalCertifications: []
    },
    medicalRegistration: {
      registrationNumber: '',
      council: '',
      state: '',
      validFrom: '',
      validUpto: '',
      documentUrl: '',
      documentFile: null
    },
    specializations: [],
    panchakarmaExpertise: [],
    experience: {
      totalYears: '',
      workHistory: []
    },
    consultationSettings: {
      fees: {
        videoConsultation: '',
        inPersonConsultation: '',
        followUpConsultation: ''
      },
      availability: {
        workingDays: [],
        workingHours: {
          start: '',
          end: ''
        },
        consultationDuration: 30,
        bookingAdvanceTime: 60
      },
      preferences: {
        languages: [],
        maxPatientsPerDay: 20,
        emergencyConsultations: false
      }
    },
    professionalInfo: {
      bio: '',
      achievements: [],
      publications: [],
      conferences: []
    }
  });

  // File Upload State
  const [uploadProgress, setUploadProgress] = useState({});
  const [filePreviews, setFilePreviews] = useState({});

  // Constants and Options
  const totalSteps = 6;
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  const specializationOptions = [
    'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra',
    'Kaumarabhritya', 'Agadatantra', 'Rasayana', 'Vajikarana',
    'Bhutavidya', 'Vata Disorders', 'Pitta Disorders', 'Kapha Disorders',
    'Tridosha Imbalance', 'Lifestyle Disorders', 'Chronic Pain Management',
    'Stress & Mental Health', 'Women Health', 'Digestive Disorders',
    'Skin Disorders', 'Respiratory Disorders'
  ];

  const panchakarmaTherapies = [
    'Vamana', 'Virechana', 'Basti', 'Nasya', 'Raktamokshana',
    'Abhyanga', 'Shirodhara', 'Shirobasti', 'Karna Purana',
    'Akshi Tarpana', 'Udvartana', 'Pizhichil', 'Njavarakizhi',
    'Elakizhi', 'Kizhi', 'Steam Bath', 'Marma Therapy'
  ];

  const languageOptions = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Sanskrit'
  ];

  const workingDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
  ];

  const stepTitles = [
    'Educational Qualifications',
    'Medical Registration',
    'Specializations & Expertise',
    'Professional Experience',
    'Consultation Settings',
    'Review & Submit'
  ];

  // Lifecycle Effects
  useEffect(() => {
    setMounted(true);
    // Load saved form data from localStorage
    const savedData = localStorage.getItem('doctorRegistrationForm');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setHasUnsavedChanges(true);
      } catch (err) {
        console.error('Error loading saved form data:', err);
      }
    }
  }, []);

  useEffect(() => {
    // Save form data to localStorage when it changes
    if (mounted && hasUnsavedChanges) {
      localStorage.setItem('doctorRegistrationForm', JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges, mounted]);

  useEffect(() => {
    // Calculate completion percentage
    calculateCompletionPercentage();
    validateCurrentStep();
  }, [formData, currentStep]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Helper Functions
  const updateFormData = useCallback((section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateNestedFormData = useCallback((section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (file.size > maxFileSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    if (!allowedFileTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF, JPG, and PNG files are allowed' };
    }
    
    return { valid: true };
  };

  const handleFileUpload = async (file, fileType, section = null) => {
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const uploadId = `${fileType}_${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', fileType);

      const response = await axios.post('/api/upload/certificate', formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [uploadId]: percentCompleted }));
        }
      });

      if (response.data.success) {
        const filePreview = {
          name: file.name,
          url: response.data.data.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        };

        setFilePreviews(prev => ({
          ...prev,
          [fileType]: filePreview
        }));

        // Update form data based on file type
        if (section) {
          updateNestedFormData(section.section, section.subsection, section.field, response.data.data.url);
        }

        setSuccess('File uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('File upload failed. Please try again.');
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
    }
  };

  const calculateCompletionPercentage = () => {
    let totalFields = 0;
    let filledFields = 0;

    // Step 1: Qualifications
    totalFields += 3; // BAMS degree, university, year
    if (formData.qualifications.bams.degree) filledFields++;
    if (formData.qualifications.bams.university) filledFields++;
    if (formData.qualifications.bams.yearOfCompletion) filledFields++;

    // Step 2: Medical Registration
    totalFields += 5;
    if (formData.medicalRegistration.registrationNumber) filledFields++;
    if (formData.medicalRegistration.council) filledFields++;
    if (formData.medicalRegistration.state) filledFields++;
    if (formData.medicalRegistration.validFrom) filledFields++;
    if (formData.medicalRegistration.validUpto) filledFields++;

    // Step 3: Specializations
    totalFields += 1;
    if (formData.specializations.length > 0) filledFields++;

    // Step 4: Experience
    totalFields += 1;
    if (formData.experience.totalYears) filledFields++;

    // Step 5: Consultation Settings
    totalFields += 5;
    if (formData.consultationSettings.fees.videoConsultation) filledFields++;
    if (formData.consultationSettings.fees.inPersonConsultation) filledFields++;
    if (formData.consultationSettings.availability.workingDays.length > 0) filledFields++;
    if (formData.consultationSettings.availability.workingHours.start) filledFields++;
    if (formData.consultationSettings.availability.workingHours.end) filledFields++;

    const percentage = Math.round((filledFields / totalFields) * 100);
    setCompletionPercentage(percentage);
  };

  const validateStep = (step) => {
    let isValid = true;
    let errors = [];

    switch (step) {
      case 1:
        if (!formData.qualifications.bams.degree) {
          errors.push('BAMS degree is required');
          isValid = false;
        }
        if (!formData.qualifications.bams.university) {
          errors.push('University name is required');
          isValid = false;
        }
        if (!formData.qualifications.bams.yearOfCompletion) {
          errors.push('Year of completion is required');
          isValid = false;
        } else if (formData.qualifications.bams.yearOfCompletion < 1980 || formData.qualifications.bams.yearOfCompletion > new Date().getFullYear()) {
          errors.push('Please enter a valid year');
          isValid = false;
        }
        break;

      case 2:
        if (!formData.medicalRegistration.registrationNumber) {
          errors.push('Registration number is required');
          isValid = false;
        }
        if (!formData.medicalRegistration.council) {
          errors.push('Medical council is required');
          isValid = false;
        }
        if (!formData.medicalRegistration.state) {
          errors.push('State of registration is required');
          isValid = false;
        }
        if (!formData.medicalRegistration.validFrom) {
          errors.push('Valid from date is required');
          isValid = false;
        }
        if (!formData.medicalRegistration.validUpto) {
          errors.push('Valid until date is required');
          isValid = false;
        }
        if (formData.medicalRegistration.validFrom && formData.medicalRegistration.validUpto) {
          if (new Date(formData.medicalRegistration.validFrom) >= new Date(formData.medicalRegistration.validUpto)) {
            errors.push('Valid until date must be after valid from date');
            isValid = false;
          }
        }
        break;

      case 3:
        if (formData.specializations.length === 0) {
          errors.push('At least one specialization is required');
          isValid = false;
        }
        break;

      case 4:
        if (!formData.experience.totalYears && formData.experience.totalYears !== 0) {
          errors.push('Total years of experience is required');
          isValid = false;
        }
        if (formData.experience.totalYears < 0 || formData.experience.totalYears > 60) {
          errors.push('Experience must be between 0 and 60 years');
          isValid = false;
        }
        break;

      case 5:
        if (!formData.consultationSettings.fees.videoConsultation) {
          errors.push('Video consultation fee is required');
          isValid = false;
        }
        if (!formData.consultationSettings.fees.inPersonConsultation) {
          errors.push('In-person consultation fee is required');
          isValid = false;
        }
        if (formData.consultationSettings.availability.workingDays.length === 0) {
          errors.push('At least one working day is required');
          isValid = false;
        }
        if (!formData.consultationSettings.availability.workingHours.start) {
          errors.push('Start time is required');
          isValid = false;
        }
        if (!formData.consultationSettings.availability.workingHours.end) {
          errors.push('End time is required');
          isValid = false;
        }
        if (formData.consultationSettings.availability.workingHours.start >= formData.consultationSettings.availability.workingHours.end) {
          errors.push('End time must be after start time');
          isValid = false;
        }
        break;

      case 6:
        // Final validation - check all previous steps
        for (let i = 1; i < 6; i++) {
          if (!validateStep(i).isValid) {
            errors.push(`Please complete Step ${i}: ${stepTitles[i - 1]}`);
            isValid = false;
          }
        }
        break;
    }

    return { isValid, errors };
  };

  const validateCurrentStep = () => {
    const validation = validateStep(currentStep);
    setStepValidation(prev => ({
      ...prev,
      [currentStep]: validation
    }));
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (validation.isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
      setWarnings([]);
      window.scrollTo(0, 0);
    } else {
      setError('Please fix the following errors before proceeding:');
      setWarnings(validation.errors);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
    setWarnings([]);
    window.scrollTo(0, 0);
  };

  const saveProgress = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/doctors/save-progress', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess('Progress saved successfully!');
        setHasUnsavedChanges(false);
        localStorage.removeItem('doctorRegistrationForm');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const finalValidation = validateStep(6);
    if (!finalValidation.isValid) {
      setError('Please complete all required fields before submitting.');
      setWarnings(finalValidation.errors);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post('/api/doctors/register', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess('Registration submitted successfully! Your profile is under review.');
        setHasUnsavedChanges(false);
        localStorage.removeItem('doctorRegistrationForm');
        
        setTimeout(() => {
          navigate('/doctor-dashboard', { 
            state: { 
              message: 'Registration completed. Please wait for verification.',
              registrationId: response.data.data.doctor.id
            }
          });
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      if (err.response?.data?.details) {
        setWarnings(err.response.data.details);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced File Upload Component
  const FileUploadZone = ({ fileType, label, preview, required = false, accept = "image/*,application/pdf" }) => {
    const isUploading = Object.keys(uploadProgress).some(key => key.includes(fileType));
    const uploadPercent = Object.entries(uploadProgress).find(([key]) => key.includes(fileType))?.[1] || 0;

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative">
          <div className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
            preview 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
          }`}>
            <input
              type="file"
              ref={el => fileInputRefs.current[fileType] = el}
              onChange={(e) => handleFileUpload(e.target.files[0], fileType)}
              accept={accept}
              className="hidden"
            />

            {isUploading ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-16 h-16 border-4 border-emerald-200 rounded-full"></div>
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"
                    style={{
                      background: `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${uploadPercent * 3.6}deg, transparent ${uploadPercent * 3.6}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-600">{uploadPercent}%</span>
                  </div>
                </div>
                <p className="text-emerald-600 font-medium">Uploading...</p>
              </div>
            ) : preview ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                    {preview.type?.includes('pdf') ? (
                      <FileText className="w-6 h-6 text-white" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">{preview.name}</p>
                    <p className="text-sm text-gray-500">
                      {(preview.size / 1024 / 1024).toFixed(2)} MB
                      {preview.uploadedAt && (
                        <span className="ml-2 text-emerald-600">
                          • Uploaded {new Date(preview.uploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {preview.url && (
                    <button
                      type="button"
                      onClick={() => window.open(preview.url, '_blank')}
                      className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="View file"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilePreviews(prev => ({ ...prev, [fileType]: null }))}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer"
                onClick={() => fileInputRefs.current[fileType]?.click()}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-gray-700 font-medium mb-2">Click to upload {label.toLowerCase()}</p>
                <p className="text-sm text-gray-500">
                  PDF, JPG, PNG up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Progress Bar
  const ProgressBar = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Registration Progress</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{completionPercentage}% Complete</span>
          {hasUnsavedChanges && (
            <button
              onClick={saveProgress}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Progress</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const step = index + 1;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            const isValid = stepValidation[step]?.isValid !== false;
            
            return (
              <React.Fragment key={step}>
                <div 
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                      : isActive 
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50 scale-110 shadow-lg' 
                        : isValid
                          ? 'border-gray-300 text-gray-400 hover:border-emerald-300'
                          : 'border-red-300 text-red-500 bg-red-50'
                  }`}
                  onClick={() => {
                    if (step < currentStep || (step === currentStep)) {
                      setCurrentStep(step);
                    }
                  }}
                  title={stepTitles[index]}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : !isValid && step !== currentStep ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <span className="font-bold">{step}</span>
                  )}
                  
                  {/* Step Label */}
                  <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                    isActive ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {stepTitles[index].split(' ')[0]}
                  </div>
                </div>
                
                {step < totalSteps && (
                  <div className={`w-16 h-0.5 ${
                    step < currentStep ? 'bg-emerald-500' : 'bg-gray-300'
                  } transition-colors duration-200`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Step 1: Enhanced Qualifications
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Educational Qualifications</h2>
        <p className="text-gray-600 text-lg">Let's start with your educational background and certifications</p>
      </div>

      {/* BAMS Qualification */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-emerald-600" />
          BAMS Degree
          <span className="text-red-500">*</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Degree Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.qualifications.bams.degree}
              onChange={(e) => updateNestedFormData('qualifications', 'bams', 'degree', e.target.value)}
              placeholder="Bachelor of Ayurvedic Medicine and Surgery"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              University <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.qualifications.bams.university}
              onChange={(e) => updateNestedFormData('qualifications', 'bams', 'university', e.target.value)}
              placeholder="University name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Year of Completion <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.qualifications.bams.yearOfCompletion}
              onChange={(e) => updateNestedFormData('qualifications', 'bams', 'yearOfCompletion', parseInt(e.target.value))}
              placeholder="2020"
              min="1980"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div>
            <FileUploadZone 
              fileType="bamsCertificate"
              label="BAMS Certificate"
              preview={filePreviews.bamsCertificate}
              required
            />
          </div>
        </div>
      </div>

      {/* Post Graduation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-amber-500" />
          Post Graduation (Optional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Degree</label>
            <select
              value={formData.qualifications.postGraduation.degree}
              onChange={(e) => updateNestedFormData('qualifications', 'postGraduation', 'degree', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            >
              <option value="">Select degree</option>
              <option value="MD (Ayurveda)">MD (Ayurveda)</option>
              <option value="MS (Ayurveda)">MS (Ayurveda)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Specialization</label>
            <input
              type="text"
              value={formData.qualifications.postGraduation.specialization}
              onChange={(e) => updateNestedFormData('qualifications', 'postGraduation', 'specialization', e.target.value)}
              placeholder="Specialization area"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">University</label>
            <input
              type="text"
              value={formData.qualifications.postGraduation.university}
              onChange={(e) => updateNestedFormData('qualifications', 'postGraduation', 'university', e.target.value)}
              placeholder="University name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Year of Completion</label>
            <input
              type="number"
              value={formData.qualifications.postGraduation.yearOfCompletion}
              onChange={(e) => updateNestedFormData('qualifications', 'postGraduation', 'yearOfCompletion', parseInt(e.target.value))}
              placeholder="2022"
              min="1980"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>
        
        {formData.qualifications.postGraduation.degree && (
          <div className="mt-6">
            <FileUploadZone 
              fileType="postGradCertificate"
              label="Post Graduation Certificate"
              preview={filePreviews.postGradCertificate}
            />
          </div>
        )}
      </div>

      {/* Additional Certifications */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            Additional Certifications
          </h3>
          <button
            type="button"
            onClick={() => {
              const newCert = {
                name: '',
                institution: '',
                year: '',
                certificateUrl: ''
              };
              updateFormData('qualifications', 'additionalCertifications', [...formData.qualifications.additionalCertifications, newCert]);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>
        
        {formData.qualifications.additionalCertifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No additional certifications added yet.</p>
            <p className="text-sm">Click "Add Certification" to include your additional qualifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.qualifications.additionalCertifications.map((cert, index) => (
              <div key={index} className="border border-purple-200 rounded-xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Certification {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedCerts = formData.qualifications.additionalCertifications.filter((_, i) => i !== index);
                      updateFormData('qualifications', 'additionalCertifications', updatedCerts);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Certification Name</label>
                    <input
                      type="text"
                      value={cert.name || ''}
                      onChange={(e) => {
                        const updatedCerts = [...formData.qualifications.additionalCertifications];
                        updatedCerts[index] = { ...cert, name: e.target.value };
                        updateFormData('qualifications', 'additionalCertifications', updatedCerts);
                      }}
                      placeholder="Certification name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Institution</label>
                    <input
                      type="text"
                      value={cert.institution || ''}
                      onChange={(e) => {
                        const updatedCerts = [...formData.qualifications.additionalCertifications];
                        updatedCerts[index] = { ...cert, institution: e.target.value };
                        updateFormData('qualifications', 'additionalCertifications', updatedCerts);
                      }}
                      placeholder="Issuing institution"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="number"
                      value={cert.year || ''}
                      onChange={(e) => {
                        const updatedCerts = [...formData.qualifications.additionalCertifications];
                        updatedCerts[index] = { ...cert, year: parseInt(e.target.value) };
                        updateFormData('qualifications', 'additionalCertifications', updatedCerts);
                      }}
                      placeholder="Year obtained"
                      min="1980"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <FileUploadZone 
                      fileType={`additionalCert${index}`}
                      label="Certificate"
                      preview={filePreviews[`additionalCert${index}`]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Continue with other steps... (Step 2, 3, 4, 5, 6)
  // For brevity, I'll show the structure for remaining steps

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Medical Registration</h2>
        <p className="text-gray-600 text-lg">Your professional licensing and registration details</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.medicalRegistration.registrationNumber}
              onChange={(e) => updateNestedFormData('medicalRegistration', 'registrationNumber', '', e.target.value)}
              placeholder="Enter registration number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Medical Council <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.medicalRegistration.council}
              onChange={(e) => updateNestedFormData('medicalRegistration', 'council', '', e.target.value)}
              placeholder="e.g., State Board of Ayurveda"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              State of Registration <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.medicalRegistration.state}
              onChange={(e) => updateNestedFormData('medicalRegistration', 'state', '', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              required
            >
              <option value="">Select state</option>
              {indianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Valid From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.medicalRegistration.validFrom}
              onChange={(e) => updateNestedFormData('medicalRegistration', 'validFrom', '', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Valid Until <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.medicalRegistration.validUpto}
              onChange={(e) => updateNestedFormData('medicalRegistration', 'validUpto', '', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>
          
          <div>
            <FileUploadZone 
              fileType="registrationDocument"
              label="Registration Certificate"
              preview={filePreviews.registrationDocument}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Similar enhanced implementations for steps 3-6...

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      // Add cases for steps 3-6 here
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Doctor Registration
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Complete your professional profile to join our platform and start helping patients
          </p>
        </div>

        {/* Enhanced Progress Bar */}
        <ProgressBar />

        {/* Main Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Status Messages */}
            {success && (
              <div className="mb-8 flex items-center space-x-3 bg-green-100 border border-green-300 rounded-2xl p-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-semibold text-lg">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-semibold text-lg">{error}</p>
                </div>
                {warnings.length > 0 && (
                  <ul className="ml-11 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-red-700 text-sm">• {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[800px]">
              {renderStepContent()}
            </div>

            {/* Enhanced Navigation */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-3 px-8 py-4 text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Previous</span>
              </button>

              <div className="flex items-center space-x-4">
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                )}
                
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="font-semibold">Next Step</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-semibold">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-semibold">Complete Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Auto-Save Enabled</span>
            </div>
          </div>
          <p className="text-gray-400 mt-4">
            Your information is secure and will be reviewed for verification before account activation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDoctorRegistrationForm;
