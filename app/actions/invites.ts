"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createInvite(input: {
  restaurantId?: string; // Optional for admin
  role: "owner" | "staff";
  email?: string | null;
  expiresAt?: string | null; // ISO string
}) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profileData } = await db
    .from("users")
    .select("restaurant_id, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null; role?: string } | null;
  const targetRestaurantId = profile?.role === "admin" && input.restaurantId
    ? input.restaurantId
    : profile?.restaurant_id;

  if (!targetRestaurantId) {
    return { error: "Aucun restaurant trouvé" };
  }

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Non autorisé" };
  }

  const { data, error } = await db
    .from("invites")
    .insert({
      restaurant_id: targetRestaurantId,
      role: input.role,
      email: input.email ?? null,
      expires_at: input.expiresAt ?? null,
      created_by: user.id,
    })
    .select("token")
    .single();

  if (error) {
    console.error("Create invite error:", error);
    return { error: "Erreur lors de la création de l'invitation" };
  }

  return { success: true, token: (data as { token: string }).token };
}

export async function sendInviteEmail(input: {
  restaurantId?: string;
  role: "owner" | "staff";
  email: string;
}) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profileData } = await db
    .from("users")
    .select("restaurant_id, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null; role?: string } | null;
  const targetRestaurantId = profile?.role === "admin" && input.restaurantId
    ? input.restaurantId
    : profile?.restaurant_id;

  if (!targetRestaurantId) {
    return { error: "Aucun restaurant trouvé" };
  }

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Non autorisé" };
  }

  const { data: restaurantData } = await db
    .from("restaurants")
    .select("name")
    .eq("id", targetRestaurantId)
    .single();

  const restaurantName = (restaurantData as { name?: string } | null)?.name || "Restaurant";

  const { data: inviteData, error: inviteError } = await db
    .from("invites")
    .insert({
      restaurant_id: targetRestaurantId,
      role: input.role,
      email: input.email,
      created_by: user.id,
    })
    .select("id, token")
    .single();

  if (inviteError || !inviteData) {
    console.error("Create invite error:", inviteError);
    return { error: "Erreur lors de la création de l'invitation" };
  }

  const invite = inviteData as { id: string; token: string };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return { error: "NEXT_PUBLIC_SITE_URL manquant" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${siteUrl}/reset-password`,
      data: {
        invite_token: invite.token,
        restaurant_name: restaurantName,
      },
    });

    if (error) {
      await db.from("invites").delete().eq("id", invite.id);
      return { error: error.message };
    }
  } catch (err) {
    await db.from("invites").delete().eq("id", invite.id);
    return { error: err instanceof Error ? err.message : "Erreur lors de l'envoi" };
  }

  return { success: true, token: invite.token };
}
