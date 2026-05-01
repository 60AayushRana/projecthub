import { format, formatDistanceToNow, isPast } from 'date-fns';

export const formatDate = (date) => (date ? format(new Date(date), 'MMM d, yyyy') : '—');
export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
export const isOverdue = (date, status) => date && status !== 'completed' && isPast(new Date(date));

export const priorityColor = (p) => ({
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}[p] || '');

export const statusColor = (s) => ({
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'on-hold': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}[s] || '');

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
