import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Restaurant } from "@/lib/types/database";

export type UserWithRestaurant = User & {
  restaurants: Restaurant | null;
};

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserWithProfile(): Promise<UserWithRestaurant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, restaurants(*)")
    .eq("id", user.id)
    .single();

  return profile as UserWithRestaurant | null;
}

// Check if user is authenticated (has Supabase session) but may not have profile yet
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Require auth but allow missing profile (for initialization flow)
export async function requireAuthAllowNoProfile() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getUserWithProfile();
  return { user, profile };
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAuthWithProfile(): Promise<UserWithRestaurant> {
  const profile = await getUserWithProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}
