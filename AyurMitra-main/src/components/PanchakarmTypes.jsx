const PanchakarmTypes = () => {
  const types = [
    {
      name: "Vamana",
      title: "Therapeutic Vomiting",
      description:
        "A safe and guided therapy where the patient is given herbal medicines to remove extra mucus and toxins through vomiting. It helps clean the stomach and chest area, bringing relief from breathing problems, allergies, and digestive issues.",
      image: "/img/Vamana.jpg",
      benefits: [
        "Clears chest and lungs",
        "Improves digestion",
        "Reduces allergy symptoms",
        "Boosts skin health",
        "Increases appetite",
        "Promotes lightness in body",
      ],
    },
    {
      name: "Virechana",
      title: "Therapeutic Purgation",
      description:
        "A gentle cleansing method where herbal medicines are used to flush out toxins from the intestines and liver through bowel movements. This therapy helps in improving skin health, reducing acidity, and treating liver and stomach-related problems.",
      image: "/img/virechana.jpg",
      benefits: [
        "Cleans liver and intestines",
        "Improves skin glow",
        "Reduces acidity and inflammation",
        "Helps in weight management",
        "Balances excess heat in the body",
        "Improves metabolism",
      ],
    },

    {
      name: "Basti",
      title: "Herbal Cleansing Therapy",
      description:
        "In this therapy, herbal oils or liquids are gently introduced into the large intestine to clean it and remove toxins. It is very helpful for constipation, back pain, joint stiffness, and nerve-related problems. Basti is often called the most important Panchakarma treatment.",
      image: "/img/Basti.jpg",
      benefits: [
        "Relieves constipation",
        "Reduces joint and back pain",
        "Strengthens nerves and mobility",
        "Improves sleep quality",
        "Enhances energy and vitality",
        "Supports healthy aging",
      ],
    },
    {
      name: "Nasya",
      title: "Nasal Therapy",
      description:
        "In this treatment, herbal oils or drops are gently put into the nose to clear toxins from the head region. It improves breathing, reduces headaches and sinus problems, and also supports better memory and mental clarity.",
      image: "/img/Nasya.jpg",
      benefits: [
        "Opens nasal passages",
        "Relieves headaches and sinus issues",
        "Supports memory and concentration",
        "Improves voice quality",
        "Reduces stress and anxiety",
        "Strengthens hair and prevents hair fall",
      ],
    },
    {
      name: "Raktamokshana",
      title: "Blood Purification",
      description:
        "A special therapy where small amounts of impure blood are removed using safe techniques like leeches or controlled instruments. This helps in purifying the blood, reducing skin problems, and easing swelling or inflammation in the body.",
      image: "/img/raktamokshan.jpg",
      benefits: [
        "Purifies blood naturally",
        "Helps with acne and skin diseases",
        "Reduces swelling and pain",
        "Improves circulation",
        "Boosts immunity",
        "Relieves heaviness in the body",
      ],
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#2E7D32] mb-4">
            Five Types of Panchakarma
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the ancient wisdom of Ayurveda through these five powerful
            detoxification therapies, each designed to restore balance and
            promote optimal health.
          </p>
        </div>

        <div className="space-y-16">
          {types.map((type, index) => (
            <div
              key={type.name}
              className={`flex flex-col lg:flex-row items-center gap-8 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Section */}
              <div className="lg:w-1/2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                  <div className="relative bg-white p-2 rounded-2xl shadow-xl">
                    <img
                      src={type.image}
                      alt={type.name}
                      className="w-full h-64 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDQwMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTI4QzIwMCAxNDAuNzMgMTg5LjI1NSAxNTEgMTc2IDE1MUMxNjIuNzQ1IDE1MSAxNTIgMTQwLjczIDE1MiAxMjhDMTUyIDExNS4yNyAxNjIuNzQ1IDEwNSAxNzYgMTA1QzE4OS4yNTUgMTA1IDIwMCAxMTUuMjcgMjAwIDEyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+dGggZD0iTTE3NiAxMzVDMTc5Ljg2NiAxMzUgMTgzIDEzMS44NjYgMTgzIDEyOEMxODMgMTI0LjEzNCAxNzkuODY2IDEyMSAxNzYgMTIxQzE3Mi4xMzQgMTIxIDE2OSAxMjQuMTM0IDE2OSAxMjhDMTY5IDEzMS44NjYgMTcyLjEzNCAxMzUgMTc2IDEzNVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMjQgMTUxSDE3NkwxNTIgMTc1SDE3NkgyMjRIMjQ4TDIyNCAxNTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjg3Mjg4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:w-1/2 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-2">
                    {type.name}
                  </h3>
                  <h4 className="text-xl font-semibold text-[#4CAF50] mb-4">
                    {type.title}
                  </h4>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {type.description}
                  </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <h5 className="font-semibold text-[#2E7D32] mb-3 text-lg">
                    Key Benefits:
                  </h5>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center">
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full mr-3"></div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center">
                  <button className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    Learn More
                  </button>
                  <div className="ml-4 text-sm text-gray-500">
                    Consult with our experts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PanchakarmTypes;
