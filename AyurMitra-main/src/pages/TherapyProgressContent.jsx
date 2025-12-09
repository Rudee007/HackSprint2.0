// src/components/TherapyProgressContent.jsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, CheckCircle, Clock, Star } from "lucide-react";
import { Doughnut } from "react-chartjs-2";

const TherapyProgressContent = ({
  therapyData,
  createDoughnutData,
  doughnutOptions,
  setActiveSection,
}) => {
  const phases = [
    {
      name: "Purva Karma",
      subtitle: "Preparation Phase",
      completed: therapyData.purvaDaysCompleted,
      total: therapyData.totalTreatmentDays,
      color: "#10b981",
      description: "Cleansing and preparation procedures",
      activities: ["Oleation (Snehana)", "Sudation (Swedana)", "Dietary Changes"],
    },
    {
      name: "Pradhana Karma",
      subtitle: "Main Treatment Phase",
      completed: therapyData.pradhanaDaysCompleted,
      total: therapyData.totalTreatmentDays,
      color: "#f59e0b",
      description: "Core Panchakarma procedures",
      activities: ["Vamana", "Virechana", "Basti", "Nasya", "Raktamokshana"],
    },
    {
      name: "Paschat Karma",
      subtitle: "Post-Treatment Phase",
      completed: therapyData.paschatDaysCompleted,
      total: therapyData.totalTreatmentDays,
      color: "#6366f1",
      description: "Rejuvenation and follow-up care",
      activities: ["Diet Regulation", "Lifestyle Changes", "Rasayana Therapy"],
    },
  ];

  const totalCompleted = therapyData.purvaDaysCompleted + therapyData.pradhanaDaysCompleted + therapyData.paschatDaysCompleted;
  const overallProgress = Math.round((totalCompleted / (therapyData.totalTreatmentDays * 3)) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveSection("dashboard")}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">{overallProgress}% Complete</span>
        </div>
      </div>

      {/* Main Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Star className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Panchakarma Journey</h1>
              <p className="text-emerald-50">Track your complete treatment progress</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <CheckCircle className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{totalCompleted}</div>
              <div className="text-sm text-emerald-50">Days Completed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Clock className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{(therapyData.totalTreatmentDays * 3) - totalCompleted}</div>
              <div className="text-sm text-emerald-50">Days Remaining</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <TrendingUp className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <div className="text-sm text-emerald-50">Overall Progress</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phase Details */}
      <div className="grid md:grid-cols-3 gap-6">
        {phases.map((phase, index) => (
          <motion.div
            key={phase.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            {/* Progress Chart */}
            <div className="relative h-48 mb-6">
              <Doughnut
                data={createDoughnutData(phase.completed, phase.total, phase.color)}
                options={doughnutOptions}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-gray-900">
                  {Math.round((phase.completed / phase.total) * 100)}%
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {phase.completed}/{phase.total} days
                </div>
              </div>
            </div>

            {/* Phase Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{phase.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{phase.subtitle}</p>
              <p className="text-sm text-gray-700 mb-4">{phase.description}</p>

              {/* Activities */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Activities:</h4>
                <ul className="space-y-1">
                  {phase.activities.map((activity, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(phase.completed / phase.total) * 100}%`,
                    backgroundColor: phase.color,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Treatment Timeline</h2>
        <div className="relative">
          {phases.map((phase, index) => (
            <div key={phase.name} className="flex gap-4 mb-8 last:mb-0">
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                  style={{ backgroundColor: phase.color }}
                >
                  {index + 1}
                </div>
                {index < phases.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <h3 className="font-bold text-gray-900 mb-1">{phase.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{phase.subtitle}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">
                    <span className="font-semibold">{phase.completed}</span> of{" "}
                    <span className="font-semibold">{phase.total}</span> days
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${phase.color}20`,
                      color: phase.color,
                    }}
                  >
                    {Math.round((phase.completed / phase.total) * 100)}% Complete
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TherapyProgressContent;
