import { requireAuthWithProfile, getAdminEffectiveRestaurant } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProduitsContent } from "@/components/dashboard/ProduitsContent";

export default async function ProduitsPage() {
  const profile = await requireAuthWithProfile();

  // Admin case: check effective restaurant
  if (profile.role === "admin") {
    const effectiveRestaurant = await getAdminEffectiveRestaurant();
    if (!effectiveRestaurant) {
      redirect("/dashboard");
    }
  } else if (!profile.restaurants) {
    redirect("/dashboard");
  }

  return <ProduitsContent />;
}
