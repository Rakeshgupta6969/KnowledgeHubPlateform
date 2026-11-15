import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';

// Route-level code splitting for performance optimization
const LoginPage = React.lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../features/auth/RegisterPage'));
const DashboardLayout = React.lazy(() => import('../layouts/DashboardLayout'));
const OverviewPage = React.lazy(() => import('../features/tenant/OverviewPage'));
const ProfilePage = React.lazy(() => import('../features/tenant/ProfilePage'));
const SettingsPage = React.lazy(() => import('../features/tenant/SettingsPage'));
const CategoriesPage = React.lazy(() => import('../features/categories/CategoriesPage'));
const ArticlesListPage = React.lazy(() => import('../features/articles/ArticlesListPage'));
const ArticleEditorPage = React.lazy(() => import('../features/articles/ArticleEditorPage'));
const AnalyticsPage = React.lazy(() => import('../features/analytics/AnalyticsPage'));

// Public customer Help Center routes
const PublicHelpLayout = React.lazy(() => import('../features/public/PublicHelpLayout'));
const PublicLandingPage = React.lazy(() => import('../features/public/PublicLandingPage'));
const PublicCategoryPage = React.lazy(() => import('../features/public/PublicCategoryPage'));
const PublicArticleDetailPage = React.lazy(() => import('../features/public/PublicArticleDetailPage'));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-gray-400 font-medium">Loading page...</span>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
  );
}
