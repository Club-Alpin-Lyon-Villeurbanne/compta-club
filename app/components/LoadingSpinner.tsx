import React from 'react';
import { FaSpinner } from "react-icons/fa";

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
  loadingText?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'w-8 h-8', 
  color = 'text-blue-500',
  loadingText = 'Chargement...'
}) => (
  <div className="flex justify-center items-center h-screen" role="status">
    <FaSpinner className={`animate-spin ${size} ${color}`} aria-hidden="true" />
    <span className="sr-only">{loadingText}</span>
  </div>
);

export default LoadingSpinner;