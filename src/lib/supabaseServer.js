// lib/supabaseServer.js

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const cookieValue = cookieStore.get(name)?.value;
          console.log(
            `[SupabaseServer] Cookie: ${name} = ${cookieValue || "no definida"}`
          );
          return cookieValue;
        },
        set() {
          console.log(
            "[SupabaseServer] No se permite modificar cookies en este contexto."
          );
          // No hacemos nada, las cookies deben modificarse en un Route Handler o Server Action
        },
        remove() {
          console.log(
            "[SupabaseServer] No se permite eliminar cookies en este contexto."
          );
          // No hacemos nada, las cookies deben eliminarse en un Route Handler o Server Action
        },
      },
    }
  );
}
