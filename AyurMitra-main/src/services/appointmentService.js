// City coordinates for distance calculation
const cityCoordinates = {
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 }
};

// Haversine formula for distance calculation
function calculateDistance(lat1, lng1, lat2, lng2) {
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Parse CSV data with better handling
function parseCSV(csvText) {
  try {
    if (!csvText || typeof csvText !== 'string') return [];
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/["/]/g, ''));
    console.log('CSV Headers:', encodeURIComponent(JSON.stringify(headers))); // Debug log

    const doctors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Proper CSV parsing that handles quoted values
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      const doctor = {
        id: i,
        name: '',
        specialization: '',
        symptoms_alerted: [],
        description: '',
        rating: 4.0 + Math.random(),
        address: 'Mumbai, Maharashtra'
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerLower = header.toLowerCase();

        if (headerLower === 'vaidya_name' || headerLower.includes('name')) {
          doctor.name = value;
        } else if (headerLower === 'panchakarma' || headerLower.includes('special')) {
          doctor.specialization = value;
        } else if (headerLower === 'symptoms' || headerLower.includes('symptom') || headerLower.includes('condition')) {
          if (value) {
            doctor.symptoms_alerted = value.split(/[;|,]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
          }
        } else if (headerLower === 'vaidya_description' || headerLower.includes('desc') || headerLower.includes('about')) {
          doctor.description = value;
        } else if (headerLower.includes('rating') || headerLower.includes('score')) {
          doctor.rating = parseFloat(value) || doctor.rating;
        } else if (headerLower.includes('address') || headerLower.includes('location') || headerLower.includes('city')) {
          doctor.address = value || doctor.address;
        }
      });

      // Only add if we have essential data
      if (doctor.name && doctor.specialization) {
        // If no symptoms provided, create from specialization
        if (doctor.symptoms_alerted.length === 0) {
          doctor.symptoms_alerted = [doctor.specialization.toLowerCase()];
        }

        // Assign random city if no address provided
        if (doctor.address === 'Mumbai, Maharashtra') {
          const cities = ['Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka',
            'Pune, Maharashtra', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal',
            'Hyderabad, Telangana', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh'];
          doctor.address = cities[Math.floor(Math.random() * cities.length)];
        }

        doctors.push(doctor);
      }
    }

    console.log('Parsed doctors:', encodeURIComponent(doctors.length.toString())); // Debug log
    return doctors;
  } catch (error) {
    console.error('CSV parsing error:', error);
    return [];
  }
}

// Extract city from address
function extractCity(address) {
  if (!address || typeof address !== 'string') return '';
  const parts = address.toLowerCase().split(',');
  return parts.length > 0 ? parts[0].trim() : address.toLowerCase().trim();
}

// Calculate string similarity for fuzzy matching
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export const appointmentService = {
  async bookAppointment(appointmentData) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Fetch doctors from CSV file
      const response = await fetch('/panchakarma_doctor2.csv');
      if (!response.ok) {
        throw new Error(`Failed to load vaidyas: ${response.status}`);
      }
      const csvText = await response.text();
      const doctors = parseCSV(csvText);
      console.log(`Loaded ${doctors.length} vaidyas from CSV`);

      // Enhanced symptom parsing with medical terms
      const medicalSynonyms = {
        'pain': ['ache', 'hurt', 'sore', 'discomfort'],
        'fever': ['temperature', 'hot', 'burning'],
        'headache': ['head pain', 'migraine', 'head ache'],
        'stomach': ['belly', 'tummy', 'abdomen', 'gastric'],
        'cold': ['flu', 'cough', 'runny nose', 'congestion'],
        'joint': ['knee', 'elbow', 'shoulder', 'hip', 'ankle'],
        'skin': ['rash', 'itching', 'allergy', 'dermatitis']
      };

      let patientSymptoms = appointmentData.symptoms.toLowerCase()
        .replace(/[^a-z\s,]/g, '')
        .split(/[,\s]+/)
        .filter(s => s.length >= 3)
        .map(s => s.trim());

      // Add synonyms to expand matching
      const expandedSymptoms = [...patientSymptoms];
      patientSymptoms.forEach(symptom => {
        Object.entries(medicalSynonyms).forEach(([key, synonyms]) => {
          if (synonyms.includes(symptom) || symptom.includes(key)) {
            expandedSymptoms.push(key);
            expandedSymptoms.push(...synonyms);
          }
        });
      });

      patientSymptoms = [...new Set(expandedSymptoms)];

      const patientCity = extractCity(appointmentData.patientDetails?.address || '');
      const patientCoords = cityCoordinates[patientCity];

      // Calculate scores for each doctor
      const scoredDoctors = doctors.map(doctor => {
        // Step 1: Advanced symptom matching with weighted scoring
        let matchedSymptoms = 0;
        let totalRelevance = 0;
        let exactMatches = 0;
        let partialMatches = 0;

        doctor.symptoms_alerted.forEach(symptom => {
          const symptomLower = symptom.toLowerCase();
          let bestMatch = 0;

          patientSymptoms.forEach(ps => {
            let matchScore = 0;

            // Exact match (highest priority)
            if (ps === symptomLower) {
              matchScore = 1.0;
              exactMatches++;
            }
            // Word boundary match (high priority)
            else if (ps.length >= 3 && symptomLower.length >= 3 &&
              (symptomLower.includes(ps) || ps.includes(symptomLower))) {
              matchScore = 0.9;
            }
            // Contains match with length consideration
            else if (ps.length >= 4 && symptomLower.includes(ps)) {
              matchScore = 0.7 * (ps.length / symptomLower.length);
            }
            // Reverse contains match
            else if (symptomLower.length >= 4 && ps.includes(symptomLower)) {
              matchScore = 0.6 * (symptomLower.length / ps.length);
            }
            // Fuzzy match for similar words
            else if (ps.length >= 4 && symptomLower.length >= 4) {
              const similarity = calculateSimilarity(ps, symptomLower);
              if (similarity > 0.7) {
                matchScore = 0.5 * similarity;
              }
            }

            bestMatch = Math.max(bestMatch, matchScore);
          });

          if (bestMatch > 0) {
            matchedSymptoms++;
            totalRelevance += bestMatch;
            if (bestMatch < 1.0) partialMatches++;
          }
        });

        // Enhanced scoring with bonuses
        let symptomScore = doctor.symptoms_alerted.length > 0 ?
          totalRelevance / doctor.symptoms_alerted.length : 0;

        // Bonus for exact matches
        const exactBonus = exactMatches * 0.1;
        // Penalty for too many partial matches
        const partialPenalty = partialMatches > exactMatches ? partialMatches * 0.05 : 0;

        symptomScore = Math.min(1, symptomScore + exactBonus - partialPenalty);

        // Step 2: Location matching
        const doctorCity = extractCity(doctor.address);
        const doctorCoords = cityCoordinates[doctorCity];
        let locationScore = 0;
        let distance = 0;

        if (patientCity === doctorCity) {
          locationScore = 1;
          distance = 0;
        } else if (patientCoords && doctorCoords) {
          distance = calculateDistance(
            patientCoords.lat, patientCoords.lng,
            doctorCoords.lat, doctorCoords.lng
          );
          locationScore = Math.max(0, 1 - distance / 2000);
        } else {
          // Default distance for unknown cities
          distance = 500;
          locationScore = 0.2;
        }

        // Step 3: Rating score
        const ratingScore = doctor.rating / 5;

        // Step 4: Dynamic final score with adaptive weighting
        let finalScore = 0;

        if (symptomScore > 0.1) {
          // Adaptive weighting based on match quality
          const symptomWeight = exactMatches > 0 ? 0.7 : 0.6;
          const locationWeight = patientCity ? 0.25 : 0.15;
          const ratingWeight = 1 - symptomWeight - locationWeight;

          finalScore = (symptomScore * symptomWeight) +
            (locationScore * locationWeight) +
            (ratingScore * ratingWeight);

          // Boost for specialists with high symptom relevance
          if (symptomScore > 0.8) finalScore *= 1.1;

          // Boost for highly rated doctors in same city
          if (doctor.isNearest && doctor.rating >= 4.5) finalScore *= 1.05;
        }

        return {
          ...doctor,
          symptomScore,
          locationScore,
          ratingScore,
          finalScore: Math.round(finalScore * 100),
          distance: Math.round(distance || 0),
          isNearest: patientCity === doctorCity,
          matchedSymptoms,
          exactMatches,
          reviews: Math.floor(Math.random() * 200) + 50 // Mock reviews
        };
      });

      // Step 5: Intelligent sorting and selection
      let topDoctors = scoredDoctors
        .filter(doctor => doctor.finalScore > 8) // Minimum 8% relevance
        .sort((a, b) => {
          // Prioritize exact matches first
          if (a.exactMatches !== b.exactMatches) return b.exactMatches - a.exactMatches;
          // Then by final score
          if (Math.abs(b.finalScore - a.finalScore) > 2) return b.finalScore - a.finalScore;
          // Then by location (nearest first)
          if (a.isNearest !== b.isNearest) return b.isNearest - a.isNearest;
          // Then by rating
          return b.rating - a.rating;
        });

      // Ensure diversity in specializations
      const diverseTopDoctors = [];
      const seenSpecializations = new Set();

      // First pass: add doctors with unique specializations
      topDoctors.forEach(doctor => {
        if (!seenSpecializations.has(doctor.specialization) && diverseTopDoctors.length < 5) {
          diverseTopDoctors.push(doctor);
          seenSpecializations.add(doctor.specialization);
        }
      });

      // Second pass: fill remaining slots with best matches
      topDoctors.forEach(doctor => {
        if (diverseTopDoctors.length < 5 && !diverseTopDoctors.includes(doctor)) {
          diverseTopDoctors.push(doctor);
        }
      });

      topDoctors = diverseTopDoctors;

      // Enhanced fallback system
      if (topDoctors.length === 0) {
        // Try with lower threshold
        topDoctors = scoredDoctors
          .filter(doctor => doctor.finalScore > 3)
          .sort((a, b) => b.finalScore - a.finalScore)
          .slice(0, 3);

        if (topDoctors.length === 0) {
          // Last resort: best local doctors
          topDoctors = scoredDoctors
            .filter(doctor => doctor.isNearest)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);

          if (topDoctors.length === 0) {
            // Final fallback: top rated overall
            topDoctors = scoredDoctors
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3);
          }
        }
      }

      return { recommendedDoctors: topDoctors };

    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Make sure panchakarma_doctor.json is in the public folder');
      return { recommendedDoctors: [] };
    }
  },

  async getRecommendedDoctors(symptoms) {
    const mockAppointmentData = { symptoms, patientDetails: { address: '' } };
    const result = await this.bookAppointment(mockAppointmentData);
    return { doctors: result.recommendedDoctors };
  }
};