import React, { useEffect, useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search, page, limit: 12 } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} members</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search members..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u._id} className="card p-5">
              <div className="flex items-start gap-3">
                <Avatar name={u.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Joined {formatDate(u.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u._id, e.target.value)}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => deleteUser(u._id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary px-3 py-1 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <button className="btn-secondary px-3 py-1 text-sm" disabled={users.length < 12} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
