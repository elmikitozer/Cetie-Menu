import { requireAuthWithProfile } from "@/lib/auth";
import { MenuDuJour } from "@/components/dashboard/MenuDuJour";
import { redirect } from "next/navigation";

export default async function MenuPage() {
  const profile = await requireAuthWithProfile();

  if (!profile.restaurants) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Menu du jour</h1>
      <MenuDuJour />
    </div>
  );
}
