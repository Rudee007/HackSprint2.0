const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">About Us</h1>
          <p className="text-xl text-gray-600">Learn more about our Ayurveda practice</p>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            We are dedicated to providing authentic Ayurvedic treatments and wellness solutions. 
            Our experienced practitioners combine traditional wisdom with modern healthcare approaches 
            to help you achieve optimal health and well-being.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;