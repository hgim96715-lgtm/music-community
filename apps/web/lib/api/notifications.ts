import type { ApiNotification } from './apiTypes';
import { authFetchApi } from './authFetch';

export function fetchNotifications(): Promise<ApiNotification[]> {
  return authFetchApi<ApiNotification[]>('/notifications');
}

export function fetchNotificationUnreadCount(): Promise<{ count: number }> {
  return authFetchApi<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<ApiNotification> {
  return authFetchApi<ApiNotification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return authFetchApi<{ ok: boolean }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
