"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getDashboardStats, type DashboardStats } from "@/app/actions/daily-menu";
import { formatDateDisplay } from "@/lib/date";
import type { Restaurant } from "@/lib/types/database";

interface DashboardContentProps {
  restaurant: Restaurant;
}

export function DashboardContent({ restaurant }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const result = await getDashboardStats();
      if (result.error) {
        toast.error(result.error, { duration: 5000 });
      }
      setStats(result.stats);
      setLoading(false);
    }
    loadStats();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
      </div>

      {/* Menu du jour section */}
      <section className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Menu du jour</h2>
          <span className="text-sm text-gray-500 capitalize">
            {formatDateDisplay(today)}
          </span>
        </div>

        {stats?.hasMenu ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.todayMenuItemsCount}
                </p>
                <p className="text-sm text-gray-500">
                  {stats.todayMenuItemsCount === 1 ? "plat sélectionné" : "plats sélectionnés"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                stats.todayMenuPublished
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }`}>
                {stats.todayMenuPublished ? "Publié" : "Brouillon"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">Aucun menu créé pour aujourd&apos;hui</p>
          </div>
        )}

        <Link
          href="/dashboard/menu"
          className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {stats?.hasMenu ? "Modifier le menu" : "Créer le menu du jour"}
        </Link>
      </section>

      {/* Produits section */}
      <section className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Produits</h2>
        </div>

        {stats && stats.totalProducts > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">Aucun produit</p>
            <p className="text-sm text-gray-400">Ajoutez vos premiers plats</p>
          </div>
        )}

        <Link
          href="/dashboard/produits"
          className="block w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-center rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Gérer les produits
        </Link>
      </section>

      {/* Public link */}
      <section className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          <strong>Lien public de votre menu :</strong>
        </p>
        <Link
          href={`/menu/${restaurant.slug}`}
          className="text-blue-600 dark:text-blue-400 underline break-all text-sm"
          target="_blank"
        >
          {typeof window !== "undefined" ? window.location.origin : ""}/menu/{restaurant.slug}
        </Link>
      </section>
    </div>
  );
}
