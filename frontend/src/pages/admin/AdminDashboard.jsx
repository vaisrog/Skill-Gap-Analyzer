import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import {
  Users,
  Briefcase,
  Wrench,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Database
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    careersCount: 0,
    skillsCount: 0,
    resourcesCount: 0,
    studentsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [careersRes, skillsRes, resourcesRes, studentsRes] = await Promise.allSettled([
          axios.get('/api/careers'),
          axios.get('/api/skills'),
          axios.get('/api/resources'),
          axios.get('/api/users/students')
        ]);

        setStats({
          careersCount: careersRes.status === 'fulfilled' ? careersRes.value.data.career_roles?.length || 0 : 0,
          skillsCount: skillsRes.status === 'fulfilled' ? skillsRes.value.data.skills?.length || 0 : 0,
          resourcesCount: resourcesRes.status === 'fulfilled' ? resourcesRes.value.data.resources?.length || 0 : 0,
          studentsCount: studentsRes.status === 'fulfilled' ? studentsRes.value.data.students?.length || 0 : 0
        });
      } catch (err) {
        console.error('Failed to load admin statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                <h1 className="text-2xl font-extrabold text-slate-900">Administrator Console</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage skills database, career role matrices, learning resources, and registered students.
              </p>
            </div>
            <span className="mt-2 sm:mt-0 text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
              Role: System Admin
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Total Careers</span>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.careersCount}</p>
              <p className="text-xs text-slate-500 mt-1">Seeded industry tracks</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Total Skills</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.skillsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Database skill inventory</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Resources</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.resourcesCount}</p>
              <p className="text-xs text-slate-500 mt-1">Curated learning links</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Registered Students</span>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.studentsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Active student users</p>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <Link
              to="/admin/careers"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition group"
            >
              <Briefcase className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition flex items-center justify-between">
                <span>Career Roles</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View & modify career tracks and their required proficiency scores.
              </p>
            </Link>

            <Link
              to="/admin/skills"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition group"
            >
              <Wrench className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition flex items-center justify-between">
                <span>Skills Catalog</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage global technical skills across categories and taxonomies.
              </p>
            </Link>

            <Link
              to="/admin/resources"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition group"
            >
              <BookOpen className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition flex items-center justify-between">
                <span>Learning Resources</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Maintain course links, documentation, and reference materials.
              </p>
            </Link>

            <Link
              to="/admin/students"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition group"
            >
              <Users className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition flex items-center justify-between">
                <span>Student Directory</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Inspect registered student profiles and academic qualifications.
              </p>
            </Link>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

