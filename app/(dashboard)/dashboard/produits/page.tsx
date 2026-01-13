import { requireAuthWithProfile } from "@/lib/auth";
import Link from "next/link";

export default async function ProduitsPage() {
  await requireAuthWithProfile();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Ajouter
        </button>
      </div>

      {/* Categories filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium whitespace-nowrap">
          Tous
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-900">
          Entrées
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-900">
          Plats
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-900">
          Desserts
        </button>
      </div>

      {/* Empty state */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Aucun produit</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Commencez par ajouter vos premiers produits.
        </p>
        <Link
          href="/dashboard/categories"
          className="text-blue-600 hover:underline text-sm"
        >
          Gérer les catégories
        </Link>
      </div>
    </div>
  );
}
