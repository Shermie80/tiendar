import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrfToken } from "lib/csrf";
import { z } from "zod";

// Esquema de validación con Zod
const shopSettingsSchema = z.object({
  shop_id: z.string().uuid(),
  primary_color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "El color primario debe ser un código hexadecimal válido"
    ),
  secondary_color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "El color secundario debe ser un código hexadecimal válido"
    ),
  logo_url: z
    .string()
    .url("La URL del logo no es válida")
    .max(500, "La URL no puede exceder 500 caracteres")
    .optional()
    .nullable(),
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

    // Verificar el token CSRF
    try {
      verifyCsrfToken(request); // Eliminamos el segundo parámetro
    } catch (csrfError) {
      await logAction(null, null, "/api/shop-settings", "CSRF_FAILED", {
        message: csrfError.message,
      });
      return NextResponse.json(
        { error: "Token CSRF inválido" },
        { status: 403 }
      );
    }

    // Obtener datos del FormData
    const formData = await request.formData();
    const shop_id = formData.get("shop_id");
    const primary_color = formData.get("primary_color");
    const secondary_color = formData.get("secondary_color");
    const logo_url = formData.get("logo_url") || null;

    // Validar datos con Zod
    const validationResult = shopSettingsSchema.safeParse({
      shop_id,
      primary_color,
      secondary_color,
      logo_url,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      await logAction(null, null, "/api/shop-settings", "VALIDATION_FAILED", {
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
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      await logAction(
        supabaseAuth,
        null,
        "/api/shop-settings",
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

    // Verificar que el shop_id pertenece al usuario autenticado
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("id", shop_id)
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      await logAction(supabase, user.id, "/api/shop-settings", "UNAUTHORIZED", {
        message: "La tienda no pertenece al usuario",
      });
      return NextResponse.json(
        { error: "No autorizado: la tienda no pertenece al usuario" },
        { status: 403 }
      );
    }

    // Buscar el registro existente en shop_settings para obtener el id
    const { data: existingSettings, error: fetchError } = await supabase
      .from("shop_settings")
      .select("id")
      .eq("shop_id", shop_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 significa "no rows found", lo cual es esperado si no existe el registro
      await logAction(supabase, user.id, "/api/shop-settings", "FETCH_FAILED", {
        message: fetchError.message,
      });
      return NextResponse.json(
        { error: "Error al buscar configuraciones: " + fetchError.message },
        { status: 400 }
      );
    }

    // Preparar el objeto para el upsert
    const settingsData = {
      id: existingSettings?.id, // Incluimos el id si existe
      shop_id,
      primary_color,
      secondary_color,
      logo_url,
    };

    // Actualizar o insertar configuraciones
    const { data: updatedSettings, error: updateError } = await supabase
      .from("shop_settings")
      .upsert(settingsData, { onConflict: "shop_id" })
      .select()
      .single();

    if (updateError) {
      await logAction(
        supabase,
        user.id,
        "/api/shop-settings",
        "UPDATE_FAILED",
        { message: updateError.message }
      );
      return NextResponse.json(
        { error: "Error al guardar configuraciones: " + updateError.message },
        { status: 400 }
      );
    }

    await logAction(
      supabase,
      user.id,
      "/api/shop-settings",
      "SETTINGS_UPDATED",
      { shop_id }
    );
    return NextResponse.json(
      {
        message: "Configuraciones guardadas correctamente",
        updatedSettings,
      },
      { status: 200 }
    );
  } catch (err) {
    await logAction(null, null, "/api/shop-settings", "SERVER_ERROR", {
      message: err.message,
    });
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
