import { ApiAdminRoom, ApiAdminRoomsPage, ApiAdminUsersPage } from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';

export function adminFetchJson<T>(path: string, init?: RequestInit) {
  return authFetchApi<T>(`/admin${path}`, init);
}

export function adminFetchVoid(path: string, init?: RequestInit) {
  return authFetchApiVoid(`/admin${path}`, init);
}

export function fetchAdminRooms(
  opts: {
    q?: string;
    status?: 'active' | 'closed' | 'archived';
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ApiAdminRoomsPage> {
  const sp = new URLSearchParams();
  if (opts.q?.trim()) sp.set('q', opts.q.trim());
  if (opts.status) sp.set('status', opts.status);
  if (opts.cursor) sp.set('cursor', opts.cursor);
  if (opts.limit != null) sp.set('limit', opts.limit.toString());
  const qs = sp.toString();
  return adminFetchJson<ApiAdminRoomsPage>(qs ? `/rooms?${qs}` : '/rooms');
}

export function fetchAdminUsers(
  opts: {
    q?: string;
    role?: 'user' | 'admin';
    inactiveDays?: number;
    activeToday?: boolean;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ApiAdminUsersPage> {
  const sp = new URLSearchParams();
  if (opts.q?.trim()) sp.set('q', opts.q.trim());
  if (opts.role) sp.set('role', opts.role);
  if (opts.inactiveDays != null)
    sp.set('inactiveDays', opts.inactiveDays.toString());
  if (opts.activeToday) sp.set('activeToday', 'true');
  if (opts.cursor) sp.set('cursor', opts.cursor);
  if (opts.limit != null) sp.set('limit', opts.limit.toString());
  const qs = sp.toString();
  return adminFetchJson<ApiAdminUsersPage>(qs ? `/users?${qs}` : `/users`);
}

export function patchAdminRoomStatus(
  id: string,
  status: 'active' | 'closed' | 'archived',
  reason?: string,
): Promise<ApiAdminRoom> {
  return adminFetchJson<ApiAdminRoom>(`/rooms/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    }),
  });
}
