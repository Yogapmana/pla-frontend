import api from './client';

export const notificationApi = {
  getNotifications: (limit = 50) => api.get(`/notifications?limit=${limit}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/notifications'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (prefs) => api.put('/notifications/preferences', prefs)
};
