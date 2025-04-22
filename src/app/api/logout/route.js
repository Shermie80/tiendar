import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient();

  // Cerrar sesión en Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Logout] Error al cerrar sesión:", error.message);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }

  // Eliminar la cookie de autenticación
  cookieStore.delete("sb-vxipkqfzmumfyzumsryb-auth-token");

  return NextResponse.json(
    { message: "Sesión cerrada correctamente" },
    { status: 200 }
  );
}
