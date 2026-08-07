import { authFetchApi } from './authFetch';

export type ApiReport = {
  id: string;
  targetType: 'comment' | 'room_message' | 'recommendation';
  targetId: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
};

export function createRecommendationReport(
  recommendationId: string,
  reason: string,
) {
  return authFetchApi<ApiReport>(
    `/recommendations/${recommendationId}/reports`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    },
  );
}
export function createCommentReport(commentId: string, reason: string) {
  return authFetchApi<ApiReport>(`/comments/${commentId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason.trim() }),
  });
}
export function createRoomMessageReport(
  roomId: string,
  messageId: string,
  reason: string,
) {
  return authFetchApi<ApiReport>(
    `/rooms/${roomId}/messages/${messageId}/reports`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    },
  );
}
