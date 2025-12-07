import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from "../utils/i18n.jsx";

const TestimonialsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);
  const { t } = useI18n();

  const testimonials = [
    {
      quote: t('testimonials.item1.quote', 'The reminder alerts for my diet before Vamana were a lifesaver! I felt so much more prepared and the process was smooth.'),
      author: t('testimonials.item1.author', 'Priya S.'),
      role: t('testimonials.item1.role', 'Patient')
    },
    {
      quote: t("testimonials.item2.quote", "This software understands Ayurveda. It doesn't replace my judgment but empowers me to serve my patients better."),
      author: t('testimonials.item2.author', 'Dr. Ajit Kumar, BAMS'),
      role: t('testimonials.item2.role', 'Ayurvedic Physician')
    }
  ];



  return (
    <section ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-900 mb-3">
            {t('testimonials.title', 'What Our Community Says')}
          </h2>
          <p className="text-emerald-800/80 max-w-2xl mx-auto text-sm sm:text-base">
            {t('testimonials.subtitle', 'Stories from patients and practitioners who use our Ayurvedic platform every day.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={index}
              className={`relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-emerald-100 shadow-sm transition-all duration-500 group ${index === 1 ? 'md:hover:-rotate-1' : ''}`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -6 }}
            >
              <div className="absolute inset-0 pointer-events-none rounded-2xl group-hover:ring-4 group-hover:ring-emerald-300/30 transition" aria-hidden />
              <div className="mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-3 sm:mb-4 transition-all duration-300 sm:group-hover:scale-125 sm:group-hover:text-amber-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
                <blockquote>
                  <p className="text-emerald-950 text-base sm:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </blockquote>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 transition-all duration-300 group-hover:bg-emerald-200 group-hover:shadow-md">
                  <span className="text-emerald-900 font-bold text-base sm:text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900 text-sm sm:text-base">{testimonial.author}</p>
                  <p className="text-emerald-700 text-xs sm:text-sm">{testimonial.role}</p>
                </div>
                <div className="hidden sm:flex items-center gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.985 2.124c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>


      </div>
    </section>
  );
};

export default TestimonialsSection;