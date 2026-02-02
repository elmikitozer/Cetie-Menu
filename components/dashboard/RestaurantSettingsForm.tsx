"use client";

import { useState, useRef } from "react";
import { updateRestaurant, uploadLogo } from "@/app/actions/restaurant";
import { toast } from "sonner";

interface RestaurantSettingsFormProps {
  initialName: string;
  initialLogoUrl: string | null;
  isOwner: boolean;
  restaurantId: string | null;
}

export function RestaurantSettingsForm({
  initialName,
  initialLogoUrl,
  isOwner,
  restaurantId,
}: RestaurantSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = name !== initialName || logoUrl !== (initialLogoUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error("Vous n'avez pas les droits pour modifier ces paramètres");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateRestaurant({
        restaurantId: restaurantId || undefined,
        name: name !== initialName ? name : undefined,
        logoUrl: logoUrl !== (initialLogoUrl || "") ? (logoUrl || null) : undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Restaurant mis à jour");
        window.location.reload();
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurantId);

      const result = await uploadLogo(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.logoUrl) {
        setLogoUrl(result.logoUrl);
        toast.success("Logo mis à jour");
        window.location.reload();
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Nom</label>
          <p className="font-medium">{initialName}</p>
        </div>
        {initialLogoUrl && (
          <div>
            <label className="block text-sm text-gray-500 mb-1">Logo</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialLogoUrl}
              alt={initialName}
              className="max-h-20 w-auto object-contain bg-white rounded p-2"
            />
          </div>
        )}
        <p className="text-sm text-gray-500 italic">
          Seuls les propriétaires peuvent modifier ces paramètres.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
      {/* Nom du restaurant */}
      <div>
        <label htmlFor="restaurant-name" className="block text-sm text-gray-500 mb-1">
          Nom du restaurant
        </label>
        <input
          id="restaurant-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nom du restaurant"
          required
        />
      </div>

      {/* Upload logo */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo actuel"
                className="max-h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="logo-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="logo-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Changer le logo
                </>
              )}
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG (max 2 Mo)</p>
          </div>
        </div>
      </div>

      {/* URL manuelle */}
      <div>
        <label htmlFor="logo-url" className="block text-sm text-gray-500 mb-1">
          Ou URL du logo
        </label>
        <input
          id="logo-url"
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="/logo.png ou https://..."
        />
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
        {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
