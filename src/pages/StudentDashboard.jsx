import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Map,
  Sparkles,
  Target,
  FileSearch,
  TrendingUp,
  Bot,
  FileText,
  Scale,
  Award,
  AlertTriangle,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { NextBestStepWidget } from '../components/NextBestStepWidget';
import { AiCareerAssistant } from '../components/AiCareerAssistant';
import { AchievementsWidget } from '../components/AchievementsWidget';
import { ActivityCenterWidget } from '../components/ActivityCenterWidget';

const proficiencyLabels = ['No Knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export const StudentDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState({ total_skills: 0 });
  const [analysis, setAnalysis] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [achievementsData, setAchievementsData] = useState({ unlocked_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Assistant state
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');

  const openAdvisor = (prompt = '') => {
    setAdvisorPrompt(prompt);
    setIsAdvisorOpen(true);
  };

  const loadDashboard = useCallback(async () => {
    try {
      const [profileResponse, skillsResponse, summaryResponse, achievementsResponse] = await Promise.all([
        axios.get('/api/users/profile'),
        axios.get('/api/student-skills'),
        axios.get('/api/student-skills/summary'),
        axios.get('/api/achievements/user').catch(() => ({ data: { unlocked_count: 0, total_count: 0 } })),
      ]);

      updateUserProfile(profileResponse.data.user);
      setSkills(skillsResponse.data.skills || []);
      setSummary(summaryResponse.data || { total_skills: 0 });
      setAchievementsData(achievementsResponse.data || { unlocked_count: 0, total_count: 0 });

      if (profileResponse.data.user.target_career_id) {
        try {
          const [analysisResponse, roadmapResponse] = await Promise.allSettled([
            axios.get('/api/analysis'),
            axios.get('/api/roadmap'),
          ]);
          if (analysisResponse.status === 'fulfilled') {
            setAnalysis(analysisResponse.value.data.analysis);
          } else {
            setAnalysis(null);
          }
          if (roadmapResponse.status === 'fulfilled') {
            setRoadmap(roadmapResponse.value.data);
          } else {
            setRoadmap(null);
          }
        } catch {
          setAnalysis(null);
          setRoadmap(null);
        }
      } else {
        setAnalysis(null);
        setRoadmap(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Your dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [updateUserProfile]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const nextStep = analysis?.recommended_next_skill || roadmap?.recommended_next_skill;
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Top Greeting Header */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Career Intelligence Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {firstName} 👋
              </h1>
              <p className="text-sm text-slate-500 font-normal">
                Real-time benchmark tracking and deterministic learning roadmap.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/choose-career"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <Target className="w-4 h-4 text-slate-500" />
                <span>{user?.target_career_title ? 'Switch Target Career' : 'Set Target Career'}</span>
              </Link>

              <button
                onClick={() => openAdvisor('What skills should I prioritize next for my career?')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Bot className="w-4 h-4 text-indigo-200" />
                <span>Ask AI Advisor</span>
              </button>
            </div>
          </section>

          {loading ? (
            <LoadingSpinner label="Compiling your career intelligence metrics..." />
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800">
              {error}
            </div>
          ) : (
            <>
              {/* Compact Summary Cards (4 Cards) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Readiness Score */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Readiness Score</p>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {analysis ? `${analysis.readiness_score}%` : '—'}
                    </span>
                    {analysis && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {analysis.readiness_classification}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 truncate">
                    {user?.target_career_title ? `Target: ${user.target_career_title}` : 'No target selected yet'}
                  </p>
                </div>

                {/* 2. Skills Acquired */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills Acquired</p>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {summary.total_skills}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">recorded</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 truncate">
                    {analysis
                      ? `${analysis.summary?.skills_satisfied || 0} of ${analysis.summary?.total_required_skills || 0} requirements met`
                      : 'Self-assessed in skills inventory'}
                  </p>
                </div>

                {/* 3. Roadmap Progress */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Roadmap Progress</p>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Map className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {roadmap?.code === 'all_skills_satisfied'
                        ? '100%'
                        : roadmap?.roadmap
                        ? `${roadmap.roadmap.overall_completion}%`
                        : '0%'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">completed</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 truncate">
                    {roadmap?.roadmap
                      ? `${roadmap.roadmap.completed_items} of ${roadmap.roadmap.total_items} milestones achieved`
                      : 'Select a career to generate path'}
                  </p>
                </div>

                {/* 4. Achievements */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Achievements</p>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {achievementsData.unlocked_count}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {achievementsData.total_count || 6} unlocked
                    </span>
                  </div>
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          achievementsData.total_count
                            ? Math.round((achievementsData.unlocked_count / achievementsData.total_count) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Skill Overview Section */}
              <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Skill Overview</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Deterministic match breakdown against your target career requirements.
                    </p>
                  </div>
                  <Link
                    to={user?.target_career_id ? '/analysis' : '/choose-career'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <span>Full Analysis Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Readiness Ring */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                    <div
                      className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner"
                      style={{
                        background: `conic-gradient(#2563eb ${(analysis?.readiness_score || 0) * 3.6}deg, #e2e8f0 0deg)`,
                      }}
                    >
                      <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center shadow-xs">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {analysis ? `${analysis.readiness_score}%` : '0%'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                          Readiness Ring
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-800 text-center">
                      {analysis?.readiness_classification || 'No target career benchmark set'}
                    </p>
                    <p className="text-[11px] text-slate-500 text-center mt-0.5">
                      {user?.target_career_title ? user.target_career_title : 'Select a career to calculate benchmark'}
                    </p>
                  </div>

                  {/* 4 Skill Categories: Strengths, Minor Gaps, Major Gaps, Missing Skills */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                            Strengths ({analysis?.strengths?.length || 0})
                          </h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Satisfied
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {analysis?.strengths?.length ? (
                          analysis.strengths.slice(0, 4).map((s) => (
                            <span
                              key={s.skill_id}
                              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-900"
                            >
                              {s.skill_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No recorded requirements met yet</span>
                        )}
                      </div>
                    </div>

                    {/* Minor Gaps */}
                    <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                            Minor Gaps (
                            {analysis?.skill_gaps?.filter((g) => g.status === 'Minor Gap').length || 0}
                            )
                          </h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          1-2 Levels
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {analysis?.skill_gaps?.filter((g) => g.status === 'Minor Gap').length ? (
                          analysis.skill_gaps
                            .filter((g) => g.status === 'Minor Gap')
                            .slice(0, 4)
                            .map((s) => (
                              <span
                                key={s.skill_id}
                                className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-amber-900"
                              >
                                {s.skill_name}
                              </span>
                            ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No minor skill gaps detected</span>
                        )}
                      </div>
                    </div>

                    {/* Major Gaps */}
                    <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                            Major Gaps ({analysis?.major_gaps?.length || 0})
                          </h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          3+ Levels
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {analysis?.major_gaps?.length ? (
                          analysis.major_gaps.slice(0, 4).map((s) => (
                            <span
                              key={s.skill_id}
                              className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-900"
                            >
                              {s.skill_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No critical major gaps detected</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                            Missing Skills ({analysis?.missing_skills?.length || 0})
                          </h3>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Level 0
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {analysis?.missing_skills?.length ? (
                          analysis.missing_skills.slice(0, 4).map((s) => (
                            <span
                              key={s.skill_id}
                              className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-xs font-semibold text-purple-900"
                            >
                              {s.skill_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">All required skills have recorded data</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Next Best Step: Large Recommendation Card */}
              {nextStep ? (
                <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-slate-800 rounded-2xl p-6 sm:p-7 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Next Best Skill</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {nextStep.skill_name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 py-1">
                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                          <span className="text-slate-400">Current:</span>
                          <span className="font-bold text-white">
                            {nextStep.current_proficiency ?? 0}/5 (
                            {proficiencyLabels[nextStep.current_proficiency ?? 0]})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                          <span className="text-slate-400">Required:</span>
                          <span className="font-bold text-white">
                            {nextStep.required_proficiency ?? 4}/5 (
                            {proficiencyLabels[nextStep.required_proficiency ?? 4]})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-400/30">
                          <span className="text-blue-300">Gap:</span>
                          <span className="font-bold text-blue-200">
                            {nextStep.skill_gap ?? 2} Levels
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed font-normal">
                        High priority for your target career ({user?.target_career_title || 'chosen track'}).
                        Mastering this milestone significantly boosts your overall career readiness.
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
                      <Link
                        to="/roadmap"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        <span>Continue Learning</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => openAdvisor(`Explain what I need to learn to master ${nextStep.skill_name}.`)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold rounded-xl border border-white/15 transition"
                      >
                        <Bot className="w-4 h-4 text-blue-300" />
                        <span>Study Guide with AI</span>
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Best Skill</p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {user?.target_career_title ? 'All benchmark skills satisfied!' : 'Select a target career'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {user?.target_career_title
                        ? 'Great job! Explore advanced tools or analyze active job postings.'
                        : 'Choose a target career path to receive prioritized skill recommendations.'}
                    </p>
                  </div>
                  <Link
                    to={user?.target_career_title ? '/job-analyzer' : '/choose-career'}
                    className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                  >
                    {user?.target_career_title ? 'Analyze Job Openings' : 'Select Career'}
                  </Link>
                </section>
              )}

              {/* Full Smart Recommendations Component */}
              <NextBestStepWidget onOpenAiAssistant={openAdvisor} />

              {/* Roadmap Progress Visualization */}
              {user?.target_career_id && roadmap?.roadmap && (
                <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Roadmap Progress</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {roadmap.roadmap.completed_items} of {roadmap.roadmap.total_items} milestones completed (
                        {roadmap.roadmap.overall_completion}%)
                      </p>
                    </div>
                    <Link
                      to="/roadmap"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>Interactive Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Progress visualization bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${roadmap.roadmap.overall_completion}%` }}
                    />
                  </div>

                  {/* Sequential milestone preview chips */}
                  {((roadmap.items || roadmap.roadmap?.items) && (roadmap.items || roadmap.roadmap?.items).length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {(roadmap.items || roadmap.roadmap?.items || []).slice(0, 6).map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-900'
                              : item.status === 'In Progress'
                              ? 'bg-blue-50/40 border-blue-200/80 text-blue-900'
                              : 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                              #{item.sequence}
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{item.skill_name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{item.importance} priority</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic pt-2">No active roadmap milestones remaining.</p>
                  )}
                </section>
              )}

              {/* Achievements & Activity Timeline Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AchievementsWidget />
                <ActivityCenterWidget />
              </section>

              {/* Career Intelligence Quick Tools Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/job-analyzer"
                  className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-400 transition group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Job Description Analyzer</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Paste real company job descriptions to benchmark your readiness and extract missing skills.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    Analyze Jobs <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  to="/resume-analyzer"
                  className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-indigo-400 transition group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Resume Analyzer</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload your PDF/DOCX resume to detect technical competencies and missing portfolio requirements.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Upload Resume <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  to="/compare-careers"
                  className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-violet-400 transition group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition">
                      <Scale className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Career Comparison</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Compare 2–3 technical pathways side-by-side to discover transferable skills and learning curves.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-600 group-hover:translate-x-0.5 transition-transform">
                    Compare Roles <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </section>
            </>
          )}
        </main>
      </div>

      <Footer />

      {/* AI Career Assistant Modal */}
      <AiCareerAssistant
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        initialPrompt={advisorPrompt}
      />
    </div>
  );
};
