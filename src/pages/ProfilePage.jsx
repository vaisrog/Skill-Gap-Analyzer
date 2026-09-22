import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { User, Mail, GraduationCap, Calendar, Target, Save, CheckCircle2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateUserProfile, showToast, isStudent } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    qualification: '',
    graduation_year: 2026,
    career_interest: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        const u = res.data.user;
        setFormData({
          full_name: u.full_name || '',
          qualification: u.qualification || '',
          graduation_year: u.graduation_year || 2026,
          career_interest: u.career_interest || '',
        });
        updateUserProfile(u);
      } catch (err) {
        console.warn('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateUserProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await axios.put('/api/users/profile', {
        ...formData,
        graduation_year: Number(formData.graduation_year),
      });
      updateUserProfile(res.data.user);
      setSuccess(true);
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {isStudent && <Sidebar />}

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{user?.full_name}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email} · <span className="capitalize font-semibold text-slate-700">{user?.role}</span></p>
              </div>
            </div>
          </section>

          {loading ? (
            <LoadingSpinner label="Loading profile information..." />
          ) : (
            <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6">Profile Details</h2>

              {success && (
                <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your profile details have been saved.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email (Read-Only)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Degree / Qualification
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. B.Tech Computer Science"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Graduation Year
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        min={2000}
                        max={2035}
                        value={formData.graduation_year}
                        onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Career Interest Note
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.career_interest}
                      onChange={(e) => setFormData({ ...formData, career_interest: e.target.value })}
                      placeholder="e.g. Cloud Infrastructure, Distributed Backend Systems"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving changes...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
