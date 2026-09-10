import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

const levels = ['No Knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export const CareerDetailsPage = () => {
  const { careerId } = useParams();
  const { user, updateUserProfile, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRequirements = useCallback(async () => {
    try {
      const response = await axios.get(`/api/careers/${careerId}/requirements`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Career requirements could not be loaded.');
    } finally { setLoading(false); }
  }, [careerId]);

  useEffect(() => { loadRequirements(); }, [loadRequirements]);

  const selectCareer = async () => {
    setSaving(true);
    try {
      const response = await axios.put('/api/users/target-career', { career_id: Number(careerId) });
      updateUserProfile(response.data.user);
      showToast('Target career saved.', 'success');
    } catch (err) { showToast(err.response?.data?.error || 'Unable to save target career.', 'error'); }
    finally { setSaving(false); }
  };

  return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><div className="flex-1 flex max-w-7xl w-full mx-auto"><Sidebar /><main className="flex-1 p-6 space-y-6 overflow-y-auto">
    <Link to="/choose-career" className="text-xs font-semibold text-blue-600 hover:underline">← All career roles</Link>
    {loading ? <LoadingSpinner label="Loading career requirements..." /> : error ? <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800">{error}</div> : data && <>
      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 sm:items-start"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Target className="w-6 h-6" /></div><div className="flex-1"><span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{data.career_role.category || 'Career Track'}</span><h1 className="text-2xl font-extrabold text-slate-900 mt-2">{data.career_role.title}</h1><p className="text-sm text-slate-600 mt-2 leading-relaxed">{data.career_role.description}</p></div><button onClick={selectCareer} disabled={saving || user?.target_career_id === Number(careerId)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition">{user?.target_career_id === Number(careerId) ? 'Selected career' : saving ? 'Saving...' : 'Select career'}</button></section>
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="p-5 border-b border-slate-200"><h2 className="font-bold text-slate-900">Career requirements</h2><p className="text-xs text-slate-500 mt-1">Use the analysis page to compare these requirements with your saved skills.</p></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Skill</th><th className="px-5 py-3">Required level</th><th className="px-5 py-3">Importance</th></tr></thead><tbody className="divide-y divide-slate-100">{data.requirements.map((item) => <tr key={item.id}><td className="px-5 py-3.5 font-semibold text-slate-800"><span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />{item.skill_name}</span><span className="block ml-6 text-xs font-normal text-slate-500 mt-0.5">{item.skill_category}</span></td><td className="px-5 py-3.5"><span className="font-semibold text-slate-800">{levels[item.required_proficiency]}</span><span className="text-xs text-slate-500"> ({item.required_proficiency}/5)</span></td><td className="px-5 py-3.5"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.is_core ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{item.is_core ? 'Critical' : 'Important'}</span></td></tr>)}</tbody></table></div></section>
    </>}
  </main></div><Footer /></div>;
};
