import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  HelpCircle,
  Briefcase,
  Layers,
  Wrench,
  GraduationCap,
  Award,
  ChevronDown,
  Loader2,
  Trash2,
  Check,
  ChevronRight,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const ResumeAnalyzerPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // Job matching state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobMatch, setJobMatch] = useState(null);
  const [loadingJobMatch, setLoadingJobMatch] = useState(false);

  // Skill import selection state
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState({});
  const [applyingSkills, setApplyingSkills] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [latestRes, jobsRes] = await Promise.allSettled([
        axios.get('/api/resume/latest'),
        axios.get('/api/job-analyses'),
      ]);

      if (latestRes.status === 'fulfilled' && latestRes.value.data.analysis) {
        setAnalysis(latestRes.value.data.analysis);
        initSelectedSkills(latestRes.value.data.analysis.skills_in_resume_not_in_profile);
      }
      if (jobsRes.status === 'fulfilled') {
        const list = jobsRes.value.data.analyses || [];
        setJobs(list);
        if (list.length > 0) {
          setSelectedJobId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load resume analyzer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const initSelectedSkills = (missingSkills) => {
    if (!missingSkills) return;
    const initial = {};
    missingSkills.forEach((s) => {
      initial[s.skill_id] = {
        selected: true,
        proficiency: 2,
      };
    });
    setSelectedSkillsToAdd(initial);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setSuccessMsg('');
    setAnalyzing(true);

    try {
      let res;
      if (activeTab === 'upload') {
        if (!file) {
          setError('Please select a resume file (PDF, DOCX, TXT) to analyze.');
          setAnalyzing(false);
          return;
        }
        const formData = new FormData();
        formData.append('resume_file', file);
        res = await axios.post('/api/resume/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 30) {
          setError('Please paste a substantive resume document (at least 30 characters).');
          setAnalyzing(false);
          return;
        }
        res = await axios.post('/api/resume/analyze', {
          resume_text: pastedText,
          filename: 'pasted_resume.txt',
        });
      }

      setAnalysis(res.data.analysis);
      initSelectedSkills(res.data.analysis.skills_in_resume_not_in_profile);
      setSuccessMsg('Resume parsed and analyzed successfully!');

      if (selectedJobId) {
        runJobMatch(selectedJobId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const runJobMatch = async (jobId) => {
    if (!jobId) return;
    setLoadingJobMatch(true);
    try {
      const res = await axios.get(`/api/resume/job-match/${jobId}`);
      setJobMatch(res.data);
    } catch (err) {
      console.error('Job match error:', err);
    } finally {
      setLoadingJobMatch(false);
    }
  };

  const handleApplySelectedSkills = async () => {
    const skillsToPost = Object.entries(selectedSkillsToAdd)
      .filter(([_, val]) => val.selected)
      .map(([skillId, val]) => ({
        skill_id: parseInt(skillId, 10),
        proficiency: val.proficiency,
      }));

    if (skillsToPost.length === 0) {
      setError('Please select at least one skill to add to your profile.');
      return;
    }

    setApplyingSkills(true);
    try {
      const res = await axios.post('/api/resume/apply-skills', { skills: skillsToPost });
      setSuccessMsg(res.data.message);
      const updated = await axios.get('/api/resume/latest');
      if (updated.data.analysis) {
        setAnalysis(updated.data.analysis);
        initSelectedSkills(updated.data.analysis.skills_in_resume_not_in_profile);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update skills profile.');
    } finally {
      setApplyingSkills(false);
    }
  };

  const matchedProfileSkills = analysis?.parsed_skills?.filter((s) => s.in_profile) || [];
  const missingProfileSkills = analysis?.skills_in_resume_not_in_profile || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              <div className="space-y-1 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resume & CV Intelligence</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Resume Skill Analyzer
                </h1>
                <p className="text-sm text-slate-500 font-normal">
                  Extract technical competencies from your resume, detect unlogged skills, and benchmark alignment with target jobs.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload or Paste Box */}
          <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            {activeTab === 'upload' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 sm:p-10 text-center bg-slate-50/60 hover:bg-indigo-50/10 transition cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {file ? file.name : 'Click to select or drag & drop your resume file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports PDF, DOCX, or TXT documents (Max 5MB)
                  </p>
                </div>
                {file && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your plain-text resume content, portfolio summary, or LinkedIn text export here..."
                  rows={8}
                  className="w-full text-xs font-mono p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
            )}

            {/* Clear Analyze CTA Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Extracting Resume Competencies...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Analyze Resume Intelligence</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Analysis Results Display */}
          {analysis && (
            <div className="space-y-6">
              {/* Analysis Summary Banner */}
              <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recognized Skills
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {analysis.parsed_skills.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Identified in resume text</p>
                  </div>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Matched in Profile
                    </span>
                    <p className="text-2xl font-black text-emerald-800 mt-1">
                      {matchedProfileSkills.length}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Already in skills inventory</p>
                  </div>

                  <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Unlogged in Profile
                    </span>
                    <p className="text-2xl font-black text-indigo-800 mt-1">
                      {missingProfileSkills.length}
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-0.5">Ready to import below</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Source Document
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate mt-1">
                      {analysis.filename || 'pasted_resume.txt'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Analyzed {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* Matched Skills Chips & Missing Skills Chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills Chips (In Resume & In Profile) */}
                <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Matched Skills Chips ({matchedProfileSkills.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Verified in Profile
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {matchedProfileSkills.length > 0 ? (
                      matchedProfileSkills.map((s) => (
                        <span
                          key={s.skill_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold shadow-2xs"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-emerald-700 font-bold ml-1">
                            (Lv.{s.student_proficiency || 2})
                          </span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No overlap with current profile skills.</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills Chips (Detected on Resume but not in Profile) */}
                <div className="bg-white border border-indigo-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                        Missing Skills Chips ({missingProfileSkills.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Discovered on Resume
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {missingProfileSkills.length > 0 ? (
                      missingProfileSkills.map((s) => (
                        <span
                          key={s.skill_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-indigo-700 font-bold ml-1">
                            ({s.frequency_in_resume}x mentions)
                          </span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">All resume skills are already logged in your profile!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* One-Click Import to Profile Table */}
              {missingProfileSkills.length > 0 && (
                <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Import Skills from Resume into Your Profile
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check the skills you want to record and choose your self-assessed proficiency.
                      </p>
                    </div>

                    <button
                      onClick={handleApplySelectedSkills}
                      disabled={applyingSkills}
                      className="px-4 py-2 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      {applyingSkills ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Add Selected to Profile</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200/80">
                        <tr>
                          <th className="py-2.5 px-3">Import</th>
                          <th className="py-2.5 px-3">Skill Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Mentions</th>
                          <th className="py-2.5 px-3">Your Proficiency Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {missingProfileSkills.map((item) => {
                          const state = selectedSkillsToAdd[item.skill_id] || {
                            selected: false,
                            proficiency: 2,
                          };
                          return (
                            <tr key={item.skill_id} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3">
                                <input
                                  type="checkbox"
                                  checked={state.selected}
                                  onChange={(e) =>
                                    setSelectedSkillsToAdd((prev) => ({
                                      ...prev,
                                      [item.skill_id]: {
                                        ...prev[item.skill_id],
                                        selected: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{item.skill_name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{item.skill_category}</td>
                              <td className="py-2.5 px-3 text-slate-500">{item.frequency_in_resume}x</td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={state.proficiency}
                                  onChange={(e) =>
                                    setSelectedSkillsToAdd((prev) => ({
                                      ...prev,
                                      [item.skill_id]: {
                                        ...prev[item.skill_id],
                                        proficiency: parseInt(e.target.value, 10),
                                      },
                                    }))
                                  }
                                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                  <option value={1}>1 - Beginner</option>
                                  <option value={2}>2 - Basic</option>
                                  <option value={3}>3 - Intermediate</option>
                                  <option value={4}>4 - Advanced</option>
                                  <option value={5}>5 - Expert</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Cross-Match with Target Job Openings */}
              {jobs.length > 0 && (
                <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Cross-Match Resume with Target Job Description</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        See how your uploaded resume document matches against real postings you saved.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedJobId}
                        onChange={(e) => {
                          setSelectedJobId(e.target.value);
                          runJobMatch(e.target.value);
                        }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.job_title} ({j.company_name || 'Posting'})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => runJobMatch(selectedJobId)}
                        disabled={loadingJobMatch}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shrink-0"
                      >
                        {loadingJobMatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Compare'}
                      </button>
                    </div>
                  </div>

                  {jobMatch && (
                    <div className="space-y-4">
                      {/* Match Score Strip */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Job Alignment for:</p>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {jobMatch.job_title} {jobMatch.company_name && `• ${jobMatch.company_name}`}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Match Percentage</span>
                            <p className="text-2xl font-black text-blue-600">{jobMatch.overall_match_percentage}%</p>
                          </div>
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${jobMatch.overall_match_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recommendations from Resume Match */}
                      {jobMatch.recommended_improvements?.length > 0 && (
                        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-900">
                          <p className="font-extrabold uppercase tracking-wide text-[10px] text-amber-700">
                            Actionable Resume Recommendations:
                          </p>
                          {jobMatch.recommended_improvements.map((rec, i) => (
                            <p key={i} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span>{rec}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
