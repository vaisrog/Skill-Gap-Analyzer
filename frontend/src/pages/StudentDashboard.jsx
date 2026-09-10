import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BarChart3, Briefcase, ChevronRight, GraduationCap, Layers, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

const proficiencyLabels = ['No Knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export const StudentDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState({ total_skills: 0 });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const [profileResponse, skillsResponse, summaryResponse] = await Promise.all([
        axios.get('/api/users/profile'), axios.get('/api/student-skills'), axios.get('/api/student-skills/summary')
      ]);
      updateUserProfile(profileResponse.data.user);
      setSkills(skillsResponse.data.skills || []);
      setSummary(summaryResponse.data || { total_skills: 0 });
      if (profileResponse.data.user.target_career_id) {
        try {
          const analysisResponse = await axios.get('/api/analysis');
          setAnalysis(analysisResponse.data.analysis);
        } catch {
          setAnalysis(null);
        }
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Your dashboard data could not be loaded.');
    } finally { setLoading(false); }
  }, [updateUserProfile]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const completedFields = [user?.full_name, user?.email, user?.qualification, user?.graduation_year, user?.career_interest, user?.target_career_id].filter(Boolean).length;
  const completion = Math.round((completedFields / 6) * 100);

  return <div className="min-h-screen flex flex-col bg-slate-50"><Navbar /><div className="flex-1 flex max-w-7xl w-full mx-auto"><Sidebar /><main className="flex-1 p-6 space-y-6 overflow-y-auto">
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md"><div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200"><Sparkles className="w-3.5 h-3.5" /> Student workspace</div><h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Welcome, {user?.full_name}!</h1><p className="text-sm text-slate-300 mt-2 max-w-2xl">Build your profile, track your skills, and choose the career path you want to prepare for.</p></section>
    {loading ? <LoadingSpinner label="Loading your dashboard..." /> : error ? <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800">{error}</div> : <>
      <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Target className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Target Career</p><p className="font-bold text-slate-900 mt-0.5">{user?.target_career_title || 'Not selected'}</p></div></div><Link to="/choose-career" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">{user?.target_career_title ? 'Change career' : 'Choose a career'} <ChevronRight className="w-3.5 h-3.5" /></Link></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Career Readiness</p><p className="font-bold text-slate-900 mt-0.5">{analysis ? `${analysis.readiness_score}%` : '—'}</p></div></div><p className="mt-4 text-xs text-slate-500">{analysis?.readiness_classification || 'Select a career to begin analysis.'}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Layers className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Skills</p><p className="font-bold text-slate-900 mt-0.5">{analysis ? `${analysis.summary.skills_satisfied} / ${analysis.summary.total_required_skills}` : `${summary.total_skills} added`}</p></div></div><p className="mt-4 text-xs text-slate-500">{analysis ? 'career requirements satisfied' : 'Add skills to improve accuracy.'}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Briefcase className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Top Skill Gap</p><p className="font-bold text-slate-900 mt-0.5">{analysis?.recommended_next_skill?.skill_name || '—'}</p></div></div><p className="mt-4 text-xs text-slate-500">{analysis?.recommended_next_skill ? `${analysis.recommended_next_skill.status} · ${analysis.recommended_next_skill.importance}` : 'No analysis available yet.'}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Profile Completion</p><p className="font-bold text-slate-900 mt-0.5">{completion}% complete</p></div></div><div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${completion}%` }} /></div><Link to="/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">Complete profile <ChevronRight className="w-3.5 h-3.5" /></Link></div>
      </section>
      <section className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5"><div className="flex justify-between items-center"><div><h2 className="font-bold text-slate-900">Skill Summary</h2><p className="text-xs text-slate-500 mt-1">Your latest self-assessed proficiency levels.</p></div><Link to="/my-skills" className="text-xs font-semibold text-blue-600 hover:underline">Manage skills</Link></div>{skills.length === 0 ? <div className="text-center py-10"><Layers className="mx-auto w-7 h-7 text-slate-300" /><p className="text-sm text-slate-500 mt-2">No skills added yet.</p><Link to="/my-skills" className="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline">Add your first skill</Link></div> : <div className="mt-4 divide-y divide-slate-100">{skills.slice(0, 5).map((skill) => <div key={skill.id} className="flex justify-between items-center py-3"><div><p className="text-sm font-semibold text-slate-800">{skill.skill_name}</p><p className="text-xs text-slate-500">{skill.skill_category}</p></div><span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">{proficiencyLabels[skill.proficiency]}</span></div>)}</div>}</div><aside className="bg-blue-600 rounded-2xl p-5 text-white"><BarChart3 className="w-7 h-7 text-blue-100" /><h2 className="font-bold mt-4">{analysis ? 'Top Priority Skills' : 'Ready to analyze?'}</h2>{analysis ? <ol className="mt-3 space-y-2 text-sm text-blue-100">{analysis.priority_skills.slice(0, 3).map((item) => <li key={item.skill_id} className="flex gap-2"><span className="font-bold text-white">{item.priority_rank}.</span>{item.skill_name}</li>)}</ol> : <p className="text-sm text-blue-100 mt-2 leading-relaxed">Select a career to begin your skill-gap analysis.</p>}<Link to={analysis ? '/analysis' : '/choose-career'} className="mt-5 inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition">{analysis ? 'View Full Analysis' : 'Choose Career'} <ChevronRight className="w-3.5 h-3.5" /></Link></aside></section>
      {!user?.target_career_id && <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3"><Briefcase className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="text-sm font-bold text-amber-900">Choose a target career to continue</p><p className="text-xs text-amber-800 mt-0.5">Career requirements help you understand the skills expected for your path.</p></div><Link to="/choose-career" className="ml-auto self-center text-xs font-bold text-amber-800 hover:underline">Choose career</Link></section>}
    </>}
  </main></div><Footer /></div>;
};
