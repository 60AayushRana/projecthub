import React from 'react';
import { getInitials } from '../utils/helpers';

const colors = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500',
];

const getColor = (name = '') => colors[name.charCodeAt(0) % colors.length];

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
};

export default function Avatar({ name, src, size = 'md' }) {
  if (src) return (
    <img src={src} alt={name}
      className={`${sizes[size]} rounded-xl object-cover border-2 border-white dark:border-slate-800`} />
  );

  return (
    <div className={`${sizes[size]} ${getColor(name)} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white dark:border-slate-800`}>
      {getInitials(name)}
    </div>
  );
}
