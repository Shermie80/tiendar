import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return NextResponse.json({
    session: session
      ? { user: session.user, expires: session.expires_at }
      : null,
    error: error?.message,
  });
}
