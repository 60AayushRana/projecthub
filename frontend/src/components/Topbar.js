import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bars3Icon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon,
  BellIcon, MagnifyingGlassIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/team': 'Team',
  '/profile': 'Profile',
};

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const pageTitle = Object.entries(pageTitles).find(([k]) =>
    location.pathname === k || location.pathname.startsWith(k + '/')
  )?.[1] || 'ProjectHub';

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal('');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden btn-ghost p-2">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Search bar (desktop) */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <form onSubmit={handleSearch} className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 py-2 bg-slate-50 dark:bg-slate-800 border-gray-100 dark:border-gray-700"
            placeholder="Search tasks..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Mobile search toggle */}
        <button className="md:hidden btn-ghost p-2" onClick={() => setSearchOpen(!searchOpen)}>
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="btn-ghost p-2 relative"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-72 card shadow-lg z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="btn-ghost p-1">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 text-center text-sm text-gray-400 py-8">
                <BellSolid className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="btn-ghost p-2" aria-label="Toggle theme">
          {dark
            ? <SunIcon className="w-5 h-5 text-amber-400" />
            : <MoonIcon className="w-5 h-5" />
          }
        </button>

        {/* Avatar + logout */}
        <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
            {user?.name}
          </span>
          <button onClick={handleLogout} className="btn-ghost p-2 text-gray-400 hover:text-red-500" aria-label="Logout">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 p-3 md:hidden z-40 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="input pl-9"
              placeholder="Search tasks..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>
        </div>
      )}
    </header>
  );
}
