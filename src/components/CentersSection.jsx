import { useI18n } from "../utils/i18n.jsx";

const CentersSection = () => {
  const { t } = useI18n();
  const centers = [
    {
      name: " Carnoustie Ayurveda & Wellness Resort",
      location: "Kerla",
      rating: "4.8",
      image: "/img/center1.jpg",
    },
    {
      name: "Kairali - The Ayurvedic Healing Village",
      location: "Kerala",
      rating: "4.9",
      image: "/img/center2.jpg",
    },
    {
      name: "Vanat",
      location: "Uttarakhand",
      rating: "4.7",
      image: "/img/center3.jpg",
    },
    {
      name: "Atmantan Wellness Resort",
      location: "Maharashtra",
      rating: "4.6",
      image: "/img/center4.jpg",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-900 mb-3">
            {t('centers.title', 'Popular Panchakarma Centers')}
          </h2>
          <p className="text-emerald-800/80 max-w-2xl mx-auto text-sm sm:text-base">
            {t('centers.subtitle', 'Discover trusted centers offering authentic, therapist‑led treatments.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {centers.map((center, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm hover:shadow-emerald-200/60 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-emerald-100 flex flex-col transform hover:-translate-y-1 group">
              <div className="h-52 relative overflow-hidden">
                <img 
                  src={center.image} 
                  alt={center.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent transition-opacity duration-300 group-hover:from-emerald-900/50"></div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-emerald-900 border border-emerald-100">
                  ⭐ {center.rating}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2 leading-tight">
                  {center.name}
                </h3>
                <p className="text-emerald-700 mb-4 text-sm flex items-center">
                  <span aria-hidden className="mr-1">📍</span> {center.location}
                </p>
                
                <button className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/40 transition-all duration-200 mt-auto">
                  {t('centers.bookNow', 'Book Now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CentersSection;