import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, UserPlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

const TASK_FORM = { title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium', labels: '' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState(TASK_FORM);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { project: id } }),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data.tasks);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchMembers = async (q) => {
    setMemberSearch(q);
    if (!q) return setSearchResults([]);
    const res = await api.get('/users/search', { params: { q } });
    setSearchResults(res.data);
  };

  const addMember = async (userId) => {
    try {
      const res = await api.post(`/projects/${id}/members`, { userId });
      setProject(res.data);
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
      toast.success('Member removed');
    } catch {
      toast.error('Failed');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...taskForm, project: id, labels: taskForm.labels.split(',').map((l) => l.trim()).filter(Boolean) };
      await api.post('/tasks', data);
      toast.success('Task created');
      setShowTaskModal(false);
      setTaskForm(TASK_FORM);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch {
      toast.error('Failed');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchData();
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredTasks = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
  const progress = tasks.length ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/projects')} className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
            <Badge type="priority" value={project?.priority} />
            <Badge type="status" value={project?.status} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{project?.description}</p>
          {project?.deadline && <p className="text-xs text-gray-400 mt-1">Deadline: {formatDate(project.deadline)}</p>}
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <UserPlusIcon className="w-4 h-4" /> Members
            </button>
            <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <PlusIcon className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card p-5">
        <ProgressBar value={progress} />
        <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{tasks.length} total tasks</span>
          <span>{tasks.filter((t) => t.status === 'completed').length} completed</span>
          <span>{tasks.filter((t) => isOverdue(t.dueDate, t.status)).length} overdue</span>
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Tasks</h2>
          <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No tasks yet</div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div key={task._id}
                className={`card p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${isOverdue(task.dueDate, task.status) ? 'border-red-200 dark:border-red-900' : ''}`}>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/tasks/${task._id}`)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                    <Badge type="priority" value={task.priority} />
                    {isOverdue(task.dueDate, task.status) && (
                      <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {task.assignedTo && <span>Assigned to {task.assignedTo.name}</span>}
                    {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task._id, e.target.value)}
                    className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteTask(task._id)} className="text-gray-400 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Task">
        <form onSubmit={createTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="input" rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
              <select className="input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project?.members?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Labels</label>
              <input className="input" placeholder="bug, feature" value={taskForm.labels} onChange={(e) => setTaskForm({ ...taskForm, labels: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal open={showMemberModal} onClose={() => setShowMemberModal(false)} title="Manage Members">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search users</label>
            <input className="input" placeholder="Search by name or email..." value={memberSearch}
              onChange={(e) => searchMembers(e.target.value)} />
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {searchResults.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <button onClick={() => addMember(u._id)} className="btn-primary text-xs py-1 px-3">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Members</h3>
            <div className="space-y-2">
              {project?.members?.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Avatar name={m.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m._id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
              {!project?.members?.length && <p className="text-sm text-gray-400">No members yet</p>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
