import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : null,
    flowType: "implicit",
    storageKey: "sb-vxipkqfzmumfyzumsryb-auth-token",
  },
});

// Log de eventos de autenticación (para depuración)
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("[Supabase] Evento de autenticación:", event, session);

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      fetch("/api/auth/set-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }),
      });
    }

    if (event === "SIGNED_OUT") {
      fetch("/api/auth/remove-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  });
}
