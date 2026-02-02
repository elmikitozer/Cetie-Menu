import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User, Restaurant, UserRole } from "@/lib/types/database";

const ADMIN_RESTAURANT_COOKIE = "admin_selected_restaurant";

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

// Check if user is admin
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

// Get all restaurants (for admins)
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");
  return (data as Restaurant[]) || [];
}

// Get admin's selected restaurant ID from cookie
export async function getAdminSelectedRestaurantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_RESTAURANT_COOKIE)?.value || null;
}

// Get the effective restaurant for an admin (selected or first available)
export async function getAdminEffectiveRestaurant(): Promise<Restaurant | null> {
  const selectedId = await getAdminSelectedRestaurantId();
  const supabase = await createClient();

  if (selectedId) {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", selectedId)
      .single();
    if (data) return data as Restaurant;
  }

  // Fallback to first restaurant
  const { data: first } = await supabase
    .from("restaurants")
    .select("*")
    .order("name")
    .limit(1)
    .single();

  if (!first) return null;
  return first as Restaurant;
}

// Get user profile with effective restaurant (handles admin case)
export async function getUserWithEffectiveRestaurant(): Promise<UserWithRestaurant | null> {
  const profile = await getUserWithProfile();
  if (!profile) return null;

  // If admin, get selected restaurant
  if (profile.role === "admin") {
    const effectiveRestaurant = await getAdminEffectiveRestaurant();
    return {
      ...profile,
      restaurants: effectiveRestaurant,
    };
  }

  return profile;
}

// Require auth with effective restaurant (for dashboard pages)
export async function requireAuthWithEffectiveRestaurant(): Promise<UserWithRestaurant> {
  const profile = await getUserWithEffectiveRestaurant();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}
