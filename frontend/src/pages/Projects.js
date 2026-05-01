import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', deadline: '', priority: 'medium', tags: '' };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total projects</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search projects..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <select className="input w-auto" value={filters.priority}
          onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400">No projects found</p>
          {user?.role === 'admin' && <button onClick={openCreate} className="btn-primary mt-4">Create your first project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.description || 'No description'}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Badge type="priority" value={p.priority} />
                </div>
              </div>

              <ProgressBar value={p.progress} size="sm" />

              <div className="flex items-center justify-between mt-4">
                <div className="flex -space-x-2">
                  {p.members?.slice(0, 4).map((m) => (
                    <div key={m._id} title={m.name}><Avatar name={m.name} size="sm" /></div>
                  ))}
                  {p.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge type="status" value={p.status} />
                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={(e) => openEdit(p, e)} className="text-xs text-gray-400 hover:text-primary-600 px-1">Edit</button>
                      <button onClick={(e) => handleDelete(p._id, e)} className="text-xs text-gray-400 hover:text-red-600 px-1">Del</button>
                    </div>
                  )}
                </div>
              </div>

              {p.deadline && (
                <p className="text-xs text-gray-400 mt-2">Due {formatDate(p.deadline)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 9 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary px-3 py-1 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <button className="btn-secondary px-3 py-1 text-sm" disabled={projects.length < 9} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
            <input className="input" placeholder="design, backend, urgent" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
