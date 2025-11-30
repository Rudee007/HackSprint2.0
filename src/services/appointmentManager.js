// Appointment management service for frontend-only implementation
export const appointmentManager = {
  // Book appointment with specific doctor
  bookAppointment(patientData, doctorUsername) {
    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '{}');
    
    if (!appointments[doctorUsername]) {
      appointments[doctorUsername] = [];
    }
    
    const appointment = {
      id: Date.now().toString(),
      patientName: patientData.name,
      age: patientData.age,
      phone: patientData.phone,
      address: patientData.address,
      symptoms: patientData.symptoms,
      appointmentDate: patientData.appointmentDate || new Date().toISOString().split('T')[0],
      appointmentTime: patientData.appointmentTime || '10:00',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    appointments[doctorUsername].push(appointment);
    localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
    
    return appointment;
  },

  // Get appointments for specific doctor
  getDoctorAppointments(doctorUsername) {
    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '{}');
    return appointments[doctorUsername] || [];
  },

  // Update appointment status
  updateAppointmentStatus(doctorUsername, appointmentId, newStatus) {
    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '{}');
    
    if (appointments[doctorUsername]) {
      const appointment = appointments[doctorUsername].find(apt => apt.id === appointmentId);
      if (appointment) {
        appointment.status = newStatus;
        appointment.updatedAt = new Date().toISOString();
        localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
        return true;
      }
    }
    return false;
  },

  // Get all appointments (for management dashboard)
  getAllAppointments() {
    return JSON.parse(localStorage.getItem('doctorAppointments') || '{}');
  }
};