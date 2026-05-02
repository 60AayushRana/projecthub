import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PaperClipIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { formatDate, timeAgo, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get('/comments', { params: { task: id } }),
      ]);
      setTask(tRes.data);
      setEditStatus(tRes.data.status);
      setComments(cRes.data);
    } catch {
      toast.error('Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (status) => {
    setEditStatus(status);
    try {
      await api.put(`/tasks/${id}`, { status });
      setTask((t) => ({ ...t, status }));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await api.post('/comments', { task: id, text: comment });
      setComments((c) => [...c, res.data]);
      setComment('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (cId) => {
    try {
      await api.delete(`/comments/${cId}`);
      setComments((c) => c.filter((x) => x._id !== cId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/tasks/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTask(res.data);
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overdue = isOverdue(task?.dueDate, task?.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task?.title}</h1>
            <Badge type="priority" value={task?.priority} />
            {overdue && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</span>}
          </div>
          {task?.project && (
            <Link to={`/projects/${task.project._id}`} className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
              {task.project.name}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{task?.description || 'No description provided.'}</p>
          </div>

          {/* Labels */}
          {task?.labels?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Labels</h2>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((l) => (
                  <span key={l} className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Attachments</h2>
              <label className="btn-secondary text-xs py-1 px-3 cursor-pointer flex items-center gap-1">
                <PaperClipIcon className="w-3.5 h-3.5" /> Upload
                <input type="file" className="hidden" onChange={uploadFile} />
              </label>
            </div>
            {task?.attachments?.length ? (
              <div className="space-y-2">
                {task.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{a.originalName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No attachments</p>
            )}
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Comments ({comments.length})</h2>
            <div className="space-y-4 mb-4">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <Avatar name={c.author?.name} size="sm" />
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.author?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                        {(c.author?._id === user?._id || user?.role === 'admin') && (
                          <button onClick={() => deleteComment(c._id)} className="text-gray-400 hover:text-red-500">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet</p>}
            </div>
            <form onSubmit={postComment} className="flex gap-2">
              <input className="input flex-1" placeholder="Add a comment..." value={comment}
                onChange={(e) => setComment(e.target.value)} />
              <button type="submit" className="btn-primary px-3" disabled={posting}>
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select className="input" value={editStatus} onChange={(e) => updateStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
              <Badge type="priority" value={task?.priority} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
              {task?.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignedTo.name} size="sm" />
                  <span className="text-sm text-gray-900 dark:text-white">{task.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
              <span className={`text-sm ${overdue ? 'text-red-500 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                {task?.dueDate ? formatDate(task.dueDate) : '—'}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created By</label>
              <span className="text-sm text-gray-700 dark:text-gray-300">{task?.createdBy?.name}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created</label>
              <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(task?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
