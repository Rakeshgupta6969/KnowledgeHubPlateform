import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Building, Shield, User, LogOut, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, currentTenant, currentMembership, memberships, switchTenant, logout } = useAuth();

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    EDITOR: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                K
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">KnowledgeHub</span>
                <span className="ml-2 text-xs text-gray-500 font-mono">Week 1 MVP</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tenant switcher if user belongs to more than 1 tenant */}
              {memberships.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Workspace:</span>
                  <select
                    value={currentTenant?.id || ''}
                    onChange={(e) => switchTenant(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {memberships.map((m) => (
                      <option key={m.id} value={m.tenant.id}>
                        {m.tenant.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Connected to company workspace: <span className="font-semibold text-gray-800">{currentTenant?.name}</span>
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

        {/* Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Workspace Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Workspace Details</h2>
                <p className="text-xs text-gray-500">Derived strictly from membership</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Company:</span>
                <span className="font-medium text-gray-900">{currentTenant?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Slug:</span>
                <span className="font-mono text-gray-800">/help/{currentTenant?.slug}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Workspace ID:</span>
                <span className="font-mono text-gray-500 truncate max-w-[150px]">{currentTenant?.id}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Tenant Status:</span>
                <span className="font-semibold text-emerald-600 uppercase">{currentTenant?.status}</span>
              </div>
            </div>
          </div>

          {/* User & Role Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">User Identity</h2>
                <p className="text-xs text-gray-500">Authenticated JWT session</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Role in Workspace:</span>
                <span className="font-semibold text-purple-700">{currentMembership?.role}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Membership Status:</span>
                <span className="font-semibold text-emerald-600 uppercase">{currentMembership?.status}</span>
              </div>
            </div>
          </div>

          {/* Architecture & Week 1 Status Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Security Architecture</h2>
                <p className="text-xs text-gray-500">Week 1 Non-negotiables</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Tenant isolation derived strictly from verified membership</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Atomic transaction for registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Short-lived access token + HttpOnly refresh cookie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Revocable database session on logout</span>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Public Help Center Route:</span>
                <span className="font-mono text-blue-600">/help/{currentTenant?.slug}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
