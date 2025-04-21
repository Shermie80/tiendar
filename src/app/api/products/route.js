import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrfToken } from "lib/csrf";
import { z } from "zod";

const RATE_LIMIT = 5; // Máximo de solicitudes por minuto
const rateLimitMap = new Map();

const productSchema = z.object({
  shop_id: z.string().uuid(),
  name: z.string().min(1, "El nombre del producto es obligatorio"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  image_url: z.string().optional(),
});

export async function POST(request) {
  try {
    // Verificar el token CSRF
    await verifyCsrfToken(request);

    // Implementar rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const currentTime = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];

    // Filtrar solicitudes dentro de la última ventana de tiempo (1 minuto)
    const recentRequests = userRequests.filter(
      (timestamp) => currentTime - timestamp < 60 * 1000
    );

    if (recentRequests.length >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }

    // Actualizar el mapa de rate limiting
    recentRequests.push(currentTime);
    rateLimitMap.set(ip, recentRequests);

    // Obtener datos del formulario
    const formData = await request.formData();
    const shop_id = formData.get("shop_id");
    const name = formData.get("name");
    const description = formData.get("description") || null;
    const price = parseFloat(formData.get("price"));
    const image_url = formData.get("image_url") || null;

    // Validar datos con Zod
    const validatedData = productSchema.parse({
      shop_id,
      name,
      description,
      price,
      image_url,
    });

    const cookieStore = cookies();

    // Crear cliente de Supabase con anon key para verificar autenticación
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

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

    // Crear cliente de Supabase con service role key para operaciones
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

    // Verificar que la tienda pertenece al usuario autenticado
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, user_id")
      .eq("id", validatedData.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    if (shop.user_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado: la tienda no pertenece al usuario" },
        { status: 403 }
      );
    }

    // Insertar el producto en la base de datos
    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        shop_id: validatedData.shop_id,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        image_url: validatedData.image_url,
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json(
        { error: "Error al agregar el producto: " + productError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ newProduct }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
