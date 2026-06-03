export const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getAuthUser = () => {
  let activeRole = sessionStorage.getItem('active_role');
  
  if (!activeRole) {
    // Fallback: Infer from URL if opening a new tab
    const path = window.location.pathname;
    if (path.startsWith('/portal') || path.startsWith('/client')) {
      activeRole = 'Client';
    } else if (path !== '/' && path !== '/login' && !path.startsWith('/invite')) {
      // Default to Admin/Staff for app routes if not explicitly client
      activeRole = 'Admin';
    }
  }

  // If no active role could be determined and we are at login/root, just return null
  if (!activeRole) return null;

  const key = activeRole === 'Client' ? 'auth_user_client' : 'auth_user_admin';
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user: any) => {
  const isClient = user.role === 'Client';
  const key = isClient ? 'auth_user_client' : 'auth_user_admin';
  localStorage.setItem(key, JSON.stringify(user));
  sessionStorage.setItem('active_role', isClient ? 'Client' : 'Admin');
};

export const removeAuthUser = () => {
  const activeRole = sessionStorage.getItem('active_role');
  if (activeRole === 'Client') {
    localStorage.removeItem('auth_user_client');
  } else if (activeRole === 'Admin' || activeRole === 'Staff') {
    localStorage.removeItem('auth_user_admin');
  } else {
    // Fallback if somehow active_role is missing during logout
    localStorage.removeItem('auth_user_admin');
    localStorage.removeItem('auth_user_client');
  }
  sessionStorage.removeItem('active_role');
};
