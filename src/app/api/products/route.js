// app/api/products/route.js

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const shop_id = formData.get("shop_id");
    let name = formData.get("name");
    let description = formData.get("description");
    const price = parseFloat(formData.get("price"));
    let image_url = formData.get("image_url") || null;

    // Sanitizar entradas
    name = name ? String(name).trim().slice(0, 100) : null;
    description = description ? String(description).trim().slice(0, 500) : null;
    image_url = image_url ? String(image_url).trim().slice(0, 500) : null;

    // Validar datos
    if (!shop_id || !name || !price) {
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

    if (image_url) {
      const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
      if (!urlRegex.test(image_url)) {
        return NextResponse.json(
          { error: "La URL de la imagen no es válida" },
          { status: 400 }
        );
      }
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

    // Insertar producto
    const { error } = await supabase
      .from("products")
      .insert([{ shop_id, name, description, price, image_url }]);

    if (error) {
      return NextResponse.json(
        { error: "Error al agregar el producto: " + error.message },
        { status: 400 }
      );
    }

    // Obtener shopName para devolver
    const { data: shop } = await supabase
      .from("shops")
      .select("shop_name")
      .eq("id", shop_id)
      .single();

    return NextResponse.json({ shopName: shop.shop_name }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor: " + err.message },
      { status: 500 }
    );
  }
}
