import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  GitBranch,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AdminPrerequisites = () => {
  const { showToast } = useAuth();
  const [prerequisites, setPrerequisites] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [targetSkillId, setTargetSkillId] = useState('');
  const [prereqSkillId, setPrereqSkillId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prereqsRes, skillsRes] = await Promise.all([
        axios.get('/api/admin/prerequisites'),
        axios.get('/api/skills'),
      ]);
      setPrerequisites(prereqsRes.data.prerequisites || []);
      setSkills(skillsRes.data.skills || []);
    } catch (err) {
      console.warn('Failed to load prerequisites:', err);
      showToast('Failed to load prerequisite relationships.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!targetSkillId || !prereqSkillId) {
      setError('Please select both a target skill and its prerequisite skill.');
      return;
    }

    if (Number(targetSkillId) === Number(prereqSkillId)) {
      setError('A skill cannot be a prerequisite of itself.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/admin/prerequisites', {
        skill_id: Number(targetSkillId),
        prerequisite_skill_id: Number(prereqSkillId),
      });
      showToast('Prerequisite relationship established!', 'success');
      setTargetSkillId('');
      setPrereqSkillId('');
      await fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create prerequisite.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, targetName, prereqName) => {
    if (!window.confirm(`Delete rule that "${prereqName}" is required before "${targetName}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/prerequisites/${id}`);
      showToast('Prerequisite relationship removed.', 'info');
      setPrerequisites((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove relationship.', 'error');
    }
  };

  const filteredPrereqs = prerequisites.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.target_skill_name && p.target_skill_name.toLowerCase().includes(q)) ||
      (p.prerequisite_skill_name && p.prerequisite_skill_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 mb-2">
              <GitBranch className="w-3.5 h-3.5" /> Dependency Graph Architecture
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Skill Prerequisites & Sequences</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Define which foundational skills must be mastered before progressing to advanced topics. The system uses these dependencies to construct logically ordered roadmap milestones and enforces cycle prevention algorithms.
            </p>
          </section>

          {/* Create Form Card */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" /> Create Prerequisite Relationship
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  1. Prerequisite Skill (Must learn first)
                </label>
                <select
                  value={prereqSkillId}
                  onChange={(e) => setPrereqSkillId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">-- Choose foundational skill --</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  2. Target Advanced Skill (Requires foundation)
                </label>
                <select
                  value={targetSkillId}
                  onChange={(e) => setTargetSkillId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">-- Choose advanced target skill --</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  disabled={submitting || !prereqSkillId || !targetSkillId}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? 'Validating...' : 'Link Prerequisite'}
                </button>
              </div>
            </form>
          </section>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dependencies by skill name..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Prerequisites Table */}
          {loading ? (
            <LoadingSpinner label="Loading skill dependency graph..." />
          ) : filteredPrereqs.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-xs text-slate-500">
              No prerequisite relationships found.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Prerequisite (Foundational)</th>
                      <th className="py-3 px-5 text-center">Direction</th>
                      <th className="py-3 px-5">Target (Advanced Skill)</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPrereqs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                            {item.prerequisite_skill_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-center text-slate-400">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            required before <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                          </span>
                        </td>

                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                            {item.target_skill_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id,
                                item.target_skill_name,
                                item.prerequisite_skill_name
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove prerequisite relationship"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
export default AdminPrerequisites;
