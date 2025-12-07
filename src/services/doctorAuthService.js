// Vaidya authentication service using CSV data
export const doctorAuthService = {
  // Login vaidya using CSV credentials
  async loginDoctor(username, password) {
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
        
        if (values.length >= 6) {
          const vaidyaUsername = values[4]?.replace(/"/g, '').trim();
          const vaidyaPassword = values[5]?.replace(/"/g, '').trim();
          
          if (vaidyaUsername === username && vaidyaPassword === password) {
            const vaidyaData = {
              id: values[0]?.replace(/"/g, '').trim(),
              symptoms: values[1]?.replace(/"/g, '').trim(),
              name: values[2]?.replace(/"/g, '').trim(),
              panchakarma: values[3]?.replace(/"/g, '').trim(),
              username: vaidyaUsername,
              description: values[6]?.replace(/"/g, '').trim()
            };
            
            // Store in sessionStorage
            sessionStorage.setItem('loggedInDoctor', JSON.stringify(vaidyaData));
            return { success: true, doctor: vaidyaData };
          }
        }
      }
      
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // Get current logged-in vaidya
  getCurrentDoctor() {
    const vaidyaData = sessionStorage.getItem('loggedInDoctor');
    return vaidyaData ? JSON.parse(vaidyaData) : null;
  },

  // Logout vaidya
  logout() {
    sessionStorage.removeItem('loggedInDoctor');
  },

  // Check if vaidya is logged in
  isLoggedIn() {
    return !!sessionStorage.getItem('loggedInDoctor');
  }
};