// src/components/therapist/feedback/FeedbackCard.jsx
import React from 'react';
import { Star, User, Calendar } from 'lucide-react';

const FeedbackCard = ({ feedback }) => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {feedback.patientName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{feedback.patientName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(feedback.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < feedback.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-3">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {feedback.therapyType}
        </span>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">
        {feedback.comment}
      </p>
    </div>
  );
};

export default FeedbackCard;
