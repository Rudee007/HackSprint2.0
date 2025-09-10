const mongoose = require('mongoose');
const Feedback = require('../../src/models/Feedback');
const { connectTestDB, closeTestDB, clearTestDB } = require('../helpers/database');

describe('Feedback Model Unit Tests', () => {
  
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Model Validation', () => {
    test('should create valid feedback successfully', async () => {
      const validFeedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        healthMetrics: {
          painLevel: { before: 8, after: 3 },
          energyLevel: { before: 3, after: 7 },
          sleepQuality: { before: 4, after: 8 },
          stressLevel: { before: 9, after: 4 },
          overallWellbeing: { before: 4, after: 8 },
          mobilityLevel: { before: 5, after: 7 }
        },
        improvements: [{
          aspect: 'joint_pain',
          progressLevel: 75,
          notes: 'Significant improvement in knee pain',
          significance: 'major'
        }],
        recommendationScore: 9,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true,
        textFeedback: {
          positiveAspects: 'Excellent therapy session',
          additionalComments: 'Very satisfied with results'
        }
      };

      const feedback = new Feedback(validFeedbackData);
      const savedFeedback = await feedback.save();

      expect(savedFeedback._id).toBeDefined();
      expect(savedFeedback.therapyType).toBe('abhyanga');
      expect(savedFeedback.ratings.overallSatisfaction).toBe(5);
      expect(savedFeedback.status).toBe('submitted');
    });

    test('should fail validation without required fields', async () => {
      const invalidFeedback = new Feedback({});
      
      await expect(invalidFeedback.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test('should validate rating ranges (1-5)', async () => {
      const invalidRatingData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 6, // Invalid - above 5
          treatmentEffectiveness: 0, // Invalid - below 1
          patientCare: 3,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        healthMetrics: {
          painLevel: { before: 5, after: 3 }
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(invalidRatingData);
      await expect(feedback.save()).rejects.toThrow();
    });

    test('should validate health metrics ranges (1-10)', async () => {
      const invalidMetricsData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        healthMetrics: {
          painLevel: { before: 15, after: 0 }, // Invalid ranges
          energyLevel: { before: 3, after: 7 }
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(invalidMetricsData);
      await expect(feedback.save()).rejects.toThrow();
    });

    test('should validate therapy type enum', async () => {
      const invalidTherapyType = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'invalid_therapy', // Invalid enum value
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(invalidTherapyType);
      await expect(feedback.save()).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    test('should calculate overallImprovement virtual field correctly', async () => {
      const feedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        healthMetrics: {
          painLevel: { before: 8, after: 4 }, // 50% improvement
          energyLevel: { before: 4, after: 8 }, // 100% improvement
          sleepQuality: { before: 5, after: 7 }, // 40% improvement
          stressLevel: { before: 8, after: 4 }, // 50% improvement
          overallWellbeing: { before: 4, after: 8 } // 100% improvement
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(feedbackData);
      const savedFeedback = await feedback.save();

      expect(savedFeedback.overallImprovement).toBeGreaterThan(0);
      expect(savedFeedback.overallImprovement).toBeLessThanOrEqual(100);
    });

    test('should calculate averageRating virtual field correctly', async () => {
      const feedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(feedbackData);
      const savedFeedback = await feedback.save();

      const expectedAverage = (5 + 4 + 5 + 4 + 5 + 4) / 6; // 4.5
      expect(savedFeedback.averageRating).toBe(Math.round(expectedAverage * 10) / 10);
    });

    test('should identify positive feedback correctly', async () => {
      const positiveFeedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 5,
          patientCare: 5,
          facilityQuality: 5,
          therapistProfessionalism: 5,
          communicationQuality: 5
        },
        recommendationScore: 9,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(positiveFeedbackData);
      const savedFeedback = await feedback.save();

      expect(savedFeedback.isPositiveFeedback).toBe(true);
      expect(savedFeedback.averageRating).toBeGreaterThanOrEqual(4);
      expect(savedFeedback.recommendationScore).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Instance Methods', () => {
    test('should get improvement summary correctly', async () => {
      const feedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5,
          facilityQuality: 4,
          therapistProfessionalism: 5,
          communicationQuality: 4
        },
        healthMetrics: {
          painLevel: { before: 8, after: 4 },
          energyLevel: { before: 4, after: 8 }
        },
        recommendationScore: 8,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(feedbackData);
      const savedFeedback = await feedback.save();
      const summary = savedFeedback.getImprovementSummary();

      expect(summary).toHaveProperty('painLevel');
      expect(summary).toHaveProperty('energyLevel');
      expect(summary.painLevel.before).toBe(8);
      expect(summary.painLevel.after).toBe(4);
      expect(summary.painLevel.change).toBe(-4);
      expect(summary.energyLevel.improvement).toBeGreaterThan(0);
    });

    test('should identify feedback requiring immediate attention', async () => {
      const criticalFeedbackData = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 1, // Very low rating
          treatmentEffectiveness: 1,
          patientCare: 2,
          facilityQuality: 1,
          therapistProfessionalism: 2,
          communicationQuality: 1
        },
        sideEffects: [{
          type: 'severe_pain',
          severity: 5, // High severity
          duration: 'days',
          description: 'Severe adverse reaction'
        }],
        recommendationScore: 1,
        wouldReturnForTreatment: false,
        wouldRecommendToOthers: false
      };

      const feedback = new Feedback(criticalFeedbackData);
      const savedFeedback = await feedback.save();

      expect(savedFeedback.requiresImmediateAttention()).toBe(true);
      expect(savedFeedback.flags.requiresAttention).toBe(true);
      expect(savedFeedback.flags.criticalFeedback).toBe(true);
    });
  });

  describe('Pre-save Middleware', () => {
    test('should auto-flag low rating feedback for attention', async () => {
      const lowRatingFeedback = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 2, // Low rating
          treatmentEffectiveness: 1,
          patientCare: 2,
          facilityQuality: 2,
          therapistProfessionalism: 1,
          communicationQuality: 2
        },
        recommendationScore: 3, // Low recommendation
        wouldReturnForTreatment: false,
        wouldRecommendToOthers: false
      };

      const feedback = new Feedback(lowRatingFeedback);
      const savedFeedback = await feedback.save();

      expect(savedFeedback.flags.requiresAttention).toBe(true);
    });

    test('should auto-flag feedback with severe side effects', async () => {
      const severeSideEffectFeedback = {
        patientId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        providerId: new mongoose.Types.ObjectId(),
        therapyType: 'abhyanga',
        ratings: {
          overallSatisfaction: 4,
          treatmentEffectiveness: 4,
          patientCare: 4,
          facilityQuality: 4,
          therapistProfessionalism: 4,
          communicationQuality: 4
        },
        sideEffects: [{
          type: 'severe_reaction',
          severity: 4, // High severity
          duration: 'days',
          description: 'Severe allergic reaction'
        }],
        recommendationScore: 6,
        wouldReturnForTreatment: true,
        wouldRecommendToOthers: true
      };

      const feedback = new Feedback(severeSideEffectFeedback);
      const savedFeedback = await feedback.save();

      expect(savedFeedback.flags.criticalFeedback).toBe(true);
    });
  });
});
