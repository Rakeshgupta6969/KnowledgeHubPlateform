import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Building, HelpCircle, Search, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

export default function PublicHelpLayout() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTenantConfig() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest(`/api/v1/public/${tenantSlug}`);
        setTenant(res.tenant);
      } catch (err) {
        setError(err?.error?.message || 'Help Center not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (tenantSlug) {
      loadTenantConfig();
    }
  }, [tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Help Center...</span>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-sm border border-gray-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Help Center Not Found</h1>
          <p className="text-xs text-gray-500">
            The workspace <strong className="font-mono text-gray-700">/{tenantSlug}</strong> does not exist or is currently inactive.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Go to KnowledgeHub Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.primaryColor || '#3B82F6';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Public Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={`/help/${tenant.slug}`} className="flex items-center gap-3">
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-8 max-w-[140px] object-contain"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name?.[0]?.toUpperCase() || 'H'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-base leading-tight">
                  {tenant.name}
                </span>
                <span className="text-[11px] text-gray-500">Help Center</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to={`/help/${tenant.slug}`}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                All Topics
              </Link>
              <Link
                to="/login"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
              >
                Company Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet context={{ tenant, primaryColor }} />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {tenant.name}. All documentation rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-semibold text-gray-700">KnowledgeHub SaaS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
