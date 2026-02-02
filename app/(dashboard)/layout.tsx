import { Header, MobileNav } from "@/components/layout";
import { requireAuthAllowNoProfile, getAllRestaurants, getAdminEffectiveRestaurant } from "@/lib/auth";
import { AdminRestaurantSelector } from "@/components/dashboard/AdminRestaurantSelector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuthAllowNoProfile();
  const isAdmin = profile?.role === "admin";

  // For admins, get the effective restaurant (selected or default)
  // For regular users, use their linked restaurant
  let restaurant = profile?.restaurants;
  let allRestaurants: Awaited<ReturnType<typeof getAllRestaurants>> = [];

  if (isAdmin) {
    [restaurant, allRestaurants] = await Promise.all([
      getAdminEffectiveRestaurant(),
      getAllRestaurants(),
    ]);
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Admin restaurant selector */}
      {isAdmin && (
        <AdminRestaurantSelector
          restaurants={allRestaurants}
          currentRestaurantId={restaurant?.id || null}
        />
      )}
      <Header restaurantName={restaurant?.name ?? "Carte du Jour"} />
      <main className="p-4">{children}</main>
      <MobileNav />
    </div>
  );
}
