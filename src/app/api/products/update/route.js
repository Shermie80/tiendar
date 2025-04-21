import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrfToken } from "lib/csrf";
import { z } from "zod";

// Esquema de validación con Zod
const updateProductSchema = z.object({
  product_id: z.string().uuid("El ID del producto debe ser un UUID válido"),
  name: z.string().min(1, "El nombre del producto es obligatorio"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  image_url: z.string().optional(),
});

export async function POST(request) {
  try {
    // Verificar el token CSRF
    await verifyCsrfToken(request);

    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { product_id, name, description, price, image_url } = body;

    // Validar datos con Zod
    const validatedData = updateProductSchema.parse({
      product_id,
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

    // Verificar que el producto existe y pertenece al usuario autenticado
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, shop_id")
      .eq("id", validatedData.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el dueño de la tienda asociada al producto
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, user_id")
      .eq("id", product.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    if (shop.user_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado: el producto no pertenece al usuario" },
        { status: 403 }
      );
    }

    // Actualizar el producto en la base de datos
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        image_url: validatedData.image_url,
      })
      .eq("id", validatedData.product_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar el producto: " + updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ updatedProduct }, { status: 200 });
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
