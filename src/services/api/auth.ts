import { fetchApi, setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from './client';

export const auth = {
  login: async (email: string, password: string) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  logout: async () => {
    const rToken = getRefreshToken();
    try {
      if (rToken) {
        await fetchApi('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rToken })
        });
      }
    } catch (err) {
      console.warn("Logout request to backend failed", err);
    } finally {
      clearTokens();
    }
  },

  refresh: async (refreshToken: string) => {
    const data = await fetchApi('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  resendVerificationEmailPublic: async (email: string) => {
    return fetchApi('/auth/email-verification/resend', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  setupMfa: async () => {
    return fetchApi('/auth/mfa/setup', {
      method: 'POST'
    });
  },

  enableMfa: async (code: string) => {
    return fetchApi('/auth/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  verifyMfaLogin: async (tempToken: string, code: string) => {
    const data = await fetchApi('/auth/mfa/login-verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code })
    });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  changePassword: async (passwordPayload: any) => {
    return fetchApi('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordPayload)
    });
  },

  confirmEmailVerification: async (token: string) => {
    return fetchApi('/auth/email-verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  activateClient: async (payload: { token: string; password?: string; confirmPassword?: string }) => {
    return fetchApi('/auth/activate-client', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

