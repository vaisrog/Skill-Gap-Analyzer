import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Map,
  RefreshCw,
  Sparkles,
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const statusStyles = {
  'No Gap': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Minor Gap': 'bg-amber-50 text-amber-700 border-amber-200',
  'Moderate Gap': 'bg-orange-50 text-orange-700 border-orange-200',
  'Major Gap': 'bg-rose-50 text-rose-700 border-rose-200',
};

const importanceStyles = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  Important: 'bg-blue-50 text-blue-700 border-blue-200',
  Optional: 'bg-slate-100 text-slate-700 border-slate-200',
};

const readinessStyles = {
  'Highly Ready': { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Developing: { text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Needs Improvement': { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Beginner: { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const proficiencyLabels = ['No Knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export const AnalysisPlaceholderPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingCareer, setSwitchingCareer] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, strengths, weaknesses, major_gaps, missing_skills, priority_skills

  const fetchAnalysis = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [analysisRes, careersRes] = await Promise.all([
        axios.get('/api/analysis'),
        axios.get('/api/careers').catch(() => ({ data: { careers: [] } })),
      ]);
      setAnalysis(analysisRes.data.analysis);
      setCareers(careersRes.data.careers || []);
    } catch (err) {
      setAnalysis(null);
      setError({
        message: err.response?.data?.error || 'Unable to load your skill-gap analysis. Please try again.',
        code: err.response?.data?.code,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleCareerChange = async (e) => {
    const newCareerId = parseInt(e.target.value, 10);
    if (!newCareerId || newCareerId === analysis?.target_career?.id) return;
    try {
      setSwitchingCareer(true);
      const res = await axios.post('/api/users/target-career', { target_career_id: newCareerId });
      if (res.data.user) {
        updateUserProfile(res.data.user);
      }
      await fetchAnalysis();
    } catch (err) {
      console.error('Failed to change career:', err);
    } finally {
      setSwitchingCareer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-8">
            <LoadingSpinner label="Calculating deterministic career readiness metrics..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    const noCareer = error.code === 'no_target_career';
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6">
            <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Skill Gap Analysis</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{error.message}</p>
              {noCareer ? (
                <Link
                  to="/choose-career"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Target className="w-4 h-4" />
                  <span>Choose Target Career</span>
                </Link>
              ) : (
                <button
                  onClick={() => fetchAnalysis(true)}
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
              )}
            </section>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const { target_career: career, summary, recommended_next_skill: recommendation } = analysis;

  // Horizontal Bar Chart (Current vs Required proficiency)
  const sortedSkillAnalysis = [...analysis.skill_analysis].sort((a, b) => b.skill_gap - a.skill_gap);
  const barData = {
    labels: sortedSkillAnalysis.map((item) => item.skill_name),
    datasets: [
      {
        label: 'Current Level',
        data: sortedSkillAnalysis.map((item) => item.current_proficiency),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barThickness: 14,
      },
      {
        label: 'Required Level',
        data: sortedSkillAnalysis.map((item) => item.required_proficiency),
        backgroundColor: '#0f172a',
        borderRadius: 4,
        barThickness: 14,
      },
    ],
  };

  const horizontalBarOptions = {
    indexAxis: 'y', // Horizontal bars per user specification
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Proficiency Level (0 = None, 5 = Expert)', font: { size: 11 } },
        grid: { color: '#f1f5f9' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { weight: '600', size: 11 }, color: '#334155' },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 11, weight: '600' } },
      },
    },
  };

  // Donut chart for gap distribution
  const statusCounts = summary.status_counts || {};
  const distributionData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'strengths', label: `Strengths (${analysis.strengths?.length || 0})` },
    { id: 'weaknesses', label: `Weaknesses (${analysis.skill_gaps?.filter(g => g.status !== 'No Gap').length || 0})` },
    { id: 'major_gaps', label: `Major Gaps (${analysis.major_gaps?.length || 0})` },
    { id: 'missing_skills', label: `Missing Skills (${analysis.missing_skills?.length || 0})` },
    { id: 'priority_skills', label: `Priority Skills (${analysis.priority_skills?.length || 0})` },
  ];

  const currentReadinessStyle = readinessStyles[analysis.readiness_classification] || readinessStyles.Developing;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              <div className="space-y-1 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Career Gap Intelligence</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Skill Gap Analysis
                </h1>
                <p className="text-sm text-slate-500 font-normal">
                  Understand your current skill level and discover what you need to learn.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start">
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Map className="w-3.5 h-3.5 text-indigo-200" />
                  <span>View Learning Roadmap</span>
                </Link>

                <button
                  onClick={() => fetchAnalysis(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Recalculate'}</span>
                </button>
              </div>
            </div>

            {/* Top Interactive Bar: Career Selector & Readiness Stats */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Career selector dropdown */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Target Career Role
                </label>
                <div className="relative">
                  <select
                    value={career.id}
                    onChange={handleCareerChange}
                    disabled={switchingCareer}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition"
                  >
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.category ? `(${c.category})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {career.description || 'Comparing your profile against this industry benchmark.'}
                </p>
              </div>

              {/* Readiness Score & Label badge */}
              <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-5">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Readiness Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{analysis.readiness_score}%</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${currentReadinessStyle.bg} ${currentReadinessStyle.text}`}>
                        {analysis.readiness_classification}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block text-left text-xs text-slate-500">
                  <p className="font-bold text-slate-800">
                    {summary.skills_satisfied} of {summary.total_required_skills} Skills
                  </p>
                  <p className="text-[11px] text-slate-400">Requirements Satisfied</p>
                </div>
              </div>
            </div>
          </section>

          {/* Warning Banner if No Skills Added */}
          {analysis.warnings?.includes('no_skills_added') && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 font-medium">
                  You haven't added skills to your profile yet. All requirements are evaluated at Level 0.
                </p>
              </div>
              <Link
                to="/my-skills"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition"
              >
                Add My Skills
              </Link>
            </div>
          )}

          {/* Segmented Navigation / Tabs */}
          <div className="flex overflow-x-auto pb-1 gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Next Best Skill Recommendation */}
              {recommendation && (
                <section className="bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-200/70 rounded-2xl p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> High Priority Milestone
                      </div>
                      <h2 className="text-lg font-black text-slate-900">
                        Recommended Next Step: {recommendation.skill_name}
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {recommendation.recommendation_reason}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-semibold">
                        <span>Current: {recommendation.current_proficiency_label}</span>
                        <span>•</span>
                        <span>Required: {recommendation.required_proficiency_label}</span>
                        <span>•</span>
                        <span className="text-indigo-700 font-bold">Gap: {recommendation.skill_gap} levels</span>
                      </div>
                    </div>
                    <Link
                      to="/roadmap"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                    >
                      Start Milestone in Roadmap
                    </Link>
                  </div>
                </section>
              )}

              {/* Charts Section: Horizontal Bar Chart + Donut Chart */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Horizontal Bar Chart */}
                <div className="xl:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Current vs. Required Proficiency
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Horizontal comparison of all {analysis.skill_analysis.length} required competencies.
                      </p>
                    </div>
                  </div>
                  <div className="h-96 w-full">
                    <Bar
                      data={barData}
                      options={horizontalBarOptions}
                      aria-label="Horizontal bar chart comparing current and required skill proficiency"
                    />
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="xl:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Gap Distribution
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Required skills grouped by deficiency tier.</p>
                    <div className="h-60 mt-4 relative flex items-center justify-center">
                      <Doughnut
                        data={distributionData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Satisfied</p>
                      <p className="text-lg font-black text-emerald-900">{summary.skills_satisfied}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50">
                      <p className="text-[10px] font-bold text-rose-800 uppercase">Deficient</p>
                      <p className="text-lg font-black text-rose-900">{summary.skills_requiring_improvement}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority list preview */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Top Priority Improvements
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministic order prioritizing critical importance and largest gaps.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('priority_skills')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All Priority Skills
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(analysis.priority_skills || []).slice(0, 6).map((item) => (
                    <div
                      key={item.skill_id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            Rank #{item.priority_rank}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${importanceStyles[item.importance]}`}>
                            {item.importance}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">{item.skill_name}</h3>
                        <p className="text-xs text-slate-500">
                          Current: {item.current_proficiency}/5 • Required: {item.required_proficiency}/5
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600">Gap: {item.skill_gap} levels</span>
                        <Link
                          to="/roadmap"
                          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          Learn <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRENGTHS */}
          {activeTab === 'strengths' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Your Technical Strengths</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Skills where your recorded proficiency meets or exceeds {career.title}'s required level.
                </p>
              </div>

              {analysis.strengths?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.strengths.map((item) => (
                    <div
                      key={item.skill_id}
                      className="p-5 bg-white border border-emerald-200/90 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Requirement Met
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{item.skill_name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.skill_category}</p>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-xl space-y-1 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Your Level:</span>
                          <span className="font-bold text-emerald-800">{item.current_proficiency_label} ({item.current_proficiency}/5)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Benchmark Level:</span>
                          <span className="font-semibold">{item.required_proficiency_label} ({item.required_proficiency}/5)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
                  No strengths recorded yet for this career. Add your skills in the Skills catalog.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEAKNESSES / SKILL GAPS */}
          {activeTab === 'weaknesses' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Identified Skill Weaknesses</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Competencies requiring active progression to achieve full readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.skill_gaps.map((item) => (
                  <div
                    key={item.skill_id}
                    className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${importanceStyles[item.importance]}`}>
                          {item.importance} Priority
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.skill_name}</h3>
                      <p className="text-xs text-slate-500">{item.skill_category}</p>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="font-semibold">{item.current_proficiency_label} ({item.current_proficiency}/5)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target:</span>
                          <span className="font-bold text-slate-900">{item.required_proficiency_label} ({item.required_proficiency}/5)</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200/60">
                          <span>Deficit Gap:</span>
                          <span>{item.skill_gap} Levels</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/roadmap"
                      className="w-full mt-2 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl text-center transition"
                    >
                      View in Roadmap
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MAJOR GAPS */}
          {activeTab === 'major_gaps' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5">
                <h2 className="text-base font-extrabold text-rose-950">Critical Major Skill Gaps</h2>
                <p className="text-xs text-rose-800 mt-1">
                  Requirements where the proficiency deficiency is 3 or more full levels. These require structured learning.
                </p>
              </div>

              {analysis.major_gaps?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.major_gaps.map((item) => (
                    <div
                      key={item.skill_id}
                      className="p-5 bg-white border border-rose-300 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Major Gap (-{item.skill_gap} Levels)
                        </span>
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">{item.skill_name}</h3>
                      <p className="text-xs text-slate-500">{item.skill_category}</p>

                      <div className="p-3 bg-rose-50/50 rounded-xl space-y-1 text-xs text-slate-800">
                        <div className="flex justify-between">
                          <span>Current Level:</span>
                          <span className="font-semibold text-rose-700">{item.current_proficiency_label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Required:</span>
                          <span className="font-bold text-slate-900">{item.required_proficiency_label}</span>
                        </div>
                      </div>

                      <Link
                        to="/roadmap"
                        className="inline-flex items-center justify-center w-full py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition"
                      >
                        Study on Roadmap
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
                  No major 3+ level gaps found! Your profile aligns well with this career benchmark.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MISSING SKILLS */}
          {activeTab === 'missing_skills' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-5">
                <h2 className="text-base font-extrabold text-purple-950">Missing Skills (Level 0)</h2>
                <p className="text-xs text-purple-800 mt-1">
                  Required skills where you have not self-assessed or recorded any experience yet.
                </p>
              </div>

              {analysis.missing_skills?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.missing_skills.map((item) => (
                    <div
                      key={item.skill_id}
                      className="p-5 bg-white border border-purple-200 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          Unrecorded Skill
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${importanceStyles[item.importance]}`}>
                          {item.importance}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.skill_name}</h3>
                      <p className="text-xs text-slate-500">{item.skill_category}</p>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Current:</span>
                          <span className="font-semibold text-rose-600">No Knowledge (0/5)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target Required:</span>
                          <span className="font-bold text-slate-900">{item.required_proficiency_label}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to="/my-skills"
                          className="flex-1 py-2 text-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        >
                          Self-Assess
                        </Link>
                        <Link
                          to="/roadmap"
                          className="flex-1 py-2 text-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs"
                        >
                          Learn
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
                  All required competencies have recorded experience in your profile.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PRIORITY SKILLS (TABLE & CARDS) */}
          {activeTab === 'priority_skills' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900">Ranked Priority List</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ordered deterministically by Importance (Critical &gt; Important &gt; Optional), Gap size, then Missing status.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Skill Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Current</th>
                        <th className="py-3 px-4">Required</th>
                        <th className="py-3 px-4">Gap</th>
                        <th className="py-3 px-4">Importance</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.priority_skills.map((item) => (
                        <tr key={item.skill_id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-black text-blue-600">#{item.priority_rank}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{item.skill_name}</td>
                          <td className="py-3.5 px-4 text-slate-500">{item.skill_category}</td>
                          <td className="py-3.5 px-4 text-slate-600">{item.current_proficiency_label} ({item.current_proficiency}/5)</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{item.required_proficiency_label} ({item.required_proficiency}/5)</td>
                          <td className="py-3.5 px-4 font-black text-rose-600">+{item.skill_gap}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${importanceStyles[item.importance]}`}>
                              {item.importance}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to="/roadmap"
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                              <span>Roadmap</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
