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
    } else if (path.startsWith('/workspace') || path.startsWith('/staff')) {
      activeRole = 'Staff';
    } else if (path !== '/' && path !== '/login' && !path.startsWith('/invite')) {
      // Default to Admin for app routes if not explicitly client or staff
      activeRole = 'Admin';
    }
  }

  // If no active role could be determined and we are at login/root, just return null
  if (!activeRole) return null;

  let key = 'auth_user_admin';
  if (activeRole === 'Client') key = 'auth_user_client';
  if (activeRole === 'Staff') key = 'auth_user_staff';

  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user: any) => {
  let activeRole = 'Admin';
  let key = 'auth_user_admin';
  
  if (user.role === 'Client') {
    activeRole = 'Client';
    key = 'auth_user_client';
  } else if (user.role === 'Staff') {
    activeRole = 'Staff';
    key = 'auth_user_staff';
  }

  localStorage.setItem(key, JSON.stringify(user));
  sessionStorage.setItem('active_role', activeRole);
};

export const removeAuthUser = () => {
  const activeRole = sessionStorage.getItem('active_role');
  if (activeRole === 'Client') {
    localStorage.removeItem('auth_user_client');
  } else if (activeRole === 'Staff') {
    localStorage.removeItem('auth_user_staff');
  } else if (activeRole === 'Admin') {
    localStorage.removeItem('auth_user_admin');
  } else {
    // Fallback if somehow active_role is missing during logout
    localStorage.removeItem('auth_user_admin');
    localStorage.removeItem('auth_user_client');
    localStorage.removeItem('auth_user_staff');
  }
  sessionStorage.removeItem('active_role');
};
