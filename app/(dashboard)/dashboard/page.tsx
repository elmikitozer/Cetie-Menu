import { requireAuthAllowNoProfile } from "@/lib/auth";
import { InitializeRestaurant } from "@/components/dashboard/InitializeRestaurant";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const { profile } = await requireAuthAllowNoProfile();

  // If user has no profile or no restaurant, show initialization
  if (!profile || !profile.restaurants) {
    return <InitializeRestaurant />;
  }

  return <DashboardContent restaurant={profile.restaurants} />;
}
