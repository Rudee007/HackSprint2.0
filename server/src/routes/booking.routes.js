const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Check if a slot is available
router.post('/check-availability', authenticate, bookingController.checkSlotAvailability);

// Create a new booking
router.post('/create', authenticate, bookingController.createBooking);

// Get provider bookings for a specific date
router.get('/provider/:providerId/bookings', authenticate, bookingController.getProviderBookings);

router.get('/provider/:providerId/all-bookings', authenticate, bookingController.getAllProviderBookings);


// Add this route to your existing booking routes
router.post('/alternative-slots', authenticate, bookingController.getAlternativeSlots);

module.exports = router;
