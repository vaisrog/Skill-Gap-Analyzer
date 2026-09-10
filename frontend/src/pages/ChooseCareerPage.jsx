import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const ChooseCareerPage = () => {
  const { user, updateUserProfile, showToast } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const loadCareers = useCallback(async () => {
    try {
      const response = await axios.get('/api/careers');
      setCareers(response.data.career_roles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Career roles could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCareers(); }, [loadCareers]);

  const selectCareer = async (career) => {
    setSavingId(career.id);
    try {
      const response = await axios.put('/api/users/target-career', { career_id: career.id });
      updateUserProfile(response.data.user);
      showToast(`${career.title} saved as your target career.`, 'success');
      navigate(`/careers/${career.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to save your target career.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><Target className="w-6 h-6 text-blue-600" /> Choose Career</h1>
            <p className="text-sm text-slate-500 mt-1">Select the role you want to prepare for. You can change it anytime.</p>
          </div>

          {user?.target_career_title && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div><p className="font-bold text-sm">Current target: {user.target_career_title}</p><p className="text-xs text-emerald-800 mt-0.5">Choosing another card replaces this saved selection.</p></div>
            </div>
          )}

          {loading ? <LoadingSpinner label="Loading career roles..." /> : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800">{error}</div>
          ) : careers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">No career roles are available yet.</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {careers.map((career) => {
                const selected = user?.target_career_id === career.id;
                return <article key={career.id} className={`bg-white rounded-2xl border p-5 space-y-4 ${selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                  <div className="flex justify-between gap-4">
                    <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Briefcase className="w-5 h-5" /></div><div><h2 className="font-bold text-slate-900">{career.title}</h2><span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{career.category || 'Career Track'}</span></div></div>
                    {selected && <span className="text-xs font-bold text-blue-700">Selected</span>}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{career.description}</p>
                  <p className="text-xs font-semibold text-slate-500">Required Skills: <span className="text-slate-900">{career.skills_count}</span></p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => navigate(`/careers/${career.id}`)} className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">View requirements</button>
                    <button onClick={() => selectCareer(career)} disabled={savingId !== null} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition">{savingId === career.id ? 'Saving...' : selected ? 'Keep selected' : 'Select career'} <ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </article>;
              })}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};
