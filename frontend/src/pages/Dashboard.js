import React, { useEffect, useState } from 'react';
import {
  FolderOpenIcon, ClipboardDocumentCheckIcon, CheckCircleIcon,
  ExclamationCircleIcon, UsersIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { timeAgo } from '../utils/helpers';

const PIE_COLORS = ['#94a3b8', '#6366f1', '#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold text-gray-700 dark:text-gray-200">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.value}{p.name === 'progress' ? '%' : ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects"  value={stats?.totalProjects}  icon={FolderOpenIcon}              gradient="stat-card-blue" />
        <StatCard title="Active Tasks"    value={stats?.activeTasks}    icon={ClipboardDocumentCheckIcon}  gradient="stat-card-violet" />
        <StatCard title="Completed"       value={stats?.completedTasks} icon={CheckCircleIcon}             gradient="stat-card-emerald" />
        <StatCard title="Overdue"         value={stats?.overdueTasks}   icon={ExclamationCircleIcon}       gradient="stat-card-rose" />
        {user?.role === 'admin' && (
          <StatCard title="Team Members"  value={stats?.totalUsers}     icon={UsersIcon}                   gradient="stat-card-amber" />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Progress Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Project Progress</h2>
              <p className="text-xs text-gray-400 mt-0.5">Completion percentage per project</p>
            </div>
          </div>
          {projectProgress.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectProgress} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="progress" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No project data yet" />
          )}
        </div>

        {/* Task Status Pie */}
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Task Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution by status</p>
          </div>
          {taskStatus.some((t) => t.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={72} innerRadius={40} paddingAngle={3}>
                  {taskStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No task data yet" />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Performance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Team Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tasks completed per member</p>
            </div>
          </div>
          {userPerf.length ? (
            <div className="space-y-4">
              {userPerf.map((u, i) => {
                const pct = u.total ? Math.round((u.completed / u.total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</span>
                        <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{u.completed}/{u.total} · {pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, #6366f1, #818cf8)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No performance data</p>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest actions across projects</p>
            </div>
          </div>
          {activity.length ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activity.map((a, i) => (
                <div key={a._id || i} className="flex items-start gap-3 group">
                  <Avatar name={a.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-white">{a.user?.name}</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">{a.action}</span>
                      {a.entityName && (
                        <span className="font-medium text-indigo-600 dark:text-indigo-400"> "{a.entityName}"</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-2">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
        <ArrowTrendingUpIcon className="w-6 h-6" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
