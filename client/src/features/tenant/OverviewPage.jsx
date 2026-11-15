import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Building, Shield, User, FolderTree, FileText, Settings, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function OverviewPage() {
  const { user, currentTenant, currentMembership } = useAuth();

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    EDITOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Managing company workspace: <span className="font-semibold text-gray-800">{currentTenant?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              roleColors[currentMembership?.role] || 'bg-gray-100 text-gray-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {currentMembership?.role || 'MEMBER'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tenant Isolated
          </span>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          to="/articles"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
              Manage &rarr;
            </span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Articles</h2>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, publish and archive customer-facing documentation.
          </p>
        </Link>

        <Link
          to="/categories"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FolderTree className="w-5 h-5" />
            </div>
            <span className="text-xs text-purple-600 font-medium group-hover:translate-x-0.5 transition-transform">
              Manage &rarr;
            </span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Categories</h2>
          <p className="text-xs text-gray-500 mt-1">
            Organize knowledge base articles into structured topics and ordering.
          </p>
        </Link>

        <Link
          to={`/help/${currentTenant?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ExternalLink className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform">
              Open &rarr;
            </span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Public Help Center</h2>
          <p className="text-xs text-gray-500 mt-1">
            Preview the published customer-facing portal for this workspace.
          </p>
        </Link>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Active Workspace</h2>
              <p className="text-xs text-gray-500">Derived strictly from active membership</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Company Name:</span>
              <span className="font-medium text-gray-900">{currentTenant?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Public URL Path:</span>
              <span className="font-mono text-blue-600 font-semibold">/help/{currentTenant?.slug}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Workspace ID:</span>
              <span className="font-mono text-gray-500 truncate max-w-[200px]">{currentTenant?.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Tenant Status:</span>
              <span className="font-semibold text-emerald-600 uppercase">{currentTenant?.status}</span>
            </div>
          </div>
        </div>

        {/* User Identity Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">User Identity & Access</h2>
              <p className="text-xs text-gray-500">Authenticated session</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Full Name:</span>
              <span className="font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Role in Workspace:</span>
              <span className="font-semibold text-purple-700">{currentMembership?.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Membership Status:</span>
              <span className="font-semibold text-emerald-600 uppercase">{currentMembership?.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
