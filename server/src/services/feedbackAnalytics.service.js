// services/feedbackAnalytics.service.js
const Feedback = require('../models/Feedback');
const moment = require('moment');

class FeedbackAnalyticsService {
  // ================== HIGH-LEVEL PATIENT PROGRESS ==================

  async updatePatientProgress(patientId) {
    try {
      const recentFeedback = await Feedback.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(10);

      if (!recentFeedback || recentFeedback.length === 0) {
        return null;
      }

      const progressData = this.calculateProgressMetrics(recentFeedback);

      return {
        patientId,
        progressBars: progressData.progressBars || {},
        improvements: progressData.improvements || [],
        trends: progressData.trends || {},
        lastUpdated: new Date(),
      };
    } catch (error) {
      // keep this silent for patient flow; controller already handles fallback
      return null;
    }
  }

  // ================== CORE METRIC CALCULATIONS ==================

  calculateProgressMetrics(feedbackArray) {
    if (!Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' },
      };
    }

    const latest = feedbackArray[0];
    const baseline = feedbackArray[feedbackArray.length - 1];

    if (!latest || !baseline) {
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' },
      };
    }

    const progressBars = {};
    const improvements = [];

    // healthMetrics → progress bars for doctor view
    if (latest.healthMetrics && baseline.healthMetrics) {
      Object.keys(latest.healthMetrics).forEach((metric) => {
        const latestMetric = latest.healthMetrics[metric];
        const baselineMetric = baseline.healthMetrics[metric];

        if (
          latestMetric &&
          baselineMetric &&
          typeof latestMetric.before === 'number' &&
          typeof latestMetric.after === 'number' &&
          typeof baselineMetric.before === 'number'
        ) {
          const improvement = this.calculateImprovement(
            baselineMetric.before,
            latestMetric.after,
            ['painLevel', 'stressLevel'].includes(metric)
          );

          progressBars[metric] = {
            current: latestMetric.after,
            baseline: baselineMetric.before,
            improvement: Math.max(0, Math.min(100, improvement)),
            trend: this.calculateTrend(feedbackArray, metric),
          };
        }
      });
    }

    // structured improvements array → patient & doctor dashboards
    if (Array.isArray(latest.improvements)) {
      latest.improvements.forEach((imp) => {
        if (!imp || !imp.aspect) return;
        improvements.push({
          aspect: imp.aspect,
          progress: imp.progressLevel || 0,
          significance: imp.significance || 'minor',
          notes: imp.notes || '',
        });
      });
    }

    const trends = this.calculateOverallTrends(feedbackArray);

    return { progressBars, improvements, trends };
  }

  calculateOverallTrends(feedbackArray) {
    if (!Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return {
        overall: 'insufficient_data',
        satisfaction: 'stable',
        effectiveness: 'stable',
      };
    }

    const satisfactionTrend = this.calculateRatingTrend(
      feedbackArray,
      'overallSatisfaction'
    );
    const effectivenessTrend = this.calculateRatingTrend(
      feedbackArray,
      'treatmentEffectiveness'
    );

    return {
      overall: this.determineOverallTrend(
        satisfactionTrend,
        effectivenessTrend
      ),
      satisfaction: satisfactionTrend,
      effectiveness: effectivenessTrend,
    };
  }

  calculateRatingTrend(feedbackArray, ratingField) {
    if (!Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }

    const ratings = feedbackArray
      .filter((fb) => fb && fb.ratings && typeof fb.ratings === 'object')
      .map((fb) => fb.ratings[ratingField])
      .filter(
        (rating) =>
          rating !== undefined &&
          rating !== null &&
          !Number.isNaN(Number(rating))
      )
      .reverse(); // oldest → newest

    if (ratings.length < 2) return 'stable';

    const recent = ratings.slice(-3);
    const older = ratings.slice(0, -3);

    if (older.length === 0) return 'stable';

    const recentAvg =
      recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, r) => sum + r, 0) / older.length;

    if (olderAvg === 0) return 'stable';

    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  determineOverallTrend(satisfactionTrend, effectivenessTrend) {
    if (satisfactionTrend === 'improving' && effectivenessTrend === 'improving') {
      return 'improving';
    }
    if (
      satisfactionTrend === 'declining' ||
      effectivenessTrend === 'declining'
    ) {
      return 'declining';
    }
    return 'stable';
  }

  calculateTrend(feedbackArray, metric) {
    if (!Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }

    const improvements = feedbackArray
      .filter((fb) => fb && fb.healthMetrics && fb.healthMetrics[metric])
      .map((fb) => {
        const m = fb.healthMetrics[metric];
        if (!m || m.before == null || m.after == null) return 0;
        return this.calculateSessionImprovement(m, metric);
      })
      .filter((imp) => !Number.isNaN(imp) && imp !== 0);

    if (!improvements.length) return 'stable';

    const avgImprovement =
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;

    if (avgImprovement > 10) return 'improving';
    if (avgImprovement < -10) return 'declining';
    return 'stable';
  }

  calculateImprovement(before, after, lowerIsBetter = false) {
    if (
      typeof before !== 'number' ||
      typeof after !== 'number' ||
      before === 0
    ) {
      return 0;
    }

    if (lowerIsBetter) {
      return ((before - after) / before) * 100;
    }
    return ((after - before) / before) * 100;
  }

  calculateSessionImprovement(metric, metricType) {
    if (
      !metric ||
      typeof metric !== 'object' ||
      metric.before == null ||
      metric.after == null
    ) {
      return 0;
    }

    const lowerIsBetter = ['painLevel', 'stressLevel'].includes(metricType);
    return this.calculateImprovement(metric.before, metric.after, lowerIsBetter);
  }

  // ================== PATIENT PROGRESS API (for controller) ==================

  async getPatientProgressAnalytics(patientId, timeRange = '6months') {
    try {
      const startDate = moment().subtract(6, 'months').toDate();

      const feedback = await Feedback.find({
        patientId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 });

      if (!feedback || !feedback.length) {
        return {
          message: 'No feedback data available for this patient',
          patientId,
          timeRange,
          totalSessions: 0,
        };
      }

      return {
        patientId,
        timeRange,
        totalSessions: feedback.length,
        progressData: this.calculateSafeProgressData(feedback),
        milestones: this.identifyMilestones(feedback) || [],
        recommendations: this.generatePersonalizedRecommendations(feedback) || [],
        generatedAt: new Date(),
      };
    } catch (error) {
      return {
        message: 'Error retrieving progress analytics',
        patientId,
        timeRange,
        totalSessions: 0,
        error: error.message,
      };
    }
  }

  calculateSafeProgressData(feedbackArray) {
    if (!Array.isArray(feedbackArray) || !feedbackArray.length) {
      return {};
    }

    const metrics = [
      'painLevel',
      'energyLevel',
      'sleepQuality',
      'stressLevel',
      'overallWellbeing',
    ];
    const progressData = {};

    metrics.forEach((metric) => {
      const points = feedbackArray
        .filter((fb) => fb && fb.healthMetrics && fb.healthMetrics[metric])
        .map((fb) => {
          const m = fb.healthMetrics[metric];
          return {
            date: fb.createdAt,
            before: m.before,
            after: m.after,
            improvement: this.calculateSessionImprovement(m, metric),
          };
        })
        .filter((d) => d.before != null && d.after != null);

      progressData[metric] = {
        timeline: points,
        overallTrend: 'stable', // per-metric trend if you want can reuse calculateTrend
        averageImprovement: points.length
          ? points.reduce((sum, d) => sum + d.improvement, 0) / points.length
          : 0,
        consistency: points.length,
      };
    });

    return progressData;
  }

  identifyMilestones(feedbackArray) {
    if (!Array.isArray(feedbackArray)) return [];

    const milestones = [];

    feedbackArray.forEach((feedback) => {
      if (!feedback) return;

      if (feedback.overallImprovement && feedback.overallImprovement > 50) {
        milestones.push({
          date: feedback.createdAt,
          type: 'major_improvement',
          description: `Achieved ${feedback.overallImprovement}% overall improvement`,
          significance: 'high',
        });
      }

      if (feedback.averageRating >= 4.5 && feedback.recommendationScore >= 9) {
        milestones.push({
          date: feedback.createdAt,
          type: 'excellent_satisfaction',
          description: 'Achieved excellent satisfaction scores',
          significance: 'medium',
        });
      }
    });

    return milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generatePersonalizedRecommendations(feedbackArray) {
    if (!Array.isArray(feedbackArray) || !feedbackArray.length) {
      return [];
    }

    const recommendations = [];
    const latest = feedbackArray[0];
    if (!latest) return recommendations;

    // clinical recommendations (doctor view)
    if (
      latest.healthMetrics &&
      latest.healthMetrics.sleepQuality &&
      latest.healthMetrics.sleepQuality.after < 6
    ) {
      recommendations.push({
        category: 'sleep',
        priority: 'high',
        recommendation: 'Consider adding sleep-focused therapies',
        rationale: 'Sleep quality scores indicate need for targeted intervention',
      });
    }

    if (
      latest.ratings &&
      typeof latest.ratings.treatmentEffectiveness === 'number' &&
      latest.ratings.treatmentEffectiveness < 4
    ) {
      recommendations.push({
        category: 'treatment',
        priority: 'high',
        recommendation: 'Review and adjust treatment protocol',
        rationale: 'Treatment effectiveness ratings suggest need for modification',
      });
    }

    // service / admin side examples
    if (
      latest.ratings &&
      typeof latest.ratings.facilityQuality === 'number' &&
      latest.ratings.facilityQuality < 4
    ) {
      recommendations.push({
        category: 'facility',
        priority: 'medium',
        recommendation: 'Review facility hygiene, waiting time, and ambience',
        rationale: 'Facility quality ratings are below desired threshold',
      });
    }

    return recommendations;
  }

  // ================== OVERALL SYSTEM STATS ==================

  async getOverallStats(timeRange = '6months') {
    try {
      const startDate = moment().subtract(6, 'months').toDate();

      const [totalFeedback, criticalFeedbackCount] = await Promise.all([
        Feedback.countDocuments({ createdAt: { $gte: startDate } }),
        Feedback.countDocuments({
          createdAt: { $gte: startDate },
          'flags.criticalFeedback': true,
        }),
      ]);

      return {
        overview: {
          totalFeedback: totalFeedback || 0,
          criticalFeedbackCount: criticalFeedbackCount || 0,
          // you can compute these later from real SLA data
          responseRate: 85,
          averageResponseTime: 24,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      return {
        overview: {
          totalFeedback: 0,
          criticalFeedbackCount: 0,
          responseRate: 0,
          averageResponseTime: 0,
          error: error.message,
        },
        generatedAt: new Date(),
      };
    }
  }

  // Optional: provider-level analytics if you want a dedicated method
  async getProviderAnalytics(providerId, timeRange = '6months') {
    const startDate = moment().subtract(6, 'months').toDate();

    const feedback = await Feedback.find({
      providerId,
      createdAt: { $gte: startDate },
      'visibility.toDoctor': true,
    }).sort({ createdAt: 1 });

    if (!feedback.length) {
      return {
        providerId,
        timeRange,
        totalFeedback: 0,
        averageRatings: {},
        trends: { overall: 'insufficient_data' },
      };
    }

    const averageRatingsAgg = await Feedback.aggregate([
      {
        $match: {
          providerId,
          createdAt: { $gte: startDate },
          'visibility.toDoctor': true,
        },
      },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$ratings.overallSatisfaction' },
          avgEffectiveness: { $avg: '$ratings.treatmentEffectiveness' },
          avgCare: { $avg: '$ratings.patientCare' },
          avgCommunication: { $avg: '$ratings.communicationQuality' },
        },
      },
    ]);

    const avg = averageRatingsAgg[0] || {};

    return {
      providerId,
      timeRange,
      totalFeedback: feedback.length,
      averageRatings: {
        avgOverall: avg.avgOverall || 0,
        avgEffectiveness: avg.avgEffectiveness || 0,
        avgCare: avg.avgCare || 0,
        avgCommunication: avg.avgCommunication || 0,
      },
      trends: this.calculateOverallTrends(feedback),
    };
  }

  // Optional stub: if controller calls getImprovementTrends
  async getImprovementTrends(metric = 'overallWellbeing', timeRange = '1year') {
    const startDate = moment().subtract(1, 'year').toDate();

    const feedback = await Feedback.find({
      createdAt: { $gte: startDate },
      [`healthMetrics.${metric}`]: { $exists: true },
    }).sort({ createdAt: 1 });

    if (!feedback.length) {
      return {
        metric,
        timeRange,
        trend: 'insufficient_data',
        timeline: [],
      };
    }

    const timeline = feedback
      .map((fb) => {
        const m = fb.healthMetrics[metric];
        if (!m || m.before == null || m.after == null) return null;
        return {
          date: fb.createdAt,
          improvement: this.calculateSessionImprovement(m, metric),
        };
      })
      .filter(Boolean);

    const trend = this.calculateTrend(feedback, metric);

    return {
      metric,
      timeRange,
      trend,
      timeline,
    };
  }
}

module.exports = new FeedbackAnalyticsService();
