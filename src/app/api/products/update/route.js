import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const { product_id, name, description, price, image_url } =
      await request.json();

    // Validar datos
    if (!product_id || !name || !price) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Validar longitudes
    if (name.length > 100) {
      return NextResponse.json(
        { error: "El nombre no puede exceder 100 caracteres" },
        { status: 400 }
      );
    }
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "La descripción no puede exceder 500 caracteres" },
        { status: 400 }
      );
    }

    if (image_url) {
      const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
      if (!urlRegex.test(image_url) || image_url.length > 500) {
        return NextResponse.json(
          { error: "La URL de la imagen no es válida o excede 500 caracteres" },
          { status: 400 }
        );
      }
    }

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
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado: usuario no autenticado" },
        { status: 401 }
      );
    }

    // Crear cliente de Supabase con service role key
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

    // Verificar que el producto pertenece a una tienda del usuario
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("shop_id")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("id", product.shop_id)
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "No autorizado: el producto no pertenece al usuario" },
        { status: 403 }
      );
    }

    // Actualizar producto
    const { error } = await supabase
      .from("products")
      .update({ name, description, price, image_url })
      .eq("id", product_id);

    if (error) {
      return NextResponse.json(
        { error: "Error al actualizar el producto: " + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Producto actualizado correctamente" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
