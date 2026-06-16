import { fetchApi } from './client';

export const notifications = {
  getNotifications: async () => {
    return fetchApi('/notifications');
  },
  markNotificationAsRead: async (id: string) => {
    return fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllNotificationsAsRead: async () => {
    return fetchApi('/notifications/read-all', { method: 'PUT' });
  },
  deleteNotification: async (id: string) => {
    return fetchApi(`/notifications/${id}`, { method: 'DELETE' });
  },
  clearAllNotifications: async () => {
    return fetchApi('/notifications', { method: 'DELETE' });
  }
};
