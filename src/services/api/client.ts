import { safeParse, getActiveRole } from '../../utils/storage';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getAccessToken = () => {
  const role = getActiveRole();
  const key = `access_token_${role.toLowerCase()}`;
  return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
};

export const setAccessToken = (token: string) => {
  const role = getActiveRole();
  const key = `access_token_${role.toLowerCase()}`;

  sessionStorage.setItem(key, token);
  localStorage.setItem(key, token);
};

export const getRefreshToken = () => {
  const role = getActiveRole();
  return localStorage.getItem(`refresh_token_${role.toLowerCase()}`);
};

export const setRefreshToken = (token: string) => {
  const role = getActiveRole();
  localStorage.setItem(`refresh_token_${role.toLowerCase()}`, token);
};

export const clearTokens = () => {
  const role = getActiveRole();
  const key = `access_token_${role.toLowerCase()}`;
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
  localStorage.removeItem(`refresh_token_${role.toLowerCase()}`);
};

const generateCorrelationId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'corr-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
};

const triggerFallbackWarning = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-fallback-active', { detail: { active: true } }));
  }
};

const clearFallbackWarning = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-fallback-active', { detail: { active: false } }));
  }
};

const delayMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const handleLogoutRedirect = () => {
  clearTokens();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user_admin');
    localStorage.removeItem('auth_user_client');
    localStorage.removeItem('auth_user_staff');
    sessionStorage.removeItem('active_role');
    window.location.href = '/login';
  }
};

export const fetchApi = async (endpoint: string, options: any = {}): Promise<any> => {
  const url = `${API_URL}${endpoint}`;

  const token = getAccessToken();
  const correlationId = generateCorrelationId();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-Correlation-ID': correlationId,
    ...((options.headers as Record<string, string>) || {})
  };

  const finalOptions = {
    ...options,
    headers
  };

  const retries = 3;
  let backoff = 300;
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, finalOptions);

      // Handle 401 unauthorized (attempt token refresh)
      if (response.status === 401 && !options._isRetry) {
        if (endpoint === '/auth/refresh' || endpoint === '/auth/login') {
          throw new Error('Authentication failed');
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${newToken}`,
              };
              fetchApi(endpoint, { ...options, headers: retryHeaders, _isRetry: true })
                .then(resolve)
                .catch(reject);
            });
          });
        }

        isRefreshing = true;
        const rToken = getRefreshToken();
        if (!rToken) {
          isRefreshing = false;
          handleLogoutRedirect();
          throw new Error('Session expired. Please log in again.');
        }

        try {
          console.log('[AUTH] Access token expired, attempting rotation...');
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': generateCorrelationId()
            },
            body: JSON.stringify({ refreshToken: rToken })
          });

          if (!refreshResponse.ok) {
            throw new Error('Refresh token invalid');
          }

          const refreshData = await refreshResponse.json();
          setAccessToken(refreshData.accessToken);
          setRefreshToken(refreshData.refreshToken);

          isRefreshing = false;
          onRefreshed(refreshData.accessToken);

          // Retry the original request
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${refreshData.accessToken}`,
          };
          return await fetchApi(endpoint, { ...options, headers: retryHeaders, _isRetry: true });
        } catch (refreshErr) {
          isRefreshing = false;
          console.error('[AUTH] Refresh token rotation failed, logging out', refreshErr);
          handleLogoutRedirect();
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Retry on 5xx status codes
      if (response.status >= 500 && i < retries - 1) {
        console.warn(`Server error ${response.status}. Retrying in ${backoff}ms...`);
        await delayMs(backoff);
        backoff *= 2;
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || `HTTP error! status: ${response.status}`) as any;
        err.data = errorData;
        err.status = response.status;
        throw err;
      }

      clearFallbackWarning();
      return await response.json();
    } catch (error: any) {
      lastError = error;

      const isNetworkError = error instanceof Error && (
        error.name === 'TypeError' ||
        error.message === 'Failed to fetch' ||
        error.message.includes('Network connection error') ||
        error.message.includes('NetworkError')
      );

      if (isNetworkError) {
        triggerFallbackWarning();
        if (i < retries - 1) {
          console.warn(`Transient network failure. Retrying in ${backoff}ms...`, error);
          await delayMs(backoff);
          backoff *= 2;
          continue;
        }
      } else {
        throw error;
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
};

export const checkClientBlock = (action: string) => {
  const user = safeParse<Record<string, any>>('user', {});
  if (user && user.role === 'Client') {
    console.error(`[SECURITY] Blocked ${user.role} from performing administrative action: ${action}`);
    throw new Error(`Permission Denied: Clients cannot perform administrative operation '${action}'`);
  }
};

