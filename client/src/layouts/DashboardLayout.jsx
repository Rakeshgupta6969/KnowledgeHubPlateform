import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  User,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Building,
  Shield,
  ChevronDown,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, currentTenant, currentMembership, memberships, switchTenant, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    EDITOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Categories', path: '/categories', icon: FolderTree },
    { name: 'Articles', path: '/articles', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <span className="font-bold text-gray-900 text-base">KnowledgeHub</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {memberships.length > 1 && (
            <select
              value={currentTenant?.id || ''}
              onChange={(e) => switchTenant(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700 max-w-[120px] truncate"
              aria-label="Switch workspace"
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.tenant.id}>
                  {m.tenant.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={logout}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm leading-tight">KnowledgeHub</span>
              <span className="text-[10px] text-gray-400 font-mono">Multi-Tenant SaaS</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Card / Tenant Switcher */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Workspace</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                roleColors[currentMembership?.role] || 'bg-gray-100 text-gray-700'
              }`}
            >
              <Shield className="w-3 h-3" />
              {currentMembership?.role || 'MEMBER'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Building className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{currentTenant?.name || 'Workspace'}</p>
              <p className="text-[10px] text-gray-500 truncate">/{currentTenant?.slug}</p>
            </div>
          </div>

          {/* Tenant Switcher: ONLY rendered if user has multiple memberships */}
          {memberships.length > 1 && (
            <div className="mt-3 pt-2.5 border-t border-gray-200">
              <label htmlFor="sidebar-tenant-select" className="text-[10px] font-medium text-gray-500 block mb-1">
                Switch Workspace ({memberships.length}):
              </label>
              <div className="relative">
                <select
                  id="sidebar-tenant-select"
                  value={currentTenant?.id || ''}
                  onChange={(e) => switchTenant(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md pl-2 pr-7 py-1.5 bg-white text-gray-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                  {memberships.map((m) => (
                    <option key={m.id} value={m.tenant.id}>
                      {m.tenant.name} ({m.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Public Help Center direct link */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <span className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Public Portal
            </span>
            <Link
              to={`/help/${currentTenant?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                View Help Center
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                /{currentTenant?.slug}
              </span>
            </Link>
          </div>
        </nav>

        {/* User Account & Sign Out Footer */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
