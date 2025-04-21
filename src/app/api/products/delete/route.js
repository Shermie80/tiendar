import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrfToken } from "lib/csrf";
import { z } from "zod";

// Esquema de validación con Zod
const deleteProductSchema = z.object({
  product_id: z.string().uuid(),
});

async function logAction(supabase, userId, endpoint, action, details) {
  const { error } = await supabase
    .from("logs")
    .insert([{ user_id: userId, endpoint, action, details }]);

  if (error) {
    console.error("Error al registrar log:", error.message);
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const csrfToken = request.headers.get("x-csrf-token");

    if (!verifyCsrfToken(request, csrfToken)) {
      await logAction(null, null, "/api/products/delete", "CSRF_FAILED", {
        message: "Token CSRF inválido",
      });
      return NextResponse.json(
        { error: "Token CSRF inválido" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { product_id } = body;

    // Validar datos con Zod
    const validationResult = deleteProductSchema.safeParse({ product_id });

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      await logAction(null, null, "/api/products/delete", "VALIDATION_FAILED", {
        errors,
      });
      return NextResponse.json(
        { error: `Errores de validación: ${errors}` },
        { status: 400 }
      );
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
      await logAction(
        supabaseAuth,
        null,
        "/api/products/delete",
        "UNAUTHORIZED",
        { message: "Usuario no autenticado" }
      );
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

    // Verificar que el producto pertenece al usuario autenticado
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("shop_id")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      await logAction(supabase, user.id, "/api/products/delete", "NOT_FOUND", {
        message: "Producto no encontrado",
      });
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
      await logAction(
        supabase,
        user.id,
        "/api/products/delete",
        "UNAUTHORIZED",
        { message: "El producto no pertenece al usuario" }
      );
      return NextResponse.json(
        { error: "No autorizado: el producto no pertenece al usuario" },
        { status: 403 }
      );
    }

    // Eliminar producto
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product_id);

    if (error) {
      await logAction(
        supabase,
        user.id,
        "/api/products/delete",
        "DELETE_FAILED",
        { message: error.message }
      );
      return NextResponse.json(
        { error: "Error al eliminar el producto: " + error.message },
        { status: 400 }
      );
    }

    await logAction(
      supabase,
      user.id,
      "/api/products/delete",
      "PRODUCT_DELETED",
      { product_id }
    );
    return NextResponse.json(
      { message: "Producto eliminado correctamente" },
      { status: 200 }
    );
  } catch (err) {
    await logAction(null, null, "/api/products/delete", "SERVER_ERROR", {
      message: err.message,
    });
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
