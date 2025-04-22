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

  // Crear cliente de Supabase para verificar autenticación
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        // Esto se usará para actualizar las cookies en la respuesta
      },
      remove(name, options) {
        // Esto se usará para eliminar cookies en la respuesta
      },
    },
  });

  // Obtener la sesión del usuario
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir a /login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verificar si la ruta es una página de administración
  if (path.includes("/admin")) {
    // Crear cliente de Supabase con service role key para verificar propiedad
    const supabaseAdmin = createServerClient(
      supabaseUrl,
      supabaseServiceRoleKey,
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
      .eq("user_id", session.user.id)
      .single();

    if (error || !shop) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Continuar con la solicitud y actualizar las cookies en la respuesta
  const response = NextResponse.next();

  // Actualizar las cookies de la sesión en la respuesta
  if (session) {
    response.cookies.set(
      "sb-vxipkqfzmumfyzumsryb-auth-token",
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      }),
      {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      }
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
