import { requireAuthWithProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProduitsContent } from "@/components/dashboard/ProduitsContent";

export default async function ProduitsPage() {
  const profile = await requireAuthWithProfile();

  if (!profile.restaurants) {
    redirect("/dashboard");
  }

  return <ProduitsContent />;
}
