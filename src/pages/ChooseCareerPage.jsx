import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Compass,
  Target,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

export const ChooseCareerPage = () => {
  const { showToast, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [careersRes, targetRes] = await Promise.all([
          axios.get('/api/careers'),
          axios.get('/api/users/target-career'),
        ]);
        setCareers(careersRes.data.careers || []);
        setCurrentTarget(targetRes.data.target_career || null);
      } catch (err) {
        console.warn('Failed to load careers:', err);
        showToast('Could not load career options.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleSelectTarget = async (careerId) => {
    setSelectingId(careerId);
    try {
      const res = await axios.put('/api/users/target-career', { career_id: careerId });
      setCurrentTarget(res.data.target_career);
      if (res.data.user) {
        updateUserProfile(res.data.user);
      }
      showToast(`Target career set to ${res.data.target_career.title}!`, 'success');
      navigate('/analysis');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to select target career.', 'error');
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Compass className="w-3.5 h-3.5 text-indigo-600" /> Career Discovery
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Select Target Career</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Choose your target career path to compute real-time skill gaps and generate a personalized learning roadmap.
            </p>
          </section>

          {currentTarget && (
            <section className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Current Active Target
                  </span>
                  <h2 className="text-lg font-extrabold text-white">{currentTarget.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/analysis"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                >
                  View Gap Analysis
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/careers/${currentTarget.id}`}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Details
                </Link>
              </div>
            </section>
          )}

          {loading ? (
            <LoadingSpinner label="Loading career roles..." />
          ) : (
            <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {careers.map((career) => {
                const isSelected = currentTarget?.id === career.id;
                const isSelecting = selectingId === career.id;

                return (
                  <div
                    key={career.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition flex flex-col justify-between ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base">{career.title}</h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {career.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Required Skills:</span>
                        <span className="font-bold text-slate-800">
                          {career.skills_count || career.requirements_count || 0} skills
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleSelectTarget(career.id)}
                        disabled={isSelecting || isSelected}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50'
                        }`}
                      >
                        {isSelected ? 'Active Target' : isSelecting ? 'Selecting...' : 'Select Target'}
                      </button>

                      <Link
                        to={`/careers/${career.id}`}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1"
                        title="View Career Details"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
