import React from 'react';
import { Compass } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Skill Gap Analyzer & Learning Roadmap</span>
        </div>
        <p className="text-xs text-slate-500 text-center">
          &copy; {new Date().getFullYear()} SkillGap.ai Platform. Tailored technical roadmaps for modern college graduates.
        </p>
      </div>
    </footer>
  );
};

