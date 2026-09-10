import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toast } from './components/Toast';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { MySkillsPage } from './pages/MySkillsPage';
import { ChooseCareerPage } from './pages/ChooseCareerPage';
import { CareerDetailsPage } from './pages/CareerDetailsPage';
import { AnalysisPlaceholderPage } from './pages/AnalysisPlaceholderPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { JobAnalyzerPage } from './pages/JobAnalyzerPage';
import { StudentAnalyticsPage } from './pages/StudentAnalyticsPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCareers } from './pages/admin/AdminCareers';
import { AdminSkills } from './pages/admin/AdminSkills';
import { AdminPrerequisites } from './pages/admin/AdminPrerequisites';
import { AdminResources } from './pages/admin/AdminResources';
import { AdminStudents } from './pages/admin/AdminStudents';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student workspace */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-skills" element={<MySkillsPage />} />
            <Route path="/choose-career" element={<ChooseCareerPage />} />
            <Route path="/careers/:careerId" element={<CareerDetailsPage />} />
            <Route path="/analysis" element={<AnalysisPlaceholderPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/job-analyzer" element={<JobAnalyzerPage />} />
            <Route path="/analytics" element={<StudentAnalyticsPage />} />
          </Route>

          {/* General authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/careers" element={<AdminCareers />} />
            <Route path="/admin/skills" element={<AdminSkills />} />
            <Route path="/admin/prerequisites" element={<AdminPrerequisites />} />
            <Route path="/admin/resources" element={<AdminResources />} />
            <Route path="/admin/students" element={<AdminStudents />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toast />
      </BrowserRouter>
    </AuthProvider>
  );
}
