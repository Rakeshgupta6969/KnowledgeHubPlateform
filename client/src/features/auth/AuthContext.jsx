import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAccessToken } from '../../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt silent refresh on app startup
  useEffect(() => {
    async function initAuth() {
      try {
        const refreshData = await apiRequest('/api/v1/auth/refresh', { method: 'POST' });
        if (refreshData?.accessToken) {
          setAccessToken(refreshData.accessToken);
          const meData = await apiRequest('/api/v1/auth/me');
          setUser(meData.user);
          setMemberships(meData.memberships || []);

          // Load current tenant context
          const tenantData = await apiRequest('/api/v1/tenant/current');
          setCurrentTenant(tenantData.tenant);
          setCurrentMembership(tenantData.membership);
        }
      } catch (_err) {
        // Not logged in or expired session
        setAccessToken(null);
        setUser(null);
        setCurrentTenant(null);
        setCurrentMembership(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAccessToken(data.accessToken);
    setUser(data.user);
    setMemberships(data.memberships || []);

    // Load active workspace details
    const tenantData = await apiRequest('/api/v1/tenant/current');
    setCurrentTenant(tenantData.tenant);
    setCurrentMembership(tenantData.membership);

    return data;
  }

  async function register(companyName, slug, name, email, password) {
    const payload = { companyName, name, email, password };
    if (slug && slug.trim()) {
      payload.slug = slug.trim();
    }

    const data = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setAccessToken(data.accessToken);
    setUser(data.user);
    setCurrentTenant(data.tenant);
    setCurrentMembership(data.membership);

    const meData = await apiRequest('/api/v1/auth/me');
    setMemberships(meData.memberships || []);

    return data;
  }

  async function logout() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch (_err) {
      // Continue client cleanup even if network fails
    }
    setAccessToken(null);
    setUser(null);
    setMemberships([]);
    setCurrentTenant(null);
    setCurrentMembership(null);
    localStorage.removeItem('kh_active_tenant_id');
  }

  async function switchTenant(tenantId) {
    localStorage.setItem('kh_active_tenant_id', tenantId);
    try {
      const tenantData = await apiRequest('/api/v1/tenant/current', {
        headers: { 'x-tenant-id': tenantId },
      });
      setCurrentTenant(tenantData.tenant);
      setCurrentMembership(tenantData.membership);
    } catch (err) {
      console.error('Failed to switch tenant:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        currentTenant,
        currentMembership,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
