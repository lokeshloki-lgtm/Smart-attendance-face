import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common';
import { Building2, LayoutDashboard, LogOut, Moon, Settings, Sun, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#d5e1e6] bg-[#f3f7f8]/95 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0f2638]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center" aria-label="SmartAttend home">
            <img src="/smartattend-mark.svg" alt="" className="block h-10 w-10 max-h-full max-w-full object-contain" />
            <span className="ml-2 text-xl font-extrabold tracking-tight text-[#132a3a] dark:text-[#f3f7f8]">Smart<span className="text-cyan-400">Attend</span></span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Link
                  to={user?.role === 'ADMIN' ? '/dashboard' : user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'}
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#24566f] transition hover:bg-[#dcecf1] md:flex dark:text-[#b9d6cf] dark:hover:bg-white/10"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                {user?.role === 'ADMIN' && <div className="hidden items-center gap-2 md:flex"><Link to="/users" className="text-sm text-[#24566f] hover:text-cyan-500 dark:text-[#b9d6cf]"><Users size={15} /></Link><Link to="/departments" className="text-sm text-[#24566f] hover:text-cyan-500 dark:text-[#b9d6cf]"><Building2 size={15} /></Link><Link to="/settings" className="text-sm text-[#24566f] hover:text-cyan-500 dark:text-[#b9d6cf]"><Settings size={15} /></Link></div>}
                <span className="hidden border-l border-[#d5e1e6] pl-4 text-sm text-[#61788a] sm:inline dark:border-white/10 dark:text-[#afbfbe]">
                  Welcome, {user?.name}
                </span>
              </>
            )}

            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-lg border border-[#d5e1e6] p-2 text-[#24566f] transition hover:border-[#14b8a6] hover:text-[#2563eb] dark:border-white/10 dark:text-[#b9d6cf]"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && (
              <Button variant="danger" size="sm" onClick={logout}>
                <LogOut size={16} />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
