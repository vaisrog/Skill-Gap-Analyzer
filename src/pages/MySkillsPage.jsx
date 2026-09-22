import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  BookOpen,
  Sparkles,
} from 'lucide-react';

const PROFICIENCY_OPTIONS = [
  { level: 1, label: 'Beginner (1/5)', desc: 'Basic conceptual awareness' },
  { level: 2, label: 'Elementary (2/5)', desc: 'Basic practical applications' },
  { level: 3, label: 'Intermediate (3/5)', desc: 'Working competency' },
  { level: 4, label: 'Advanced (4/5)', desc: 'Deep knowledge & problem solving' },
  { level: 5, label: 'Expert (5/5)', desc: 'Mastery & production architecture' },
];

export const MySkillsPage = () => {
  const { showToast } = useAuth();
  const [studentSkills, setStudentSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Add skill form state
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState(3);
  const [addingSkill, setAddingSkill] = useState(false);

  // Edit skill inline
  const [editingId, setEditingId] = useState(null);
  const [editingProficiency, setEditingProficiency] = useState(3);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, allSkillsRes] = await Promise.all([
        axios.get('/api/student-skills'),
        axios.get('/api/skills'),
      ]);
      setStudentSkills(skillsRes.data.skills || []);
      setAllSkills(allSkillsRes.data.skills || []);
    } catch (err) {
      console.warn('Failed to load skills:', err);
      showToast('Could not load skills list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      showToast('Please select a skill to add.', 'error');
      return;
    }

    setAddingSkill(true);
    try {
      await axios.post('/api/student-skills', {
        skill_id: Number(selectedSkillId),
        proficiency: Number(selectedProficiency),
      });
      showToast('Skill added successfully!', 'success');
      setSelectedSkillId('');
      setSelectedProficiency(3);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add skill.', 'error');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleUpdateProficiency = async (id) => {
    try {
      await axios.put(`/api/student-skills/${id}`, {
        proficiency: Number(editingProficiency),
      });
      showToast('Proficiency updated.', 'success');
      setEditingId(null);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update skill.', 'error');
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) return;

    try {
      await axios.delete(`/api/student-skills/${id}`);
      showToast('Skill removed.', 'info');
      setStudentSkills(studentSkills.filter((s) => s.id !== id));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove skill.', 'error');
    }
  };

  // Filter skills not yet added by student for the dropdown
  const existingSkillIds = new Set(studentSkills.map((s) => s.skill_id));
  const availableToAdd = allSkills.filter((s) => !existingSkillIds.has(s.id));

  // Extract categories for filter
  const categories = ['All', ...new Set(allSkills.map((s) => s.category).filter(Boolean))];

  const filteredStudentSkills = studentSkills.filter((s) => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.skill_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Self-Assessment
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">My Skills Inventory</h1>
              <p className="text-xs text-slate-500 mt-1">
                Log and update your current proficiency levels (1–5). These form the basis of your gap analysis.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
              <span className="text-xs text-slate-500 font-medium">Total Skills Logged</span>
              <p className="text-xl font-extrabold text-slate-900">{studentSkills.length}</p>
            </div>
          </section>

          {/* Add New Skill Form Card */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Skill to Your Profile
            </h2>

            {availableToAdd.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                You have already assessed all cataloged skills. Great job!
              </p>
            ) : (
              <form onSubmit={handleAddSkill} className="grid sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Skill
                  </label>
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="">-- Choose a skill --</option>
                    {availableToAdd.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Proficiency Level
                  </label>
                  <select
                    value={selectedProficiency}
                    onChange={(e) => setSelectedProficiency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    {PROFICIENCY_OPTIONS.map((opt) => (
                      <option key={opt.level} value={opt.level}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={addingSkill || !selectedSkillId}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingSkill ? 'Adding...' : 'Add Skill'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Filter Bar */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your skills..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Skills List Table / Cards */}
          {loading ? (
            <LoadingSpinner label="Loading your skills..." />
          ) : filteredStudentSkills.length === 0 ? (
            <section className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No skills found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {studentSkills.length === 0
                  ? 'Use the form above to add your first self-assessed skill.'
                  : 'No skills match your current search or category filter.'}
              </p>
            </section>
          ) : (
            <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-5">Skill Name</th>
                      <th className="py-3.5 px-5">Category</th>
                      <th className="py-3.5 px-5">Proficiency</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudentSkills.map((item) => {
                      const isEditing = editingId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {item.skill_name}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {item.skill_category}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={editingProficiency}
                                  onChange={(e) => setEditingProficiency(e.target.value)}
                                  className="px-2 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-semibold focus:outline-none"
                                >
                                  {PROFICIENCY_OPTIONS.map((opt) => (
                                    <option key={opt.level} value={opt.level}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUpdateProficiency(item.id)}
                                  className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                  Level {item.proficiency} / 5
                                </span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <div
                                      key={star}
                                      className={`w-2 h-2 rounded-full ${
                                        star <= item.proficiency ? 'bg-blue-600' : 'bg-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {!isEditing && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditingProficiency(item.proficiency);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit proficiency"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSkill(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Remove skill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
