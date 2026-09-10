import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  Shield,
  Briefcase,
  Wrench,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  Map,
  FileSearch,
  Target,
  BarChart3,
  Layers,
  GitBranch,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/admin');
        setAnalytics(res.data.analytics);
      } catch (err) {
        console.warn('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminAnalytics();
  }, []);

  const totals = analytics?.totals || {
    students: 0,
    careers: 0,
    skills: 0,
    resources: 0,
    roadmaps: 0,
    job_analyses: 0,
    avg_readiness: 0,
  };

  const managementCards = [
    {
      title: 'Career Roles',
      count: totals.careers,
      desc: 'Technical roles, benchmark requirements & importance weights',
      path: '/admin/careers',
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Skills Catalog',
      count: totals.skills,
      desc: 'Master technical taxonomy, categories, and descriptions',
      path: '/admin/skills',
      icon: Wrench,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Skill Prerequisites',
      count: 'Graph',
      desc: 'Foundational dependency relationships and learning orders',
      path: '/admin/prerequisites',
      icon: GitBranch,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Learning Resources',
      count: totals.resources,
      desc: 'Vetted courses, docs, and tutorials linked to roadmap milestones',
      path: '/admin/resources',
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  // Career Popularity Bar Chart
  const careerPopularityData = analytics?.career_popularity?.length ? {
    labels: analytics.career_popularity.map((c) => c.title),
    datasets: [
      {
        label: 'Students Enrolled',
        data: analytics.career_popularity.map((c) => c.students_count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  } : null;

  // Common Gaps Bar Chart
  const commonGapsData = analytics?.common_skill_gaps?.length ? {
    labels: analytics.common_skill_gaps.map((g) => g.skill_name),
    datasets: [
      {
        label: 'Students with Active Gap',
        data: analytics.common_skill_gaps.map((g) => g.affected_students_count),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
    ],
  } : null;

  // Student Readiness Doughnut Chart
  const readinessData = analytics?.readiness_distribution ? {
    labels: Object.keys(analytics.readiness_distribution),
    datasets: [
      {
        data: Object.values(analytics.readiness_distribution),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  } : null;

  // Roadmap Completion Brackets Doughnut Chart
  const roadmapBracketsData = analytics?.roadmap_brackets ? {
    labels: Object.keys(analytics.roadmap_brackets),
    datasets: [
      {
        data: Object.values(analytics.roadmap_brackets),
        backgroundColor: ['#e2e8f0', '#93c5fd', '#6366f1', '#10b981'],
        borderWidth: 0,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-200 rounded-2xl p-6 shadow-sm text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-2">
              <Shield className="w-3.5 h-3.5" /> Administrator Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">System Administration & Analytics</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Curate career requirements, configure prerequisite dependencies, track cohort readiness benchmarks, and monitor job description analyses.
            </p>
          </section>

          {loading ? (
            <LoadingSpinner label="Loading admin system intelligence..." />
          ) : (
            <>
              {/* Aggregated Overview Tiles */}
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Total Students</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.students}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Career Roles</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.careers}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Skills in Catalog</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.skills}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Learning Resources</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.resources}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Active Roadmaps</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.roadmaps}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500">Job Analyses Run</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totals.job_analyses}</p>
                </div>
              </section>

              {/* Management Navigation Cards */}
              <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {managementCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xl font-extrabold text-slate-900">{card.count}</span>
                        </div>
                        <h2 className="font-extrabold text-slate-900 text-base">{card.title}</h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                      </div>

                      <Link
                        to={card.path}
                        className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
                      >
                        Manage {card.title}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </section>

              {/* Advanced Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Career Role Popularity */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" /> Target Career Role Popularity
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Number of students who have selected each target career path.
                      </p>
                    </div>
                  </div>
                  <div className="h-60">
                    {careerPopularityData && (
                      <Bar
                        data={careerPopularityData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: { ticks: { stepSize: 1 }, beginAtZero: true },
                          },
                          plugins: {
                            legend: { display: false },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Most Common Skill Gaps */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-600" /> Most Common Student Skill Gaps
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Skills where students are most frequently falling below role requirements.
                      </p>
                    </div>
                  </div>
                  <div className="h-60">
                    {commonGapsData ? (
                      <Bar
                        data={commonGapsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: { ticks: { stepSize: 1 }, beginAtZero: true },
                          },
                          plugins: {
                            legend: { display: false },
                          },
                        }}
                      />
                    ) : (
                      <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                        No skill gaps recorded yet across registered students.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cohort Readiness Distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-emerald-600" /> Student Readiness Distribution
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Average readiness across all students with a target career is <span className="font-extrabold text-slate-900">{totals.avg_readiness}%</span>.
                    </p>
                  </div>
                  <div className="h-52 relative flex items-center justify-center">
                    {readinessData && (
                      <Doughnut
                        data={readinessData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '65%',
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Roadmap Completion Status */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-indigo-600" /> Roadmap Completion Progress
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Student progress through their personalized learning roadmaps.
                    </p>
                  </div>
                  <div className="h-52 relative flex items-center justify-center">
                    {roadmapBracketsData && (
                      <Doughnut
                        data={roadmapBracketsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '65%',
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
export default AdminDashboard;
