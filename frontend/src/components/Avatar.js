import React from 'react';
import { getInitials } from '../utils/helpers';

const colors = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
  'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

const getColor = (name = '') => colors[name.charCodeAt(0) % colors.length];

export default function Avatar({ name, src, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;

  return (
    <div className={`${sizes[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}
