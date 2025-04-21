// app/login/page.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  // Depurar estado de autenticación
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Login] Sesión inicial:", session);
      if (session) {
        console.log("[Login] Usuario ya autenticado, redirigiendo...");
        redirectToShop(session.user.id);
      }
    });
  }, []);

  const redirectToShop = async (userId) => {
    try {
      console.log("[Login] Consultando tienda para user_id:", userId);
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("shop_name")
        .eq("user_id", userId)
        .single();

      if (shopError) {
        console.error("[Login] Error al consultar tienda:", shopError.message);
        setError("No se pudo obtener la información de la tienda");
        router.push("/");
        return;
      }

      if (shop) {
        console.log("[Login] Redirigiendo a:", `/${shop.shop_name}/admin`);
        router.push(`/${shop.shop_name}/admin`);
      } else {
        console.log("[Login] No hay tienda, redirigiendo a: /");
        router.push("/");
      }
    } catch (err) {
      console.error("[Login] Error inesperado:", err.message);
      setError("Error al redirigir");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("[Login] Intentando iniciar sesión con:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Login] Error al iniciar sesión:", error.message);
        setError(error.message);
        return;
      }

      console.log("[Login] Sesión iniciada:", data.session);

      // Actualizar la sesión en el cliente
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      // Redirigir
      await redirectToShop(data.user.id);
    } catch (err) {
      console.error("[Login] Error inesperado:", err.message);
      setError("Error al iniciar sesión");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Iniciar Sesión</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
