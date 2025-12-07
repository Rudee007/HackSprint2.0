import { Search, MapPin, Stethoscope, TrendingUp, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "../utils/i18n.jsx";

const ProcessSection = () => {
  const { t } = useI18n();

  const steps = [
    {
      icon: Search,
      title: t('process.step1.title', 'Know Your Diseases'),
      description: t('process.step1.desc', 'Understand your health conditions through comprehensive Ayurvedic assessment and diagnosis.'),
    },
    {
      icon: MapPin,
      title: t('process.step2.title', 'Find Nearby Centers'),
      description: t('process.step2.desc', 'Locate certified Ayurved health centers and practitioners in your area.'),
    },
    {
      icon: Stethoscope,
      title: t('process.step3.title', 'Consult & Plan'),
      description: t('process.step3.desc', 'Vaidya diagnoses and creates a personalized digital Panchakarma plan.'),
    },
    {
      icon: TrendingUp,
      title: t('process.step4.title', 'Track & Heal'),
      description: t('process.step4.desc', 'Log your daily progress, track milestones, and communicate with your therapist easily.'),
    },
    {
      icon: Heart,
      title: t('process.step5.title', 'Recover & Thrive'),
      description: t('process.step5.desc', 'Receive post-therapy guidance and see your holistic improvement over time.'),
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-900 mb-3 sm:mb-4 tracking-tight">
            {t('process.title', 'Your Journey to Wellness')}
          </h2>
          <p className="text-emerald-800/80 max-w-2xl mx-auto text-sm sm:text-base">
            {t('process.subtitle', 'Simple, guided steps that take you from discovery to long‑term balance.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 px-2 sm:px-0">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                className="text-center group"
                style={{ perspective: '1000px' }}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -6 }}
              >
                <div className="relative h-64 sm:h-72 lg:h-80 w-full rounded-xl transition-all duration-700 md:group-hover:rotate-y-180 md:group-hover:scale-[1.03] md:group-hover:-translate-y-2" style={{transformStyle: 'preserve-3d'}}>
                  {/* Front of card */}
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-xl p-4 sm:p-6 flex flex-col justify-center items-center shadow-sm group-hover:shadow-xl group-hover:shadow-emerald-200/60 transition-shadow duration-300" style={{backfaceVisibility: 'hidden'}}>
                    <div className="relative mb-4 sm:mb-6">
                      <motion.div
                        className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto transition-transform duration-300 shadow-md group-hover:rotate-3"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
                      >
                        <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                      </motion.div>
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-emerald-900 mb-2 sm:mb-4 leading-tight px-2">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-emerald-800/80 font-medium text-center md:hidden px-2">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Back of card - desktop only */}
                  <div className="absolute inset-0 bg-emerald-50/60 backdrop-blur-lg border border-emerald-200 rounded-xl p-4 sm:p-6 flex-col justify-center shadow-sm hidden md:flex" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                    <p className="text-sm sm:text-base text-emerald-900 font-medium leading-relaxed text-center">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
