// src/components/therapist/feedback/FeedbackList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import FeedbackCard from './FeedbackCard';

const FeedbackList = () => {
  const feedbackList = [
    {
      id: 1,
      patientName: 'Rajesh Kumar',
      rating: 5,
      comment: 'Excellent therapy session! Very professional and caring approach.',
      date: '2025-10-10',
      therapyType: 'Abhyanga'
    },
    {
      id: 2,
      patientName: 'Priya Sharma',
      rating: 4,
      comment: 'Good experience overall. The therapist was knowledgeable.',
      date: '2025-10-09',
      therapyType: 'Shirodhara'
    },
    {
      id: 3,
      patientName: 'Amit Patel',
      rating: 5,
      comment: 'Best Panchakarma treatment I have received. Highly recommended!',
      date: '2025-10-08',
      therapyType: 'Panchakarma'
    }
  ];

  return (
    <div className="space-y-4">
      {feedbackList.map((feedback, index) => (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <FeedbackCard feedback={feedback} />
        </motion.div>
      ))}
    </div>
  );
};

export default FeedbackList;
