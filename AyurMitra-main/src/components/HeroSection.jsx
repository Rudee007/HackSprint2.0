import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Leaf, Heart, Star } from "lucide-react";
import { useI18n } from "../utils/i18n.jsx";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  const { t } = useI18n();

  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: "url(/img/bg-3.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-800/70 to-green-900/80" />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-300/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Parallax Mouse Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          x: mousePosition.x * 0.01,
          y: mousePosition.y * 0.01,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl" />
        <div className="absolute bottom-40 right-32 w-24 h-24 bg-teal-400/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-green-400/10 rounded-full blur-xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen"
        >
          {/* Content Section */}
          <div className="order-2 lg:order-1 space-y-8">
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-6 py-3"
              >
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span className="text-emerald-200 font-medium">{t('hero.badge', 'Ancient Wisdom, Modern Care')}</span>
              </motion.div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="block"
                >
                  <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                    AyurMitra
                  </span>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="block text-white/90"
                >
                  {t('hero.title.suffix', 'Wellness Portal')}
                </motion.span>
              </h1>

              {/* Subtitle */}
              <motion.p
                variants={itemVariants}
                className="text-xl text-emerald-100 leading-relaxed max-w-2xl"
              >
                {t('hero.subtitle.prefix', "Experience Panchakarma's transformative five-step detox ritual—")} 
                <span className="text-emerald-300 font-semibold">{t('hero.subtitle.highlight', 'Vamana, Virechana, Basti, Nasya, and Raktamokshana')}</span>
                {t('hero.subtitle.suffix', '—designed to cleanse your body, calm your mind, and restore perfect balance through our modern, seamless platform.')}
              </motion.p>

              {/* Features */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-6 py-4">
                {[
                  { icon: Heart, text: t('hero.feature1', 'Holistic Healing') },
                  { icon: Leaf, text: t('hero.feature2', 'Natural Remedies') },
                  { icon: Star, text: t('hero.feature3', 'Expert Vaidyas') }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex items-center space-x-2 text-emerald-200"
                  >
                    <feature.icon className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-6">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/book-appointment')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>{t('home.bookConsultation', 'Book Consultation')}</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/panchakarma')}
                  className="px-8 py-4 border-2 border-emerald-400/50 text-emerald-200 rounded-2xl font-semibold hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                >
                  {t('hero.cta.explore', 'Explore Treatments')}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Image Section */}
          <div className="order-1 lg:order-2">
            <motion.div
              variants={imageVariants}
              className="relative"
            >
              {/* Decorative Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-8 -right-8 w-16 h-16 border-2 border-emerald-400/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-6 -left-6 w-12 h-12 border-2 border-teal-400/30 rounded-full"
              />

              {/* Main Image */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-2xl transform rotate-6" />
                <img
                  src="/img/l-1.png"
                  alt="AyurMitra Wellness Portal"
                  className="relative w-full h-auto rounded-3xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 border border-emerald-400/20"
                />

                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 }}
                  className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-300">5000+</div>
                    <div className="text-xs text-emerald-200">Happy Patients</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.7 }}
                  className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-300">98%</div>
                    <div className="text-xs text-teal-200">Success Rate</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-2 text-emerald-300"
        >
          <span className="text-sm font-medium">{t('hero.scroll', 'Scroll to explore')}</span>
          <div className="w-6 h-10 border-2 border-emerald-400/50 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-emerald-400 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;