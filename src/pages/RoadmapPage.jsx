import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  Map,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';

const importanceStyles = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  Important: 'bg-amber-100 text-amber-700 border-amber-200',
  Optional: 'bg-slate-100 text-slate-700 border-slate-200',
};

const priorityStyles = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
};

const statusBadgeStyles = {
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const RoadmapPage = () => {
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchRoadmap = useCallback(async (isRegenerate = false) => {
    if (isRegenerate) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const endpoint = isRegenerate ? '/api/roadmap/regenerate' : '/api/roadmap';
      const method = isRegenerate ? axios.post : axios.get;
      const response = await method(endpoint);
      setRoadmapData(response.data);
    } catch (err) {
      setRoadmapData(null);
      setError({
        message: err.response?.data?.error || 'Unable to load your personalized roadmap. Please try again.',
        code: err.response?.data?.code,
      });
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleUpdateItemProgress = async (itemId, status, completionPercentage) => {
    setUpdatingItemId(itemId);
    try {
      const response = await axios.put(`/api/roadmap/items/${itemId}`, {
        status,
        completion_percentage: completionPercentage,
      });

      const updatedItem = response.data.item;
      const updatedRoadmap = response.data.roadmap;
      const updatedNextSkill = response.data.recommended_next_skill;

      setRoadmapData((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
        return {
          ...prev,
          roadmap: updatedRoadmap,
          items: newItems,
          recommended_next_skill: updatedNextSkill,
          summary: {
            ...prev.summary,
            overall_completion: updatedRoadmap.overall_completion,
            completed_skills: newItems.filter((i) => i.status === 'Completed').length,
            in_progress_skills: newItems.filter((i) => i.status === 'In Progress').length,
            not_started_skills: newItems.filter((i) => i.status === 'Not Started').length,
          },
        };
      });
    } catch (err) {
      console.warn('Failed to update roadmap item progress:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1">
            <LoadingSpinner label="Generating your personalized learning roadmap..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Error or empty state handling
  if (error) {
    const noCareer = error.code === 'no_target_career';
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6">
            <section className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 text-center mx-auto mt-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Learning Roadmap</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{error.message}</p>
              {noCareer ? (
                <Link
                  to="/choose-career"
                  className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  <Target className="w-4 h-4" /> Choose a Career
                </Link>
              ) : (
                <button
                  onClick={() => fetchRoadmap()}
                  className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              )}
            </section>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // All skills satisfied celebration state
  if (roadmapData?.code === 'all_skills_satisfied') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Career Ready
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Personalized Learning Roadmap</h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                Target Career: <span className="font-bold text-white">{roadmapData.target_career?.title}</span>
              </p>
            </section>

            <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-emerald-950">
                All Defined Skill Requirements Satisfied!
              </h2>
              <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
                You have reached or exceeded every skill proficiency required for{' '}
                <span className="font-bold">{roadmapData.target_career?.title}</span>. No learning tasks are currently
                required.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/analysis"
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  View Gap Analysis
                </Link>
                <Link
                  to="/choose-career"
                  className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition"
                >
                  Explore Other Careers
                </Link>
              </div>
            </section>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const { roadmap, items = [], recommended_next_skill, target_career, summary } = roadmapData;

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'in_progress') return item.status === 'In Progress';
    if (activeFilter === 'completed') return item.status === 'Completed';
    if (activeFilter === 'not_started') return item.status === 'Not Started';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
                <Map className="w-3.5 h-3.5" /> Structured Learning Sequence
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Personalized Learning Roadmap</h1>
              <div className="mt-2 flex items-center gap-2 text-slate-300 text-sm">
                <Target className="w-4 h-4 text-blue-300 shrink-0" />
                <span>
                  Target Career: <strong className="text-white">{target_career?.title}</strong>
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 max-w-xl">
                Your roadmap is deterministically sequenced based on foundational prerequisites, skill importance, and
                identified gaps.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-right">
                <p className="text-xs font-medium text-blue-200">Roadmap Progress</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-white">{roadmap?.overall_completion || 0}%</span>
                  <span className="text-xs text-slate-300">
                    ({summary?.completed_skills || 0} of {summary?.total_skills_in_roadmap || items.length} done)
                  </span>
                </div>
                <div className="w-36 h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${roadmap?.overall_completion || 0}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => fetchRoadmap(true)}
                disabled={regenerating}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate Roadmap'}
              </button>
            </div>
          </section>

          {/* Recommended Next Skill Card */}
          {recommended_next_skill ? (
            <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Recommended Next Step
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-200/70 text-blue-800">
                        Step #{recommended_next_skill.sequence}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {recommended_next_skill.skill_name} — {recommended_next_skill.topic}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                      {recommended_next_skill.why_needed}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {recommended_next_skill.status === 'Not Started' && (
                    <button
                      onClick={() => handleUpdateItemProgress(recommended_next_skill.id, 'In Progress', 25)}
                      disabled={updatingItemId === recommended_next_skill.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" /> Start Learning
                    </button>
                  )}
                  {recommended_next_skill.status === 'In Progress' && (
                    <button
                      onClick={() => handleUpdateItemProgress(recommended_next_skill.id, 'Completed', 100)}
                      disabled={updatingItemId === recommended_next_skill.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Roadmap Fully Completed!</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  You have completed every milestone in this personalized roadmap.
                </p>
              </div>
            </section>
          )}

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Milestones</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{items.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Completed</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600">{summary?.completed_skills || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">In Progress</p>
              <p className="mt-1 text-2xl font-extrabold text-blue-600">{summary?.in_progress_skills || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Remaining</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-600">{summary?.not_started_skills || 0}</p>
            </div>
          </section>

          {/* Filter Bar */}
          <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
              {[
                { id: 'all', label: `All Tasks (${items.length})` },
                { id: 'in_progress', label: `In Progress (${summary?.in_progress_skills || 0})` },
                { id: 'not_started', label: `Not Started (${summary?.not_started_skills || 0})` },
                { id: 'completed', label: `Completed (${summary?.completed_skills || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              Showing {filteredItems.length} of {items.length} milestones
            </p>
          </section>

          {/* Sequenced Roadmap Items List */}
          <section className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
                No roadmap items match the selected filter.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isItemUpdating = updatingItemId === item.id;
                const hasPrereqs = item.prerequisites && item.prerequisites.length > 0;
                const resource = item.learning_resource;

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-sm hover:shadow ${
                      item.status === 'Completed'
                        ? 'border-emerald-200/90 bg-emerald-50/20'
                        : item.status === 'In Progress'
                        ? 'border-blue-200/90 bg-blue-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Left: Step details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                            #{item.sequence}
                          </span>

                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{item.skill_name}</h3>

                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {item.skill_category}
                          </span>

                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                              importanceStyles[item.importance] || importanceStyles.Optional
                            }`}
                          >
                            {item.importance}
                          </span>

                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                              priorityStyles[item.priority] || priorityStyles.Low
                            }`}
                          >
                            {item.priority} Priority
                          </span>

                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              statusBadgeStyles[item.status]
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Topic & Description */}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.topic}</p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                        </div>

                        {/* Why needed & gap metrics */}
                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Why needed:</p>
                          <p className="leading-relaxed">{item.why_needed}</p>
                          <div className="flex flex-wrap items-center gap-4 pt-1 font-medium text-slate-500">
                            <span>
                              Current: <strong className="text-slate-800">{item.current_proficiency}/5</strong>
                            </span>
                            <span>
                              Required: <strong className="text-slate-800">{item.required_proficiency}/5</strong>
                            </span>
                            <span>
                              Skill Gap: <strong className="text-rose-600">+{item.skill_gap} levels</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Estimated: <strong className="text-slate-800">{item.estimated_duration}</strong>
                            </span>
                            <span>
                              Difficulty: <strong className="text-slate-800">{item.difficulty}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Prerequisites */}
                        {hasPrereqs && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-semibold text-slate-500">Prerequisites:</span>
                            {item.prerequisites.map((prereq) => (
                              <span
                                key={prereq}
                                className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium"
                              >
                                {prereq}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Learning Resource Card */}
                        <div className="pt-1">
                          {resource ? (
                            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-900 truncate">{resource.title}</p>
                                  <p className="text-[11px] text-slate-500">
                                    {resource.platform || 'Recommended Resource'} · {resource.resource_type} ·{' '}
                                    {resource.difficulty_level}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition shrink-0"
                              >
                                <span>Learn</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-400 italic">
                              Learning resource not available yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Progress & Status Interactive Controls */}
                      <div className="lg:w-64 shrink-0 bg-slate-50/90 border border-slate-200 rounded-xl p-4 space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>
                          <span className="text-xs font-bold text-slate-700">{item.completion_percentage}%</span>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-lg">
                          {[
                            { key: 'Not Started', label: 'Not Started' },
                            { key: 'In Progress', label: 'In Progress' },
                            { key: 'Completed', label: 'Done' },
                          ].map((s) => (
                            <button
                              key={s.key}
                              disabled={isItemUpdating}
                              onClick={() => {
                                let newPct = item.completion_percentage;
                                if (s.key === 'Completed') newPct = 100;
                                else if (s.key === 'Not Started') newPct = 0;
                                else if (s.key === 'In Progress' && (newPct === 0 || newPct === 100)) newPct = 50;
                                handleUpdateItemProgress(item.id, s.key, newPct);
                              }}
                              className={`py-1 rounded-md text-[11px] font-bold transition ${
                                item.status === s.key
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              } disabled:opacity-50`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {/* Progress Bar & Quick Presets */}
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                            <span>Completion</span>
                            <span>{item.completion_percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-500'
                                  : item.status === 'In Progress'
                                  ? 'bg-blue-600'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${item.completion_percentage}%` }}
                            />
                          </div>

                          {/* Quick Percent Presets */}
                          <div className="mt-2.5 flex justify-between gap-1">
                            {[0, 25, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                disabled={isItemUpdating}
                                onClick={() => {
                                  let newStatus = item.status;
                                  if (pct === 100) newStatus = 'Completed';
                                  else if (pct === 0) newStatus = 'Not Started';
                                  else newStatus = 'In Progress';
                                  handleUpdateItemProgress(item.id, newStatus, pct);
                                }}
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition ${
                                  item.completion_percentage === pct
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                } disabled:opacity-50`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {isItemUpdating && (
                          <p className="text-[11px] text-blue-600 font-semibold text-center animate-pulse">
                            Saving progress...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Navigation Helpers */}
          <section className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5">
            <div>
              <p className="text-sm font-bold text-slate-900">Want to re-evaluate your skill gaps?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your self-assessed proficiency levels anytime to regenerate your roadmap.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/my-skills"
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Update Skills
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
              >
                <span>View Gap Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};
