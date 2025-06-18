'use client'

import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface TimelineStepProps {
  title: string;
  timestamp?: string;
  isCompleted: boolean;
  isActive: boolean;
  icon: string;

}

const TimelineStep: React.FC<TimelineStepProps> = ({ 
  title, 
  timestamp, 
  isCompleted, 
  isActive,
  icon 
}) => {

  return (
    <div className="relative flex items-start space-x-4 pb-6">
      {/* Connector Line */}
      {!isActive && (
        <div className={`absolute left-5 top-10 w-0.5 h-full transition-colors duration-300 ${
          isCompleted ? 'bg-gradient-to-b from-green-500 to-green-300' : 'bg-gray-200'
        }`} />
      )}

      {/* Icon Circle */}
      <div className="relative z-10">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm
          transition-all duration-300 shadow-lg
          ${isCompleted
            ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white scale-110'
            : isActive
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white animate-pulse'
            : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'}
        `}>
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : isActive ? (
            <Clock className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`
          bg-white rounded-xl p-4 shadow-sm border transition-all duration-300
          ${isCompleted
            ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-25'
            : isActive
            ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-25 shadow-md'
            : 'border-gray-100 hover:shadow-sm'}
        `}>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl" role="img" aria-label={title}>{icon}</span>
            <h3 className={`font-semibold text-lg transition-colors duration-300 ${
              isCompleted 
                ? 'text-green-700' 
                : isActive 
                ? 'text-blue-700' 
                : 'text-gray-600'
            }`}>
              {title}
            </h3>
          </div>

          {timestamp ? (
            <div className={`
              inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
              ${isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-700'}
            `}>
              <Clock className="w-4 h-4" />
              <span>{timestamp}</span>
            </div>
          ) : (
            isActive && (
              <div className="w-full mt-2 flex justify-center">
                <input  min={new Date().toISOString().slice(0, 16)}
                  type="datetime-local"
                  className="w-full max-w-xs px-2 py-2 border border-blue-200 rounded-lg text-xs 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-white shadow-sm transition-all duration-200"
                  placeholder="เลือกวันที่และเวลา"
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineStep;
