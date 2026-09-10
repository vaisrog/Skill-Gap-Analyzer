import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  ArrowLeft,
  Briefcase,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
} from 'lucide-react';

export const CareerDetailsPage = () => {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const { showToast, updateUserProfile } = useAuth();

  const [career, setCareer] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [careerRes, reqRes, targetRes] = await Promise.all([
          axios.get(`/api/careers/${careerId}`),
          axios.get(`/api/careers/${careerId}/requirements`),
          axios.get('/api/users/target-career'),
        ]);
        setCareer(careerRes.data.career);
        setRequirements(reqRes.data.requirements || []);
        setCurrentTarget(targetRes.data.target_career || null);
      } catch (err) {
        console.warn('Failed to load career details:', err);
        showToast('Could not load career requirements.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [careerId, showToast]);

  const handleSelectTarget = async () => {
    setSelecting(true);
    try {
      const res = await axios.put('/api/users/target-career', { career_id: Number(careerId) });
      setCurrentTarget(res.data.target_career);
      if (res.data.user) {
        updateUserProfile(res.data.user);
      }
      showToast(`${career.title} selected as your active target!`, 'success');
      navigate('/analysis');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to select target career.', 'error');
    } finally {
      setSelecting(false);
    }
  };

  const isSelected = currentTarget?.id === Number(careerId);

  const importanceBadges = {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
    Important: 'bg-amber-50 text-amber-700 border-amber-200',
    Optional: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <Link
            to="/choose-career"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Career Catalog
          </Link>

          {loading ? (
            <LoadingSpinner label="Loading career profile..." />
          ) : !career ? (
            <div className="bg-white p-8 rounded-2xl border text-center">
              <p className="text-sm font-bold text-slate-800">Career not found.</p>
            </div>
          ) : (
            <>
              {/* Career Banner */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-slate-900">{career.title}</h1>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Target
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {career.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-center">
                  <button
                    onClick={handleSelectTarget}
                    disabled={selecting || isSelected}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl transition shadow-sm ${
                      isSelected
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {isSelected ? 'Active Target Role' : selecting ? 'Selecting...' : 'Set as Target Career'}
                  </button>

                  {isSelected && (
                    <Link
                      to="/analysis"
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      View Gap
                    </Link>
                  )}
                </div>
              </section>

              {/* Requirements List */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Required Skills & Proficiencies</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Benchmark technical skills evaluated for this role.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {requirements.length} Requirements
                  </span>
                </div>

                {requirements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    No specific skill requirements registered for this career role yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Skill</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Importance</th>
                          <th className="py-3 px-4">Required Proficiency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {requirements.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {req.skill_name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {req.skill_category}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                                  importanceBadges[req.importance] || importanceBadges.Optional
                                }`}
                              >
                                {req.importance}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800">
                                Level {req.required_proficiency} / 5
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
