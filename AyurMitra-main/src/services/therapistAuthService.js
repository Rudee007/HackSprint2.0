// Therapist authentication service using CSV data
export const therapistAuthService = {
  // Login therapist using CSV credentials
  async loginTherapist(username, password) {
    try {
      const response = await fetch('/panchakarma_doctor2.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV parsing more carefully
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
        values.push(current.trim()); // Add the last value
        
        if (values.length >= 9) {
          const therapistName = values[7]?.replace(/"/g, '').trim();
          const therapistPassword = values[8]?.replace(/"/g, '').trim();
          
          if (therapistName === username && therapistPassword === password) {
            const therapistData = {
              id: values[0]?.replace(/"/g, '').trim(),
              symptoms: values[1]?.replace(/"/g, '').trim(),
              vaidyaName: values[2]?.replace(/"/g, '').trim(),
              panchakarma: values[3]?.replace(/"/g, '').trim(),
              vaidyaUsername: values[4]?.replace(/"/g, '').trim(),
              vaidyaDescription: values[6]?.replace(/"/g, '').trim(),
              name: therapistName,
              username: therapistName,
              password: therapistPassword,
              specialization: values[3]?.replace(/"/g, '').trim(), // Use panchakarma as specialization
              description: `Therapist specializing in ${values[3]?.replace(/"/g, '').trim()} therapy for treating ${values[1]?.replace(/"/g, '').trim()}.`
            };
            
            // Store in sessionStorage
            sessionStorage.setItem('loggedInTherapist', JSON.stringify(therapistData));
            return { success: true, therapist: therapistData };
          }
        }
      }
      
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Therapist login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // Get current logged-in therapist
  getCurrentTherapist() {
    const therapistData = sessionStorage.getItem('loggedInTherapist');
    return therapistData ? JSON.parse(therapistData) : null;
  },

  // Logout therapist
  logout() {
    sessionStorage.removeItem('loggedInTherapist');
  },

  // Check if therapist is logged in
  isLoggedIn() {
    return !!sessionStorage.getItem('loggedInTherapist');
  }
};