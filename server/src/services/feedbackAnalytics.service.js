const Feedback = require('../models/Feedback');
const moment = require('moment');

class FeedbackAnalyticsService {
  
  async updatePatientProgress(patientId) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 [FeedbackAnalyticsService] updatePatientProgress called');
    console.log('📊 patientId:', patientId);
    
    try {
      const recentFeedback = await Feedback.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(10);

      console.log('📈 Recent feedback found:', recentFeedback.length);

      if (!recentFeedback || recentFeedback.length === 0) {
        console.log('⚠️  No feedback found for patient');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return null;
      }

      const progressData = this.calculateProgressMetrics(recentFeedback);
      
      const result = {
        patientId,
        progressBars: progressData.progressBars || {},
        improvements: progressData.improvements || [],
        trends: progressData.trends || {},
        lastUpdated: new Date()
      };
      
      console.log('✅ Progress calculated:');
      console.log('   - Progress bars:', Object.keys(result.progressBars).length);
      console.log('   - Improvements:', result.improvements.length);
      console.log('   - Trend:', result.trends.overall);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return result;
    } catch (error) {
      console.error('❌ Error updating patient progress:', error);
      console.error('   - Error message:', error.message);
      console.error('   - Error stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return null;
    }
  }

  calculateProgressMetrics(feedbackArray) {
    console.log('🔍 [calculateProgressMetrics] Called with', feedbackArray?.length, 'feedback items');
    
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      console.log('⚠️  Insufficient feedback data');
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' }
      };
    }

    const latest = feedbackArray[0];
    const baseline = feedbackArray[feedbackArray.length - 1];
    
    console.log('📊 Latest feedback date:', latest?.createdAt);
    console.log('📊 Baseline feedback date:', baseline?.createdAt);
    
    if (!latest || !baseline) {
      console.log('⚠️  Missing latest or baseline feedback');
      return {
        progressBars: {},
        improvements: [],
        trends: { overall: 'insufficient_data' }
      };
    }

    const progressBars = {};
    const improvements = [];
    
    if (latest.healthMetrics && baseline.healthMetrics) {
      console.log('✅ Health metrics available');
      
      Object.keys(latest.healthMetrics).forEach(metric => {
        const latestMetric = latest.healthMetrics[metric];
        const baselineMetric = baseline.healthMetrics[metric];
        
        if (latestMetric && baselineMetric && latestMetric.before && latestMetric.after && baselineMetric.before) {
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
          
          console.log(`   - ${metric}: ${improvement.toFixed(1)}% improvement`);
        }
      });
    } else {
      console.log('⚠️  Health metrics missing');
    }

    if (latest.improvements && Array.isArray(latest.improvements)) {
      console.log('✅ Improvements found:', latest.improvements.length);
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

    const trends = this.calculateOverallTrends(feedbackArray);
    console.log('📈 Overall trend:', trends.overall);

    return {
      progressBars,
      improvements,
      trends
    };
  }

  calculateOverallTrends(feedbackArray) {
    console.log('🔍 [calculateOverallTrends] Called with', feedbackArray?.length, 'items');
    
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return {
        overall: 'insufficient_data',
        satisfaction: 'stable',
        effectiveness: 'stable'
      };
    }

    const satisfactionTrend = this.calculateRatingTrend(feedbackArray, 'overallSatisfaction');
    const effectivenessTrend = this.calculateRatingTrend(feedbackArray, 'treatmentEffectiveness');
    
    console.log('   - Satisfaction trend:', satisfactionTrend);
    console.log('   - Effectiveness trend:', effectivenessTrend);
    
    return {
      overall: this.determineOverallTrend(satisfactionTrend, effectivenessTrend),
      satisfaction: satisfactionTrend,
      effectiveness: effectivenessTrend
    };
  }

  calculateRatingTrend(feedbackArray, ratingField) {
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }
    
    const ratings = feedbackArray
      .filter(fb => fb && fb.ratings && typeof fb.ratings === 'object')
      .map(fb => fb.ratings[ratingField])
      .filter(rating => rating !== undefined && rating !== null && !isNaN(rating))
      .reverse();
    
    console.log(`   - ${ratingField} ratings:`, ratings);
    
    if (ratings.length < 2) return 'stable';
    
    const recent = ratings.slice(-3);
    const older = ratings.slice(0, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r, 0) / older.length;
    
    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    console.log(`   - ${ratingField}: recent=${recentAvg.toFixed(2)}, older=${olderAvg.toFixed(2)}, change=${improvement.toFixed(1)}%`);
    
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
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length < 2) {
      return 'stable';
    }
    
    const improvements = feedbackArray
      .filter(fb => fb && fb.healthMetrics && fb.healthMetrics[metric])
      .map(fb => {
        const healthMetric = fb.healthMetrics[metric];
        if (!healthMetric || !healthMetric.before || !healthMetric.after) return 0;
        
        return this.calculateSessionImprovement(healthMetric, metric);
      })
      .filter(imp => !isNaN(imp) && imp !== 0);
    
    if (improvements.length === 0) return 'stable';
    
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    
    if (avgImprovement > 10) return 'improving';
    if (avgImprovement < -10) return 'declining';
    return 'stable';
  }

  calculateImprovement(before, after, lowerIsBetter = false) {
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
    if (!metric || typeof metric !== 'object' || !metric.before || !metric.after) {
      return 0;
    }
    
    const lowerIsBetter = ['painLevel', 'stressLevel'].includes(metricType);
    return this.calculateImprovement(metric.before, metric.after, lowerIsBetter);
  }

  async getPatientProgressAnalytics(patientId, timeRange = '6months') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 [getPatientProgressAnalytics] called');
    console.log('📊 patientId:', patientId);
    console.log('📅 timeRange:', timeRange);
    
    try {
      const startDate = moment().subtract(6, 'months').toDate();
      console.log('📅 Start date:', moment(startDate).format('YYYY-MM-DD'));
      
      const feedback = await Feedback.find({
        patientId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 });

      console.log('📈 Feedback found:', feedback.length);

      if (!feedback || feedback.length === 0) {
        console.log('⚠️  No feedback data available');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return { 
          message: 'No feedback data available for this patient',
          patientId,
          timeRange,
          totalSessions: 0
        };
      }

      const result = {
        patientId,
        timeRange,
        totalSessions: feedback.length,
        progressData: this.calculateSafeProgressData(feedback),
        milestones: this.identifyMilestones(feedback) || [],
        recommendations: this.generatePersonalizedRecommendations(feedback) || [],
        generatedAt: new Date()
      };
      
      console.log('✅ Analytics generated successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return result;
    } catch (error) {
      console.error('❌ Error getting patient progress analytics:', error);
      console.error('   - Error message:', error.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
    console.log('🔍 [calculateSafeProgressData] Processing', feedbackArray?.length, 'items');
    
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return {};
    }

    const metrics = ['painLevel', 'energyLevel', 'sleepQuality', 'stressLevel', 'overallWellbeing'];
    const progressData = {};
    
    metrics.forEach(metric => {
      const validData = feedbackArray
        .filter(fb => fb && fb.healthMetrics && fb.healthMetrics[metric])
        .map(fb => ({
          date: fb.createdAt,
          before: fb.healthMetrics[metric].before,
          after: fb.healthMetrics[metric].after,
          improvement: this.calculateSessionImprovement(fb.healthMetrics[metric], metric)
        }))
        .filter(d => d.before && d.after);

      console.log(`   - ${metric}: ${validData.length} valid data points`);

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
    console.log('🔍 [identifyMilestones] Processing', feedbackArray?.length, 'items');
    
    if (!feedbackArray || !Array.isArray(feedbackArray)) {
      return [];
    }

    const milestones = [];
    
    feedbackArray.forEach((feedback) => {
      if (!feedback) return;

      if (feedback.overallImprovement && feedback.overallImprovement > 50) {
        milestones.push({
          date: feedback.createdAt,
          type: 'major_improvement',
          description: `Achieved ${feedback.overallImprovement}% overall improvement`,
          significance: 'high'
        });
      }
      
      if (feedback.averageRating >= 4.5 && feedback.recommendationScore >= 9) {
        milestones.push({
          date: feedback.createdAt,
          type: 'excellent_satisfaction',
          description: 'Achieved excellent satisfaction scores',
          significance: 'medium'
        });
      }
    });
    
    console.log('   - Milestones identified:', milestones.length);
    
    return milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generatePersonalizedRecommendations(feedbackArray) {
    console.log('🔍 [generatePersonalizedRecommendations] Processing', feedbackArray?.length, 'items');
    
    if (!feedbackArray || !Array.isArray(feedbackArray) || feedbackArray.length === 0) {
      return [];
    }

    const recommendations = [];
    const latest = feedbackArray[0];
    
    if (!latest) return recommendations;
    
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
    
    console.log('   - Recommendations generated:', recommendations.length);
    
    return recommendations;
  }

  async getOverallStats(timeRange = '6months') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 [getOverallStats] called');
    console.log('📅 timeRange:', timeRange);
    
    try {
      const startDate = moment().subtract(6, 'months').toDate();
      console.log('📅 Start date:', moment(startDate).format('YYYY-MM-DD'));
      
      const [totalFeedback, criticalFeedbackCount] = await Promise.all([
        Feedback.countDocuments({ createdAt: { $gte: startDate } }),
        Feedback.countDocuments({ 
          createdAt: { $gte: startDate },
          'flags.criticalFeedback': true 
        })
      ]);

      console.log('📊 Stats:');
      console.log('   - Total feedback:', totalFeedback);
      console.log('   - Critical feedback:', criticalFeedbackCount);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
      console.error('❌ Error getting overall stats:', error);
      console.error('   - Error message:', error.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
