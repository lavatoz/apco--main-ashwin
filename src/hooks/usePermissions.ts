import { useMemo } from 'react';
import { getAuthUser } from '../utils/storage';
import type { UserPermission, UserRole } from '../types';

interface UserSession {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions: UserPermission[];
}

export const usePermissions = () => {
  const user = getAuthUser() as UserSession | null;

  const hasPermission = (permission: UserPermission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions.includes(permission);
  };

  const isRole = (role: UserRole) => {
    return user?.role === role;
  };

  const routePermissionMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/command-center": "dashboard",
    "/ledger": "finance",
    "/tasks": "tasks",
    "/directory": "clients",
    "/workflow": "workflow",
    "/analytics": "analytics",
    "/copilot": "ai"
  };

  const hasRoutePermission = (route: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    
    const requiredPermission = routePermissionMap[route];
    console.log("Permission Check Log:");
    console.log("- User permissions:", user.permissions);
    console.log("- Route:", route);
    console.log("- Mapped permission:", requiredPermission);
    
    if (!requiredPermission) return true; // Public or unknown route
    
    return user.permissions.includes(requiredPermission as UserPermission);
  };

  const userPermissionsStr = JSON.stringify(user?.permissions);
  const firstAllowedRoute = useMemo(() => {
    if (!user || !user.permissions.length) return '/login';
    
    // Reverse Map for redirection with priority
    const permissionToRoute: Record<string, string> = {
      dashboard: '/dashboard',
      finance: '/ledger',
      tasks: '/tasks',
      clients: '/directory',
      workflow: '/workflow',
      analytics: '/analytics',
      ai: '/copilot'
    };

    // Priority order for redirection
    const priorities = ['dashboard', 'finance', 'tasks', 'clients', 'workflow', 'analytics', 'ai'];
    
    for (const p of priorities) {
        if (user.permissions.includes(p as UserPermission) && permissionToRoute[p]) {
            return permissionToRoute[p];
        }
    }

    return permissionToRoute[user.permissions[0]] || '/dashboard';
  }, [user?.id, userPermissionsStr]);

  const canEdit = useMemo(() => {
    return user?.role === 'Admin' || user?.role === 'Staff';
  }, [user?.role]);

  const canDelete = useMemo(() => {
    return user?.role === 'Admin';
  }, [user?.role]);

  return { user, hasPermission, isRole, firstAllowedRoute, canEdit, canDelete, hasRoutePermission };
};
