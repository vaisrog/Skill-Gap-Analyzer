import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Map,
  FileSearch,
  FileText,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';

const EVENT_ICON_MAP = {
  skill_added: Layers,
  skill_updated: Layers,
  roadmap_progress: Map,
  job_analyzed: FileSearch,
  resume_analyzed: FileText,
  achievement_unlocked: Award,
  career_selected: Sparkles,
};

export const ActivityCenterWidget = () => {
  const [activities, setActivities] = useState([]);
  const [progressHistory, setProgressHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actRes, histRes] = await Promise.allSettled([
        axios.get('/api/activity?limit=6'),
        axios.get('/api/progress/history'),
      ]);

      if (actRes.status === 'fulfilled') {
        setActivities(actRes.value.data.activities || []);
      }
      if (histRes.status === 'fulfilled') {
        setProgressHistory(histRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load activity center data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-36 bg-slate-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <p className="text-[11px] text-slate-500">Your logged learning actions</p>
          </div>
        </div>

        {progressHistory?.trend_insight && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <TrendingUp className="w-3 h-3" /> Upward Trend
          </span>
        )}
      </div>

      {/* Progress Insight Callout if available */}
      {progressHistory?.trend_insight && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wide text-[10px] text-blue-600 block">
              Progress Insight
            </span>
            <p className="font-medium text-slate-700 mt-0.5">{progressHistory.trend_insight}</p>
          </div>
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center italic">
            No activity logged yet. Add your skills or choose a career to start tracking.
          </p>
        ) : (
          activities.map((item) => {
            const IconComponent = EVENT_ICON_MAP[item.event_type] || CheckCircle2;
            const timeAgo = formatTimeAgo(item.created_at);
            return (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-slate-800 truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo}</span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
