const API_BASE_URL = 'http://localhost:8000';

function getCookie(name: string): string | null {
  if (!document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken || '';
    }
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
  }
  return getCookie('csrftoken') || '';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: any | null; status: number }> {
  let csrfToken = getCookie('csrftoken');
  if (!csrfToken && options.method && options.method !== 'GET') {
    csrfToken = await fetchCsrfToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (csrfToken && options.method && options.method !== 'GET') {
    headers['X-CSRFToken'] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const result = isJson ? await response.json() : null;

    if (!response.ok) {
      return { data: null, error: result || 'Request failed', status: response.status };
    }

    return { data: result, error: null, status: response.status };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error', status: 0 };
  }
}
