import { Wind, Flame, Droplets, Mountain, Sparkles } from 'lucide-react';
import { useI18n } from "../utils/i18n.jsx";

const TridoshaSection = () => {
  const { t } = useI18n();

  const elements = [
    { icon: Sparkles, name: "ETHER", color: "bg-gray-800" },
    { icon: Wind, name: "AIR", color: "bg-teal-600" },
    { icon: Flame, name: "FIRE", color: "bg-orange-500" },
    { icon: Droplets, name: "WATER", color: "bg-cyan-500" },
    { icon: Mountain, name: "EARTH", color: "bg-green-800" }
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-900 mb-4 sm:mb-6 tracking-tight">
          {t('tridosha.title', 'Ayurvedic Tridosha')}
        </h2>
        <p className="max-w-3xl mx-auto text-emerald-800/80 text-sm sm:text-base mb-10 sm:mb-14">
          {t('tridosha.subtitle', 'The five elements combine to form the three doshas. Explore their qualities below.')}
        </p>
        
        <div className="relative">
          {/* Dosha Labels with brackets */}
          <div className="hidden sm:flex justify-center items-start mb-12 space-x-8">
            {/* VATA bracket over ETHER and AIR */}
            <div className="relative flex flex-col items-center transition-transform duration-300 hover:scale-105">
              <span className="text-emerald-700 text-lg font-semibold tracking-wider mb-2">{t('tridosha.vata', 'VATA')}</span>
              <div className="flex items-end">
                <div className="w-8 h-8 border-l-2 border-t-2 border-emerald-600/60 rounded-tl-lg"></div>
                <div className="w-24 border-t-2 border-emerald-600/60"></div>
                <div className="w-8 h-8 border-r-2 border-t-2 border-emerald-600/60 rounded-tr-lg"></div>
              </div>
            </div>
            
            {/* PITTA bracket over FIRE and WATER */}
            <div className="relative flex flex-col items-center transition-transform duration-300 hover:scale-105">
              <span className="text-emerald-700 text-lg font-semibold tracking-wider mb-2">{t('tridosha.pitta', 'PITTA')}</span>
              <div className="flex items-end">
                <div className="w-8 h-8 border-l-2 border-t-2 border-emerald-600/60 rounded-tl-lg"></div>
                <div className="w-24 border-t-2 border-emerald-600/60"></div>
                <div className="w-8 h-8 border-r-2 border-t-2 border-emerald-600/60 rounded-tr-lg"></div>
              </div>
            </div>
            
            {/* KAPHA bracket over EARTH */}
            <div className="relative flex flex-col items-center transition-transform duration-300 hover:scale-105">
              <span className="text-emerald-700 text-lg font-semibold tracking-wider mb-2">{t('tridosha.kapha', 'KAPHA')}</span>
              <div className="flex items-end">
                <div className="w-6 h-6 border-l-2 border-t-2 border-emerald-600/60 rounded-tl-lg"></div>
                <div className="w-8 border-t-2 border-emerald-600/60"></div>
                <div className="w-6 h-6 border-r-2 border-t-2 border-emerald-600/60 rounded-tr-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Elements in a row */}
          <div className="grid grid-cols-3 sm:flex sm:justify-center sm:items-center gap-4 sm:space-x-8 sm:gap-0 mb-8 sm:mb-12">
            {elements.map((element, index) => {
              const IconComponent = element.icon;
              return (
                <div key={index} className="text-center group focus-within:scale-105 transition-transform duration-300">
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 ${element.color} rounded-full flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg ring-0 group-hover:ring-4 group-hover:ring-emerald-300/40 transition-all duration-300`}>
                    <IconComponent aria-hidden className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    <span className="sr-only">{element.name}</span>
                  </div>
                  <span className="text-emerald-900 text-xs sm:text-sm font-medium tracking-wider transition-colors duration-200 group-hover:text-emerald-700">
                    {element.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="text-base sm:text-xl font-semibold text-emerald-900 leading-relaxed max-w-3xl mx-auto px-4">
          {t('tridosha.description', 'Understanding your unique constitution helps tailor treatments for balance and vitality.')}
        </p>
      </div>
    </section>
  );
};

export default TridoshaSection;