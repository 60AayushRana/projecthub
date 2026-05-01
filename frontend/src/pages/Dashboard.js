import React, { useEffect, useState } from 'react';
import {
  FolderIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  ExclamationTriangleIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Avatar from '../components/Avatar';
import { timeAgo } from '../utils/helpers';

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projectProgress, setProjectProgress] = useState([]);
  const [taskStatus, setTaskStatus] = useState([]);
  const [userPerf, setUserPerf] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/project-progress'),
      api.get('/dashboard/task-status'),
      api.get('/dashboard/user-performance'),
      api.get('/dashboard/activity'),
    ]).then(([s, pp, ts, up, act]) => {
      setStats(s.data);
      setProjectProgress(pp.data);
      setTaskStatus(ts.data);
      setUserPerf(up.data);
      setActivity(act.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats?.totalProjects} icon={FolderIcon} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard title="Active Tasks" value={stats?.activeTasks} icon={ClipboardDocumentListIcon} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <StatCard title="Completed" value={stats?.completedTasks} icon={CheckCircleIcon} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <StatCard title="Overdue" value={stats?.overdueTasks} icon={ExclamationTriangleIcon} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
        {user?.role === 'admin' && (
          <StatCard title="Total Users" value={stats?.totalUsers} icon={UsersIcon} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h2>
          {projectProgress.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectProgress} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No project data</div>
          )}
        </div>

        {/* Task Status Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Task Status</h2>
          {taskStatus.some((t) => t.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {taskStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No task data</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Performance */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Team Performance</h2>
          {userPerf.length ? (
            <div className="space-y-3">
              {userPerf.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{u.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{u.completed}/{u.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${u.total ? Math.round((u.completed / u.total) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No performance data</p>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {activity.length ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((a) => (
                <div key={a._id} className="flex items-start gap-3">
                  <Avatar name={a.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{a.user?.name}</span> {a.action}
                      {a.entityName && <span className="font-medium"> "{a.entityName}"</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
