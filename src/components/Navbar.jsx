import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMobileNav } from '../context/MobileNavContext';
import {
  Compass,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isOpen, toggle } = useMobileNav();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/my-skills') return 'My Skills';
    if (path === '/choose-career') return 'Career Roles';
    if (path.startsWith('/careers/')) return 'Career Details';
    if (path === '/analysis') return 'Skill Gap Analysis';
    if (path === '/roadmap') return 'Learning Roadmap';
    if (path === '/job-analyzer') return 'Job Analyzer';
    if (path === '/resume-analyzer') return 'Resume Analyzer';
    if (path === '/compare-careers') return 'Compare Careers';
    if (path === '/analytics') return 'Analytics & Progress';
    if (path === '/profile') return 'Profile Settings';
    if (path === '/admin') return 'Admin Dashboard';
    if (path === '/admin/careers') return 'Admin Careers';
    if (path === '/admin/skills') return 'Admin Skills';
    if (path === '/admin/prerequisites') return 'Admin Prerequisites';
    if (path === '/admin/resources') return 'Admin Resources';
    if (path === '/admin/students') return 'Admin Students';
    return '';
  };

  const pageTitle = getPageTitle();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={toggle}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link
            to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs border border-slate-800 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-200">
              <Compass className="w-5 h-5 text-indigo-400 group-hover:text-white transition" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition">
                  SkillGap
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/80 uppercase tracking-wider">
                  SaaS
                </span>
              </div>
              <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 -mt-0.5">
                Career Intelligence Platform
              </span>
            </div>
          </Link>

          {pageTitle && (
            <div className="hidden md:flex items-center gap-1.5 pl-4 ml-3 border-l border-slate-200 text-xs font-medium text-slate-500">
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-semibold text-slate-800">{pageTitle}</span>
            </div>
          )}
        </div>

        {/* Right: User controls / Auth actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                    {isAdmin && <Shield className="w-2.5 h-2.5 text-indigo-500" />}
                    {user.role}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Account Settings"
                aria-label="Profile settings"
              >
                <UserIcon className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 rounded-lg shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
