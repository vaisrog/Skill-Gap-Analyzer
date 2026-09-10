import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Footer } from '../../components/Footer';
import { Users, GraduationCap, Calendar, Mail, Search } from 'lucide-react';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/users/students');
        setStudents(res.data.students || []);
      } catch (err) {
        console.error('Failed to fetch students list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.qualification && s.qualification.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Registered Students Directory</h1>
              <p className="text-xs text-slate-500 mt-1">
                View student accounts, educational qualifications, and graduation timelines.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full mt-2 sm:mt-0">
              Total Enrolled: {students.length}
            </span>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name, email, or degree..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium text-sm">Loading student directory...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              No students found matching your search.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Qualification</th>
                      <th className="px-4 py-3">Graduation Year</th>
                      <th className="px-4 py-3">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                            {s.full_name.charAt(0)}
                          </div>
                          <span>{s.full_name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{s.email}</td>
                        <td className="px-4 py-3 text-slate-800 font-semibold">
                          {s.qualification || 'Not provided'}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600">
                          {s.graduation_year || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
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

