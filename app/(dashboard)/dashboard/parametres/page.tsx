import { requireAuthWithProfile } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { ResetItemsButton } from "@/components/dashboard/ResetItemsButton";

export default async function ParametresPage() {
  const profile = await requireAuthWithProfile();
  const restaurant = profile.restaurants;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Restaurant info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Restaurant</h2>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Nom</label>
            <p className="font-medium">{restaurant?.name || "Non configuré"}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Identifiant URL
            </label>
            <p className="font-medium">{restaurant?.slug || "—"}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Adresse</label>
            <p className="font-medium">{restaurant?.address || "—"}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Téléphone</label>
            <p className="font-medium">{restaurant?.phone || "—"}</p>
          </div>
        </div>
      </section>

      {/* Account info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Compte</h2>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Nom</label>
            <p className="font-medium">{profile.full_name || "—"}</p>
          </div>
        </div>
      </section>

      {/* Logout */}
      <section className="pt-4">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full py-3 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </section>

      {/* Dev only: Reset items */}
      <ResetItemsButton />
    </div>
  );
}
