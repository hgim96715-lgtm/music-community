import type {
  ApiFriendRequests,
  ApiFriendship,
  ApiPublicUser,
} from './apiTypes';

/** Friendship row에서 나 말고 상대 */
export function otherUser(
  friendship: ApiFriendship,
  myId: string,
): Pick<ApiPublicUser, 'id' | 'nickname' | 'image'> {
  return friendship.requesterId === myId
    ? friendship.addressee
    : friendship.requester;
}

export type FriendRelation =
  | 'guest'
  | 'self'
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends';

export function friendRelationWith(args: {
  myId: string | null;
  profileUserId: string;
  friends: ApiFriendship[];
  requests: ApiFriendRequests;
}): FriendRelation {
  const { myId, profileUserId, friends, requests } = args;
  if (!myId) return 'guest';
  if (myId === profileUserId) return 'self';
  const isFriend = friends.some(
    (f) =>
      f.status === 'accepted' &&
      (f.requesterId === profileUserId || f.addresseeId === profileUserId),
  );
  if (isFriend) return 'friends';

  if (requests.sent.some((f) => f.addresseeId === profileUserId))
    return 'pending_sent';
  if (requests.received.some((f) => f.requesterId === profileUserId)) {
    return 'pending_received';
  }
  return 'none';
}

export function friendRelationLabel(
  relation: FriendRelation,
  blockedByMe = false,
): string {
  if (blockedByMe) return '차단함';
  switch (relation) {
    case 'guest':
      return '로그인이 필요해요';
    case 'self':
      return '나';
    case 'none':
      return '친구 아님';
    case 'pending_sent':
      return '요청 보냄';
    case 'pending_received':
      return '친구 요청 받음';
    case 'friends':
      return '친구';
  }
}
