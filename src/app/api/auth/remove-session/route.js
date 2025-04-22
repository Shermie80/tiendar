import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.delete("sb-vxipkqfzmumfyzumsryb-auth-token");

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Error al eliminar la sesión" },
      { status: 500 }
    );
  }
}
