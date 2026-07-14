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
