import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Search,
} from 'lucide-react';

export const AdminResources = () => {
  const { showToast } = useAuth();
  const [resources, setResources] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [skillId, setSkillId] = useState('');
  const [resourceType, setResourceType] = useState('Course');
  const [difficultyLevel, setDifficultyLevel] = useState('Beginner');
  const [platform, setPlatform] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, skillsRes] = await Promise.all([
        axios.get('/api/resources'),
        axios.get('/api/skills'),
      ]);
      setResources(resRes.data.resources || []);
      setSkills(skillsRes.data.skills || []);
    } catch (err) {
      console.warn('Failed to load learning resources:', err);
      showToast('Failed to load learning resources.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !skillId) {
      showToast('Title, URL, and Skill are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/resources', {
        title,
        url,
        skill_id: Number(skillId),
        resource_type: resourceType,
        difficulty_level: difficultyLevel,
        platform: platform || null,
      });
      showToast('Learning resource linked successfully!', 'success');
      setTitle('');
      setUrl('');
      setSkillId('');
      setPlatform('');
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, resourceTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${resourceTitle}"?`)) return;

    try {
      await axios.delete(`/api/resources/${id}`);
      showToast('Resource deleted.', 'info');
      setResources(resources.filter((r) => r.id !== id));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete resource.', 'error');
    }
  };

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.skill_name && r.skill_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.platform && r.platform.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
                <BookOpen className="w-3.5 h-3.5" /> Curated Education
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Learning Resources</h1>
              <p className="text-xs text-slate-500 mt-1">
                Attach vetted documentation, courses, and interactive tutorials to skill milestones.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          </section>

          {/* Add Modal */}
          {showAddModal && (
            <section className="bg-indigo-50/40 border border-indigo-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Add Learning Resource</h3>
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
                      Resource Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Complete Node.js Developer Course"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Associated Skill
                    </label>
                    <select
                      required
                      value={skillId}
                      onChange={(e) => setSkillId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select target skill --</option>
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Resource URL
                    </label>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Type
                    </label>
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Course">Course</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Book">Book</option>
                      <option value="Tutorial">Tutorial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Platform
                    </label>
                    <input
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      placeholder="e.g. Coursera, MDN, Udemy"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Linking...' : 'Save Resource'}
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

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources by title, skill, or platform..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          {loading ? (
            <LoadingSpinner label="Loading resources..." />
          ) : filtered.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-xs text-slate-500">
              No learning resources found.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Title</th>
                      <th className="py-3 px-5">Skill</th>
                      <th className="py-3 px-5">Type / Platform</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-blue-600 transition"
                          >
                            {item.title}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {item.skill_name || `Skill #${item.skill_id}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">
                          {item.resource_type} {item.platform ? `· ${item.platform}` : ''}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
