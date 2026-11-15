import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../../lib/api';
import { Settings, Building, Palette, Shield, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const { currentTenant, currentMembership } = useAuth();
  const isAuthorized = currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';

  const [name, setName] = useState(currentTenant?.name || '');
  const [primaryColor, setPrimaryColor] = useState(currentTenant?.primaryColor || '#3B82F6');
  const [logoUrl, setLogoUrl] = useState(currentTenant?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    if (!isAuthorized) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await apiRequest('/api/v1/tenant/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          primaryColor: primaryColor.trim() || null,
          logoUrl: logoUrl.trim() || null,
        }),
      });

      if (res?.tenant) {
        setSuccessMessage('Workspace settings saved successfully.');
        // Refresh page state smoothly
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      setErrorMessage(err?.error?.message || 'Failed to update workspace settings.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage company branding, workspace metadata and public configuration.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isAuthorized && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>
            You have <strong className="font-semibold">{currentMembership?.role}</strong> permissions. Only Workspace Owners and Admins can update workspace configuration.
          </span>
        </div>
      )}

      {/* Workspace Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-bold text-gray-900">General Information</h2>
          <p className="text-xs text-gray-500">Core company identifiers</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAuthorized || isSaving}
              required
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Public Subdomain / Slug <span className="text-gray-400 font-normal">(Immutable)</span>
            </label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-xs text-gray-500 font-mono">
                /help/
              </span>
              <input
                type="text"
                value={currentTenant?.slug || ''}
                disabled
                className="w-full text-sm font-mono border border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Used to route customer traffic to your public Help Center.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Workspace ID</label>
            <input
              type="text"
              value={currentTenant?.id || ''}
              disabled
              className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="border-b border-gray-100 pt-4 pb-4">
          <h2 className="text-base font-bold text-gray-900">Custom Branding</h2>
          <p className="text-xs text-gray-500">Visual customizations for your public Help Center</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!isAuthorized || isSaving}
                className="w-10 h-10 rounded border border-gray-300 p-0.5 cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!isAuthorized || isSaving}
                placeholder="#3B82F6"
                className="w-36 text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500">
                Applied to buttons, badges, and headers on public pages.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Logo URL (Optional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!isAuthorized || isSaving}
              placeholder="https://example.com/logo.png"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {isAuthorized && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Workspace Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
