import { ApiRecommendation } from './apiTypes';
import { displayAuthorNickname } from './displayAuthor';
import { Recommendation } from './types';

const ANONYMOUS_AUTHOR = {
  id: '',
  nickname: '익명',
} as const;

function countLikes(reactions: ApiRecommendation['reactions']): number {
  return reactions.filter((reaction) => reaction.type === 'like').length;
}

/** Api JSON 1건 → 피드 카드 props */
export function mapRecommendation(
  api: ApiRecommendation,
  currentUserId?: string,
): Recommendation {
  const likedByMe = currentUserId
    ? api.reactions.some(
        (reaction) =>
          reaction.type === 'like' && reaction.userId === currentUserId,
      )
    : undefined;

  return {
    id: api.id,
    title: api.title,
    artist: api.artist,
    embedUrl: api.embedUrl,
    reason: api.reason,
    moods: api.moods,
    likeCount: countLikes(api.reactions),
    likedByMe,
    commentCount: api._count?.comments ?? 0,
    author: api.author
      ? {
          id: api.author.id,
          nickname: displayAuthorNickname(api.author.nickname),
        }
      : ANONYMOUS_AUTHOR,
    createdAt: api.createdAt,
  };
}

export function mapRecommendations(
  apis: ApiRecommendation[],
  currentUserId?: string,
): Recommendation[] {
  return apis.map((api) => mapRecommendation(api, currentUserId));
}
