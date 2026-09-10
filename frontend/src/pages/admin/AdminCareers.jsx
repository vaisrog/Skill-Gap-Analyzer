import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { Briefcase, Plus, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminCareers = () => {
  const { showToast } = useAuth();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCareers = async () => {
    try {
      const res = await axios.get('/api/careers');
      setCareers(res.data.career_roles || []);
    } catch (err) {
      console.error('Failed to fetch careers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const filteredCareers = careers.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Career Roles Management</h1>
              <p className="text-xs text-slate-500 mt-1">
                View seeded career roles and associated skill proficiency benchmarks.
              </p>
            </div>
            <button
              onClick={() => showToast('Career addition form placeholder (Phase 1).', 'info')}
              className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Career Role</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search career roles..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Careers Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium text-sm">Loading career roles...</div>
          ) : filteredCareers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              No career roles found matching search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCareers.map((role) => (
                <div key={role.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{role.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{role.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      ID: #{role.id}
                    </span>
                  </div>

                  {/* Required Skills list */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Required Skills ({role.required_skills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {role.required_skills?.map((sk) => (
                        <div
                          key={sk.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex items-center space-x-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-800">{sk.skill_name}</span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                            {sk.required_proficiency}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

