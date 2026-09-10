import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Compass,
  ArrowRight,
  BarChart3,
  Map,
  Target,
  CheckCircle2,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Ready Career Preparation & Growth Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Bridge your skills gap. <br className="hidden sm:inline" />
            <span className="text-blue-600">Accelerate your career.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Assess your current technical proficiencies, measure your match against industry career requirements, and follow a deterministic step-by-step learning roadmap tailored to your goals.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Seed demo credential banner */}
          <div className="mt-12 max-w-xl mx-auto p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-left text-xs text-slate-600 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-bold text-blue-900">Demo Accounts Available:</p>
              <p className="mt-0.5 text-slate-500">
                Student: <strong className="text-slate-700">student@skillgap.com</strong> / <code className="bg-white px-1.5 py-0.5 rounded border">Student@12345</code>
              </p>
              <p className="mt-0.5 text-slate-500">
                Admin: <strong className="text-slate-700">admin@skillgap.com</strong> / <code className="bg-white px-1.5 py-0.5 rounded border">Admin@12345</code>
              </p>
            </div>
            <Link
              to="/login"
              className="text-xs font-bold text-blue-600 hover:underline shrink-0"
            >
              Quick Login →
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">1. Target Career Selection</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Choose from verified technical roles such as Full Stack Developer, DevOps Engineer, Data Scientist, and Cloud Architect.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">2. Interactive Gap Analysis</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Visual charts contrast your self-assessed proficiencies against career benchmarks, computing readiness scores and gap rankings.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">3. Sequenced Roadmap</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Follow an algorithmic milestone path that prioritizes prerequisites first, attaches vetted learning materials, and tracks your progress.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
