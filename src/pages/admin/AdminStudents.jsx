import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  Users,
  Search,
  GraduationCap,
  Calendar,
  Target,
  Mail,
} from 'lucide-react';

export const AdminStudents = () => {
  const { showToast } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/users/students');
        setStudents(res.data.students || []);
      } catch (err) {
        console.warn('Failed to load registered students:', err);
        showToast('Failed to load registered students.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [showToast]);

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.qualification && s.qualification.toLowerCase().includes(search.toLowerCase())) ||
    (s.target_career?.title && s.target_career.title.toLowerCase().includes(search.toLowerCase()))
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 mb-2">
                <Users className="w-3.5 h-3.5" /> Enrolled Learners
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Student Directory</h1>
              <p className="text-xs text-slate-500 mt-1">
                View student cohort profiles, educational backgrounds, and target careers.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <span className="text-xs text-slate-500 font-medium">Total Students</span>
              <p className="text-xl font-extrabold text-slate-900">{students.length}</p>
            </div>
          </section>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or career..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Students table */}
          {loading ? (
            <LoadingSpinner label="Loading student directory..." />
          ) : filtered.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-xs text-slate-500">
              No students found.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Student</th>
                      <th className="py-3 px-5">Qualification & Year</th>
                      <th className="py-3 px-5">Target Career</th>
                      <th className="py-3 px-5">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filtered.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {st.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{st.full_name}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {st.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700">
                          <p className="font-semibold">{st.qualification || 'Not specified'}</p>
                          {st.graduation_year && (
                            <p className="text-[11px] text-slate-400">Class of {st.graduation_year}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {st.target_career ? (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              <Target className="w-3 h-3" />
                              {st.target_career.title}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No target selected</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 text-[11px]">
                          {new Date(st.created_at).toLocaleDateString()}
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
