import { useContext } from 'react';
import { RealTimeContext } from '../context/RealTimeContext';

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
