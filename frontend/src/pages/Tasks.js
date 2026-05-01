import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search, ...filters };
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
    e.stopPropagation();
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchTasks();
    } catch {
      toast.error('Failed to update');
    }
  };

  const statusCols = ['todo', 'in-progress', 'completed'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total tasks</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search tasks..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="input w-auto" value={filters.priority}
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

      {/* Kanban-style columns */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filters.status || search || filters.priority || filters.overdue ? (
        // List view when filtering
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No tasks found</div>
          ) : tasks.map((task) => (
            <TaskRow key={task._id} task={task} onNavigate={() => navigate(`/tasks/${task._id}`)} onStatusChange={updateStatus} />
          ))}
        </div>
      ) : (
        // Kanban columns
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusCols.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            const labels = { todo: 'To Do', 'in-progress': 'In Progress', completed: 'Completed' };
            const colors = { todo: 'bg-gray-100 dark:bg-gray-800', 'in-progress': 'bg-blue-50 dark:bg-blue-900/10', completed: 'bg-green-50 dark:bg-green-900/10' };
            return (
              <div key={col} className={`rounded-xl p-4 ${colors[col]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{labels[col]}</h3>
                  <span className="badge bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={task._id} onClick={() => navigate(`/tasks/${task._id}`)}
                      className={`card p-3 cursor-pointer hover:shadow-md transition-shadow ${isOverdue(task.dueDate, task.status) ? 'border-red-200 dark:border-red-900' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                        <Badge type="priority" value={task.priority} />
                      </div>
                      {task.project && <p className="text-xs text-gray-400 mt-1">{task.project.name}</p>}
                      <div className="flex items-center justify-between mt-2">
                        {task.assignedTo ? <Avatar name={task.assignedTo.name} size="sm" /> : <span />}
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue(task.dueDate, task.status) ? 'text-red-500' : 'text-gray-400'}`}>
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary px-3 py-1 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <button className="btn-secondary px-3 py-1 text-sm" disabled={tasks.length < 15} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onNavigate, onStatusChange }) {
  return (
    <div className={`card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${isOverdue(task.dueDate, task.status) ? 'border-red-200 dark:border-red-900' : ''}`}
      onClick={onNavigate}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
          <Badge type="priority" value={task.priority} />
          {isOverdue(task.dueDate, task.status) && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          {task.project && <span>{task.project.name}</span>}
          {task.assignedTo && <span>→ {task.assignedTo.name}</span>}
          {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <select value={task.status} onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(task._id, e.target.value, e)}
        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
