import type { Recommendation } from './types';

/** 3단계 mock — 4단계부터 fetchRecommendations()로 교체 */
export const mockRecommendations: Recommendation[] = [
  {
    id: 'mock-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    embedUrl: 'https://www.youtube.com/embed/4NRXx6U8abQ',
    reason: '밤에 혼자 걸을 때 듣기 좋아요.',
    moods: ['새벽', '운전'],
    likeCount: 12,
    commentCount: 0,
    author: { id: 'mock-user-1', nickname: 'night_driver' },
    createdAt: '2026-06-24T10:00:00.000Z',
  },
  {
    id: 'mock-2',
    title: 'Rainy Day',
    artist: 'Sample Artist',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    reason: '비 오는 날 창문 열고 듣는 곡.',
    moods: ['비', '우울'],
    likeCount: 3,
    likedByMe: true,
    commentCount: 0,
    author: { id: 'mock-user-2', nickname: 'rainy_mood' },
    createdAt: '2026-06-23T18:30:00.000Z',
  },
];
