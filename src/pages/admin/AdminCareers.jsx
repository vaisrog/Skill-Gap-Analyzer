import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Wrench,
  Sliders,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const AdminCareers = () => {
  const { showToast } = useAuth();
  const [careers, setCareers] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add career modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit career inline
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Requirements Manager Drawer/Modal
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [careerSkills, setCareerSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [newSkillId, setNewSkillId] = useState('');
  const [newProficiency, setNewProficiency] = useState(3);
  const [newImportance, setNewImportance] = useState('Critical');
  const [addingSkill, setAddingSkill] = useState(false);

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    try {
      const [careersRes, skillsRes] = await Promise.all([
        axios.get('/api/careers'),
        axios.get('/api/skills'),
      ]);
      setCareers(careersRes.data.careers || []);
      setAllSkills(skillsRes.data.skills || []);
    } catch (err) {
      console.warn('Failed to load career roles:', err);
      showToast('Failed to load career roles.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/careers', { title, description });
      showToast('Career role created successfully!', 'success');
      setTitle('');
      setDescription('');
      setShowAddModal(false);
      await fetchCareers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create career.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`/api/careers/${id}`, {
        title: editTitle,
        description: editDesc,
      });
      showToast('Career role updated.', 'success');
      setEditingId(null);
      await fetchCareers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update career.', 'error');
    }
  };

  const handleDelete = async (id, roleTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${roleTitle}"?`)) return;

    try {
      await axios.delete(`/api/careers/${id}`);
      showToast('Career role deleted.', 'info');
      setCareers(careers.filter((c) => c.id !== id));
      if (selectedCareer?.id === id) {
        setSelectedCareer(null);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete career.', 'error');
    }
  };

  // Open requirements panel
  const handleOpenRequirements = async (career) => {
    setSelectedCareer(career);
    setLoadingSkills(true);
    setNewSkillId('');
    setNewProficiency(3);
    setNewImportance('Critical');
    try {
      const res = await axios.get(`/api/admin/careers/${career.id}/skills`);
      setCareerSkills(res.data.requirements || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load requirements.', 'error');
    } finally {
      setLoadingSkills(false);
    }
  };

  // Add required skill
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!newSkillId) {
      showToast('Please select a skill to require.', 'error');
      return;
    }

    setAddingSkill(true);
    try {
      const res = await axios.post(`/api/admin/careers/${selectedCareer.id}/skills`, {
        skill_id: Number(newSkillId),
        required_proficiency: Number(newProficiency),
        importance: newImportance,
        is_core: newImportance === 'Critical',
      });
      showToast('Skill requirement added to career!', 'success');
      setCareerSkills((prev) => [...prev, res.data.requirement]);
      setNewSkillId('');
      setNewProficiency(3);
      setNewImportance('Critical');
      await fetchCareers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add requirement.', 'error');
    } finally {
      setAddingSkill(false);
    }
  };

  // Update requirement inline
  const handleUpdateRequirement = async (roleSkillId, updatedFields) => {
    try {
      const res = await axios.put(
        `/api/admin/careers/${selectedCareer.id}/skills/${roleSkillId}`,
        updatedFields
      );
      showToast('Requirement updated.', 'success');
      setCareerSkills((prev) =>
        prev.map((item) => (item.id === roleSkillId ? res.data.requirement : item))
      );
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update requirement.', 'error');
    }
  };

  // Remove required skill
  const handleDeleteRequirement = async (roleSkillId) => {
    try {
      await axios.delete(`/api/admin/careers/${selectedCareer.id}/skills/${roleSkillId}`);
      showToast('Skill requirement removed.', 'info');
      setCareerSkills((prev) => prev.filter((item) => item.id !== roleSkillId));
      await fetchCareers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove requirement.', 'error');
    }
  };

  const filteredCareers = careers.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Available skills not yet attached to selected career
  const existingSkillIds = new Set(careerSkills.map((cs) => cs.skill_id));
  const availableSkillsToAdd = allSkills.filter((s) => !existingSkillIds.has(s.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                <Briefcase className="w-3.5 h-3.5" /> Career Role Taxonomy
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Career Roles & Benchmarks</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Define target industry technical roles and configure their benchmark skill requirements, required proficiencies, and importance levels.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Career Role
            </button>
          </section>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search careers by title or description..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List of Careers */}
          {loading ? (
            <LoadingSpinner label="Loading career roles..." />
          ) : filteredCareers.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-xs text-slate-500">
              No career roles found.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Role Title</th>
                      <th className="py-3 px-5">Description</th>
                      <th className="py-3 px-5">Requirements</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCareers.map((career) => {
                      const isEditing = editingId === career.id;

                      return (
                        <tr key={career.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-900 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs"
                              />
                            ) : (
                              career.title
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 align-top max-w-md">
                            {isEditing ? (
                              <textarea
                                rows={2}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs"
                              />
                            ) : (
                              career.description
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-semibold align-top whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenRequirements(career)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>{career.skills_count || 0} skills</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-right align-top whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdate(career.id)}
                                  className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingId(career.id);
                                    setEditTitle(career.title);
                                    setEditDesc(career.description);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit role"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(career.id, career.title)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete role"
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
            </div>
          )}

          {/* Add Career Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Add New Career Role</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. AI Prompt Engineer"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the responsibilities and scope of this career role..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Career Skill Requirements Modal / Panel */}
          {selectedCareer && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Benchmark Configuration
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">
                      {selectedCareer.title} — Required Skills
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure the benchmark skill levels and importance weights needed for this role.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Add requirement inline form */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Benchmark Requirement
                    </h4>
                    <form onSubmit={handleAddRequirement} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Select Master Skill
                        </label>
                        <select
                          value={newSkillId}
                          onChange={(e) => setNewSkillId(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">-- Choose a skill --</option>
                          {availableSkillsToAdd.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Required Level (1-5)
                        </label>
                        <select
                          value={newProficiency}
                          onChange={(e) => setNewProficiency(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={1}>1 - Beginner</option>
                          <option value={2}>2 - Novice</option>
                          <option value={3}>3 - Intermediate</option>
                          <option value={4}>4 - Advanced</option>
                          <option value={5}>5 - Expert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Importance
                        </label>
                        <select
                          value={newImportance}
                          onChange={(e) => setNewImportance(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Critical">Critical (Core)</option>
                          <option value="Important">Important</option>
                          <option value="Optional">Optional</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={addingSkill || !newSkillId}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {addingSkill ? 'Adding...' : 'Attach Requirement'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Requirements List Table */}
                  {loadingSkills ? (
                    <LoadingSpinner label="Loading requirements..." />
                  ) : careerSkills.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No skill requirements currently attached to this role.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-4">Skill & Category</th>
                            <th className="py-2.5 px-4 text-center">Required Level</th>
                            <th className="py-2.5 px-4">Importance</th>
                            <th className="py-2.5 px-4 text-right">Remove</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {careerSkills.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900">{req.skill_name}</span>
                                <span className="block text-[10px] text-slate-400">{req.skill_category}</span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <select
                                  value={req.required_proficiency}
                                  onChange={(e) =>
                                    handleUpdateRequirement(req.id, {
                                      required_proficiency: Number(e.target.value),
                                    })
                                  }
                                  className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-bold text-slate-800"
                                >
                                  <option value={1}>Level 1 (Beginner)</option>
                                  <option value={2}>Level 2 (Novice)</option>
                                  <option value={3}>Level 3 (Intermediate)</option>
                                  <option value={4}>Level 4 (Advanced)</option>
                                  <option value={5}>Level 5 (Expert)</option>
                                </select>
                              </td>

                              <td className="py-3 px-4">
                                <select
                                  value={req.importance || (req.is_core ? 'Critical' : 'Important')}
                                  onChange={(e) =>
                                    handleUpdateRequirement(req.id, {
                                      importance: e.target.value,
                                      is_core: e.target.value === 'Critical',
                                    })
                                  }
                                  className={`px-2 py-1 text-[11px] font-bold rounded-full border ${
                                    req.importance === 'Critical'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : req.importance === 'Optional'
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  <option value="Critical">Critical</option>
                                  <option value="Important">Important</option>
                                  <option value="Optional">Optional</option>
                                </select>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequirement(req.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Remove benchmark requirement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCareer(null)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
export default AdminCareers;
