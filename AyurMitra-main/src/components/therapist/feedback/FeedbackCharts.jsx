// src/components/therapist/feedback/FeedbackCharts.jsx
import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

const FeedbackCharts = () => {
  const ratingDistribution = [
    { stars: 5, count: 85, percentage: 66 },
    { stars: 4, count: 30, percentage: 23 },
    { stars: 3, count: 10, percentage: 8 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 1, percentage: 1 }
  ];

  const monthlyTrend = [
    { month: 'Jun', rating: 4.5 },
    { month: 'Jul', rating: 4.6 },
    { month: 'Aug', rating: 4.7 },
    { month: 'Sep', rating: 4.6 },
    { month: 'Oct', rating: 4.7 }
  ];

  return (
    <div className="space-y-8">
      {/* Rating Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          Rating Distribution
        </h3>
        
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 w-20">
                {[...Array(item.stars)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="w-20 text-right">
                <span className="text-sm font-medium text-gray-700">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Rating Trend (Last 5 Months)
        </h3>
        
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
          <div className="flex items-end justify-between h-48">
            {monthlyTrend.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                  <div
                    className="w-12 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-purple-600"
                    style={{ height: `${(item.rating / 5) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-bold text-blue-600">
                      {item.rating}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mt-3">{item.month}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Most Praised</p>
              <p className="text-lg font-bold text-green-900 mt-1">Professional Care</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Response Time</p>
              <p className="text-lg font-bold text-blue-900 mt-1">2.4 hours avg</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCharts;
