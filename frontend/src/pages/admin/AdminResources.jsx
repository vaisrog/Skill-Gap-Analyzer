import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { BookOpen, Plus, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminResources = () => {
  const { showToast } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await axios.get('/api/resources');
        setResources(res.data.resources || []);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Learning Resources Catalog</h1>
              <p className="text-xs text-slate-500 mt-1">
                Curated documentation, courses, and educational material linked to database skills.
              </p>
            </div>
            <button
              onClick={() => showToast('Resource creation form placeholder (Phase 1).', 'info')}
              className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium text-sm">Loading learning resources...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Resource Title</th>
                      <th className="px-4 py-3">Associated Skill</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3 text-right">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.title}</td>
                        <td className="px-4 py-3 font-medium text-blue-600">{r.skill_name || 'General'}</td>
                        <td className="px-4 py-3 text-slate-500">{r.platform || 'Web'}</td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                            {r.difficulty_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-bold"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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

