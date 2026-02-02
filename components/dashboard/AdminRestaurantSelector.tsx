"use client";

import { useState } from "react";
import { switchRestaurant } from "@/app/actions/restaurant";
import { toast } from "sonner";
import type { Restaurant } from "@/lib/types/database";

interface AdminRestaurantSelectorProps {
  restaurants: Restaurant[];
  currentRestaurantId: string | null;
}

export function AdminRestaurantSelector({
  restaurants,
  currentRestaurantId,
}: AdminRestaurantSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRestaurantId = e.target.value;
    if (!newRestaurantId || newRestaurantId === currentRestaurantId) return;

    setIsLoading(true);
    try {
      const result = await switchRestaurant(newRestaurantId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Restaurant changé");
        // Force page reload to update all data
        window.location.reload();
      }
    } catch {
      toast.error("Erreur lors du changement de restaurant");
    } finally {
      setIsLoading(false);
    }
  };

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
        Admin
      </span>
      <select
        value={currentRestaurantId || ""}
        onChange={handleChange}
        disabled={isLoading}
        className="flex-1 text-sm px-2 py-1 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900 text-amber-900 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
      >
        <option value="" disabled>
          Sélectionner un restaurant
        </option>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}
