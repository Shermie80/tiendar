import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const cookieStore = request.cookies;
  const path = request.nextUrl.pathname;
  const shopName = path.split("/")[1];

  // Rutas públicas
  const publicRoutes = ["/", "/login", "/register", "/_next", "/static"];
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Crear cliente de Supabase para verificar autenticación
  const supabase = createServerClient(
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verificar si la ruta es una página de administración
  if (path.includes("/admin")) {
    // Crear cliente de Supabase con service role key para verificar propiedad
    const supabaseAdmin = createServerClient(
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

    const { data: shop, error } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("shop_name", shopName)
      .eq("user_id", user.id)
      .single();

    if (error || !shop) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
