import { format, formatDistanceToNow, isPast } from 'date-fns';

export const formatDate = (date) => (date ? format(new Date(date), 'MMM d, yyyy') : '—');
export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
export const isOverdue = (date, status) => date && status !== 'completed' && isPast(new Date(date));

export const priorityColor = (p) => ({
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high:   'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}[p] || 'bg-gray-100 text-gray-600');

export const statusColor = (s) => ({
  todo:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  active:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'on-hold':     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}[s] || 'bg-gray-100 text-gray-600');

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
