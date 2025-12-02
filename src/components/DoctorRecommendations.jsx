/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { ArrowLeft, Star, MapPin, Clock, User, Award, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DoctorDetails from "./DoctorDetails";

export default function DoctorRecommendations({ doctors, onBack, onSchedule, quickAppointmentData }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  if (selectedDoctor) {
    return (
      <DoctorDetails
        doctor={selectedDoctor}
        onBack={() => setSelectedDoctor(null)}
        onSchedule={onSchedule}
        quickAppointmentData={quickAppointmentData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/40">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4">
          <button 
            onClick={onBack} 
            className="hover:text-emerald-200 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h1 className="font-bold text-lg">Recommended Doctors</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">
            Found {doctors.length} Specialists for You
          </h2>
          <p className="text-gray-600">
            Based on your symptoms, here are the best Ayurvedic doctors available
          </p>
        </motion.div>

        {/* Doctor Cards */}
        <div className="space-y-4">
          <AnimatePresence>
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.doctorId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-emerald-100"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Doctor Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                      {doctor.name?.[0]?.toUpperCase() || "D"}
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            Dr. {doctor.name}
                          </h3>
                          <p className="text-emerald-600 font-semibold mb-2">
                            {doctor.speciality}
                          </p>
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full border border-yellow-200">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="text-sm font-bold text-yellow-800">
                            {doctor.rating}
                          </span>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">{doctor.experience}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">{doctor.location}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialty Highlight */}
                <div className="bg-emerald-50 px-6 py-3 border-t border-emerald-100">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">Specializes in:</span> {doctor.speciality}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            All doctors are verified Ayurvedic practitioners with proper certifications
          </p>
        </motion.div>
      </main>
    </div>
  );
}