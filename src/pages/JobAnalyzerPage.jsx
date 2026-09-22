import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  FileText,
  History,
  Layers,
  Map,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';

const sampleJobs = [
  {
    title: 'Data Analyst',
    company: 'Fintech Solutions Ltd',
    description: `We are looking for a Data Analyst to join our growing analytics team.

Key Requirements:
- Strong proficiency in SQL and relational database design.
- Hands-on experience with Python and Pandas for data manipulation.
- Experience building dashboards in Power BI or Tableau for business stakeholders.
- Advanced knowledge of Excel & Spreadsheet Modeling (VLOOKUP, Pivot Tables).
- Solid understanding of Statistics & Probability for hypothesis testing.

Nice to have:
- Exposure to Machine Learning & Scikit-Learn.
- Basic understanding of Git & CI/CD for version control.`,
  },
  {
    title: 'Full Stack Developer',
    company: 'CloudScale Technologies',
    description: `CloudScale is hiring a Full Stack Developer to build modern web applications.

Qualifications:
- Proficient in JavaScript and React for dynamic frontends.
- Solid background in Node.js and REST APIs development.
- Deep knowledge of Database Design (PostgreSQL / relational schemas).
- Hands-on experience with HTML & CSS and responsive web development.
- Strong working knowledge of Git & CI/CD workflows.

Preferred:
- Experience with Object-Oriented Design and Programming Fundamentals.
- Familiarity with Linux System Administration.`,
  },
  {
    title: 'Cybersecurity Analyst',
    company: 'Apex Cyber Defense',
    description: `Apex Cyber Defense is seeking a Cybersecurity Analyst to protect critical infrastructure.

Requirements:
- Strong knowledge of Network Security, firewalls, and perimeter defense.
- Hands-on experience in Incident Response and threat triage.
- Working knowledge of SIEM tools (Splunk / Sentinel) and log analysis.
- Solid understanding of Linux System Administration.
- Good comprehension of Networking protocols (TCP/IP, DNS).

Bonus:
- Exposure to Ethical Hacking & Penetration Testing and vulnerability assessment tools.
- Understanding of Cryptography & PKI.`,
  },
];

const statusBadgeStyles = {
  Match: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Minor Gap': 'bg-amber-50 text-amber-800 border-amber-200',
  'Moderate Gap': 'bg-orange-50 text-orange-800 border-orange-200',
  'Major Gap': 'bg-rose-50 text-rose-800 border-rose-200',
  Missing: 'bg-purple-50 text-purple-800 border-purple-200',
};

const importanceBadgeStyles = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  Important: 'bg-blue-50 text-blue-700 border-blue-200',
  Optional: 'bg-slate-100 text-slate-700 border-slate-200',
};

