"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("type=invite")) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        subscription.unsubscribe();
        router.replace("/reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
