"use server";

import { adminFetchVoid } from "@/lib/adminFetch";
import { getApiAccessToken } from "@/lib/getApiAccessToken";
import { revalidatePath } from "next/cache";

export async function setRecommendationHidden(id: string, hidden: boolean) {
  await adminFetchVoid(`/admin/recommendations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ hidden }),
  });
  revalidatePath("/admin/recommendations");
}

export async function deleteRecommendation(id: string) {
  await adminFetchVoid(`/admin/recommendations/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/admin/recommendations");
  revalidatePath("/");
}
