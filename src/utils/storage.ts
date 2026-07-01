export const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getActiveRole = (): string => {
  if (typeof window === 'undefined') return 'Admin';
  let activeRole = sessionStorage.getItem('active_role');

  if (!activeRole) {
    // Fallback: Infer from URL if opening a new tab or refreshing
    const path = window.location.pathname;
    if (path.startsWith('/workspace')) {
      activeRole = 'Staff';
    } else if (
      path.startsWith('/portal') || 
      path.startsWith('/client') || 
      path.startsWith('/gallery') || 
      path.startsWith('/deliverables') || 
      path.startsWith('/events') || 
      path.startsWith('/timeline') || 
      path.startsWith('/invoices') || 
      path.startsWith('/agreements') || 
      path.startsWith('/messages') || 
      path.startsWith('/support')
    ) {
      activeRole = 'Client';
    } else if (
      path !== '/' &&
      path !== '/login' &&
      !path.startsWith('/invite') &&
      !path.startsWith('/setup-account') &&
      !path.startsWith('/packages') &&
      path !== '/unauthorized'
    ) {
      activeRole = 'Admin';
    }

    if (activeRole) {
      sessionStorage.setItem('active_role', activeRole);
    }
  }

  return activeRole || 'Admin';
};

export const getAuthUser = () => {
  const activeRole = getActiveRole();

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
    localStorage.removeItem('auth_user_admin');
    localStorage.removeItem('auth_user_client');
    localStorage.removeItem('auth_user_staff');
  }
  sessionStorage.removeItem('active_role');
};
