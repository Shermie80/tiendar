import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopName = searchParams.get("shopName");

    if (!shopName) {
      return NextResponse.json(
        { error: "El nombre de la tienda es obligatorio" },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase con service role key (no requiere autenticación)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get() {
            return undefined;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Buscar la tienda por shop_name
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, shop_name")
      .eq("shop_name", shopName)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Obtener configuraciones de la tienda
    const { data: settings, error: settingsError } = await supabase
      .from("shop_settings")
      .select("primary_color, secondary_color, logo_url")
      .eq("shop_id", shop.id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error al cargar configuraciones: " + settingsError.message },
        { status: 400 }
      );
    }

    // Obtener productos de la tienda
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, description, price, image_url")
      .eq("shop_id", shop.id);

    if (productsError) {
      return NextResponse.json(
        { error: "Error al cargar productos: " + productsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        shop,
        settings: settings || {
          primary_color: "#2563eb",
          secondary_color: "#1f2937",
          logo_url: null,
        }, // Valores por defecto
        products: products || [],
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
