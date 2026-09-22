import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Layers,
  ChevronRight,
  Target,
  Zap,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const CareerComparisonPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [allCareers, setAllCareers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadCareers();
  }, []);

  const loadCareers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/careers');
      const list = res.data.careers || [];
      setAllCareers(list);

      // Default selection: user's target career + 1 or 2 others
      if (list.length >= 2) {
        const targetId = user?.target_career_id;
        const initial = targetId ? [targetId] : [list[0].id];
        const second = list.find((c) => c.id !== initial[0]);
        if (second) initial.push(second.id);
        setSelectedIds(initial);
        fetchComparison(initial);
      }
    } catch (err) {
      setError('Failed to load career listings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async (ids) => {
    if (ids.length < 2) {
      setError('Please select at least 2 careers to compare.');
      return;
    }
    setComparing(true);
    setError('');
    try {
      const res = await axios.get(`/api/careers/compare?ids=${ids.join(',')}`);
      setComparisonData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare careers.');
    } finally {
      setComparing(false);
    }
  };

  const toggleCareer = (id) => {
    let updated;
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        setError('You must keep at least 2 careers selected for comparison.');
        return;
      }
      updated = selectedIds.filter((cid) => cid !== id);
    } else {
      if (selectedIds.length >= 4) {
        setError('You can compare a maximum of 4 careers at once.');
        return;
      }
      updated = [...selectedIds, id];
    }
    setSelectedIds(updated);
    fetchComparison(updated);
  };

  const handleSetTargetCareer = async (careerId, title) => {
    try {
      const res = await axios.put('/api/users/profile', { target_career_id: careerId });
      updateUserProfile(res.data.user);
      setSuccessMsg(`Target career successfully updated to ${title}!`);
      // Refresh comparison
      fetchComparison(selectedIds);
    } catch (err) {
      setError('Failed to update target career.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 text-white shadow-xs">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
              <Scale className="w-3.5 h-3.5" /> Career Insights • Phase 6
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Career Pathway Comparison</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Compare multiple career trajectories side-by-side, evaluate your readiness for each, and identify
              high-leverage transferable skills that empower pivot agility.
            </p>
          </section>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Career Selector Pills */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Careers to Compare (2 to 4 paths)
              </h2>
              <span className="text-xs font-semibold text-indigo-600">
                {selectedIds.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allCareers.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const isTarget = user?.target_career_id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCareer(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c.title}</span>
                    {isTarget && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-900 font-extrabold">
                        Target
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Side-by-Side Comparison Table */}
          {comparisonData && (
            <section className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs overflow-hidden">
              <h3 className="text-base font-extrabold text-slate-900">
                Comparative Readiness & Workload Breakdown
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider w-1/4">
                        Metric / Attribute
                      </th>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `career-${idx}`;
                        const careerTitle = career.title || career.career_title || `Career #${idx + 1}`;
                        const isTarget = user?.target_career_id === careerId;

                        return (
                          <th key={careerId} className="py-3 px-4 font-extrabold text-slate-900 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black">{careerTitle}</span>
                              {isTarget ? (
                                <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                  Current Target
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSetTargetCareer(careerId, careerTitle)}
                                  className="mt-1 text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  Set as Target
                                </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700">Readiness Score</td>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `readiness-${idx}`;
                        const readinessPct = career.readiness_percentage ?? career.match_readiness_percentage ?? 0;
                        return (
                          <td key={careerId} className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xl font-black text-blue-600">{readinessPct}%</span>
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${readinessPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700">Satisfied Skills</td>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `satisfied-${idx}`;
                        const satisfiedCount = career.satisfied_skills_count ?? (career.skills?.filter((s) => s.is_satisfied)?.length ?? 0);
                        const totalCount = career.total_skills_count ?? career.required_skills_count ?? (career.skills?.length ?? 0);
                        return (
                          <td key={careerId} className="py-3 px-4 text-center font-bold text-emerald-700">
                            {satisfiedCount} / {totalCount}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700">Major Skill Gaps</td>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `gaps-${idx}`;
                        return (
                          <td key={careerId} className="py-3 px-4 text-center font-bold text-amber-700">
                            {career.major_gaps_count ?? 0}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700">Completely Missing Skills</td>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `missing-${idx}`;
                        return (
                          <td key={careerId} className="py-3 px-4 text-center font-bold text-rose-700">
                            {career.missing_skills_count ?? 0}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700">Estimated Roadmap Workload</td>
                      {(comparisonData.careers || []).map((career, idx) => {
                        const careerId = career.id || career.career_id || `workload-${idx}`;
                        const effort = career.roadmap_estimated_effort || (career.estimated_workload_weeks != null ? `${career.estimated_workload_weeks} weeks` : '—');
                        return (
                          <td key={careerId} className="py-3 px-4 text-center font-semibold text-slate-600">
                            {effort}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Transferable Skills Section */}
          {comparisonData && (comparisonData.transferable_skills || []).length > 0 && (
            <section className="bg-white border-2 border-indigo-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">High-Leverage Transferable Skills</h3>
                  <p className="text-xs text-slate-500">
                    These skills are required across multiple of your selected careers. Mastering them provides maximum career leverage.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(comparisonData.transferable_skills || []).map((ts, idx) => {
                  const careerTitles = ts.shared_careers || ts.career_titles || [];
                  const sharedCount = ts.shared_in_career_count || ts.careers_count || careerTitles.length;
                  const skillId = ts.skill_id || `ts-${idx}`;
                  const maxReq = ts.max_required_proficiency || 5;
                  const studentProf = ts.student_proficiency || 0;

                  return (
                    <div
                      key={skillId}
                      className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{ts.skill_name}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            Shared in {sharedCount} Career Paths
                          </span>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                            studentProf >= maxReq
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {studentProf} / {maxReq}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        Required across: <strong className="text-slate-700">{careerTitles.length > 0 ? careerTitles.join(', ') : 'Selected careers'}</strong>
                      </p>

                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full"
                          style={{ width: `${Math.min(100, (studentProf / (maxReq || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};
