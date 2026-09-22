import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Compass,
  Layers,
  Map,
  Flame,
  TrendingUp,
  Zap,
  Target,
  FileSearch,
  FileText,
  BookOpen,
} from 'lucide-react';

const ICON_MAP = {
  Compass,
  Layers,
  Map,
  Flame,
  TrendingUp,
  Award,
  Zap,
  Target,
  FileSearch,
  FileText,
  BookOpen,
};

export const AchievementsWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/achievements/user');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
        <div className="h-10 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const achievementsList = (data.achievements || []).map((ach, idx) => {
    const base = ach.achievement || ach;
    return {
      id: base.id || ach.id || `ach-${idx}`,
      title: base.title || ach.title || 'Achievement',
      description: base.description || ach.description || '',
      icon: base.icon || ach.icon || 'Award',
      unlocked: Boolean(ach.unlocked ?? base.unlocked),
      unlocked_at: ach.unlocked_at || base.unlocked_at || null,
    };
  });

  const unlockedList = achievementsList.filter((a) => a.unlocked);
  const nextToUnlock = achievementsList.find((a) => !a.unlocked);

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Career Milestones</h3>
              <p className="text-[11px] text-slate-500">
                {data.unlocked_count ?? 0} of {data.total ?? achievementsList.length} Milestones Achieved ({data.percentage ?? 0}%)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAllModal(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${data.percentage ?? 0}%` }}
          />
        </div>

        {/* Recent Unlocked Badges */}
        <div className="grid grid-cols-4 gap-2">
          {achievementsList.slice(0, 4).map((ach) => {
            const IconComponent = ICON_MAP[ach.icon] || Award;
            return (
              <div
                key={ach.id}
                title={`${ach.title}: ${ach.description}`}
                className={`flex flex-col items-center p-2 rounded-xl text-center transition ${
                  ach.unlocked
                    ? 'bg-slate-50 border border-indigo-200/80 text-slate-800'
                    : 'bg-slate-50/60 border border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mb-1.5 ${
                    ach.unlocked ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {ach.unlocked ? <IconComponent className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-bold truncate max-w-full text-slate-700">{ach.title}</span>
              </div>
            );
          })}
        </div>

        {nextToUnlock && (
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">
              Next Benchmark: <strong className="text-slate-800">{nextToUnlock.title}</strong> — {nextToUnlock.description}
            </span>
          </div>
        )}
      </div>

      {/* All Achievements Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Career Competency Milestones</h3>
                  <p className="text-xs text-slate-500">
                    Recognitions granted as you close skill gaps, complete roadmap stages, and analyze job targets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
              <div className="grid sm:grid-cols-2 gap-3">
                {achievementsList.map((ach) => {
                  const IconComponent = ICON_MAP[ach.icon] || Award;
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                        ach.unlocked
                          ? 'bg-white border-indigo-200 shadow-xs'
                          : 'bg-white/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          ach.unlocked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {ach.unlocked ? <IconComponent className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{ach.title}</h4>
                          {ach.unlocked ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Achieved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                              Incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{ach.description}</p>
                        {ach.unlocked_at && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Achieved: {new Date(ach.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
