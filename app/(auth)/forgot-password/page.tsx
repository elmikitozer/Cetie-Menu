"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Email envoyé</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
            </p>
          </div>
          <Link href="/login" className="text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@restaurant.fr"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
