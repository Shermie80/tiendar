// app/api/register/route.js

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password, shopName } = await request.json();

    // Validar los datos recibidos
    if (!email || !password || !shopName) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: email, password o shopName" },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase con service role key
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get() {
            return undefined; // No necesitamos leer cookies
          },
          set() {
            // No necesitamos establecer cookies
          },
          remove() {
            // No necesitamos eliminar cookies
          },
        },
      }
    );

    // Registrar usuario
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 400 }
      );
    }

    // Crear la tienda
    const formattedShopName = shopName.toLowerCase();
    const { error: shopError } = await supabase
      .from("shops")
      .insert([{ user_id: data.user.id, shop_name: formattedShopName }]);

    if (shopError) {
      // Opcional: Eliminar el usuario si falla la creación de la tienda
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: shopError.message }, { status: 400 });
    }

    return NextResponse.json({ shopName: formattedShopName }, { status: 200 });
  } catch (err) {
    console.error("[Register API] Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
