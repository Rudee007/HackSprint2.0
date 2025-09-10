import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import HeroSection from "../components/HeroSection";
import TridoshaSection from "../components/TridoshaSection";
import ProcessSection from "../components/ProcessSection";
import CentersSection from "../components/CentersSection";
import TestimonialsSection from "../components/TestimonialsSection";
import Footer from "../components/Footer";
import { useI18n } from "../utils/i18n.jsx";

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { language, setLanguage, t, availableLanguages } = useI18n();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Language is managed by I18nProvider; no local sync needed

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 50
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      {/* Enhanced Hero Section with Parallax Effect */}
      <motion.div variants={sectionVariants}>
        <HeroSection />
      </motion.div>

      

      {/* Enhanced Sections with Intersection Observer Animations */}
      <motion.div
        variants={sectionVariants}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent pointer-events-none"></div>
        <TridoshaSection />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/20 to-transparent pointer-events-none"></div>
        <ProcessSection />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent pointer-events-none"></div>
        <CentersSection />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/40 to-transparent pointer-events-none"></div>
        <TestimonialsSection />
      </motion.div>

      {/* Enhanced Footer */}
      <motion.div variants={sectionVariants}>
        <Footer />
      </motion.div>

      {/* Floating Action Button */}
      {/* Language Selector */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl px-3 py-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Lang</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm bg-transparent outline-none cursor-pointer"
          >
            {availableLanguages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center group"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-2xl"
          >
            🌿
          </motion.div>
          <div className="absolute -top-12 right-0 bg-slate-800 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {t('home.bookConsultation', 'Book Consultation')}
          </div>
        </motion.button>
      </motion.div>

      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 transform-gpu z-50"
        style={{ scaleX: 0, transformOrigin: "0%" }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"
        />
      </div>
    </motion.div>
  );
};

export default Home;