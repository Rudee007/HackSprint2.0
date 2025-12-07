const Service = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600">Comprehensive Ayurvedic treatments and wellness programs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Consultation</h3>
            <p className="text-gray-600">Personalized health assessments and treatment plans</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Panchakarma</h3>
            <p className="text-gray-600">Traditional detoxification and rejuvenation therapies</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Herbal Medicine</h3>
            <p className="text-gray-600">Natural remedies and supplements for wellness</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Service;