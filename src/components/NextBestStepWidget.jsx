import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Target,
  TrendingUp,
  Bot,
} from 'lucide-react';

export const NextBestStepWidget = ({ onOpenAiAssistant }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/recommendations');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load smart recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl mb-3"></div>
      </div>
    );
  }

  if (!data || !data.has_target_career) {
    return (
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              <Sparkles className="w-3.5 h-3.5" /> Smart Recommendation
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Your Next Best Step</h2>
            <p className="text-sm text-slate-600">
              Choose a target career to receive personalized skill recommendations and calculated priority scores.
            </p>
          </div>
          <Link
            to="/choose-career"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition shrink-0"
          >
            <span>Choose Target Career</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  if (data.career_skills_satisfied) {
    return (
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Career Benchmark Met
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Excellent! You currently meet all required skills for {data.target_career?.title}.
            </h2>
            <p className="text-sm text-slate-600">
              Explore real-world job descriptions to discover trending market tools, or compare adjacent career pathways.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/job-analyzer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <span>Analyze Job Postings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/compare-careers"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition"
            >
              <span>Compare Careers</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const rec = data.top_recommendation;
  if (!rec) return null;

  return (
    <section className="bg-white border-2 border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      {/* Accent Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50/70 via-blue-50/40 to-transparent pointer-events-none rounded-bl-full" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase bg-indigo-600 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Your Next Best Step
          </span>
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            Ranked for {data.target_career?.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAiAssistant && onOpenAiAssistant(`Why is ${rec.skill_name} my next best step?`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
            title="Ask AI advisor about this recommendation"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask Advisor</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Priority Score:</span>
            <span className="text-indigo-600">{rec.priority_score}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid with 4 Actionable Answers */}
      <div className="space-y-5 relative">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* 1. What should I learn? */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 mb-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>1. What should I learn?</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{rec.skill_name}</h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                  {rec.skill_category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    rec.importance === 'Critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {rec.importance} Priority
                </span>
                {rec.is_locked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="w-3 h-3" /> Prerequisites Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Ready to Study
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Estimated effort to close gap: <span className="font-semibold text-slate-700">{rec.estimated_duration}</span>
              </p>
            </div>

            {/* Proficiency Levels Comparison */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-600">
                  Current: <strong className="text-slate-900 font-bold">{rec.current_proficiency} / 5</strong>
                </span>
                <span className="text-slate-600">
                  Target: <strong className="text-slate-900 font-bold">{rec.required_proficiency} / 5</strong>
                </span>
                <span className="text-indigo-600 font-bold">Gap: {rec.skill_gap} Level(s)</span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full transition-all"
                  style={{ width: `${(rec.current_proficiency / 5) * 100}%` }}
                  title={`Current: ${rec.current_proficiency}/5`}
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${(rec.skill_gap / 5) * 100}%` }}
                  title={`Gap: ${rec.skill_gap}/5`}
                />
              </div>
            </div>
          </div>

          {/* 2. Why? */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>2. Why this skill?</span>
                </div>
                <button
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  {showScoreBreakdown ? 'Hide math' : 'Score formula'}
                </button>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-700">
                {(rec.reasons || []).slice(0, showAllReasons ? (rec.reasons?.length || 0) : 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {(rec.reasons?.length || 0) > 3 && (
                <button
                  onClick={() => setShowAllReasons(!showAllReasons)}
                  className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-0.5 pt-1 font-medium"
                >
                  {showAllReasons ? (
                    <>
                      <span>Show less</span> <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Show {rec.reasons.length - 3} more reasons</span> <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Score math breakdown */}
            {showScoreBreakdown && (
              <div className="p-2.5 bg-white border border-indigo-100 rounded-lg text-xs space-y-1 text-slate-700">
                <p className="font-bold text-indigo-950">Priority Algorithm Math:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  <div>• Gap Weight: +{rec.score_breakdown.gap_score} pts</div>
                  <div>• Importance: +{rec.score_breakdown.importance_score} pts</div>
                  <div>• Prerequisites: {rec.score_breakdown.prerequisite_score >= 0 ? `+${rec.score_breakdown.prerequisite_score}` : rec.score_breakdown.prerequisite_score} pts</div>
                  <div>• Market Weight: +{rec.score_breakdown.job_relevance_score} pts</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* 3. What will it improve? */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3. What will it improve?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Readiness Gain</p>
                <p className="text-base font-black text-indigo-600">+{rec.readiness_impact_estimate || 8}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5">towards {data.target_career?.title}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gap Elimination</p>
                <p className="text-base font-black text-emerald-600">-{rec.skill_gap} Levels</p>
                <p className="text-[10px] text-slate-500 mt-0.5">closes critical gap</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Roadmap Impact</p>
                <p className="text-base font-black text-purple-600">Unlocks Next</p>
                <p className="text-[10px] text-slate-500 mt-0.5">downstream skills</p>
              </div>
            </div>
          </div>

          {/* 4. What should I do next? */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> 4. What should I do next?
                </span>
                {rec.learning_resource?.difficulty_level && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {rec.learning_resource.difficulty_level}
                  </span>
                )}
              </div>

              {rec.learning_resource ? (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 truncate">{rec.learning_resource.title}</p>
                    <a
                      href={rec.learning_resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{rec.learning_resource.platform || 'Recommended Course'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Step-by-step interactive milestones available in your Roadmap view.
                </p>
              )}

              {rec.is_locked && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Missing Prerequisites:</span>{' '}
                    {(rec.prerequisites?.missing || []).join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link
                to="/roadmap"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition text-center"
              >
                <span>{rec.roadmap_status === 'In Progress' ? 'Continue in Roadmap' : 'Start Milestone in Roadmap'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => onOpenAiAssistant && onOpenAiAssistant(`Provide a concise study plan to master ${rec.skill_name}.`)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ask AI Advisor</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
