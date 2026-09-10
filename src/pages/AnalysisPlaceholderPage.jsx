import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { AlertCircle, BarChart3, CheckCircle2, ChevronRight, Map, RefreshCw, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const statusStyles = {
  'No Gap': 'bg-emerald-100 text-emerald-700',
  'Minor Gap': 'bg-amber-100 text-amber-700',
  'Moderate Gap': 'bg-orange-100 text-orange-700',
  'Major Gap': 'bg-rose-100 text-rose-700',
};

const importanceStyles = {
  Critical: 'bg-rose-100 text-rose-700',
  Important: 'bg-amber-100 text-amber-700',
  Optional: 'bg-slate-100 text-slate-700',
};

const readinessStyles = {
  'Highly Ready': 'text-emerald-600',
  Developing: 'text-blue-600',
  'Needs Improvement': 'text-amber-600',
  Beginner: 'text-rose-600',
};

const SkillPill = ({ label, style }) => <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>{label}</span>;

export const AnalysisPlaceholderPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/analysis');
      setAnalysis(response.data.analysis);
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

  useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

  if (loading) return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><div className="flex-1 flex max-w-7xl w-full mx-auto"><Sidebar /><main className="flex-1"><LoadingSpinner label="Calculating your current skill match..." /></main></div><Footer /></div>;

  if (error) {
    const noCareer = error.code === 'no_target_career';
    return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><div className="flex-1 flex max-w-7xl w-full mx-auto"><Sidebar /><main className="flex-1 p-6"><section className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 text-center"><div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle className="w-7 h-7" /></div><h1 className="mt-4 text-2xl font-extrabold text-slate-900">Skill Gap Analysis</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">{error.message}</p>{noCareer ? <Link to="/choose-career" className="inline-block mt-5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">Choose a career</Link> : <button onClick={() => fetchAnalysis()} className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"><RefreshCw className="w-4 h-4" /> Try again</button>}</section></main></div><Footer /></div>;
  }

  const { target_career: career, summary, recommended_next_skill: recommendation } = analysis;
  const barData = {
    labels: analysis.skill_analysis.map((item) => item.skill_name),
    datasets: [
      { label: 'Current level', data: analysis.skill_analysis.map((item) => item.current_proficiency), backgroundColor: '#60a5fa', borderRadius: 5 },
      { label: 'Required level', data: analysis.skill_analysis.map((item) => item.required_proficiency), backgroundColor: '#1e3a8a', borderRadius: 5 },
    ],
  };
  const distributionData = {
    labels: Object.keys(summary.status_counts),
    datasets: [{ data: Object.values(summary.status_counts), backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#f43f5e'], borderWidth: 0 }],
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 }, title: { display: true, text: 'Proficiency level' } } }, plugins: { legend: { position: 'bottom' } } };

  return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><div className="flex-1 flex max-w-7xl w-full mx-auto"><Sidebar /><main className="flex-1 p-6 space-y-6 overflow-y-auto">
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row gap-5 sm:items-start"><div className="flex-1"><div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200"><BarChart3 className="w-3.5 h-3.5" /> Live skill match</div><h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Skill Gap Analysis</h1><div className="mt-3 flex items-start gap-3"><Target className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" /><div><p className="font-bold">{career.title}</p><p className="text-sm text-slate-300 mt-1 leading-relaxed">{career.description}</p></div></div></div><div className="flex flex-wrap items-center gap-2 self-start"><Link to="/roadmap" className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg shadow-sm transition"><Map className="w-3.5 h-3.5" /> View Roadmap</Link><button onClick={() => fetchAnalysis(true)} disabled={refreshing} className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 text-xs font-semibold rounded-lg transition"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh analysis'}</button></div></section>

    {analysis.warnings.includes('no_skills_added') && <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center"><AlertCircle className="w-5 h-5 text-amber-600 shrink-0" /><p className="text-sm text-amber-900 flex-1">Add your current skills to receive a more accurate skill-gap analysis. Until then, all required skills are evaluated at No Knowledge.</p><Link to="/my-skills" className="text-xs font-bold text-amber-800 hover:underline">Add skills</Link></section>}

    <section className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 text-center"><div className="relative w-44 h-44 mx-auto rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#2563eb ${analysis.readiness_score * 3.6}deg, #e2e8f0 0deg)` }}><div className="w-36 h-36 rounded-full bg-white flex flex-col items-center justify-center"><span className="text-4xl font-extrabold text-slate-900">{analysis.readiness_score}%</span><span className="text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">Skill Match</span></div></div><h2 className="mt-5 font-bold text-slate-900">Estimated Career Readiness</h2><p className={`mt-1 text-sm font-extrabold ${readinessStyles[analysis.readiness_classification]}`}>{analysis.readiness_classification}</p><p className="mt-3 text-xs leading-relaxed text-slate-500">{analysis.calculation.note}</p></div><div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 content-start"><div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Required Skills</p><p className="mt-1 text-3xl font-extrabold text-slate-900">{summary.total_required_skills}</p></div><div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Skills Satisfied</p><p className="mt-1 text-3xl font-extrabold text-emerald-600">{summary.skills_satisfied}</p></div><div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Need Improvement</p><p className="mt-1 text-3xl font-extrabold text-amber-600">{summary.skills_requiring_improvement}</p></div><div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Missing Skills</p><p className="mt-1 text-3xl font-extrabold text-rose-600">{summary.missing_skills}</p></div></div></section>

    {recommendation ? <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div><div className="flex-1"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Recommended Next Skill</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold text-slate-900">{recommendation.skill_name}</h2><SkillPill label={recommendation.importance} style={importanceStyles[recommendation.importance]} /><SkillPill label={recommendation.status} style={statusStyles[recommendation.status]} /></div><p className="mt-2 text-sm text-slate-700 leading-relaxed">{recommendation.recommendation_reason}</p><p className="mt-2 text-xs font-semibold text-slate-600">Current: {recommendation.current_proficiency_label} · Required: {recommendation.required_proficiency_label} · Gap: {recommendation.skill_gap}</p></div></div><Link to="/roadmap" className="self-center hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg transition shrink-0 shadow-sm"><Map className="w-3.5 h-3.5" /> Start on Roadmap <ChevronRight className="w-3.5 h-3.5" /></Link></div></section> : <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /><div><p className="font-bold text-emerald-900">All listed requirements are satisfied.</p><p className="text-sm text-emerald-800 mt-1">You meet or exceed every configured skill requirement for this career.</p></div></section>}

    <section className="grid xl:grid-cols-3 gap-6"><div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold text-slate-900">Current vs. Required Skills</h2><p className="text-xs text-slate-500 mt-1">Proficiency is shown on the 0–5 scale.</p><div className="h-80 mt-4"><Bar data={barData} options={chartOptions} aria-label="Bar chart comparing current and required skill proficiency" /></div></div><div className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold text-slate-900">Gap Distribution</h2><p className="text-xs text-slate-500 mt-1">Required skills by gap status.</p><div className="h-64 mt-5"><Doughnut data={distributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} aria-label="Doughnut chart of skill gap distribution" /></div></div></section>

    <section className="grid xl:grid-cols-2 gap-6"><div className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold text-slate-900">Your Strong Skills</h2><p className="text-xs text-slate-500 mt-1">Skills where you meet or exceed the required level.</p>{analysis.strengths.length ? <div className="mt-4 flex flex-wrap gap-2">{analysis.strengths.map((item) => <div key={item.skill_id} className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl"><p className="text-sm font-bold text-emerald-900">{item.skill_name}</p><p className="text-xs text-emerald-700 mt-0.5">{item.current_proficiency_label} · Required {item.required_proficiency_label}</p></div>)}</div> : <p className="mt-5 text-sm text-slate-500">No requirements are satisfied yet. Start with the recommended next skill.</p>}</div><div className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold text-slate-900">Missing Skills</h2><p className="text-xs text-slate-500 mt-1">Required skills currently assessed at No Knowledge.</p>{analysis.missing_skills.length ? <div className="mt-4 flex flex-wrap gap-2">{analysis.missing_skills.map((item) => <div key={item.skill_id} className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl"><p className="text-sm font-bold text-rose-900">{item.skill_name}</p><p className="text-xs text-rose-700 mt-0.5">Required {item.required_proficiency_label}</p></div>)}</div> : <p className="mt-5 text-sm text-slate-500">Every required skill has a recorded proficiency level.</p>}</div></section>

    {analysis.major_gaps.length > 0 && <section className="bg-rose-50 border border-rose-200 rounded-2xl p-5"><h2 className="font-bold text-rose-900">Major Skill Gaps</h2><p className="text-xs text-rose-800 mt-1">These requirements have a gap of three or more proficiency levels.</p><div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">{analysis.major_gaps.map((item) => <div key={item.skill_id} className="bg-white border border-rose-200 rounded-xl p-4"><p className="font-bold text-slate-900">{item.skill_name}</p><p className="mt-1 text-xs text-slate-600">Current: {item.current_proficiency_label}</p><p className="text-xs text-slate-600">Required: {item.required_proficiency_label}</p><div className="mt-3 flex gap-2"><SkillPill label="Major Gap" style={statusStyles['Major Gap']} /><SkillPill label={item.importance} style={importanceStyles[item.importance]} /></div></div>)}</div></section>}

    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="p-5 border-b border-slate-200"><h2 className="font-bold text-slate-900">Skills to Improve</h2><p className="text-xs text-slate-500 mt-1">All skill gaps, ordered by deterministic priority (importance, gap size, then missing status).</p></div>{analysis.skill_gaps.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Skill</th><th className="px-5 py-3">Current</th><th className="px-5 py-3">Required</th><th className="px-5 py-3">Gap</th><th className="px-5 py-3">Importance</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{analysis.skill_gaps.map((item) => <tr key={item.skill_id}><td className="px-5 py-3.5 font-extrabold text-blue-600">#{item.priority_rank}</td><td className="px-5 py-3.5"><p className="font-semibold text-slate-800">{item.skill_name}</p><p className="text-xs text-slate-500">{item.skill_category}</p></td><td className="px-5 py-3.5 text-slate-700">{item.current_proficiency_label}</td><td className="px-5 py-3.5 text-slate-700">{item.required_proficiency_label}</td><td className="px-5 py-3.5 font-bold text-slate-900">{item.skill_gap}</td><td className="px-5 py-3.5"><SkillPill label={item.importance} style={importanceStyles[item.importance]} /></td><td className="px-5 py-3.5"><SkillPill label={item.status} style={statusStyles[item.status]} /></td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-slate-500">No skill improvements are currently required.</div>}</section>
  </main></div><Footer /></div>;
};
