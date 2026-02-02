"use client";

import { useMemo, useState } from "react";
import { createInvite, sendInviteEmail } from "@/app/actions/invites";

type InviteFormProps = {
  restaurantId: string | null;
  isOwner: boolean;
};

export function InviteForm({ restaurantId, isOwner }: InviteFormProps) {
  const invitesEmailEnabled = process.env.NEXT_PUBLIC_INVITES_EMAIL_ENABLED === "true";
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const inviteLink = token ? `${baseUrl}/signup?invite=${token}` : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
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
    setNotice("Lien généré.");
    setLoading(false);
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setError("Veuillez entrer un email.");
      return;
    }

    setError(null);
    setNotice(null);
    setToken(null);
    setSending(true);

    const result = await sendInviteEmail({
      restaurantId: restaurantId || undefined,
      role,
      email: email.trim(),
    });

    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }

    setToken(result.token ?? null);
    setNotice("Email d'invitation envoyé.");
    setSending(false);
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

        {!invitesEmailEnabled && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Envoi d'email désactivé : définissez NEXT_PUBLIC_INVITES_EMAIL_ENABLED=true.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {notice && (
          <p className="text-sm text-green-600 dark:text-green-400">{notice}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading || !restaurantId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Générer le lien"}
          </button>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sending || !restaurantId || !invitesEmailEnabled}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            {sending ? "Envoi..." : "Envoyer l'email"}
          </button>
        </div>
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
