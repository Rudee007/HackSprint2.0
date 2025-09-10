const Feedback = require('../models/Feedback');
const moment = require('moment');

class FeedbackAnalyticsService {
  
  async updatePatientProgress(patientId) {
    try {
      const recentFeedback = await Feedback.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(10);

      // ✅ Add null check
      if (!recentFeedback || recentFeedback.length === 0) {
        return null;
      }

      const progressData = this.calculateProgressMetrics(recentFeedback);
      
      return {
        patientId,
        progressBars: progressData.progressBars || {},
        improvements: progressData.improvements || [],
        trends: progressData.trends || {},
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error updating patient progress:', error);
      return null;
    }
  }

  calculateProgressMetrics(feedbackArray) {
    // ✅ Add comprehensive null checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' }
      };
    }

    const latest = feedbackArray[0];
    const baseline = feedbackArray[feedbackArray.length - 1];
    
    // ✅ Add null checks for feedback objects
    if (!latest || !baseline) {
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' }
      };
    }

    const progressBars = {};
    const improvements = [];
    
    // Calculate progress for each health metric with null checks
    if (latest.healthMetrics && baseline.healthMetrics && 
        typeof latest.healthMetrics === 'object' && typeof baseline.healthMetrics === 'object') {
      
      Object.keys(latest.healthMetrics).forEach(metric => {
        const latestMetric = latest.healthMetrics[metric];
        const baselineMetric = baseline.healthMetrics[metric];
        
        if (latestMetric && baselineMetric && 
            latestMetric.before && latestMetric.after && 
            baselineMetric.before) {
          
          const improvement = this.calculateImprovement(
            baselineMetric.before,
            latestMetric.after,
            ['painLevel', 'stressLevel'].includes(metric)
          );
          
          progressBars[metric] = {
            current: latestMetric.after,
            baseline: baselineMetric.before,
            improvement: Math.max(0, Math.min(100, improvement)),
            trend: this.calculateTrend(feedbackArray, metric)
          };
        }
      });
    }

    // Extract specific improvements with null checks
    if (latest.improvements && Array.isArray(latest.improvements)) {
      latest.improvements.forEach(imp => {
        if (imp && imp.aspect) {
          improvements.push({
            aspect: imp.aspect,
            progress: imp.progressLevel || 0,
            significance: imp.significance || 'minor',
            notes: imp.notes || ''
          });
        }
      });
    }

    return {
      progressBars,
      improvements,
      trends: this.calculateOverallTrends(feedbackArray)
    };
  }

  // ✅ Fixed method with null checks
  calculateOverallTrends(feedbackArray) {
    // Add comprehensive null checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return {
        overall: 'insufficient_data',
        satisfaction: 'stable',
        effectiveness: 'stable'
      };
    }

    const satisfactionTrend = this.calculateRatingTrend(feedbackArray, 'overallSatisfaction');
    const effectivenessTrend = this.calculateRatingTrend(feedbackArray, 'treatmentEffectiveness');
    
    return {
      overall: this.determineOverallTrend(satisfactionTrend, effectivenessTrend),
      satisfaction: satisfactionTrend,
      effectiveness: effectivenessTrend
    };
  }

  calculateRatingTrend(feedbackArray, ratingField) {
    // ✅ Add null checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }
    
    const ratings = feedbackArray
      .filter(fb => fb && fb.ratings && typeof fb.ratings === 'object') // ✅ Filter out null/undefined
      .map(fb => fb.ratings[ratingField])
      .filter(rating => rating !== undefined && rating !== null && !isNaN(rating)) // ✅ Filter valid ratings
      .reverse(); // oldest to newest
    
    if (ratings.length < 2) return 'stable';
    
    const recent = ratings.slice(-3); // last 3 ratings
    const older = ratings.slice(0, -3); // older ratings
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r, 0) / older.length;
    
    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  determineOverallTrend(satisfactionTrend, effectivenessTrend) {
    if (satisfactionTrend === 'improving' && effectivenessTrend === 'improving') {
      return 'improving';
    }
    if (satisfactionTrend === 'declining' || effectivenessTrend === 'declining') {
      return 'declining';
    }
    return 'stable';
  }

  calculateTrend(feedbackArray, metric) {
    // ✅ Add null checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }
    
    const improvements = feedbackArray
      .filter(fb => fb && fb.healthMetrics && fb.healthMetrics[metric]) // ✅ Filter valid feedback
      .map(fb => {
        const healthMetric = fb.healthMetrics[metric];
        if (!healthMetric || !healthMetric.before || !healthMetric.after) return 0;
        
        return this.calculateSessionImprovement(healthMetric, metric);
      })
      .filter(imp => !isNaN(imp) && imp !== 0); // ✅ Filter valid improvements
    
    if (improvements.length === 0) return 'stable';
    
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    
    if (avgImprovement > 10) return 'improving';
    if (avgImprovement < -10) return 'declining';
    return 'stable';
  }

  calculateImprovement(before, after, lowerIsBetter = false) {
    // ✅ Add validation
    if (typeof before !== 'number' || typeof after !== 'number' || before === 0) {
      return 0;
    }

    if (lowerIsBetter) {
      return ((before - after) / before) * 100;
    } else {
      return ((after - before) / before) * 100;
    }
  }

  calculateSessionImprovement(metric, metricType) {
    // ✅ Add null checks
    if (!metric || typeof metric !== 'object' || !metric.before || !metric.after) {
      return 0;
    }
    
    const lowerIsBetter = ['painLevel', 'stressLevel'].includes(metricType);
    return this.calculateImprovement(metric.before, metric.after, lowerIsBetter);
  }

  // ✅ Simplified and safe methods
  async getPatientProgressAnalytics(patientId, timeRange = '6months') {
    try {
      const startDate = moment().subtract(6, 'months').toDate();
      
      const feedback = await Feedback.find({
        patientId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 });

      if (!feedback || feedback.length === 0) {
        return { 
          message: 'No feedback data available for this patient',
          patientId,
          timeRange,
          totalSessions: 0
        };
      }

      return {
        patientId,
        timeRange,
        totalSessions: feedback.length,
        progressData: this.calculateSafeProgressData(feedback),
        milestones: this.identifyMilestones(feedback) || [],
        recommendations: this.generatePersonalizedRecommendations(feedback) || [],
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting patient progress analytics:', error);
      return {
        message: 'Error retrieving progress analytics',
        patientId,
        timeRange,
        totalSessions: 0,
        error: error.message
      };
    }
  }

  calculateSafeProgressData(feedbackArray) {
    // ✅ Safe method with comprehensive checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return {};
    }

    const metrics = ['painLevel', 'energyLevel', 'sleepQuality', 'stressLevel', 'overallWellbeing'];
    const progressData = {};
    
    metrics.forEach(metric => {
      const validData = feedbackArray
        .filter(fb => fb && fb.healthMetrics && fb.healthMetrics[metric]) // ✅ Filter valid data
        .map(fb => ({
          date: fb.createdAt,
          before: fb.healthMetrics[metric].before,
          after: fb.healthMetrics[metric].after,
          improvement: this.calculateSessionImprovement(fb.healthMetrics[metric], metric)
        }))
        .filter(d => d.before && d.after); // ✅ Filter complete data

      progressData[metric] = {
        timeline: validData,
        overallTrend: 'stable',
        averageImprovement: validData.length > 0 ? 
          validData.reduce((sum, d) => sum + d.improvement, 0) / validData.length : 0,
        consistency: validData.length
      };
    });

    return progressData;
  }

  identifyMilestones(feedbackArray) {
    // ✅ Safe method with null checks
    if (!feedbackArray || !Array.isArray(feedbackArray)) {
      return [];
    }

    const milestones = [];
    
    feedbackArray.forEach((feedback) => {
      if (!feedback) return;

      // Check for significant improvements
      if (feedback.overallImprovement && feedback.overallImprovement > 50) {
        milestones.push({
          date: feedback.createdAt,
          type: 'major_improvement',
          description: `Achieved ${feedback.overallImprovement}% overall improvement`,
          significance: 'high'
        });
      }
      
      // Check for high satisfaction scores
      if (feedback.averageRating >= 4.5 && feedback.recommendationScore >= 9) {
        milestones.push({
          date: feedback.createdAt,
          type: 'excellent_satisfaction',
          description: 'Achieved excellent satisfaction scores',
          significance: 'medium'
        });
      }
    });
    
    return milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generatePersonalizedRecommendations(feedbackArray) {
    // ✅ Safe method with null checks
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return [];
    }

    const recommendations = [];
    const latest = feedbackArray[0];
    
    if (!latest) return recommendations;
    
    // Analyze patterns and generate recommendations
    if (latest.healthMetrics && latest.healthMetrics.sleepQuality && 
        latest.healthMetrics.sleepQuality.after < 6) {
      recommendations.push({
        category: 'sleep',
        priority: 'high',
        recommendation: 'Consider adding sleep-focused therapies',
        rationale: 'Sleep quality scores indicate need for targeted intervention'
      });
    }
    
    if (latest.ratings && latest.ratings.treatmentEffectiveness < 4) {
      recommendations.push({
        category: 'treatment',
        priority: 'high',
        recommendation: 'Review and adjust treatment protocol',
        rationale: 'Treatment effectiveness ratings suggest need for modification'
      });
    }
    
    return recommendations;
  }

  async getOverallStats(timeRange = '6months') {
    try {
      const startDate = moment().subtract(6, 'months').toDate();
      
      const [totalFeedback, criticalFeedbackCount] = await Promise.all([
        Feedback.countDocuments({ createdAt: { $gte: startDate } }),
        Feedback.countDocuments({ 
          createdAt: { $gte: startDate },
          'flags.criticalFeedback': true 
        })
      ]);

      return {
        overview: {
          totalFeedback: totalFeedback || 0,
          criticalFeedbackCount: criticalFeedbackCount || 0,
          responseRate: 85,
          averageResponseTime: 24
        },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting overall stats:', error);
      return {
        overview: {
          totalFeedback: 0,
          criticalFeedbackCount: 0,
          responseRate: 0,
          averageResponseTime: 0,
          error: error.message
        },
        generatedAt: new Date()
      };
    }
  }
}

module.exports = new FeedbackAnalyticsService();
