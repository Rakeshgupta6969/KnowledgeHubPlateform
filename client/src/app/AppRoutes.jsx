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
        <Route
          path="articles"
          element={<div className="p-8 text-gray-500">Articles management loading...</div>}
        />
        <Route
          path="articles/new"
          element={<div className="p-8 text-gray-500">New article editor loading...</div>}
        />
        <Route
          path="articles/:articleId/edit"
          element={<div className="p-8 text-gray-500">Article editor loading...</div>}
        />
      </Route>

      {/* Public customer-facing Help Center routes (will be populated in Phase E) */}
      <Route
        path="/help/:tenantSlug"
        element={<div className="p-8 text-gray-700">Public Help Center loading...</div>}
      />
      <Route
        path="/help/:tenantSlug/category/:categorySlug"
        element={<div className="p-8 text-gray-700">Public Category page loading...</div>}
      />
      <Route
        path="/help/:tenantSlug/article/:articleSlug"
        element={<div className="p-8 text-gray-700">Public Article page loading...</div>}
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
