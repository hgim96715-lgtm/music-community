import type { Recommendation } from "./types";

export const mockRecommendations: Recommendation[] = [
  {
    id: "mock-1",
    title: "Spring Day",
    artist: "BTS",
    embedUrl: "https://www.youtube.com/embed/xEeFrLSkMm8",
    reason: "비 오는 날 창밖 보면서 듣기 좋아요.",
    moods: ["비", "힐링"],
    likeCount: 12,
    likedByMe: false,
    author: {
      id: "user-1",
      nickname: "음악덕후",
    },
    createdAt: "2026-06-19T10:00:00.000Z",
  },
  {
    id: "mock-2",
    title: "Night Drive",
    artist: "Unknown Artist",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    reason: "야간 운전할 때 집중되는 곡.",
    moods: ["운전", "집중", "새벽"],
    likeCount: 5,
    author: {
      id: "user-2",
      nickname: "드라이브러",
    },
    createdAt: "2026-06-18T22:30:00.000Z",
  },
];
