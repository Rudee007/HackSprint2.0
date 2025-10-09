const { body } = require('express-validator');

const doctorRegistrationValidation = [
  // Qualifications validation
  body('qualifications.bams.degree')
    .notEmpty()
    .withMessage('Degree is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Degree must be between 2 and 100 characters'),

  body('qualifications.bams.university')
    .notEmpty()
    .withMessage('University is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('University name must be between 2 and 200 characters'),

  body('qualifications.bams.yearOfCompletion')
    .isInt({ min: 1980, max: new Date().getFullYear() })
    .withMessage('Please provide a valid graduation year'),

  // Experience validation
  body('experience.totalYears')
    .isInt({ min: 0, max: 60 })
    .withMessage('Experience must be between 0 and 60 years'),

  // Consultation settings validation
  body('consultationSettings.fees.videoConsultation')
    .isInt({ min: 0 })
    .withMessage('Video consultation fee must be a positive number'),

  body('consultationSettings.availability.workingDays')
    .isArray({ min: 1 })
    .withMessage('At least one working day must be selected'),

  body('consultationSettings.availability.workingHours.start')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format'),

  body('consultationSettings.availability.workingHours.end')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format'),

  body('consultationSettings.availability.consultationDuration')
    .isInt({ min: 15, max: 120 })
    .withMessage('Consultation duration must be between 15 and 120 minutes'),

  body('consultationSettings.preferences.languages')
    .isArray({ min: 1 })
    .withMessage('At least one language must be selected'),

  body('consultationSettings.preferences.maxPatientsPerDay')
    .isInt({ min: 1, max: 50 })
    .withMessage('Max patients per day must be between 1 and 50')
];

module.exports = { doctorRegistrationValidation };
