import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Wrench,
  BookOpen,
  Users,
  User,
  ChevronRight,
  ShieldAlert,
  Layers,
  Target,
  BarChart3
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Career Roles', path: '/admin/careers', icon: Briefcase },
    { label: 'Skills', path: '/admin/skills', icon: Wrench },
    { label: 'Learning Resources', path: '/admin/resources', icon: BookOpen },
    { label: 'Students', path: '/admin/students', icon: Users },
  ];

  const studentNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Skills', path: '/my-skills', icon: Layers },
    { label: 'Choose Career', path: '/choose-career', icon: Target },
    { label: 'Skill Gap Analysis', path: '/analysis', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div>
        <div className="px-3 py-2 mb-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 font-medium capitalize flex items-center gap-1">
              {isAdmin && <ShieldAlert className="w-3 h-3 text-amber-500" />}
              {user?.role} Mode
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {isAdmin ? 'Administration' : 'Student Navigation'}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-600">
        <p className="font-semibold text-blue-900 mb-1">Phase 3 Active</p>
        <p className="text-slate-500 leading-relaxed">
          Skill-gap analysis is ready.
        </p>
      </div>
    </aside>
  );
};
