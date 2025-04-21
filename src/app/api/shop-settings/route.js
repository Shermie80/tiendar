// app/api/shop-settings/route.js

import { supabase } from "../../../lib/supabase";

export async function POST(request) {
  const formData = await request.formData();
  const shop_id = formData.get("shop_id");
  let primary_color = formData.get("primary_color");
  let secondary_color = formData.get("secondary_color");
  let logo_url = formData.get("logo_url") || null;

  // Sanitizar entradas
  primary_color = primary_color ? String(primary_color).trim() : null;
  secondary_color = secondary_color ? String(secondary_color).trim() : null;
  logo_url = logo_url ? String(logo_url).trim().slice(0, 500) : null;

  // Validar datos
  if (!shop_id || !primary_color || !secondary_color) {
    return new Response(
      JSON.stringify({
        error:
          "Faltan campos obligatorios: shop_id, primary_color y secondary_color son requeridos",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validar formato de colores (deben ser hexadecimales)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (
    !hexColorRegex.test(primary_color) ||
    !hexColorRegex.test(secondary_color)
  ) {
    return new Response(
      JSON.stringify({
        error: "Los colores deben estar en formato hexadecimal (ej. #2563eb)",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validar formato de URL si existe
  if (logo_url) {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(logo_url)) {
      return new Response(
        JSON.stringify({ error: "La URL del logo no es válida" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Verificar si ya existe una configuración para esta tienda
  const { data: existingSettings, error: selectError } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("shop_id", shop_id)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    return new Response(
      JSON.stringify({
        error:
          "Error al verificar la configuración existente: " +
          selectError.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let error;
  if (existingSettings) {
    // Actualizar configuración existente
    ({ error } = await supabase
      .from("shop_settings")
      .update({ primary_color, secondary_color, logo_url })
      .eq("shop_id", shop_id));
  } else {
    // Crear nueva configuración
    ({ error } = await supabase
      .from("shop_settings")
      .insert([{ shop_id, primary_color, secondary_color, logo_url }]));
  }

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Error al guardar la configuración: " + error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Obtener el shopName para redirigir correctamente
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("shop_name")
    .eq("id", shop_id)
    .single();

  if (shopError) {
    return new Response(
      JSON.stringify({
        error: "Error al obtener el nombre de la tienda: " + shopError.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Redirigir al panel de administración
  return new Response(null, {
    status: 302,
    headers: { Location: `/${shop.shop_name}/admin` },
  });
}
