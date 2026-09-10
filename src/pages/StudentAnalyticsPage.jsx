import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileSearch,
  GraduationCap,
  Layers,
  Map,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';

const readinessBadge = {
  'Highly Ready': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', desc: 'Ready for market applications and interviews.' },
  Developing: { bg: 'bg-blue-50 text-blue-800 border-blue-200', desc: 'Solid foundational skills; working through intermediate gaps.' },
  'Needs Improvement': { bg: 'bg-amber-50 text-amber-800 border-amber-200', desc: 'Active skill gaps remain; follow your learning roadmap.' },
  Beginner: { bg: 'bg-rose-50 text-rose-800 border-rose-200', desc: 'Early learning stage; prioritize foundational prerequisites.' },
};

export const StudentAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/student');
        setData(res.data.analytics);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load your analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner label="Computing your personal analytics..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Analytics Unavailable</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Please set up your profile and skills first.'}</p>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Skill Distribution Doughnut
  const skillDoughnutData = {
    labels: ['Strong (4-5)', 'Developing (2-3)', 'Weak (1)'],
    datasets: [
      {
        data: [
          data.skills_summary.strong,
          data.skills_summary.developing,
          data.skills_summary.weak,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  // Roadmap Progress Doughnut
  const roadmapDoughnutData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [
          data.roadmap_summary.completed,
          data.roadmap_summary.in_progress,
          data.roadmap_summary.not_started,
        ],
        backgroundColor: ['#10b981', '#6366f1', '#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  // Top Gaps Bar Chart
  const topGapsBarData = data.top_skill_gaps.length > 0 ? {
    labels: data.top_skill_gaps.map((g) => g.skill_name),
    datasets: [
      {
        label: 'Your Current Level',
        data: data.top_skill_gaps.map((g) => g.current),
        backgroundColor: '#60a5fa',
        borderRadius: 4,
      },
      {
        label: 'Career Benchmark Required',
        data: data.top_skill_gaps.map((g) => g.required),
        backgroundColor: '#1e3a8a',
        borderRadius: 4,
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
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
              <TrendingUp className="w-3.5 h-3.5" /> Performance Analytics
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Skill & Career Analytics
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Real-time intelligence on your career readiness score, skill mastery distribution, and personalized learning milestones.
            </p>
          </section>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Career Readiness */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Career Readiness</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Target className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.readiness_score}%</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    readinessBadge[data.readiness_classification]?.bg
                  }`}
                >
                  {data.readiness_classification}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {data.target_career ? `Target: ${data.target_career.title}` : 'No target career chosen'}
              </p>
            </div>

            {/* Total Recorded Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Mastery Portfolio</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wrench className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.skills_summary.total_skills}</span>
                <span className="text-xs text-slate-400 font-medium">skills logged</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.skills_summary.strong} strong • {data.skills_summary.developing} developing
              </p>
            </div>

            {/* Roadmap Completion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Roadmap Progress</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Map className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.roadmap_summary.completion_rate}%</span>
                <span className="text-xs text-slate-400 font-medium">completed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.roadmap_summary.completed} of {data.roadmap_summary.total_items} modules mastered
              </p>
            </div>

            {/* Job Market Comparisons */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Job Analyses</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <FileSearch className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.job_analyses_count}</span>
                <span className="text-xs text-slate-400 font-medium">jobs analyzed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.latest_job_match !== null ? `Latest match: ${data.latest_job_match}%` : 'Run your first job check'}
              </p>
            </div>
          </div>

          {/* Recommended Next Action Banner */}
          {data.recommended_next_skill && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white mb-1.5">
                  <Sparkles className="w-3 h-3" /> Recommended Next Study Step
                </div>
                <h3 className="text-lg font-bold">{data.recommended_next_skill.skill_name}</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {data.recommended_next_skill.topic || `Focus on closing the gap in ${data.recommended_next_skill.skill_name}.`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/roadmap"
                  className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Study in Roadmap
                </Link>
              </div>
            </div>
          )}

          {/* Visualization Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Gaps Bar Chart (2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Career Benchmark Gaps
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparison between your current level and target role requirements.
                  </p>
                </div>
                {data.target_career && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {data.target_career.title}
                  </span>
                )}
              </div>

              {topGapsBarData ? (
                <div className="h-64">
                  <Bar
                    data={topGapsBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          min: 0,
                          max: 5,
                          ticks: { stepSize: 1 },
                        },
                      },
                      plugins: {
                        legend: { position: 'top', labels: { font: { size: 10, weight: 'bold' } } },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-slate-800">All Benchmarks Met!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    You have satisfied all core requirements configured for your target role.
                  </p>
                </div>
              )}
            </div>

            {/* Mastery Distribution Doughnut */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-indigo-600" /> Skill Mastery Tiers
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Categorized by recorded proficiency ratings.
                </p>
              </div>
              <div className="h-48 relative flex items-center justify-center">
                <Doughnut
                  data={skillDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                    },
                  }}
                />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total evaluated skills</span>
                <span className="font-extrabold text-slate-900">{data.skills_summary.total_skills}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/job-analyzer"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Job Analyzer</h4>
                  <p className="text-[11px] text-slate-500">Compare against specific job postings</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </Link>

            <Link
              to="/roadmap"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Learning Roadmap</h4>
                  <p className="text-[11px] text-slate-500">Sequenced learning milestones</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
            </Link>

            <Link
              to="/skills"
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Skill Ratings</h4>
                  <p className="text-[11px] text-slate-500">Update your verified proficiencies</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
export default StudentAnalyticsPage;
