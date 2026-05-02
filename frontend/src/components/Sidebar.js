import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon, FolderOpenIcon, ClipboardDocumentCheckIcon,
  UsersIcon, UserCircleIcon, XMarkIcon,
  ChartBarIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid, FolderOpenIcon as FolderSolid,
  ClipboardDocumentCheckIcon as ClipSolid,
  UsersIcon as UsersSolid, UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard', icon: HomeIcon,                    iconActive: HomeSolid },
  { to: '/projects',   label: 'Projects',  icon: FolderOpenIcon,              iconActive: FolderSolid },
  { to: '/tasks',      label: 'Tasks',     icon: ClipboardDocumentCheckIcon,  iconActive: ClipSolid },
  { to: '/team',       label: 'Team',      icon: UsersIcon,                   iconActive: UsersSolid, adminOnly: true },
  { to: '/profile',    label: 'Profile',   icon: UserCircleIcon,              iconActive: UserSolid },
];

const roleColors = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  member: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-white dark:bg-slate-900
        border-r border-gray-100 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-indigo-200">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 dark:text-white tracking-tight">ProjectHub</span>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5">Workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden btn-ghost p-1.5">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map(({ to, icon: Icon, iconActive: IconActive, label }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  {isActive
                    ? <IconActive className="w-5 h-5 flex-shrink-0" />
                    : <Icon className="w-5 h-5 flex-shrink-0" />
                  }
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColors[user?.role] || roleColors.member}`}>
                {user?.role}
              </span>
            </div>
            <Cog6ToothIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