const readinessStyles = {
  'Highly Ready': { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Developing: { text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Needs Improvement': { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Beginner: { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const JobAnalyzerPage = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [addingToRoadmap, setAddingToRoadmap] = useState(false);
  const [roadmapMessage, setRoadmapMessage] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/job-analysis/history');
      setHistory(res.data.history || []);
    } catch {
      // benign history fetch failure
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!jobDescription.trim() || jobDescription.trim().length < 10) {
      setError('Please paste a job description with at least 10 characters.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setRoadmapMessage(null);

    try {
      const res = await axios.post('/api/job-analysis/analyze', {
        job_title: jobTitle,
        company,
        job_description: jobDescription,
      });
      setCurrentAnalysis(res.data.analysis);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze job description. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSample = (sample) => {
    setJobTitle(sample.title);
    setCompany(sample.company);
    setJobDescription(sample.description);
    setError(null);
  };

  const handleLoadFromHistory = async (id) => {
    try {
      const res = await axios.get(`/api/job-analysis/${id}`);
      setCurrentAnalysis(res.data.analysis);
      setJobTitle(res.data.analysis.job_title);
      setCompany(res.data.analysis.company);
      setJobDescription(res.data.analysis.job_description);
      setRoadmapMessage(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load analysis.');
    }
  };

  const handleDeleteFromHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/job-analysis/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
      }
    } catch {
      // benign failure
    }
  };

  const handleAddToRoadmap = async () => {
    if (!currentAnalysis) return;
    setAddingToRoadmap(true);
    setRoadmapMessage(null);
    try {
      const res = await axios.post(`/api/job-analysis/${currentAnalysis.id}/add-to-roadmap`);
      setRoadmapMessage({
        type: 'success',
        text: res.data.message,
        addedCount: res.data.added_count,
      });
    } catch (err) {
      setRoadmapMessage({
        type: 'error',
        text: err.response?.data?.error || 'Could not update roadmap.',
      });
    } finally {
      setAddingToRoadmap(false);
    }
  };

  const filteredSkills =
    currentAnalysis?.skills.filter((skill) => {
      if (activeTab === 'matched') return skill.status === 'Match';
      if (activeTab === 'gaps') return skill.skill_gap > 0;
      if (activeTab === 'missing') return skill.status === 'Missing';
      return true;
    }) || [];

  const matchedSkills = currentAnalysis?.skills.filter((s) => s.status === 'Match') || [];
  const missingSkills = currentAnalysis?.skills.filter((s) => s.status === 'Missing' || s.student_proficiency === 0) || [];
  const gapSkills = currentAnalysis?.skills.filter((s) => s.skill_gap > 0 && s.student_proficiency > 0) || [];

  const barChartData = currentAnalysis
    ? {
        labels: currentAnalysis.skills.map((s) => s.skill_name),
        datasets: [
          {
            label: 'Your Current Level',
            data: currentAnalysis.skills.map((s) => s.student_proficiency),
            backgroundColor: '#3b82f6',
            borderRadius: 4,
          },
          {
            label: 'Job Requirement Level',
            data: currentAnalysis.skills.map((s) => s.required_proficiency),
            backgroundColor: '#0f172a',
            borderRadius: 4,
          },
        ],
      }
    : null;

  const gapCounts = currentAnalysis
    ? {
        'Matched (Met)': currentAnalysis.skills.filter((s) => s.status === 'Match').length,
        'Minor Gap (1)': currentAnalysis.skills.filter((s) => s.status === 'Minor Gap').length,
        'Moderate Gap (2)': currentAnalysis.skills.filter((s) => s.status === 'Moderate Gap').length,
        'Major Gap (3+)': currentAnalysis.skills.filter((s) => s.status === 'Major Gap').length,
        'Missing (0)': currentAnalysis.skills.filter((s) => s.status === 'Missing').length,
      }
    : null;

  const doughnutData = gapCounts
    ? {
        labels: Object.keys(gapCounts),
        datasets: [
          {
            data: Object.values(gapCounts),
            backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      }
    : null;

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
                  <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Market Intelligence Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Job Description Analyzer
                </h1>
                <p className="text-sm text-slate-500 font-normal">
                  Extract technical competencies from any job posting and benchmark your readiness score.
                </p>
              </div>

              {/* Sample job shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 self-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Try Sample:
                </span>
                {sampleJobs.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200/80"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Form & Past Analyses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Section (8 Columns) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hiring Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Stripe, Google, or Startup"
                      className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Clean Paste Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Paste Job Posting Requirements <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {jobDescription.length} chars
                    </span>
                  </div>
                  <div className="relative rounded-2xl border-2 border-dashed border-slate-200 focus-within:border-indigo-500 focus-within:bg-indigo-50/5 p-1 transition">
                    <textarea
                      rows={8}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description, role requirements, technical qualifications, or nice-to-have bullet points here..."
                      className="w-full p-3 text-xs leading-relaxed bg-transparent resize-y focus:outline-none font-mono text-slate-800"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    The analyzer parses skills, maps required proficiency levels, and cross-checks your current profile.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Clear Analyze CTA Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={analyzing}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Analyzing Job Competencies...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Analyze Job Requirements</span>
                      </>
                    )}
                  </button>

                  {(jobDescription || jobTitle || currentAnalysis) && (
                    <button
                      type="button"
                      onClick={() => {
                        setJobTitle('');
                        setCompany('');
                        setJobDescription('');
                        setCurrentAnalysis(null);
                        setError(null);
                        setRoadmapMessage(null);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Past Analyses Drawer (4 Columns) */}
            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" /> Past Analyses
                  </h2>
                  <span className="text-xs font-black text-slate-400">{history.length} Saved</span>
                </div>

                {loadingHistory ? (
                  <div className="py-8">
                    <LoadingSpinner label="Loading saved analyses..." />
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No past analyses yet. Analyzed job postings will appear here for fast benchmark recall.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleLoadFromHistory(item.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          currentAnalysis?.id === item.id
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/10'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.job_title || 'Untitled Role'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {item.company || 'Direct Posting'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                item.match_score >= 70
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.match_score >= 50
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.match_score}%
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFromHistory(item.id, e)}
                              className="p-1 hover:text-rose-600 text-slate-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Click any history item to restore its extracted skills and charts.
              </div>
            </div>
          </div>

          {/* Analysis Results View */}
          {currentAnalysis && (
            <div className="space-y-6">
              {/* Analysis Summary Banner with Match Percentage Score */}
              <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Gauge & Title */}
                  <div className="lg:col-span-5 flex items-center gap-5">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center shrink-0 shadow-inner"
                      style={{
                        background: `conic-gradient(#2563eb 0% ${currentAnalysis.match_score}%, #e2e8f0 ${currentAnalysis.match_score}% 100%)`,
                      }}
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-xs">
                        <span className="text-2xl font-black text-slate-900 leading-none">
                          {currentAnalysis.match_score}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Match
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                          readinessStyles[currentAnalysis.readiness_classification]?.bg
                        } ${readinessStyles[currentAnalysis.readiness_classification]?.text}`}
                      >
                        {currentAnalysis.readiness_classification}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {currentAnalysis.job_title}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {currentAnalysis.company || 'Analyzed Posting'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="lg:col-span-4 grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Skills</p>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {currentAnalysis.identified_skills_count}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-center">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Matched</p>
                      <p className="text-xl font-black text-emerald-800 mt-1">
                        {currentAnalysis.skills_satisfied_count}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-center">
                      <p className="text-[10px] font-bold uppercase text-rose-700">Missing</p>
                      <p className="text-xl font-black text-rose-800 mt-1">
                        {currentAnalysis.missing_skills_count}
                      </p>
                    </div>
                  </div>

                  {/* Add Job Gaps to Roadmap Button */}
                  <div className="lg:col-span-3 flex flex-col justify-center space-y-2">
                    <button
                      type="button"
                      onClick={handleAddToRoadmap}
                      disabled={addingToRoadmap || currentAnalysis.skills_gap_count === 0}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                    >
                      {addingToRoadmap ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding to Roadmap...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                          <span>Add Job Gaps to Roadmap</span>
                        </>
                      )}
                    </button>

                    {roadmapMessage && (
                      <div
                        className={`text-[11px] font-medium p-2.5 rounded-xl border flex items-center justify-between ${
                          roadmapMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span>{roadmapMessage.text}</span>
                        {roadmapMessage.type === 'success' && (
                          <Link to="/roadmap" className="underline font-bold shrink-0 ml-2">
                            View →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Matched Skills Chips & Missing Skills Chips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills Chips */}
                <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Matched Skills Chips ({matchedSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Profile Meets Job Criteria
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((s) => (
                        <span
                          key={s.skill_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-emerald-700 font-bold ml-1">
                            (Lv.{s.student_proficiency})
                          </span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No exact matched skills found in this posting.</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills Chips */}
                <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                        Missing Skills Chips ({missingSkills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      Required by Role (Level 0)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((s) => (
                        <span
                          key={s.skill_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold shadow-2xs"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>{s.skill_name}</span>
                          <span className="text-[10px] text-rose-700 font-bold ml-1">
                            (Req. Lv.{s.required_proficiency})
                          </span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No missing skills! You possess basic familiarity with all requirements.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations Section */}
              {currentAnalysis.recommended_next_skills && currentAnalysis.recommended_next_skills.length > 0 && (
                <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" /> Targeted Recommendations
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Closing these specific gaps provides the biggest immediate readiness boost for this posting.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentAnalysis.recommended_next_skills.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-2 hover:border-slate-300 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{rec.skill_name}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              Gap: {rec.gap}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-500">Importance: {rec.importance}</span>
                          <Link
                            to="/my-skills"
                            className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5"
                          >
                            Update level <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Detailed Breakdown Table */}
              <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      All Extracted Competencies
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detailed matching results for every keyword and skill identified in this job description.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: 'all', label: `All (${currentAnalysis.skills.length})` },
                      { id: 'matched', label: `Matched (${currentAnalysis.skills_satisfied_count})` },
                      { id: 'gaps', label: `Gaps (${currentAnalysis.skills_gap_count})` },
                      { id: 'missing', label: `Missing (${currentAnalysis.missing_skills_count})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Skill Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Your Level</th>
                        <th className="py-3 px-4">Job Required</th>
                        <th className="py-3 px-4">Deficit Gap</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSkills.map((s) => (
                        <tr key={s.skill_id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{s.skill_name}</td>
                          <td className="py-3.5 px-4 text-slate-500">{s.skill_category}</td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {s.student_proficiency_label} ({s.student_proficiency}/5)
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-semibold">
                            {s.required_proficiency_label} ({s.required_proficiency}/5)
                          </td>
                          <td className="py-3.5 px-4">
                            {s.skill_gap > 0 ? (
                              <span className="font-bold text-rose-600">+{s.skill_gap} levels</span>
                            ) : (
                              <span className="font-bold text-emerald-600">None (Met)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadgeStyles[s.status] || 'bg-slate-100 text-slate-700'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to="/my-skills"
                              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                            >
                              <span>Update</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
