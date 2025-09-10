const FeedbackService = require('../../src/services/feedback.service');
const Feedback = require('../../src/models/Feedback');
const mongoose = require('mongoose');
const { connectTestDB, closeTestDB, clearTestDB } = require('../helpers/database');

// Mock the Feedback model
jest.mock('../../src/models/Feedback');

describe('FeedbackService Unit Tests', () => {

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    test('should create and return feedback with populated fields', async () => {
      const mockFeedbackData = {
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
        }
      };

      const mockSavedFeedback = {
        _id: new mongoose.Types.ObjectId(),
        ...mockFeedbackData,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockPopulatedFeedback = {
        ...mockSavedFeedback,
        patientId: { name: 'John Doe', email: 'john@example.com' },
        providerId: { name: 'Dr. Smith', email: 'smith@example.com', role: 'therapist' },
        sessionId: { scheduledAt: new Date(), therapyType: 'abhyanga' }
      };

      Feedback.mockImplementation(() => mockSavedFeedback);
      
      const mockFindById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockPopulatedFeedback)
          })
        })
      });
      Feedback.findById = mockFindById;

      const result = await FeedbackService.createFeedback(mockFeedbackData);

      expect(result).toEqual(mockPopulatedFeedback);
      expect(mockSavedFeedback.save).toHaveBeenCalled();
    });

    test('should handle creation errors', async () => {
      const mockFeedbackData = {
        patientId: new mongoose.Types.ObjectId()
        // Missing required fields
      };

      Feedback.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error'))
      }));

      await expect(FeedbackService.createFeedback(mockFeedbackData))
        .rejects.toThrow('Validation error');
    });
  });

  describe('getPatientFeedback', () => {
    test('should return paginated patient feedback', async () => {
      const patientId = new mongoose.Types.ObjectId();
      const mockFeedback = [
        { _id: '1', ratings: { overallSatisfaction: 5 } },
        { _id: '2', ratings: { overallSatisfaction: 4 } }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockFeedback)
      };

      Feedback.find = jest.fn().mockReturnValue(mockQuery);
      Feedback.countDocuments = jest.fn().mockResolvedValue(10);

      const result = await FeedbackService.getPatientFeedback(patientId, { page: 1, limit: 5 });

      expect(result.feedback).toEqual(mockFeedback);
      expect(result.pagination.totalFeedback).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
    });

    test('should handle empty feedback results', async () => {
      const patientId = new mongoose.Types.ObjectId();

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Feedback.find = jest.fn().mockReturnValue(mockQuery);
      Feedback.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await FeedbackService.getPatientFeedback(patientId);

      expect(result.feedback).toEqual([]);
      expect(result.pagination.totalFeedback).toBe(0);
    });
  });

  describe('updateFeedback', () => {
    test('should update feedback within 24 hours', async () => {
      const feedbackId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const updateData = { ratings: { overallSatisfaction: 4 } };

      const mockExistingFeedback = {
        _id: feedbackId,
        patientId: userId,
        createdAt: new Date(), // Recent creation
        save: jest.fn().mockResolvedValue(true)
      };

      Feedback.findById = jest.fn().mockResolvedValue(mockExistingFeedback);

      const result = await FeedbackService.updateFeedback(feedbackId, updateData, userId);

      expect(result).toEqual(mockExistingFeedback);
      expect(mockExistingFeedback.save).toHaveBeenCalled();
    });

    test('should reject update after 24 hours', async () => {
      const feedbackId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const updateData = { ratings: { overallSatisfaction: 4 } };

      const mockOldFeedback = {
        _id: feedbackId,
        patientId: userId,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      };

      Feedback.findById = jest.fn().mockResolvedValue(mockOldFeedback);

      await expect(FeedbackService.updateFeedback(feedbackId, updateData, userId))
        .rejects.toThrow('Feedback can only be updated within 24 hours of submission');
    });

    test('should reject unauthorized update', async () => {
      const feedbackId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const differentUserId = new mongoose.Types.ObjectId();
      const updateData = { ratings: { overallSatisfaction: 4 } };

      const mockFeedback = {
        _id: feedbackId,
        patientId: differentUserId, // Different user
        createdAt: new Date()
      };

      Feedback.findById = jest.fn().mockResolvedValue(mockFeedback);

      await expect(FeedbackService.updateFeedback(feedbackId, updateData, userId))
        .rejects.toThrow('Unauthorized to update this feedback');
    });
  });

  describe('getFeedbackRequiringAttention', () => {
    test('should return critical feedback', async () => {
      const mockCriticalFeedback = [
        { _id: '1', flags: { criticalFeedback: true } },
        { _id: '2', ratings: { overallSatisfaction: 1 } }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCriticalFeedback)
      };

      Feedback.find = jest.fn().mockReturnValue(mockQuery);

      const result = await FeedbackService.getFeedbackRequiringAttention();

      expect(result.criticalFeedback).toEqual(mockCriticalFeedback);
      expect(result.totalCount).toBe(2);
      expect(Feedback.find).toHaveBeenCalledWith({
        $or: [
          { 'flags.requiresAttention': true },
          { 'flags.criticalFeedback': true },
          { 'ratings.overallSatisfaction': { $lte: 2 } },
          { recommendationScore: { $lte: 3 } }
        ],
        status: { $in: ['submitted', 'reviewed'] }
      });
    });
  });

  describe('exportFeedbackData', () => {
    test('should export feedback data as JSON', async () => {
      const mockFeedback = [
        { _id: '1', ratings: { overallSatisfaction: 5 } },
        { _id: '2', ratings: { overallSatisfaction: 4 } }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockFeedback)
      };

      Feedback.find = jest.fn().mockReturnValue(mockQuery);

      const result = await FeedbackService.exportFeedbackData({ format: 'json' });

      expect(result).toBe(JSON.stringify(mockFeedback, null, 2));
    });

    test('should export feedback data as CSV', async () => {
      const mockFeedback = [{
        createdAt: new Date('2024-01-01'),
        patientId: { name: 'John Doe' },
        providerId: { name: 'Dr. Smith' },
        therapyType: 'abhyanga',
        ratings: { 
          overallSatisfaction: 5,
          treatmentEffectiveness: 4,
          patientCare: 5 
        },
        recommendationScore: 9,
        overallImprovement: 75,
        status: 'submitted'
      }];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockFeedback)
      };

      Feedback.find = jest.fn().mockReturnValue(mockQuery);

      const result = await FeedbackService.exportFeedbackData({ format: 'csv' });

      expect(result).toContain('Date,Patient Name,Provider Name');
      expect(result).toContain('John Doe,Dr. Smith,abhyanga');
    });
  });
});
