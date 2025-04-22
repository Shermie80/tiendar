import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { access_token, refresh_token, expires_at } = await request.json();

    if (!access_token || !refresh_token || !expires_at) {
      return NextResponse.json(
        { error: "Faltan datos de la sesión" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set(
      "sb-vxipkqfzmumfyzumsryb-auth-token",
      JSON.stringify({
        access_token,
        refresh_token,
        expires_at,
      }),
      {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      }
    );

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Error al establecer la sesión" },
      { status: 500 }
    );
  }
}
