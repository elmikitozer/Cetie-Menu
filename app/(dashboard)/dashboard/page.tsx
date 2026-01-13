import { requireAuthAllowNoProfile } from "@/lib/auth";
import { InitializeRestaurant } from "@/components/dashboard/InitializeRestaurant";
import Link from "next/link";

export default async function DashboardPage() {
  const { profile } = await requireAuthAllowNoProfile();

  // If user has no profile or no restaurant, show initialization
  if (!profile || !profile.restaurants) {
    return <InitializeRestaurant />;
  }

  const restaurant = profile.restaurants;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu du jour</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </div>

      {/* Placeholder for menu selection */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Sélectionnez les produits disponibles aujourd&apos;hui.
        </p>
        <Link
          href="/dashboard/produits"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Voir les produits
        </Link>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          disabled
          className="flex items-center justify-center gap-2 p-4 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Aperçu
        </button>
        <button
          disabled
          className="flex items-center justify-center gap-2 p-4 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          PDF
        </button>
      </div>

      {/* Public link */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Lien public :</strong>{" "}
          <Link
            href={`/menu/${restaurant.slug}`}
            className="underline"
            target="_blank"
          >
            /menu/{restaurant.slug}
          </Link>
        </p>
      </div>
    </div>
  );
}
