import type {
  ApiAuthor,
  ApiFriendRequests,
  ApiFriendship,
} from './apiTypes';

/** Friendship 한 건에서 나(myId) 말고 상대 유저 */
export function otherUser(f: ApiFriendship, myId: string): ApiAuthor {
  return f.requesterId === myId ? f.addressee : f.requester;
}

export type FriendRelation =
  | 'self'
  | 'guest'
  | 'none'
  | 'friends'
  | 'pending_sent'
  | 'pending_received';

/** 프로필 주인과 나 사이 친구 관계 (UI 분기용) */
export function friendRelationWith(
  myId: string | undefined,
  profileUserId: string,
  friends: ApiFriendship[],
  requests: ApiFriendRequests,
): { relation: FriendRelation; friendshipId?: string } {
  if (!myId) return { relation: 'guest' };
  if (myId === profileUserId) return { relation: 'self' };

  const accepted = friends.find(
    (f) => otherUser(f, myId).id === profileUserId,
  );
  if (accepted) return { relation: 'friends', friendshipId: accepted.id };

  const sent = requests.sent.find(
    (f) => otherUser(f, myId).id === profileUserId,
  );
  if (sent) return { relation: 'pending_sent', friendshipId: sent.id };

  const received = requests.received.find(
    (f) => otherUser(f, myId).id === profileUserId,
  );
  if (received) {
    return { relation: 'pending_received', friendshipId: received.id };
  }

  return { relation: 'none' };
}
