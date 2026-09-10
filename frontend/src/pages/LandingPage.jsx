import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Compass,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  BarChart3,
  Code,
  ShieldAlert,
  Cloud,
  Terminal,
  Layers,
  Award
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const LandingPage = () => {
  const [careerRoles, setCareerRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await axios.get('/api/careers');
        setCareerRoles(res.data.career_roles || []);
      } catch (err) {
        console.error('Failed to load career roles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  const getIcon = (title) => {
    if (title.includes('Data Analyst')) return BarChart3;
    if (title.includes('Full Stack')) return Code;
    if (title.includes('Cybersecurity')) return ShieldAlert;
    if (title.includes('Cloud')) return Cloud;
    return Terminal;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/20 px-4 py-1.5 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI-Driven Career Readiness</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Identify your skill gaps. Build the right skills.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              Follow a personalized roadmap.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Empower your transition from college to target tech industry roles. Benchmark your proficiency against actual database-driven industry requirements.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-base font-semibold rounded-xl transition flex items-center justify-center"
            >
              Student & Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Skill Gap Analyzer Works
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Designed specifically for undergraduate students seeking tech industry roles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Select Target Role</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose from high-demand technical roles such as Data Analyst, Full Stack Developer, Cybersecurity Analyst, or Cloud Engineer.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Analyze Skill Gaps</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Compare your current self-assessed proficiency against required 0–5 skill expectations set by industry benchmarks.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Personalized Roadmap</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Receive a step-by-step ordered learning roadmap paired with curated learning resources to bridge your exact gaps.
            </p>
          </div>
        </div>
      </section>

      {/* Seeded Career Roles Preview Section */}
      <section className="bg-slate-100 border-t border-b border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Database Seeded Data</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Explore Supported Career Tracks
              </h2>
            </div>
            <Link
              to="/register"
              className="mt-4 md:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Join to assess your readiness</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">Loading database careers...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {careerRoles.map((role) => {
                const IconComponent = getIcon(role.title);
                return (
                  <div
                    key={role.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">{role.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Skills Required</p>
                      <div className="flex flex-wrap gap-1.5">
                        {role.required_skills?.slice(0, 4).map((sk) => (
                          <span
                            key={sk.id}
                            className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                          >
                            {sk.skill_name} <span className="text-blue-600 font-bold">({sk.required_proficiency}/5)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

