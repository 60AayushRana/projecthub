import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon, ClipboardDocumentCheckIcon,
  Squares2X2Icon, ListBulletIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-gray-50 dark:bg-slate-800/50',       dot: 'bg-gray-400',    count: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
  { key: 'in-progress', label: 'In Progress',  color: 'bg-blue-50 dark:bg-blue-900/10',          dot: 'bg-blue-500',    count: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { key: 'completed',   label: 'Completed',    color: 'bg-emerald-50 dark:bg-emerald-900/10',    dot: 'bg-emerald-500', count: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
];

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, search, ...filters };
      if (user?.role === 'member') params.assignedTo = user._id;
      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters, user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (taskId, status, e) => {
    e?.stopPropagation();
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status } : t));
    } catch {
      toast.error('Failed to update');
    }
  };

  const hasFilters = filters.status || search || filters.priority || filters.overdue;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} task{total !== 1 ? 's' : ''} total</p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setView('kanban')}
            className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search tasks..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto min-w-32" value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="input w-auto min-w-32" value={filters.priority}
          onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="input w-auto" value={filters.overdue}
          onChange={(e) => { setFilters({ ...filters, overdue: e.target.value }); setPage(1); }}>
          <option value="">All Tasks</option>
          <option value="true">Overdue Only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">Tasks assigned to you will appear here</p>
        </div>
      ) : view === 'list' || hasFilters ? (
        /* List View */
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {tasks.map((task) => (
              <TaskRow key={task._id} task={task}
                onNavigate={() => navigate(`/tasks/${task._id}`)}
                onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className={`kanban-col ${col.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{col.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.count}`}>{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((task) => (
                    <KanbanCard key={task._id} task={task}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      onStatusChange={updateStatus} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      No tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 50 && (
        <div className="flex justify-center items-center gap-2">
          <button className="btn-secondary px-4 py-1.5 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-500 bg-slate-100 dark:bg-slate-800 rounded-lg">Page {page}</span>
          <button className="btn-secondary px-4 py-1.5 text-sm" disabled={tasks.length < 50} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ task, onClick, onStatusChange }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div onClick={onClick}
      className={`card p-3.5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${overdue ? 'border-rose-200 dark:border-rose-900/50' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{task.title}</p>
        <Badge type="priority" value={task.priority} />
      </div>
      {task.project && (
        <p className="text-xs text-gray-400 mb-2 truncate">{task.project.name}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {task.assignedTo
          ? <Avatar name={task.assignedTo.name} size="sm" />
          : <span className="text-xs text-gray-300 dark:text-gray-600">Unassigned</span>
        }
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
            {overdue && <ExclamationCircleIcon className="w-3.5 h-3.5" />}
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onNavigate, onStatusChange }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${overdue ? 'border-l-2 border-rose-400' : ''}`}
      onClick={onNavigate}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{task.title}</span>
          <Badge type="priority" value={task.priority} />
          {overdue && <span className="badge bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Overdue</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
          {task.project && <span>{task.project.name}</span>}
          {task.assignedTo && <span>→ {task.assignedTo.name}</span>}
          {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <select value={task.status} onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(task._id, e.target.value, e)}
        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
