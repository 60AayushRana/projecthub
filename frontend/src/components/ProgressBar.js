import React from 'react';

export default function ProgressBar({ value = 0, showLabel = true, size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const color = value >= 100 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{value}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${heights[size]}`}>
        <div
          className={`${heights[size]} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
