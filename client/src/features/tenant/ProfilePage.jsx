import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { User, Shield, Building, CheckCircle2, Clock } from 'lucide-react';

export default function ProfilePage() {
  const { user, memberships, currentTenant, switchTenant } = useAuth();

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    EDITOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personal account details and active workspace memberships.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Account Active
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block mb-1">User ID:</span>
            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 block truncate">
              {user?.id}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Account Created:</span>
            <span className="text-gray-800 block py-1 font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Workspaces & Memberships Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">
              Workspace Memberships ({memberships.length})
            </h2>
          </div>
          <span className="text-xs text-gray-400">Multi-tenant access list</span>
        </div>

        <div className="divide-y divide-gray-100">
          {memberships.map((m) => {
            const isCurrent = m.tenant.id === currentTenant?.id;
            return (
              <div
                key={m.id}
                className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isCurrent ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0 mt-0.5">
                    {m.tenant.name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{m.tenant.name}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                          Active Workspace
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      Slug: /{m.tenant.slug}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Joined: {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      roleColors[m.role] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {m.role}
                  </span>

                  {!isCurrent && (
                    <button
                      onClick={() => switchTenant(m.tenant.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-colors shadow-sm"
                    >
                      Switch to Workspace
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
