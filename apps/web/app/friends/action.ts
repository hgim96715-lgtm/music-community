'use server';

import { friendsFetchJson } from '@/lib/friendsFetch';
import type { ApiFriendship } from '@/lib/apiTypes';
import { revalidatePath } from 'next/cache';

function revalidateFriends() {
  revalidatePath('/friends');
  revalidatePath('/friends/requests');
}

export async function acceptFriendRequest(friendshipId: string) {
  await friendsFetchJson<ApiFriendship>(`/friends/requests/${friendshipId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'accept',
    }),
  });
  revalidateFriends();
}

export async function declineFriendRequest(friendshipId: string) {
  await friendsFetchJson<ApiFriendship>(`/friends/requests/${friendshipId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'decline',
    }),
  });
  revalidateFriends();
}

export async function sendFriendRequest(userId: string) {
  await friendsFetchJson<ApiFriendship>(`/friends/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  revalidateFriends();
  revalidatePath(`/user/${userId}`);
}

/** 보낸 pending 취소 + 수락된 친구 삭제 — 같은 DELETE */
export async function removeFriend(otherUserId: string) {
  await friendsFetchJson<void>(`/friends/${otherUserId}`, {
    method: 'DELETE',
  });
  revalidateFriends();
  revalidatePath(`/user/${otherUserId}`);
}
