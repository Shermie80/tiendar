import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LRUCache } from "lru-cache";

// Configurar el caché
const cache = new LRUCache({
  max: 100, // Máximo 100 entradas
  ttl: 1000 * 60 * 5, // 5 minutos de vida para cada entrada
});

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

    const cookieStore = cookies();

    // Validar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de entorno de Supabase" },
        { status: 500 }
      );
    }

    // Crear cliente de Supabase con anon key para verificar autenticación
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado: usuario no autenticado" },
        { status: 401 }
      );
    }

    // Generar una clave para el caché
    const cacheKey = `shop-data-${shopName}-${user.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, { status: 200 });
    }

    // Crear cliente de Supabase con service role key para operaciones
    const supabase = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });

    // Buscar la tienda por shop_name y verificar el propietario
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, shop_name, user_id")
      .eq("shop_name", shopName)
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Obtener configuraciones y productos en una sola consulta usando RPC o múltiples selects
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

    const responseData = {
      shop,
      settings: settings || {
        primary_color: "#2563eb",
        secondary_color: "#1f2937",
        logo_url: null,
      },
      products: products || [],
    };

    // Guardar en el caché
    cache.set(cacheKey, responseData);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
