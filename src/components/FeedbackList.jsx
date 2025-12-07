import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Activity, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';

const FeedbackList = ({ feedbackData, onLoadMore, hasMore }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!feedbackData || feedbackData.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center"
      >
        <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">No feedback yet</h3>
        <p className="text-slate-600">Patient reviews will appear here once you complete sessions</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbackData.map((item, index) => (
        <motion.div
          key={item._id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all overflow-hidden"
        >
          {/* Header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {item.patientId?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">
                    {item.patientId?.name || 'Anonymous Patient'}
                  </h4>
                  <p className="text-sm text-slate-600 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < (item.ratings?.overallSatisfaction || 0) 
                        ? 'text-amber-400 fill-current' 
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-bold text-slate-700">
                  {item.ratings?.overallSatisfaction?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>

            {/* Therapy Type Badge */}
            {item.therapyType && (
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                <Activity className="w-4 h-4" />
                <span className="capitalize">{item.therapyType}</span>
              </div>
            )}

            {/* Rating Breakdown */}
            {item.ratings && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {item.ratings.treatmentEffectiveness && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Effectiveness</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < item.ratings.treatmentEffectiveness ? 'text-blue-500 fill-current' : 'text-blue-200'}`} />
                      ))}
                    </div>
                  </div>
                )}
                {item.ratings.patientCare && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Patient Care</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < item.ratings.patientCare ? 'text-emerald-500 fill-current' : 'text-emerald-200'}`} />
                      ))}
                    </div>
                  </div>
                )}
                {item.ratings.therapistProfessionalism && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 font-medium mb-1">Professionalism</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < item.ratings.therapistProfessionalism ? 'text-purple-500 fill-current' : 'text-purple-200'}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Text */}
            {item.textFeedback?.positiveAspects && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-slate-700 italic">
                  "{item.textFeedback.positiveAspects}"
                </p>
              </div>
            )}

            {/* Expand/Collapse Button */}
            {(item.healthMetrics || item.improvements || item.textFeedback?.additionalComments) && (
              <button
                onClick={() => toggleExpand(item._id)}
                className="mt-4 flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                <span>{expandedId === item._id ? 'Show Less' : 'Show More Details'}</span>
                {expandedId === item._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedId === item._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-200"
              >
                <div className="p-6 bg-slate-50 space-y-4">
                  {/* Health Metrics */}
                  {item.healthMetrics && (
                    <div>
                      <h5 className="font-semibold text-slate-800 mb-3 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-purple-500" />
                        Health Improvements
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(item.healthMetrics).map(([key, value]) => {
                          if (value.before && value.after) {
                            const improvement = key === 'painLevel' || key === 'stressLevel'
                              ? value.before - value.after
                              : value.after - value.before;
                            return (
                              <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                                <p className="text-xs text-slate-600 mb-1 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-slate-500">{value.before}</span>
                                  <span className="text-purple-500">→</span>
                                  <span className="text-sm font-bold text-slate-800">{value.after}</span>
                                  <span className={`text-xs font-medium ${improvement > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {improvement > 0 ? '+' : ''}{improvement}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {item.improvements && item.improvements.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-800 mb-3">Specific Improvements</h5>
                      <div className="space-y-2">
                        {item.improvements.map((improvement, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700 capitalize">
                                {improvement.aspect.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {improvement.progressLevel}%
                              </span>
                            </div>
                            {improvement.notes && (
                              <p className="text-xs text-slate-600">{improvement.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Comments */}
                  {item.textFeedback?.additionalComments && (
                    <div>
                      <h5 className="font-semibold text-slate-800 mb-2">Additional Comments</h5>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-sm text-slate-700">{item.textFeedback.additionalComments}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Load More Feedback
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
