"use client";

import { useState } from "react";
import { resetAndReimportItems } from "@/app/actions/restaurant";

export function ResetItemsButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleReset = async () => {
    if (!confirm("Supprimer tous les produits et catégories et réimporter les données initiales ?")) {
      return;
    }

    setStatus("loading");
    const result = await resetAndReimportItems();

    if (result.error) {
      setMessage(result.error);
      setStatus("error");
    } else {
      setMessage(result.message || "Données réimportées");
      setStatus("success");
      // Refresh after 1 second
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <section className="pt-4 border-t border-yellow-500 dark:border-yellow-600">
      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Mode développement
        </h3>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
          Réinitialise les catégories et produits avec les données de seed.
        </p>
        <button
          onClick={handleReset}
          disabled={status === "loading"}
          className="w-full py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Réinitialisation..." : "Réimporter les items"}
        </button>
        {message && (
          <p className={`text-xs mt-2 ${status === "error" ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
