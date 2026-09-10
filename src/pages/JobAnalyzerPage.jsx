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
  'Match': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Minor Gap': 'bg-amber-100 text-amber-800 border-amber-200',
  'Moderate Gap': 'bg-orange-100 text-orange-800 border-orange-200',
  'Major Gap': 'bg-rose-100 text-rose-800 border-rose-200',
  'Missing': 'bg-purple-100 text-purple-800 border-purple-200',
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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'matched', 'gaps', 'missing'
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

  // Filter skills based on tab
  const filteredSkills = currentAnalysis?.skills.filter((skill) => {
    if (activeTab === 'matched') return skill.status === 'Match';
    if (activeTab === 'gaps') return skill.skill_gap > 0;
    if (activeTab === 'missing') return skill.status === 'Missing';
    return true;
  }) || [];

  // Chart configurations
  const barChartData = currentAnalysis ? {
    labels: currentAnalysis.skills.map((s) => s.skill_name),
    datasets: [
      {
        label: 'Your Current Level',
        data: currentAnalysis.skills.map((s) => s.student_proficiency),
        backgroundColor: '#60a5fa',
        borderRadius: 4,
      },
      {
        label: 'Job Requirement Level',
        data: currentAnalysis.skills.map((s) => s.required_proficiency),
        backgroundColor: '#1e3a8a',
        borderRadius: 4,
      },
    ],
  } : null;

  const gapCounts = currentAnalysis ? {
    'Match (Met)': currentAnalysis.skills.filter((s) => s.status === 'Match').length,
    'Minor Gap (1)': currentAnalysis.skills.filter((s) => s.status === 'Minor Gap').length,
    'Moderate Gap (2)': currentAnalysis.skills.filter((s) => s.status === 'Moderate Gap').length,
    'Major Gap (3+)': currentAnalysis.skills.filter((s) => s.status === 'Major Gap').length,
    'Missing (0)': currentAnalysis.skills.filter((s) => s.status === 'Missing').length,
  } : null;

  const doughnutData = gapCounts ? {
    labels: Object.keys(gapCounts),
    datasets: [
      {
        data: Object.values(gapCounts),
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
              <FileSearch className="w-3.5 h-3.5" /> Career Market Intelligence
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Job Description Analyzer
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Paste any real-world job posting to extract technical skill requirements, compare them directly against your current skill profile, and identify high-priority gaps.
            </p>
          </section>

          {/* Input & Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form (2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Job Details & Description
                </h2>
                {/* Sample templates dropdown */}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="hidden sm:inline">Load Sample:</span>
                  <div className="flex flex-wrap gap-1">
                    {sampleJobs.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadSample(sample)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium rounded-md text-xs transition border border-slate-200"
                      >
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Data Analyst"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Organization (Optional)
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job posting, bullet points, or requirements list here..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono text-xs leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The engine extracts technical skills, detects proficiency levels from contextual keywords, and compares against your profile.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={analyzing}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-60"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Requirements...
                      </>
                    ) : (
                      <>
                        <FileSearch className="w-4 h-4" /> Analyze Job Description
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
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Past Analyses Drawer (1 col on lg) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" /> Recent Analyses
                </h2>
                <span className="text-xs text-slate-400 font-semibold">{history.length} saved</span>
              </div>

              {loadingHistory ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <LoadingSpinner label="Loading history..." />
                </div>
              ) : history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <FileSearch className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">No previous analyses yet.</p>
                  <p className="text-[11px] mt-1 text-slate-400">Past analyses will be automatically saved here for quick review.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        currentAnalysis?.id === item.id
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-blue-50/40 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.job_title || 'Untitled Job'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{item.company || 'Unknown Company'}</p>
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
                            title="Delete this analysis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{item.identified_skills_count} skills extracted</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results View */}
          {currentAnalysis && (
            <div className="space-y-6">
              {/* Top Overview & Match Score Banner */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Match Gauge */}
                  <div className="flex items-center gap-5">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center shrink-0 shadow-inner"
                      style={{
                        background: `conic-gradient(#2563eb 0% ${currentAnalysis.match_score}%, #e2e8f0 ${currentAnalysis.match_score}% 100%)`,
                      }}
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-xl font-black text-slate-900 leading-none">
                          {currentAnalysis.match_score}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Match
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            readinessStyles[currentAnalysis.readiness_classification]?.bg
                          } ${readinessStyles[currentAnalysis.readiness_classification]?.text}`}
                        >
                          {currentAnalysis.readiness_classification}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">
                        {currentAnalysis.job_title}
                      </h3>
                      <p className="text-xs text-slate-500">{currentAnalysis.company}</p>
                    </div>
                  </div>

                  {/* Summary counts */}
                  <div className="grid grid-cols-2 gap-3 md:col-span-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-medium text-slate-500">Skills Identified</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        {currentAnalysis.identified_skills_count}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <p className="text-[11px] font-medium text-emerald-700">Satisfied Skills</p>
                      <p className="text-lg font-bold text-emerald-800 mt-0.5">
                        {currentAnalysis.skills_satisfied_count}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                      <p className="text-[11px] font-medium text-amber-700">Skills with Gaps</p>
                      <p className="text-lg font-bold text-amber-800 mt-0.5">
                        {currentAnalysis.skills_gap_count}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
                      <p className="text-[11px] font-medium text-purple-700">Missing Skills</p>
                      <p className="text-lg font-bold text-purple-800 mt-0.5">
                        {currentAnalysis.missing_skills_count}
                      </p>
                    </div>
                  </div>

                  {/* Action: Add Job Gaps to Roadmap */}
                  <div className="flex flex-col justify-center space-y-2.5 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                    <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Target Job Alignment
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Add the {currentAnalysis.skills_gap_count} missing and gap skills from this job directly to your learning roadmap.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddToRoadmap}
                      disabled={addingToRoadmap || currentAnalysis.skills_gap_count === 0}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {addingToRoadmap ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding to Roadmap...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Add Job Gaps to My Roadmap
                        </>
                      )}
                    </button>
                    {roadmapMessage && (
                      <div
                        className={`text-[11px] font-medium p-2 rounded border flex items-center justify-between ${
                          roadmapMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span>{roadmapMessage.text}</span>
                        {roadmapMessage.type === 'success' && (
                          <Link to="/roadmap" className="underline font-bold shrink-0 ml-2">
                            View Roadmap →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Actionable Next Recommended Skills */}
              {currentAnalysis.recommended_next_skills && currentAnalysis.recommended_next_skills.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" /> High-Priority Job Recommendations
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Closing these specific skill gaps will give you the highest immediate lift in readiness for this role.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentAnalysis.recommended_next_skills.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-2 hover:border-blue-300 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{rec.skill_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              Gap: {rec.gap} level{rec.gap > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-500">Importance: {rec.importance}</span>
                          <Link
                            to="/skills"
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

              {/* Visualizations Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Current vs Required */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Proficiency Comparison (Your Level vs. Job Required)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Proficiency rated on standard 0 (No Knowledge) to 5 (Expert) scale.
                  </p>
                  <div className="h-72">
                    {barChartData && (
                      <Bar
                        data={barChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              min: 0,
                              max: 5,
                              ticks: { stepSize: 1 },
                            },
                            x: {
                              ticks: {
                                maxRotation: 45,
                                minRotation: 0,
                                font: { size: 10 },
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: { font: { size: 11, weight: 'bold' } },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Doughnut Chart: Gap Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-indigo-600" /> Requirement Gap Distribution
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Breakdown of matched, developing, and missing skills.
                    </p>
                  </div>
                  <div className="h-56 relative flex items-center justify-center">
                    {doughnutData && (
                      <Doughnut
                        data={doughnutData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '65%',
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { boxWidth: 10, font: { size: 10 } },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center text-[11px] text-slate-400">
                    Total requirements evaluated: {currentAnalysis.identified_skills_count}
                  </div>
                </div>
              </div>

              {/* Detailed Skills Breakdown Table */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Extracted Skills Breakdown</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Detailed matching breakdown for all skills identified in the posting.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({currentAnalysis.skills.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('matched')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === 'matched' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Matched ({currentAnalysis.skills_satisfied_count})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gaps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === 'gaps' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Gaps ({currentAnalysis.skills_gap_count})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('missing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === 'missing' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Missing ({currentAnalysis.missing_skills_count})
                    </button>
                  </div>
                </div>

                {filteredSkills.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No skills found under this filter tab.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3.5">Skill & Category</th>
                          <th className="px-6 py-3.5 text-center">Your Level</th>
                          <th className="px-6 py-3.5 text-center">Job Required</th>
                          <th className="px-6 py-3.5 text-center">Skill Gap</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5">Importance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSkills.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 text-xs">{item.skill_name}</p>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {item.skill_category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-extrabold text-slate-800">{item.student_proficiency}</span>
                              <span className="text-slate-400 text-[10px]"> / 5</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-extrabold text-slate-800">{item.required_proficiency}</span>
                              <span className="text-slate-400 text-[10px]"> / 5</span>
                              {item.is_estimated && (
                                <span className="block text-[9px] text-slate-400 italic">estimated</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {item.skill_gap === 0 ? (
                                <span className="text-emerald-700 font-bold">0 (Met)</span>
                              ) : (
                                <span className="text-rose-700 font-bold">-{item.skill_gap}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                  statusBadgeStyles[item.status] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                  importanceBadgeStyles[item.importance] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.importance}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};
export default JobAnalyzerPage;
