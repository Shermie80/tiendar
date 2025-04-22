import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateCsrfToken } from "lib/csrf";

export async function GET() {
  try {
    const cookieStore = cookies();
    const existingToken = cookieStore.get("csrf_token")?.value;

    // Si ya existe un token CSRF en la cookie, devolverlo
    if (existingToken) {
      return NextResponse.json({ csrfToken: existingToken }, { status: 200 });
    }

    // Si no existe, generar uno nuevo
    const csrfToken = generateCsrfToken();

    // Almacenar el token CSRF en una cookie
    cookieStore.set("csrf_token", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ csrfToken }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al generar el token CSRF" },
      { status: 500 }
    );
  }
}
