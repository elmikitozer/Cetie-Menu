"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setPassword("");
    setConfirm("");
    setSuccess("Mot de passe mis à jour.");
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-sm text-gray-500">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="block text-sm text-gray-500">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}
