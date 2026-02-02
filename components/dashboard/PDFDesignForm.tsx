"use client";

import { useState } from "react";
import { updateRestaurant } from "@/app/actions/restaurant";
import { toast } from "sonner";

interface PDFDesignFormProps {
  restaurantId: string;
  initialData: {
    openingDays: string | null;
    openingDays2: string | null;
    lunchHours: string | null;
    dinnerHours: string | null;
    holidayNotice: string | null;
    meatOrigin: string | null;
    paymentNotice: string | null;
    subtitle: string | null;
    restaurantType: string | null;
    cities: string | null;
    sidesNote: string | null;
  };
  isOwner: boolean;
}

export function PDFDesignForm({
  restaurantId,
  initialData,
  isOwner,
}: PDFDesignFormProps) {
  const [formData, setFormData] = useState({
    openingDays: initialData.openingDays || "",
    openingDays2: initialData.openingDays2 || "",
    lunchHours: initialData.lunchHours || "",
    dinnerHours: initialData.dinnerHours || "",
    holidayNotice: initialData.holidayNotice || "",
    meatOrigin: initialData.meatOrigin || "",
    paymentNotice: initialData.paymentNotice || "",
    subtitle: initialData.subtitle || "",
    restaurantType: initialData.restaurantType || "",
    cities: initialData.cities || "",
    sidesNote: initialData.sidesNote || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChanges = Object.keys(formData).some((key) => {
    const k = key as keyof typeof formData;
    const initial = initialData[k] || "";
    return formData[k] !== initial;
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsLoading(true);
    try {
      const result = await updateRestaurant({
        restaurantId,
        openingDays: formData.openingDays || null,
        openingDays2: formData.openingDays2 || null,
        lunchHours: formData.lunchHours || null,
        dinnerHours: formData.dinnerHours || null,
        holidayNotice: formData.holidayNotice || null,
        meatOrigin: formData.meatOrigin || null,
        paymentNotice: formData.paymentNotice || null,
        subtitle: formData.subtitle || null,
        restaurantType: formData.restaurantType || null,
        cities: formData.cities || null,
        sidesNote: formData.sidesNote || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Design PDF mis à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Header avec toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium">Personnaliser le design du PDF</span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenu dépliable */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Header du PDF */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">En-tête</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jours d&apos;ouverture (ligne 1)</label>
                <input
                  type="text"
                  value={formData.openingDays}
                  onChange={(e) => handleChange("openingDays", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="du lundi au vendredi"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jours d&apos;ouverture (ligne 2)</label>
                <input
                  type="text"
                  value={formData.openingDays2}
                  onChange={(e) => handleChange("openingDays2", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Service compris 15%"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Service midi</label>
                <input
                  type="text"
                  value={formData.lunchHours}
                  onChange={(e) => handleChange("lunchHours", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="12h-14h"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Service soir</label>
                <input
                  type="text"
                  value={formData.dinnerHours}
                  onChange={(e) => handleChange("dinnerHours", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="19h30-21h30"
                />
              </div>
            </div>
          </div>

          {/* Sous le logo */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sous le logo</h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="RESTAURANT"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <input
                  type="text"
                  value={formData.restaurantType}
                  onChange={(e) => handleChange("restaurantType", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="- BOUCHER -"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Villes</label>
                <input
                  type="text"
                  value={formData.cities}
                  onChange={(e) => handleChange("cities", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="PARIS • TOKYO"
                />
              </div>
            </div>
          </div>

          {/* Catégorie Plats */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie Plats</h4>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Mention accompagnements (italique, à droite)</label>
              <input
                type="text"
                value={formData.sidesNote}
                onChange={(e) => handleChange("sidesNote", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="* Accompagnements au choix"
              />
            </div>
          </div>

          {/* Footer du PDF */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pied de page</h4>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Notice congés (rouge)</label>
              <textarea
                value={formData.holidayNotice}
                onChange={(e) => handleChange("holidayNotice", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="Le Severo sera fermé pour les congés d'hiver du 24/12 au 4/01"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Origine viandes</label>
              <textarea
                value={formData.meatOrigin}
                onChange={(e) => handleChange("meatOrigin", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="Le boeuf est d'origine allemande ou française..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Mention paiement</label>
              <textarea
                value={formData.paymentNotice}
                onChange={(e) => handleChange("paymentNotice", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="Devant la recrudescence des chèques impayés..."
                rows={2}
              />
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <button
            type="submit"
            disabled={!hasChanges || isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              hasChanges && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer le design PDF"}
          </button>
        </form>
      )}
    </div>
  );
}
