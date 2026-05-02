import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon, MagnifyingGlassIcon, FolderOpenIcon,
  CalendarDaysIcon, UserGroupIcon, EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', deadline: '', priority: 'medium', tags: '' };

const priorityDot = { high: 'bg-rose-500', medium: 'bg-amber-400', low: 'bg-emerald-400' };

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9, search, ...filters };
      const res = await api.get('/projects', { params });
      setProjects(res.data.projects);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openCreate = () => { setEditProject(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p, e) => {
    e.stopPropagation();
    setMenuOpen(null);
    setEditProject(p);
    setForm({ name: p.name, description: p.description, deadline: p.deadline?.slice(0, 10) || '', priority: p.priority, tags: p.tags?.join(', ') || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editProject) {
        await api.put(`/projects/${editProject._id}`, data);
        toast.success('Project updated');
      } else {
        await api.post('/projects', data);
        toast.success('Project created');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setMenuOpen(null);
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} project{total !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openCreate} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search projects..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto min-w-32" value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <select className="input w-auto min-w-32" value={filters.priority}
          onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpenIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No projects found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new project</p>
          {user?.role === 'admin' && (
            <button onClick={openCreate} className="btn-primary mt-5">
              <PlusIcon className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)}
              className="card-hover p-5 group relative" onClick={() => { setMenuOpen(null); navigate(`/projects/${p._id}`); }}>

              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot[p.priority] || 'bg-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h3>
                </div>
                {user?.role === 'admin' && (
                  <div className="relative ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p._id ? null : p._id); }}
                      className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                    {menuOpen === p._id && (
                      <div className="absolute right-0 top-7 w-32 card shadow-lg z-10 py-1 animate-fade-in">
                        <button onClick={(e) => openEdit(p, e)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button>
                        <button onClick={(e) => handleDelete(p._id, e)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 min-h-[2.5rem]">
                {p.description || 'No description provided'}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{p.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-primary-400 transition-all duration-500"
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {p.members?.slice(0, 4).map((m) => (
                    <div key={m._id} title={m.name}><Avatar name={m.name} size="sm" /></div>
                  ))}
                  {p.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 font-medium">
                      +{p.members.length - 4}
                    </div>
                  )}
                  {(!p.members || p.members.length === 0) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <UserGroupIcon className="w-3.5 h-3.5" /> No members
                    </div>
                  )}
                </div>
                <Badge type="status" value={p.status} />
              </div>

              {p.deadline && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Due {formatDate(p.deadline)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 9 && (
        <div className="flex justify-center items-center gap-2">
          <button className="btn-secondary px-4 py-1.5 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 rounded-lg">Page {page}</span>
          <button className="btn-secondary px-4 py-1.5 text-sm" disabled={projects.length < 9} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Project Name *</label>
            <input className="input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
              <input type="date" className="input" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
            <input className="input" placeholder="design, backend, urgent (comma separated)"
              value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
