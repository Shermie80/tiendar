import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log("[Middleware] Procesando ruta:", pathname);

  // Permitir rutas públicas
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/^\/[^/]+$/) // Rutas de tiendas públicas como /matecito
  ) {
    console.log("[Middleware] Ruta pública permitida:", pathname);
    return NextResponse.next();
  }

  // Crear cliente de Supabase
  const supabase = createSupabaseServerClient();

  // Verificar usuario autenticado
  console.log("[Middleware] Obteniendo usuario autenticado...");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "[Middleware] Error al obtener usuario:",
      userError?.message || "Usuario no autenticado"
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("[Middleware] Usuario autenticado:", user.id);

  // Proteger rutas admin
  if (pathname.includes("/admin")) {
    console.log("[Middleware] Ruta admin detectada:", pathname);

    // Manejar /admin
    if (pathname === "/admin" || pathname === "/admin/") {
      console.log("[Middleware] Procesando /admin");
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("shop_name")
        .eq("user_id", user.id)
        .single();

      if (shopError || !shop) {
        console.error(
          "[Middleware] Tienda no encontrada para user_id:",
          user.id,
          shopError?.message
        );
        return NextResponse.redirect(new URL("/login", request.url));
      }

      console.log("[Middleware] Redirigiendo a /", shop.shop_name, "/admin");
      return NextResponse.redirect(
        new URL(`/${shop.shop_name}/admin`, request.url)
      );
    }

    // Proteger /[shopName]/admin
    const adminRouteMatch = pathname.match(/^\/([^/]+)\/admin$/);
    if (adminRouteMatch) {
      const shopName = adminRouteMatch[1];
      console.log("[Middleware] Verificando acceso a /", shopName, "/admin");

      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("user_id")
        .eq("shop_name", shopName)
        .single();

      if (shopError || !shop) {
        console.error(
          "[Middleware] Tienda no encontrada:",
          shopName,
          shopError?.message
        );
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (shop.user_id !== user.id) {
        console.warn(
          "[Middleware] Acceso denegado a /",
          shopName,
          "/admin para user_id:",
          user.id
        );
        // Buscar la tienda del usuario autenticado
        const { data: userShop, error: userShopError } = await supabase
          .from("shops")
          .select("shop_name")
          .eq("user_id", user.id)
          .single();

        if (userShopError || !userShop) {
          console.error(
            "[Middleware] Tienda no encontrada para user_id:",
            user.id,
            userShopError?.message
          );
          return NextResponse.redirect(new URL("/login", request.url));
        }

        console.log(
          "[Middleware] Redirigiendo a /",
          userShop.shop_name,
          "/admin"
        );
        return NextResponse.redirect(
          new URL(`/${userShop.shop_name}/admin`, request.url)
        );
      }

      console.log("[Middleware] Acceso autorizado a /", shopName, "/admin");
      return NextResponse.next();
    }

    // Otras rutas admin no válidas
    console.warn("[Middleware] Ruta admin no válida:", pathname);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("[Middleware] Ruta no admin, permitiendo:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
