import { fetchApi } from './client';
import { type Staff, type ActivityLog, type User } from '../../types';



export const users = {
  getStaff: async (): Promise<Staff[]> => {
    const data = await fetchApi('/users');
    if (Array.isArray(data)) {
      return data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        loginId: u.email,
        role: u.role,
        isActive: !u.lockedUntil,
        permissions: {
          canManageClients: u.role === 'SystemAdmin' || u.role === 'Manager',
          canManageFinance: u.role === 'SystemAdmin' || u.role === 'Manager',
          canManageTasks: true,
          canUseAI: true,
          canManageEcosystem: u.role === 'SystemAdmin' || u.role === 'Manager'
        }
      }));
    }
    return [];
  },
  saveStaff: async (staff: Staff) => {
    const userPayload = {
      email: staff.email,
      firstName: staff.name.split(' ')[0] || staff.name,
      lastName: staff.name.split(' ').slice(1).join(' ') || 'User',
      role: staff.role
    };
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (isUuid(staff.id)) {
      return fetchApi(`/users/${staff.id}`, {
        method: 'PUT',
        body: JSON.stringify(userPayload)
      });
    } else {
      return fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...userPayload,
          password: staff.password || 'TemporaryPassword123!'
        })
      });
    }
  },
  deleteStaff: async (id: string) => {
    return fetchApi(`/users/${id}`, { method: 'DELETE' });
  },
  getUsers: async (): Promise<User[]> => {
    return fetchApi('/users');
  },
  updateUser: async (id: string, payload: any): Promise<any> => {
    return fetchApi(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  getLogs: async (): Promise<ActivityLog[]> => {
    return fetchApi('/logs');
  },
  logActivity: async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    return fetchApi('/logs', { method: 'POST', body: JSON.stringify(log) }).catch(() => null);
  }
};
