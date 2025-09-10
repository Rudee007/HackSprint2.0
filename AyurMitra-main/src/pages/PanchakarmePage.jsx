import { useState, useEffect } from 'react';
import PanchakarmaTypes from '../components/PanchakarmTypes';

const PanchakarmePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative">
            <h1 className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 leading-tight">
              Panchakarma
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
          </div>
          <p className="text-2xl text-gray-600 font-light mb-8 max-w-3xl mx-auto">
            Ancient Healing for Modern Wellness
          </p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100">
            <p className="text-lg text-gray-700 leading-relaxed">
              Panchakarma is a holistic detoxification process that aims to balance
              the body, mind, and spirit through ancient Ayurvedic practices. This
              comprehensive treatment system removes toxins, restores natural
              balance, and rejuvenates your entire being for optimal health and
              vitality.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className={`mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Transform Your Wellness
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                'Improved digestion and metabolism',
                'Enhanced immunity and disease resistance', 
                'Deep stress relief and mental clarity',
                'Toxin elimination and cellular renewal'
              ].map((benefit, index) => (
                <div key={index} className="group flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                'Balanced energy levels and vitality',
                'Improved sleep quality and relaxation',
                'Radiant skin and healthy complexion', 
                'Long-term wellness and prevention'
              ].map((benefit, index) => (
                <div key={index} className="group flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className={`mb-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              The Healing Journey
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
          </div>
          <div className="space-y-8">
            {[
              {
                phase: '1. Preparation Phase',
                name: 'Purvakarma',
                description: 'Oil massage and steam therapy prepare your body for detoxification by loosening toxins and opening channels.',
                gradient: 'from-green-400 to-emerald-400'
              },
              {
                phase: '2. Main Treatment',
                name: 'Pradhanakarma', 
                description: 'Five specialized therapies including therapeutic vomiting, purgation, medicated enemas, and nasal treatments.',
                gradient: 'from-emerald-400 to-teal-400'
              },
              {
                phase: '3. Recovery Phase',
                name: 'Paschatkarma',
                description: 'Gradual restoration with specific diet, lifestyle guidelines, and rejuvenating treatments to rebuild strength.',
                gradient: 'from-teal-400 to-green-400'
              }
            ].map((step, index) => (
              <div key={index} className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${step.gradient} rounded-t-2xl`}></div>
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {step.phase}
                    </h3>
                    <h4 className="text-lg font-semibold text-green-600 mb-3">
                      ({step.name})
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Aftercare */}
        <section className={`mb-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Sustaining Your Wellness
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-xl p-8 border border-amber-200">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Diet', desc: 'Follow a simple, easily digestible diet with warm, cooked foods for optimal recovery', icon: '🥗' },
                { title: 'Rest', desc: 'Maintain adequate sleep and avoid strenuous activities during the recovery period', icon: '😴' },
                { title: 'Hydration', desc: 'Drink warm water and herbal teas to support continued detoxification', icon: '💧' },
                { title: 'Meditation', desc: 'Practice daily meditation and breathing exercises to maintain mental balance', icon: '🧘' },
                { title: 'Follow-up', desc: 'Regular consultations ensure lasting benefits and prevent toxin accumulation', icon: '📅' }
              ].map((item, index) => (
                <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-amber-100">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className={`mb-16 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Common Questions
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'How long does Panchakarma take?',
                a: 'A complete Panchakarma program typically lasts 14-21 days, depending on individual needs and health conditions.'
              },
              {
                q: 'Is Panchakarma safe for everyone?', 
                a: 'While generally safe, Panchakarma requires proper assessment. Pregnant women, children, and those with certain conditions need special consideration.'
              },
              {
                q: 'What should I expect during treatment?',
                a: 'You may experience temporary fatigue or mild discomfort as toxins are released. This is normal and indicates the treatment is working effectively.'
              },
              {
                q: 'How often should I undergo Panchakarma?',
                a: 'Most people benefit from annual Panchakarma treatments, though frequency depends on lifestyle, health goals, and practitioner recommendations.'
              }
            ].map((faq, index) => (
              <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-300">
                    Q
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                      {faq.q}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      
        {/* Panchakarma Types */}
        <section className={`transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <PanchakarmaTypes />
        </section>
      </div>
    </div>
  );
};

export default PanchakarmePage;
