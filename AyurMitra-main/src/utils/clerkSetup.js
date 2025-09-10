// Clerk Setup Helper for Vaidyas
// This file shows how to create vaidyas in Clerk with publicMetadata

/*
SETUP INSTRUCTIONS:

1. In Clerk Dashboard, create vaidya accounts with these usernames/emails:
   - vaidya.gopal.menon@ayurveda.com
   - vaidya.nisha.bhat@ayurveda.com
   - vaidya.priya.nair@ayurveda.com
   - etc. (from the CSV file)

2. For each vaidya account, set publicMetadata in Clerk Dashboard:
   Go to Users > Select Vaidya > Metadata tab > Public metadata
   
   Example for Vaidya ID 1 (Vaidya Gopal Menon):
   {
     "doctorId": "1"
   }
   
   Example for Vaidya ID 2 (Vaidya Nisha Bhat):
   {
     "doctorId": "2"
   }

3. Alternatively, use Clerk's Backend API to set metadata programmatically:

*/

// Example function to set vaidya metadata (requires Clerk Backend API)
export const setDoctorMetadata = async (userId, doctorId) => {
  // This would be called from your backend
  const response = await fetch(`https://api.clerk.dev/v1/users/${userId}/metadata`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_metadata: {
        doctorId: doctorId
      }
    })
  });
  
  return response.json();
};

// Example CSV to Clerk mapping
export const doctorMappings = [
  { id: "1", email: "vaidya.gopal.menon@ayurveda.com", name: "Vaidya Gopal Menon" },
  { id: "2", email: "vaidya.nisha.bhat@ayurveda.com", name: "Vaidya Nisha Bhat" },
  { id: "3", email: "vaidya.priya.nair@ayurveda.com", name: "Vaidya Priya Nair" },
  { id: "4", email: "vaidya.deepak.shukla@ayurveda.com", name: "Vaidya Deepak Shukla" },
  { id: "5", email: "vaidya.manohar.joshi@ayurveda.com", name: "Vaidya Manohar Joshi" },
  // Add more vaidyas as needed
];

/*
TESTING THE FLOW:

1. Create a vaidya account in Clerk with email: vaidya.nisha.bhat@ayurveda.com
2. Set publicMetadata: { "doctorId": "2" }
3. Login as this vaidya
4. Should redirect to /doctor/2
5. Dashboard will show appointments for doctorId "2"

PATIENT BOOKING FLOW:

1. Patient fills profile form (stored in localStorage)
2. Patient searches symptoms and finds vaidyas
3. Patient clicks "Book Appointment" on a vaidya
4. Appointment saved to localStorage with structure:
   {
     "doctorId": "2",
     "doctorName": "Vaidya Nisha Bhat", 
     "patientName": "John Doe",
     "age": "30",
     "phone": "1234567890",
     "address": "123 Main St",
     "symptoms": "headache, migraine",
     "appointmentDate": "2024-01-15T10:30:00.000Z",
     "status": "pending"
   }

5. Vaidya logs in and sees only their appointments filtered by doctorId
*/