// src/components/DashboardContent.jsx
import React from "react";
import { motion } from "framer-motion";
import { 
  Calendar, CheckCircle, Pill, Activity, ArrowRight, 
  Bot, Sparkles, Star 
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";

const DashboardContent = ({
  stats,
  therapyData,
  consultations,
  prescriptions,
  createDoughnutData,
  doughnutOptions,
  getDisplayName,
  setActiveSection,
  onOpenChatbot,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48" />
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {getDisplayName()}! 🌿</h1>
          <p className="text-emerald-50 text-lg mb-6">Continue your Ayurvedic wellness journey</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sessions", value: stats.completedConsultations, icon: CheckCircle },
              { label: "Upcoming", value: stats.upcomingConsultations, icon: Calendar },
              { label: "Prescriptions", value: stats.activePrescriptions, icon: Pill },
              { label: "Total", value: stats.totalConsultations, icon: Activity },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
                <div className="text-sm text-emerald-50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickActionCard
          onClick={() => setActiveSection("book-appointment")}
          icon={Calendar}
          title="Book Appointment"
          description="Schedule your next session"
          gradient="from-emerald-500 to-teal-600"
        />

        <QuickActionCard
          onClick={onOpenChatbot}
          icon={Bot}
          title="Ask AyurBot"
          description="AI-powered health guidance"
          gradient="from-blue-600 to-cyan-600"
          badge={<Sparkles className="w-4 h-4 text-yellow-500" />}
        />

        <QuickActionCard
          onClick={() => setActiveSection("prescriptions")}
          icon={Pill}
          title="Prescriptions"
          description="View your medications"
          gradient="from-indigo-500 to-blue-600"
        />
      </div>

      {/* 🔥 Therapy Progress Preview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Panchakarma Progress</h2>
          <button
            onClick={() => setActiveSection("therapy-progress")}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View Details <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Purva Karma", completed: therapyData.purvaDaysCompleted, total: therapyData.totalTreatmentDays, color: "#10b981" },
            { name: "Pradhana Karma", completed: therapyData.pradhanaDaysCompleted, total: therapyData.totalTreatmentDays, color: "#f59e0b" },
            { name: "Paschat Karma", completed: therapyData.paschatDaysCompleted, total: therapyData.totalTreatmentDays, color: "#6366f1" },
          ].map((phase, i) => (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="text-center"
            >
              <div className="relative h-32 mb-3">
                <Doughnut
                  data={createDoughnutData(phase.completed, phase.total, phase.color)}
                  options={doughnutOptions}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round((phase.completed / phase.total) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {phase.completed}/{phase.total} days
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">{phase.name}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Consultations</h2>
          <button
            onClick={() => setActiveSection("consultations")}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {consultations?.length > 0 ? (
          <div className="space-y-3">
            {consultations.slice(0, 5).map((consultation) => (
              <motion.div
                key={consultation._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {consultation.therapyData?.therapyName || "Consultation"}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{new Date(consultation.scheduledAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      {new Date(consultation.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    consultation.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : consultation.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {consultation.status}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No Consultations Yet"
            description="Start your wellness journey by booking your first session"
            buttonText="Book Your First Session"
            onButtonClick={() => setActiveSection("book-appointment")}
          />
        )}
      </div>

      {/* Active Prescriptions */}
      {prescriptions?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Active Prescriptions</h2>
            <button
              onClick={() => setActiveSection("prescriptions")}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {prescriptions.slice(0, 4).map((prescription) => (
              <div
                key={prescription._id}
                className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">
                    {prescription.medications?.[0]?.medicineName || "Prescription"}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {prescription.medications?.length || 0} medication(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component: Quick Action Card
const QuickActionCard = ({ onClick, icon: Icon, title, description, gradient, badge }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group relative overflow-hidden"
  >
    {badge && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />
    )}
    <div className="relative">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        {title} {badge}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </motion.button>
);

// Helper Component: Empty State
const EmptyState = ({ icon: Icon, title, description, buttonText, onButtonClick }) => (
  <div className="text-center py-12">
    <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <button
      onClick={onButtonClick}
      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
    >
      <Calendar className="w-5 h-5" />
      {buttonText}
    </button>
  </div>
);

export default DashboardContent;
