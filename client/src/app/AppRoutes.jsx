import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardLayout from '../layouts/DashboardLayout';
import OverviewPage from '../features/tenant/OverviewPage';
import ProfilePage from '../features/tenant/ProfilePage';
import SettingsPage from '../features/tenant/SettingsPage';
import CategoriesPage from '../features/categories/CategoriesPage';
import ArticlesListPage from '../features/articles/ArticlesListPage';
import ArticleEditorPage from '../features/articles/ArticleEditorPage';
import AnalyticsPage from '../features/analytics/AnalyticsPage';

// Public Help Center
import PublicHelpLayout from '../features/public/PublicHelpLayout';
import PublicLandingPage from '../features/public/PublicLandingPage';
import PublicCategoryPage from '../features/public/PublicCategoryPage';
import PublicArticleDetailPage from '../features/public/PublicArticleDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes (redirect to / if already logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Authenticated Dashboard Shell and routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="articles" element={<ArticlesListPage />} />
        <Route path="articles/new" element={<ArticleEditorPage />} />
        <Route path="articles/:articleId/edit" element={<ArticleEditorPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Public customer-facing Help Center routes */}
      <Route path="/help/:tenantSlug" element={<PublicHelpLayout />}>
        <Route index element={<PublicLandingPage />} />
        <Route path="category/:categorySlug" element={<PublicCategoryPage />} />
        <Route path="article/:articleSlug" element={<PublicArticleDetailPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
