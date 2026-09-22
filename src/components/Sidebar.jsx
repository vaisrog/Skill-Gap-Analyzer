import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMobileNav } from '../context/MobileNavContext';
import {
  LayoutDashboard,
  Briefcase,
  Wrench,
  BookOpen,
  Users,
  User,
  ChevronRight,
  Shield,
  Layers,
  Target,
  BarChart3,
  Map,
  FileSearch,
  TrendingUp,
  GitBranch,
  FileText,
  Scale,
  Sparkles,
  Award,
  Settings,
  LogOut,
  X,
  Compass,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { isOpen, close } = useMobileNav();
  const navigate = useNavigate();

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Career Roles', path: '/admin/careers', icon: Briefcase },
    { label: 'Skills Catalog', path: '/admin/skills', icon: Wrench },
    { label: 'Prerequisites', path: '/admin/prerequisites', icon: GitBranch },
    { label: 'Learning Resources', path: '/admin/resources', icon: BookOpen },
    { label: 'Students Directory', path: '/admin/students', icon: Users },
  ];

  const studentNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'My Skills', path: '/my-skills', icon: Layers },
    { label: 'Career', path: '/choose-career', icon: Target },
    { label: 'Skill Gap Analysis', path: '/analysis', icon: BarChart3 },
    { label: 'Learning Roadmap', path: '/roadmap', icon: Map },
    { label: 'Job Analyzer', path: '/job-analyzer', icon: FileSearch },
    { label: 'Resume Analyzer', path: '/resume-analyzer', icon: FileText },
    { label: 'Recommendations', path: '/compare-careers', icon: Sparkles },
    { label: 'Achievements', path: '/analytics', icon: Award },
    { label: 'Progress', path: '/analytics', icon: TrendingUp },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* User Card */}
        <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            isAdmin ? 'bg-indigo-500 text-white shadow-xs' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs'
          }`}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="truncate flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-400 font-medium capitalize flex items-center gap-1">
              {isAdmin ? (
                <>
                  <Shield className="w-3 h-3 text-indigo-400" />
                  Administrator
                </>
              ) : (
                'Student Workspace'
              )}
            </p>
          </div>
        </div>

        {/* Section label */}
        <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'Management Console' : 'Career Intelligence'}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isExact = item.path === '/admin' || item.path === '/dashboard';
            return (
              <NavLink
                key={`${item.path}-${idx}`}
                to={item.path}
                end={isExact}
                onClick={close}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                      isActive ? 'opacity-80 text-white' : 'opacity-0 group-hover:opacity-40 text-slate-400'
                    }`} />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Settings & Logout */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-1">
        <NavLink
          to="/profile"
          onClick={close}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isActive
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>

        <div className="mt-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/60 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Enterprise Edition</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Skill Gap Engine v6.2</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0F172A] border-r border-slate-800 min-h-[calc(100vh-4rem)] flex-col justify-between p-4 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0F172A] border-r border-slate-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-sm text-white">SkillGap SaaS</span>
              </div>
              <button
                onClick={close}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
