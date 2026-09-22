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
  Lock,
  PlayCircle,
  Circle,
  Bot,
  Sliders,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AiCareerAssistant } from '../components/AiCareerAssistant';

const importanceStyles = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  Important: 'bg-amber-50 text-amber-700 border-amber-200',
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
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const RoadmapPage = () => {
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // AI Assistant state
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');

  const openAdvisor = (prompt = '') => {
    setAdvisorPrompt(prompt);
    setIsAdvisorOpen(true);
  };

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
      if (response.data?.items?.length) {
        // default select first incomplete or first item
        const firstActive =
          response.data.items.find((i) => i.status === 'In Progress') ||
          response.data.items.find((i) => i.status === 'Not Started') ||
          response.data.items[0];
        setSelectedMilestone(firstActive);
      }
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

      setSelectedMilestone((prev) => (prev?.id === updatedItem.id ? updatedItem : prev));
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
          <main className="flex-1 p-8">
            <LoadingSpinner label="Sequencing your personalized learning journey..." />
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
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Personalized Learning Roadmap</h1>
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
                  onClick={() => fetchRoadmap()}
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

  const { career, summary, items = [], recommended_next_skill } = roadmapData || {};

  // Stage partition for vertical timeline (Foundations, Core Skills, Advanced)
  const totalItems = items.length;
  const stage1Count = Math.max(1, Math.ceil(totalItems / 3));
  const stage2Count = Math.max(1, Math.ceil((totalItems - stage1Count) / 2));

  const stages = [
    {
      number: '01',
      title: 'Foundations',
      description: 'Core concepts, prerequisites, and foundational building blocks',
      items: items.slice(0, stage1Count),
    },
    {
      number: '02',
      title: 'Core Skills',
      description: 'Intermediate workflows, frameworks, and practical applications',
      items: items.slice(stage1Count, stage1Count + stage2Count),
    },
    {
      number: '03',
      title: 'Advanced & System Mastery',
      description: 'Architecture, high-performance patterns, and specialized competencies',
      items: items.slice(stage1Count + stage2Count),
    },
  ].filter((s) => s.items.length > 0);

  const getMilestoneState = (item) => {
    if (item.status === 'Completed') return 'completed';
    const isLocked = item.prerequisites?.some((p) => !p.satisfied);
    if (isLocked) return 'locked';
    if (recommended_next_skill && recommended_next_skill.item_id === item.id) return 'current';
    if (item.status === 'In Progress') return 'current';
    return 'upcoming';
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'in_progress') return item.status === 'In Progress';
    if (activeFilter === 'not_started') return item.status === 'Not Started';
    if (activeFilter === 'completed') return item.status === 'Completed';
    return true;
  });

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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Map className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Personalized Curriculum</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Your Learning Roadmap
                </h1>
                <p className="text-sm text-slate-500 font-normal">
                  A personalized path toward your target career.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => fetchRoadmap(true)}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>

                <Link
                  to="/analysis"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <span>Skill Gap Analysis</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Top Overall Progress Section */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Overall Progress
                  </span>
                  <span className="font-black text-slate-900">
                    {summary?.completed_skills || 0} of {items.length} skills completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.overall_completion || 0}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-6">
                <div className="text-left md:text-right">
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    {summary?.overall_completion || 0}%
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">Curriculum Completion</p>
                </div>

                <div className="border-l border-slate-200 pl-4 space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    {career?.title || 'Selected Career'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    {summary?.in_progress_skills || 0} Active / {summary?.not_started_skills || 0} Remaining
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs">
              {[
                { id: 'all', label: `All Milestones (${items.length})` },
                { id: 'in_progress', label: `In Progress (${summary?.in_progress_skills || 0})` },
                { id: 'not_started', label: `Not Started (${summary?.not_started_skills || 0})` },
                { id: 'completed', label: `Completed (${summary?.completed_skills || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Click any milestone to open details & resources
            </p>
          </div>

          {/* Main Layout: Vertical Timeline + Details Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Timeline Section (8 Columns) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {stages.map((stage) => {
                const stageFilteredItems = stage.items.filter((item) => {
                  if (activeFilter === 'in_progress') return item.status === 'In Progress';
                  if (activeFilter === 'not_started') return item.status === 'Not Started';
                  if (activeFilter === 'completed') return item.status === 'Completed';
                  return true;
                });

                if (stageFilteredItems.length === 0 && activeFilter !== 'all') return null;

                return (
                  <section
                    key={stage.number}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs"
                  >
                    {/* Stage Header */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                      <span className="text-xl font-black text-slate-300 font-mono tracking-tight">
                        {stage.number}
                      </span>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {stage.title}
                        </h2>
                        <p className="text-[11px] text-slate-400">{stage.description}</p>
                      </div>
                    </div>

                    {/* Timeline items list */}
                    <div className="space-y-3">
                      {stageFilteredItems.map((item) => {
                        const state = getMilestoneState(item);
                        const isSelected = selectedMilestone?.id === item.id;
                        const isLocked = state === 'locked';

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedMilestone(item)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50/25 shadow-xs ring-2 ring-indigo-500/10'
                                : state === 'completed'
                                ? 'border-emerald-200/80 bg-emerald-50/15 hover:border-emerald-300'
                                : state === 'current'
                                ? 'border-indigo-300 bg-indigo-50/20 hover:border-indigo-400'
                                : isLocked
                                ? 'border-slate-200 bg-slate-50/60 opacity-80'
                                : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            {/* Left indicator + Name */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              {/* State Icon */}
                              <div className="shrink-0 mt-0.5 sm:mt-0">
                                {state === 'completed' ? (
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                ) : state === 'current' ? (
                                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                ) : isLocked ? (
                                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                                    #{item.sequence}
                                  </div>
                                )}
                              </div>

                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-slate-900 truncate">
                                    {item.skill_name}
                                  </span>
                                  {state === 'current' && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider animate-pulse">
                                      NEXT
                                    </span>
                                  )}
                                  {isLocked && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase tracking-wider">
                                      LOCKED
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {item.skill_category} • {item.importance} Priority
                                </p>
                              </div>
                            </div>

                            {/* Right Status Badges & Quick Action */}
                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                              <div className="text-right hidden sm:block">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeStyles[item.status]}`}>
                                  {item.status}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {item.completion_percentage}% done
                                </p>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Right Interactive Details Panel (4 Columns) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              {selectedMilestone ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                  {/* Panel Header */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Milestone #{selectedMilestone.sequence}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeStyles[selectedMilestone.status]}`}>
                        {selectedMilestone.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                      {selectedMilestone.skill_name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedMilestone.skill_category}
                    </p>
                  </div>

                  {/* Progress Slider & Quick Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Milestone Completion</span>
                      <span className="text-blue-600 font-black">
                        {selectedMilestone.completion_percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${selectedMilestone.completion_percentage}%` }}
                      />
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: '0%', val: 0, status: 'Not Started' },
                        { label: '50%', val: 50, status: 'In Progress' },
                        { label: '75%', val: 75, status: 'In Progress' },
                        { label: '100%', val: 100, status: 'Completed' },
                      ].map((btn) => (
                        <button
                          key={btn.val}
                          disabled={updatingItemId === selectedMilestone.id}
                          onClick={() => handleUpdateItemProgress(selectedMilestone.id, btn.status, btn.val)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                            selectedMilestone.completion_percentage === btn.val
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prerequisites Checklist */}
                  {selectedMilestone.prerequisites && selectedMilestone.prerequisites.length > 0 && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Prerequisites Checklist
                      </p>
                      <div className="space-y-1.5">
                        {selectedMilestone.prerequisites.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {p.satisfied ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span className={p.satisfied ? 'text-slate-800' : 'text-slate-500 font-medium'}>
                              {p.prerequisite_skill_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Learning Resource */}
                  {selectedMilestone.learning_resource && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Recommended Resource
                        </span>
                        {selectedMilestone.learning_resource.is_free && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Free
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {selectedMilestone.learning_resource.title}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{selectedMilestone.learning_resource.resource_type}</span>
                        {selectedMilestone.learning_resource.duration_minutes && (
                          <>
                            <span>•</span>
                            <span>{selectedMilestone.learning_resource.duration_minutes} mins</span>
                          </>
                        )}
                      </div>

                      <a
                        href={selectedMilestone.learning_resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                      >
                        <span>Open Course/Tutorial</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* AI Quick Study Help */}
                  <button
                    onClick={() =>
                      openAdvisor(
                        `Provide a focused tutorial outline and practice exercises to master ${selectedMilestone.skill_name} for a ${career?.title || 'technical'} role.`
                      )
                    }
                    className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4 text-blue-300" />
                    <span>Get AI Study Plan for this Skill</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-xs text-slate-400">
                  Select any milestone from the timeline to review details and study resources.
                </div>
              )}
            </div>
          </div>
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
