import { requireAuthAllowNoProfile, getAdminEffectiveRestaurant } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const { profile } = await requireAuthAllowNoProfile();

  // Admin case: get selected restaurant
  if (profile?.role === "admin") {
    const effectiveRestaurant = await getAdminEffectiveRestaurant();
    if (!effectiveRestaurant) {
      return (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Aucun restaurant</h1>
          <p className="text-gray-600">
            Créez un restaurant pour commencer.
          </p>
        </div>
      );
    }
    return <DashboardContent restaurant={effectiveRestaurant} />;
  }

  // Regular user: use their linked restaurant
  if (!profile || !profile.restaurants) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Aucun restaurant associé</h1>
        <p className="text-gray-600">
          Votre compte n&apos;est pas lié à un restaurant. Contactez un administrateur pour obtenir une invitation.
        </p>
      </div>
    );
  }

  return <DashboardContent restaurant={profile.restaurants} />;
}
