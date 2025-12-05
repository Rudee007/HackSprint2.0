import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ClipboardList, Stethoscope, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// Utility functions for formatting
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
};

// The modal component
const TreatmentPlanDetailsModal = ({ isOpen, onClose, treatmentPlan, loading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-100 p-4 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-xl font-semibold">{treatmentPlan?.treatmentCategory || 'Treatment Plan Details'}</h2>
              <button onClick={onClose} className="text-gray-700 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : (
                <>
                  {/* Patient Info */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><User size={16}/> Patient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
                      <div><strong>Name:</strong> {treatmentPlan?.patientId?.name || 'N/A'}</div>
                      <div><strong>Email:</strong> {treatmentPlan?.patientId?.email || 'N/A'}</div>
                      <div><strong>Phone:</strong> {formatPhoneNumber(treatmentPlan?.patientId?.phone)}</div>
                      <div><strong>Gender / Age:</strong> {treatmentPlan?.patientId?.profile?.gender || 'N/A'} / {calculateAge(treatmentPlan?.patientId?.profile?.dateOfBirth)} years</div>
                    </div>
                  </section>

                  {/* Treatment Details */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><ClipboardList size={16}/> Treatment Details</h3>
                    <p><strong>Type:</strong> {treatmentPlan?.treatmentCategory || 'N/A'} - {treatmentPlan?.panchakarmaType || 'N/A'}</p>
                    <p><strong>Name:</strong> {treatmentPlan?.treatmentName || 'No treatment plan specified'}</p>
                    <p><strong>Duration:</strong> {treatmentPlan?.totalDays || 'N/A'} days</p>
                    <p><strong>Status:</strong> {treatmentPlan?.status || 'N/A'}</p>

                    {treatmentPlan?.phases?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Phases and Therapy Sessions</h4>
                        {treatmentPlan.phases.map(phase => (
                          <div key={phase._id} className="mb-4 p-3 border rounded-md bg-gray-50">
                            <p><strong>{phase.phaseName.toUpperCase()}</strong> - Duration: {phase.totalDays} days</p>
                            <p><strong>Instructions:</strong> {phase.phaseInstructions || 'No instructions provided'}</p>
                            {phase.dietPlan && <p><strong>Diet Plan:</strong> {phase.dietPlan}</p>}
                            {phase.lifestyleGuidelines && <p><strong>Lifestyle Guidelines:</strong> {phase.lifestyleGuidelines}</p>}
                            <div>
                              <strong>Therapy Sessions:</strong>
                              {phase.therapySessions?.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {phase.therapySessions.map(session => (
                                    <li key={session._id}>
                                      {session.therapyName} ({session.therapyType}) x {session.sessionCount} sessions, Frequency: {session.frequency || 'daily'}, Duration: {session.durationMinutes} mins
                                    </li>
                                  ))}
                                </ul>
                              ) : <p>No therapy sessions defined</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Scheduling Preferences */}
                  {treatmentPlan?.schedulingPreferences && (
                    <section className="mt-4 p-4 border rounded-md bg-gray-100">
                      <h3 className="font-semibold mb-2 text-gray-800">Scheduling Preferences</h3>
                      <p><strong>Start Date:</strong> {formatDate(treatmentPlan.schedulingPreferences.startDate)}</p>
                      <p><strong>Preferred Time Slot:</strong> {treatmentPlan.schedulingPreferences.preferredTimeSlot || 'Flexible'}</p>
                      {treatmentPlan.schedulingPreferences.specificTime && <p><strong>Specific Time:</strong> {treatmentPlan.schedulingPreferences.specificTime}</p>}
                      <p><strong>Skip Weekends:</strong> {treatmentPlan.schedulingPreferences.skipWeekends ? 'Yes' : 'No'}</p>
                      <p><strong>Skip Holidays:</strong> {treatmentPlan.schedulingPreferences.skipHolidays ? 'Yes' : 'No'}</p>
                      <p><strong>Require Same Therapist:</strong> {treatmentPlan.schedulingPreferences.requireSameTherapist ? 'Yes' : 'No'}</p>
                      {treatmentPlan.schedulingPreferences.preferredRoom && <p><strong>Preferred Room:</strong> {treatmentPlan.schedulingPreferences.preferredRoom}</p>}
                    </section>
                  )}

                  {/* Notes & Instructions */}
                  <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {treatmentPlan.prePanchakarmaInstructions && (
                      <div className="p-4 border rounded-md bg-yellow-50 text-yellow-900">
                        <h4 className="font-semibold flex items-center gap-1"><AlertTriangle size={16}/> Pre-Panchakarma Instructions</h4>
                        <p className="whitespace-pre-wrap">{treatmentPlan.prePanchakarmaInstructions}</p>
                      </div>
                    )}
                    {treatmentPlan.postPanchakarmaInstructions && (
                      <div className="p-4 border rounded-md bg-green-50 text-green-900">
                        <h4 className="font-semibold flex items-center gap-1"><CheckCircle size={16} /> Post-Panchakarma Instructions</h4>
                        <p className="whitespace-pre-wrap">{treatmentPlan.postPanchakarmaInstructions}</p>
                      </div>
                    )}
                    {treatmentPlan.treatmentNotes && (
                      <div className="col-span-1 md:col-span-2 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-semibold mb-2">General Treatment Notes</h4>
                        <p className="whitespace-pre-wrap">{treatmentPlan.treatmentNotes}</p>
                      </div>
                    )}
                    {treatmentPlan.safetyNotes && (
                      <div className="col-span-1 md:col-span-2 p-4 border rounded-md bg-red-50 text-red-700">
                        <h4 className="font-semibold mb-2">Patient Safety Notes</h4>
                        <p className="whitespace-pre-wrap">{treatmentPlan.safetyNotes}</p>
                      </div>
                    )}
                  </section>

                  {/* Progress */}
                  <section className="mt-4 p-4 border rounded-md bg-yellow-50 text-yellow-800">
                    <h3 className="font-semibold flex items-center gap-1 mb-3"><TrendingUp size={16} /> Treatment Progress</h3>
                    <div className="flex justify-between mb-2">
                      <span>Progress</span>
                      <span className="font-bold">{treatmentPlan.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-yellow-600 h-4 rounded-full transition-all"
                        style={{ width: `${treatmentPlan.progress || 0}%` }}
                      />
                    </div>
                    {treatmentPlan.notes && (
                      <p className="mt-3 whitespace-pre-wrap">{treatmentPlan.notes}</p>
                    )}
                  </section>

                  {/* Timestamps */}
                  <section className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Created At:</strong>
                      <p>{formatDateTime(treatmentPlan.createdAt)}</p>
                    </div>
                    <div>
                      <strong>Last Updated:</strong>
                      <p>{formatDateTime(treatmentPlan.updatedAt)}</p>
                    </div>
                  </section>

                  {/* Doctor Info */}
                  {treatmentPlan.doctorId && (
                    <section className="mt-4 p-4 border rounded-md bg-blue-50 text-blue-800">
                      <h3 className="font-semibold flex items-center gap-1 mb-2"><Stethoscope size={16} /> Prescribed By</h3>
                      <p><strong>Name:</strong> {treatmentPlan.doctorId.name || 'N/A'}</p>
                      {treatmentPlan.doctorId.specialization && <p><strong>Specialization:</strong> {treatmentPlan.doctorId.specialization}</p>}
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TreatmentPlanDetailsModal;
