import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Bars3Icon className="w-6 h-6" />
      </button>

      <div className="hidden md:block">
        <h1 className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back, <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Logout"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
