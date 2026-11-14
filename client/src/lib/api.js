let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const activeTenantId = localStorage.getItem('kh_active_tenant_id');
  if (activeTenantId && !headers['x-tenant-id']) {
    headers['x-tenant-id'] = activeTenantId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly refresh token cookie
  });

  // Handle 401 Unauthorized by attempting to refresh token
  if (response.status === 401 && !options._retry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          _retry: true,
        }).then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw data || { error: { message: 'Request failed', code: 'API_ERROR' } };
          }
          return data;
        });
      } else {
        setAccessToken(null);
      }
    } catch (_err) {
      setAccessToken(null);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw data || { error: { message: 'Request failed', code: 'API_ERROR' } };
  }

  return data;
}
