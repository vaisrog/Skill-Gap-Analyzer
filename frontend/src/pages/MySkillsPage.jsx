import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import {
  Search, Plus, Trash2, CheckCircle2, Layers,
  ChevronDown, Filter, X, Edit2, Save
} from 'lucide-react';

const PROFICIENCY_LABELS = ['No Knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
const PROFICIENCY_COLORS = [
  'bg-slate-100 text-slate-600',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700'
];

const ProficiencySelector = ({ value, onChange }) => (
  <div className="flex gap-1 flex-wrap">
    {PROFICIENCY_LABELS.map((label, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => onChange(idx)}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
          value === idx
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
        }`}
      >
        {idx} — {label}
      </button>
    ))}
  </div>
);

export const MySkillsPage = () => {
  const { showToast } = useAuth();

  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editingProficiency, setEditingProficiency] = useState(0);
  const [addingSkillId, setAddingSkillId] = useState(null);
  const [addingProficiency, setAddingProficiency] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        axios.get('/api/skills'),
        axios.get('/api/student-skills')
      ]);
      setAllSkills(allRes.data.skills || []);
      setMySkills(myRes.data.skills || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
      showToast('Failed to load skills from server.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const mySkillIds = new Set(mySkills.map(s => s.skill_id));

  const categories = ['All', ...Array.from(new Set(allSkills.map(s => s.category))).sort()];

  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSkill = async (skillId) => {
    setSaving(true);
    try {
      await axios.post('/api/student-skills', { skill_id: skillId, proficiency: addingProficiency });
      showToast('Skill added to your profile!', 'success');
      setAddingSkillId(null);
      setAddingProficiency(0);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add skill.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProficiency = async (entryId) => {
    setSaving(true);
    try {
      await axios.put(`/api/student-skills/${entryId}`, { proficiency: editingProficiency });
      showToast('Proficiency updated!', 'success');
      setEditingId(null);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (entryId, skillName) => {
    if (!window.confirm(`Remove "${skillName}" from your profile?`)) return;
    try {
      await axios.delete(`/api/student-skills/${entryId}`);
      showToast(`"${skillName}" removed.`, 'info');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove skill.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" /> My Skills
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Add skills from the catalog and set your current proficiency level (0–5).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {mySkills.length} skill{mySkills.length !== 1 ? 's' : ''} in your profile
            </div>
          </div>

          {/* My Skills Panel */}
          {mySkills.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Current Skills</h2>
              <div className="space-y-2">
                {mySkills.map(entry => (
                  <div key={entry.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{entry.skill_name}</span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          {entry.skill_category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId !== entry.id && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${PROFICIENCY_COLORS[entry.proficiency]}`}>
                            {entry.proficiency} — {PROFICIENCY_LABELS[entry.proficiency]}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            if (editingId === entry.id) { setEditingId(null); }
                            else { setEditingId(entry.id); setEditingProficiency(entry.proficiency); }
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit proficiency"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSkill(entry.id, entry.skill_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Proficiency bar */}
                    {editingId !== entry.id && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${(entry.proficiency / 5) * 100}%` }}
                        />
                      </div>
                    )}

                    {/* Edit Proficiency Inline */}
                    {editingId === entry.id && (
                      <div className="pt-2 space-y-2">
                        <ProficiencySelector value={editingProficiency} onChange={setEditingProficiency} />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateProficiency(entry.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Catalog Browser */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Browse & Add Skills</h2>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading skills catalog...</div>
            ) : filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No skills match your search.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredSkills.map(skill => {
                  const isAdded = mySkillIds.has(skill.id);
                  const isExpanded = addingSkillId === skill.id;

                  return (
                    <div
                      key={skill.id}
                      className={`border rounded-xl p-4 transition space-y-2 ${
                        isAdded
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{skill.name}</span>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {skill.category}
                            </span>
                            {isAdded && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Added
                              </span>
                            )}
                          </div>
                          {skill.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
                          )}
                        </div>

                        {!isAdded && (
                          <button
                            onClick={() => {
                              if (isExpanded) { setAddingSkillId(null); }
                              else { setAddingSkillId(skill.id); setAddingProficiency(0); }
                            }}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            {isExpanded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Cancel' : 'Add'}
                          </button>
                        )}
                      </div>

                      {/* Inline Add Proficiency Picker */}
                      {isExpanded && !isAdded && (
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Set Your Proficiency</p>
                          <ProficiencySelector value={addingProficiency} onChange={setAddingProficiency} />
                          <button
                            onClick={() => handleAddSkill(skill.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {saving ? 'Adding...' : 'Confirm Add'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
