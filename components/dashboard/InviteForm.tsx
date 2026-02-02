"use client";

import { useMemo, useState } from "react";
import { createInvite } from "@/app/actions/invites";

type InviteFormProps = {
  restaurantId: string | null;
  isOwner: boolean;
};

export function InviteForm({ restaurantId, isOwner }: InviteFormProps) {
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const inviteLink = token ? `${baseUrl}/signup?invite=${token}` : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToken(null);
    setLoading(true);

    const result = await createInvite({
      restaurantId: restaurantId || undefined,
      role,
      email: email.trim() || null,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setToken(result.token ?? null);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      // Ignore clipboard errors silently
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-500">Rôle à inviter</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "staff")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
          >
            <option value="owner">Admin restaurant</option>
            <option value="staff">Staff (menu du jour)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-500">Email (optionnel)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="invite@restaurant.fr"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !restaurantId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Création..." : "Générer une invitation"}
        </button>
      </form>

      {token && (
        <div className="space-y-2">
          <label className="block text-sm text-gray-500">Lien d&apos;invitation</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              Copier
            </button>
          </div>
          <p className="text-xs text-gray-500">Le lien est utilisable une seule fois.</p>
        </div>
      )}
    </div>
  );
}
