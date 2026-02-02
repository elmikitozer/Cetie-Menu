import { requireAuthWithProfile, getAdminEffectiveRestaurant } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { ResetItemsButton } from "@/components/dashboard/ResetItemsButton";
import { RestaurantSettingsForm } from "@/components/dashboard/RestaurantSettingsForm";
import { PDFDesignForm } from "@/components/dashboard/PDFDesignForm";
import { InviteForm } from "@/components/dashboard/InviteForm";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { redirect } from "next/navigation";

export default async function ParametresPage() {
  const profile = await requireAuthWithProfile();
  const isAdmin = profile.role === "admin";
  const isOwner = profile.role === "owner" || isAdmin;

  // For admins, get the effective restaurant
  let restaurant = profile.restaurants;
  if (isAdmin) {
    restaurant = await getAdminEffectiveRestaurant();
    if (!restaurant) {
      redirect("/dashboard");
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "owner":
        return "Propriétaire";
      default:
        return "Staff";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Restaurant settings - editable for owners and admins */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Restaurant</h2>
        <RestaurantSettingsForm
          initialName={restaurant?.name || ""}
          initialLogoUrl={restaurant?.logo_url || null}
          isOwner={isOwner}
          restaurantId={restaurant?.id || null}
        />

        {/* Non-editable info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
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

      {/* PDF Design settings */}
      {restaurant && isOwner && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Design du PDF</h2>
          <PDFDesignForm
            restaurantId={restaurant.id}
            initialData={{
              openingDays: restaurant.opening_days,
              openingDays2: restaurant.opening_days_2,
              lunchHours: restaurant.lunch_hours,
              dinnerHours: restaurant.dinner_hours,
              holidayNotice: restaurant.holiday_notice,
              meatOrigin: restaurant.meat_origin,
              paymentNotice: restaurant.payment_notice,
              subtitle: restaurant.subtitle,
              restaurantType: restaurant.restaurant_type,
              cities: restaurant.cities,
              sidesNote: restaurant.sides_note,
            }}
            isOwner={isOwner}
          />
        </section>
      )}

      {/* Invitations */}
      {restaurant && isOwner && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Invitations</h2>
          <InviteForm restaurantId={restaurant.id} isOwner={isOwner} />
        </section>
      )}

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
          <div>
            <label className="block text-sm text-gray-500 mb-1">Rôle</label>
            <p className="font-medium">{getRoleLabel(profile.role)}</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sécurité</h2>
        <ChangePasswordForm />
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
