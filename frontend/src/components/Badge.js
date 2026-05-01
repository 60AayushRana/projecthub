import React from 'react';
import { priorityColor, statusColor } from '../utils/helpers';

export default function Badge({ type, value, className = '' }) {
  const color = type === 'priority' ? priorityColor(value) : statusColor(value);
  const label = value?.replace('-', ' ');
  return (
    <span className={`badge ${color} ${className}`}>{label}</span>
  );
}
