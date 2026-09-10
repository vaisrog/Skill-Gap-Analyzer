import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
} from 'lucide-react';

export const AdminSkills = () => {
  const { showToast } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Programming');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/skills');
      setSkills(res.data.skills || []);
    } catch (err) {
      console.warn('Failed to load skills:', err);
      showToast('Failed to load skills.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Skill name is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/skills', { name, category, description });
      showToast('Skill created successfully!', 'success');
      setName('');
      setDescription('');
      setShowAddModal(false);
      await fetchSkills();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create skill.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`/api/skills/${id}`, {
        name: editName,
        category: editCategory,
        description: editDesc,
      });
      showToast('Skill updated.', 'success');
      setEditingId(null);
      await fetchSkills();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update skill.', 'error');
    }
  };

  const handleDelete = async (id, skillName) => {
    if (!window.confirm(`Are you sure you want to delete "${skillName}"?`)) return;

    try {
      await axios.delete(`/api/skills/${id}`);
      showToast('Skill deleted.', 'info');
      setSkills(skills.filter((s) => s.id !== id));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete skill.', 'error');
    }
  };

  const categories = ['All', ...new Set(skills.map((s) => s.category).filter(Boolean))];

  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
                <Wrench className="w-3.5 h-3.5" /> Technical Taxonomy
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Skills Catalog</h1>
              <p className="text-xs text-slate-500 mt-1">
                Maintain standard skills, categories, and descriptions.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
          </section>

          {/* Add Skill Modal */}
          {showAddModal && (
            <section className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Add New Technical Skill</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. GraphQL, Terraform"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Programming, DevOps, Cloud"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the skill and its applications..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Save Skill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Filter and search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills by name..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skills table */}
          {loading ? (
            <LoadingSpinner label="Loading skills catalog..." />
          ) : filteredSkills.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-xs text-slate-500">
              No skills found matching filter.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Skill</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5">Description</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSkills.map((s) => {
                      const isEditing = editingId === s.id;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-900 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs"
                              />
                            ) : (
                              s.name
                            )}
                          </td>
                          <td className="py-3.5 px-5 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs"
                              />
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                {s.category}
                              </span>
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
                              s.description || '—'
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right align-top whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdate(s.id)}
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
                                    setEditingId(s.id);
                                    setEditName(s.name);
                                    setEditCategory(s.category);
                                    setEditDesc(s.description || '');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit skill"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id, s.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Delete skill"
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
        </main>
      </div>

      <Footer />
    </div>
  );
};
