import { Header, MobileNav } from "@/components/layout";
import { requireAuthAllowNoProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuthAllowNoProfile();
  const restaurant = profile?.restaurants;

  return (
    <div className="min-h-screen pb-20">
      <Header restaurantName={restaurant?.name ?? "Carte du Jour"} />
      <main className="p-4">{children}</main>
      <MobileNav />
    </div>
  );
}
